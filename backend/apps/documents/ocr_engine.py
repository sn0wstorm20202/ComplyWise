"""Genuine OCR and file text extraction engine for statutory document verification.

Extracts real text from:
1. Vector PDFs (via pypdf).
2. Scanned / image-based PDFs (page image extraction + OCR).
3. Image files (.png, .jpg, .jpeg, .tiff, .bmp, .webp) via native Windows OCR (Windows.Media.Ocr).
4. Fallback to pytesseract if available.

Does NOT fake or mock tokens: if an image has zero text (e.g. blank canvas, arbitrary photo),
it returns empty text so the AI pre-validation layer can accurately flag it as irrelevant.
"""

from __future__ import annotations

import asyncio
import io
import logging
import os
import re
import tempfile
from typing import Any

logger = logging.getLogger(__name__)

# Try importing pypdf
try:
    import pypdf
    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False

# Try importing PIL
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# Try importing winsdk for native Windows OCR
try:
    import winsdk.windows.graphics.imaging as imaging
    import winsdk.windows.media.ocr as win_ocr
    import winsdk.windows.storage as storage
    WINSDK_OCR_AVAILABLE = True
except ImportError:
    WINSDK_OCR_AVAILABLE = False

# Try importing pytesseract
try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False


import concurrent.futures

async def _run_winsdk_ocr(image_path: str) -> str:
    """Run native Windows Media OCR on a local image path."""
    storage_file = await storage.StorageFile.get_file_from_path_async(os.path.abspath(image_path))
    stream = await storage_file.open_async(storage.FileAccessMode.READ)
    decoder = await imaging.BitmapDecoder.create_async(stream)
    bitmap = await decoder.get_software_bitmap_async()

    engine = win_ocr.OcrEngine.try_create_from_user_profile_languages()
    if engine is None:
        return ""

    ocr_result = await engine.recognize_async(bitmap)
    return ocr_result.text or ""


def _run_winsdk_ocr_isolated(image_path: str) -> str:
    """Run native Windows Media OCR in a dedicated thread with its own event loop."""
    def _worker() -> str:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(_run_winsdk_ocr(image_path))
        finally:
            loop.close()

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
            return ex.submit(_worker).result(timeout=25)
    except Exception as exc:
        logger.warning("winsdk isolated worker error on %s: %s", image_path, exc)
        return ""


def _preprocess_image_for_ocr(input_path: str) -> list[str]:
    """Generate high-readability preprocessed temporary images for OCR.

    Handles:
    - EXIF camera orientation auto-transposition (corrects sideways / upside-down mobile photos).
    - Format conversion to RGB on white background.
    - Dimension normalization: keeps max dimension <= 3800px (Windows OCR limit 4096px).
    - Resolution upscaling (LANCZOS) for low-dpi snapshots so characters are large enough.
    - Margin padding (45px white border) so border text isn't skipped.
    - High-contrast variant for low-contrast smartphone photos.
    """
    if not PIL_AVAILABLE:
        return [input_path]

    from PIL import ImageOps, ImageEnhance

    processed_paths: list[str] = []
    try:
        with Image.open(input_path) as raw_img:
            # 1. Apply EXIF orientation transposition (essential for smartphone photos)
            try:
                raw_img = ImageOps.exif_transpose(raw_img)
            except Exception:
                pass

            # 2. Normalize color space to RGB on white background
            if raw_img.mode in ("RGBA", "LA") or (raw_img.mode == "P" and "transparency" in raw_img.info):
                bg = Image.new("RGB", raw_img.size, (255, 255, 255))
                if raw_img.mode == "P":
                    alpha = raw_img.convert("RGBA").split()[-1]
                else:
                    alpha = raw_img.split()[-1]
                bg.paste(raw_img.convert("RGB"), mask=alpha)
                base_img = bg
            elif raw_img.mode != "RGB":
                base_img = raw_img.convert("RGB")
            else:
                base_img = raw_img.copy()

            # 3. Add padding so edge text is not clipped by Windows OCR engine
            padded_img = ImageOps.expand(base_img, border=45, fill="white")

            # 4. Dimension bounds normalization:
            # Windows Media OCR fails if either dimension > 4096. Keep safely under 3800.
            w, h = padded_img.size
            if max(w, h) > 3800:
                downscale = 3600.0 / max(w, h)
                padded_img = padded_img.resize((int(w * downscale), int(h * downscale)), Image.Resampling.LANCZOS)
                w, h = padded_img.size

            # Upscale if low resolution (characters must be at least ~30px for OCR)
            if max(w, h) < 1800 or min(w, h) < 800:
                scale_factor = min(3.0, max(1.5, 1800.0 / max(w, h)))
                new_w = int(w * scale_factor)
                new_h = int(h * scale_factor)
                scaled_img = padded_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            else:
                scaled_img = padded_img

            # Candidate 1: Primary normalized and padded image
            tmp1 = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
            scaled_img.save(tmp1.name, format="PNG")
            tmp1.close()
            processed_paths.append(tmp1.name)

            # Candidate 2: High contrast enhancement for noisy or faded mobile snapshots
            enhancer = ImageEnhance.Contrast(scaled_img)
            contrast_img = enhancer.enhance(1.7)
            tmp2 = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
            contrast_img.save(tmp2.name, format="PNG")
            tmp2.close()
            processed_paths.append(tmp2.name)

    except Exception as exc:
        logger.warning("Image preprocessing for OCR failed on %s: %s", input_path, exc)
        return [input_path]

    return processed_paths


def _score_ocr_text(text: str) -> int:
    """Score extracted text quality by word count and statutory markers."""
    if not text:
        return 0
    words = re.findall(r"[A-Za-z0-9_\-\.\/]+", text)
    if len(words) < 2:
        return 0
    statutory_markers = [
        "license", "licence", "certificate", "registration", "factory", "factories",
        "dish", "fssai", "safety", "health", "form", "act", "valid", "directorate",
        "industrial", "occupier", "manager", "inspection", "compliance", "government",
        "spcb", "cpcb", "bis", "nabl", "potability", "structural", "stability"
    ]
    text_lower = text.lower()
    marker_hits = sum(1 for m in statutory_markers if m in text_lower)
    return len(words) + (marker_hits * 12)


def _ocr_image_file(file_path: str) -> str:
    """OCR an image file using multi-stage winsdk (Windows Media OCR) or pytesseract, with orientation recovery."""
    preprocessed_paths = _preprocess_image_for_ocr(file_path)
    # Include original file path in candidate pool
    candidates = list(preprocessed_paths)
    if file_path not in candidates:
        candidates.append(file_path)

    extracted_results: list[str] = []

    def _try_ocr_on_file(img_path: str) -> str:
        if WINSDK_OCR_AVAILABLE:
            t = _run_winsdk_ocr_isolated(img_path)
            if t and len(t.strip()) > 0:
                return t.strip()
        if PYTESSERACT_AVAILABLE and PIL_AVAILABLE:
            try:
                img = Image.open(img_path)
                t = pytesseract.image_to_string(img)
                if t and len(t.strip()) > 0:
                    return t.strip()
            except Exception:
                pass
        return ""

    try:
        for p in candidates:
            text = _try_ocr_on_file(p)
            if text:
                extracted_results.append(text)
                # If strong statutory text (> 45 chars and recognized statutory marker), accept immediately
                if len(text) >= 45 and any(m in text.lower() for m in ["license", "licence", "factory", "form", "fssai", "dish", "act", "certificate"]):
                    return text

        best_initial = max(extracted_results, key=_score_ocr_text) if extracted_results else ""
        if _score_ocr_text(best_initial) >= 15:
            return best_initial

        # If text is minimal (< 4 words) or empty, test multi-angle orientation (90°, 270°, 180°).
        # Camera snapshots without EXIF orientation frequently arrive sideways (90° or 270°).
        if PIL_AVAILABLE and candidates:
            primary_path = candidates[0]
            try:
                with Image.open(primary_path) as base_for_rot:
                    for angle in (90, 270, 180):
                        rot_img = base_for_rot.rotate(angle, expand=True)
                        tmp_rot = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
                        rot_img.save(tmp_rot.name, format="PNG")
                        tmp_rot.close()
                        try:
                            rot_text = _try_ocr_on_file(tmp_rot.name)
                            if rot_text:
                                extracted_results.append(rot_text)
                                if any(m in rot_text.lower() for m in ["license", "licence", "factory", "form", "fssai", "dish", "act"]):
                                    return rot_text
                        finally:
                            if os.path.exists(tmp_rot.name):
                                os.unlink(tmp_rot.name)
            except Exception as rot_exc:
                logger.debug("Multi-orientation OCR attempt failed: %s", rot_exc)

        if extracted_results:
            return max(extracted_results, key=_score_ocr_text).strip()

        return ""
    finally:
        # Clean up temporary preprocessed files (skip original input file)
        for p in preprocessed_paths:
            if p != file_path and os.path.exists(p):
                try:
                    os.unlink(p)
                except OSError:
                    pass


def extract_text_from_file_bytes(file_bytes: bytes, file_name: str) -> dict[str, Any]:
    """Extract real text from file bytes based on file extension."""
    if not file_bytes:
        return {
            "extracted_text": "",
            "word_count": 0,
            "character_count": 0,
            "source_type": "EMPTY",
            "has_readable_text": False,
            "error": "Empty file bytes (0 bytes)",
        }

    _, ext = os.path.splitext(file_name.lower())

    # Case 1: PDF Document
    if ext == ".pdf":
        if not PYPDF_AVAILABLE:
            return {
                "extracted_text": "",
                "word_count": 0,
                "character_count": 0,
                "source_type": "PDF_UNSUPPORTED",
                "has_readable_text": False,
                "error": "pypdf is not installed",
            }

        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            extracted_pages: list[str] = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_pages.append(text)

            combined_text = "\n".join(extracted_pages).strip()

            # If text was directly extractable from vector PDF
            if len(combined_text) >= 20:
                words = re.findall(r"[A-Za-z0-9_\-\.\/]+", combined_text)
                return {
                    "extracted_text": combined_text,
                    "word_count": len(words),
                    "character_count": len(combined_text),
                    "source_type": "PDF_TEXT",
                    "has_readable_text": len(words) >= 3,
                    "error": None,
                }

            # If PDF has little/no text (scanned PDF), check for embedded page images
            scanned_text_parts: list[str] = []
            if PIL_AVAILABLE:
                for page in reader.pages[:3]:  # Check first 3 pages
                    for img_obj in page.images:
                        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                            tmp.write(img_obj.data)
                            tmp_path = tmp.name
                        try:
                            ocr_text = _ocr_image_file(tmp_path)
                            if ocr_text:
                                scanned_text_parts.append(ocr_text)
                        finally:
                            if os.path.exists(tmp_path):
                                os.unlink(tmp_path)

            scanned_combined = "\n".join(scanned_text_parts).strip()
            all_text = f"{combined_text}\n{scanned_combined}".strip()
            words = re.findall(r"[A-Za-z0-9_\-\.\/]+", all_text)
            return {
                "extracted_text": all_text,
                "word_count": len(words),
                "character_count": len(all_text),
                "source_type": "SCANNED_PDF_OCR" if scanned_combined else "PDF_TEXT",
                "has_readable_text": len(words) >= 3,
                "error": None,
            }
        except Exception as exc:
            logger.error("Failed to parse PDF bytes: %s", exc)
            return {
                "extracted_text": "",
                "word_count": 0,
                "character_count": 0,
                "source_type": "PDF_ERROR",
                "has_readable_text": False,
                "error": f"Invalid or corrupt PDF file: {exc}",
            }

    # Case 2: Image Files (.png, .jpg, .jpeg, .tiff, .bmp, .webp, .jfif, .pjpeg)
    if ext in {".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp", ".jfif", ".pjpeg"}:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            ocr_text = _ocr_image_file(tmp_path)
            words = re.findall(r"[A-Za-z0-9_\-\.\/]+", ocr_text)
            has_readable = len(words) >= 3 and len(ocr_text.strip()) >= 10
            return {
                "extracted_text": ocr_text,
                "word_count": len(words),
                "character_count": len(ocr_text),
                "source_type": "IMAGE_OCR",
                "has_readable_text": has_readable,
                "error": None,
            }
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    # Case 3: Text or Markdown
    if ext in {".txt", ".csv", ".json", ".md"}:
        try:
            text = file_bytes.decode("utf-8", errors="ignore").strip()
            words = re.findall(r"[A-Za-z0-9_\-\.\/]+", text)
            return {
                "extracted_text": text,
                "word_count": len(words),
                "character_count": len(text),
                "source_type": "PLAIN_TEXT",
                "has_readable_text": len(words) >= 3,
                "error": None,
            }
        except Exception as exc:
            return {
                "extracted_text": "",
                "word_count": 0,
                "character_count": 0,
                "source_type": "TEXT_ERROR",
                "has_readable_text": False,
                "error": str(exc),
            }

    # Case 4: HTML Documents (.html, .htm)
    if ext in {".html", ".htm"}:
        try:
            raw_html = file_bytes.decode("utf-8", errors="ignore")
            # Strip script, style, and HTML markup
            clean_text = re.sub(r"<script.*?</script>", "", raw_html, flags=re.DOTALL | re.IGNORECASE)
            clean_text = re.sub(r"<style.*?</style>", "", clean_text, flags=re.DOTALL | re.IGNORECASE)
            clean_text = re.sub(r"<[^>]+>", " ", clean_text)
            clean_text = re.sub(r"\s+", " ", clean_text).strip()
            words = re.findall(r"[A-Za-z0-9_\-\.\/]+", clean_text)
            return {
                "extracted_text": clean_text,
                "word_count": len(words),
                "character_count": len(clean_text),
                "source_type": "HTML_DOCUMENT",
                "has_readable_text": len(words) >= 3,
                "error": None,
            }
        except Exception as exc:
            return {
                "extracted_text": "",
                "word_count": 0,
                "character_count": 0,
                "source_type": "HTML_ERROR",
                "has_readable_text": False,
                "error": str(exc),
            }

    # Case 5: Word Document (.docx)
    if ext == ".docx":
        try:
            import zipfile
            import xml.etree.ElementTree as ET
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                xml_content = z.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            paragraphs = [node.text for node in tree.iter() if node.tag.endswith("}t") and node.text]
            clean_text = " ".join(paragraphs).strip()
            words = re.findall(r"[A-Za-z0-9_\-\.\/]+", clean_text)
            return {
                "extracted_text": clean_text,
                "word_count": len(words),
                "character_count": len(clean_text),
                "source_type": "DOCX_DOCUMENT",
                "has_readable_text": len(words) >= 3,
                "error": None,
            }
        except Exception as exc:
            return {
                "extracted_text": "",
                "word_count": 0,
                "character_count": 0,
                "source_type": "DOCX_ERROR",
                "has_readable_text": False,
                "error": str(exc),
            }

    # Case 4: Other / unsupported extensions
    return {
        "extracted_text": "",
        "word_count": 0,
        "character_count": 0,
        "source_type": "UNSUPPORTED",
        "has_readable_text": False,
        "error": f"Extension '{ext}' cannot be OCR inspected.",
    }


def extract_text_from_upload(uploaded_file: Any) -> dict[str, Any]:
    """Extract text from a Django UploadedFile or file path."""
    if uploaded_file is None:
        return {
            "extracted_text": "",
            "word_count": 0,
            "character_count": 0,
            "source_type": "NO_FILE",
            "has_readable_text": False,
            "error": "No file provided",
        }

    # Django UploadedFile object
    if hasattr(uploaded_file, "read"):
        file_name = getattr(uploaded_file, "name", "document.pdf")
        try:
            uploaded_file.seek(0)
            content = uploaded_file.read()
            uploaded_file.seek(0)
            return extract_text_from_file_bytes(content, file_name)
        except Exception as exc:
            return {
                "extracted_text": "",
                "word_count": 0,
                "character_count": 0,
                "source_type": "READ_ERROR",
                "has_readable_text": False,
                "error": str(exc),
            }

    # File path string
    if isinstance(uploaded_file, str) and os.path.exists(uploaded_file):
        with open(uploaded_file, "rb") as f:
            content = f.read()
        return extract_text_from_file_bytes(content, os.path.basename(uploaded_file))

    return {
        "extracted_text": "",
        "word_count": 0,
        "character_count": 0,
        "source_type": "UNKNOWN",
        "has_readable_text": False,
        "error": "Unrecognized file input",
    }
