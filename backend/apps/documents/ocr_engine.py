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


def _ocr_image_file(file_path: str) -> str:
    """OCR an image file using winsdk or pytesseract."""
    # 1. Native Windows OCR via winsdk
    if WINSDK_OCR_AVAILABLE:
        try:
            text = asyncio.run(_run_winsdk_ocr(file_path))
            return text.strip()
        except Exception as exc:
            logger.warning("winsdk OCR error on %s: %s", file_path, exc)

    # 2. Pytesseract fallback
    if PYTESSERACT_AVAILABLE and PIL_AVAILABLE:
        try:
            img = Image.open(file_path)
            text = pytesseract.image_to_string(img)
            return text.strip()
        except Exception as exc:
            logger.warning("pytesseract error on %s: %s", file_path, exc)

    return ""


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

    # Case 2: Image Files (.png, .jpg, .jpeg, .tiff, .bmp, .webp)
    if ext in {".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"}:
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
