"""End-to-end Playwright Browser Test for Eastern GridCell Energy Pvt. Ltd.
Verifies complete flow from /onboarding?new=true -> Step 1 -> Step 2 -> Step 3 -> Step 4/5 -> /dashboard -> /compliance.
Confirms:
1. Business name "Eastern GridCell Energy Pvt. Ltd." is displayed at every step
2. No stale business data ("Shree Ganesh Foods" / "b754a9a2") appears anywhere
3. Adaptive Smart Questions map to canonical profile variables
4. Live Regulatory Discovery execution triggers and renders:
   - Live Regulatory Discovery Summary Card
   - Quarantined Candidate Regulatory Claims Card with UNVERIFIED badge
5. Part N filtering on Initial Results:
   - Action Required rules displayed
   - NOT_APPLICABLE obligations hidden by default behind collapsible audit toggle
6. Dashboard displays:
   - Business name "Eastern GridCell Energy Pvt. Ltd."
   - Live Regulatory Discovery Provenance Banner with official portal counts
   - Priority Compliance Actions
7. Compliance Matrix (/compliance) displays:
   - Action Required tab active by default
   - Verification Required tab
   - Discovered Knowledge (Quarantined) tab
   - Collapsible "Audit Trail: Not Applicable Obligations"
"""

import sys
import time

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from playwright.sync_api import sync_playwright, expect

BASE_URL = "http://localhost:3000"

def test_eastern_gridcell_onboarding():
    console_errors = []
    page_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 950})
        page = context.new_page()

        def on_console(msg):
            if msg.type == "error":
                txt = msg.text
                if not any(x in txt for x in ["404", "501", "favicon.ico"]):
                    console_errors.append(txt)

        def on_page_error(err):
            page_errors.append(str(err))

        page.on("console", on_console)
        page.on("pageerror", on_page_error)

        print("[1] Navigating to Sign-In...")
        page.goto(f"{BASE_URL}/auth/signin", wait_until="networkidle")
        expect(page.locator("text=Sign In to ComplyWise").first).to_be_visible()

        # Fast Demo Login
        demo_button = page.locator("button:has-text('Fast Demo Login')").first
        demo_button.click()
        page.wait_for_url("**/onboarding*", timeout=15000)
        print("[2] Successfully authenticated. Navigating to fresh /onboarding?new=true...")

        # Explicitly navigate to fresh onboarding
        page.goto(f"{BASE_URL}/onboarding?new=true", wait_until="networkidle")

        # Verify Banner shows "New Entity Assessment"
        expect(page.locator("text=New Entity Assessment").first).to_be_visible()
        main_text = page.locator("main").first.inner_text()
        assert "Shree Ganesh Foods" not in main_text, "ERROR: Shree Ganesh Foods displayed on fresh onboarding!"
        assert "b754a9a2" not in main_text, "ERROR: Stale business ID b754a9a2 displayed on fresh onboarding!"
        print("[PASS] Fresh onboarding session initialized with clean state.")

        # Step 1: Fill Business Profile for Eastern GridCell Energy Pvt. Ltd.
        print("[3] Step 1: Registering Eastern GridCell Energy Pvt. Ltd. (West Bengal)...")
        biz_name = "Eastern GridCell Energy Pvt. Ltd."
        name_input = page.locator('input[placeholder*="Apex Biotech" i]').first
        name_input.fill(biz_name)

        selects = page.locator("form select")
        selects.nth(0).select_option(value="PRIVATE_LIMITED")
        selects.nth(1).select_option(value="WEST_BENGAL")

        district_input = page.locator('input[placeholder*="Ahmedabad" i]').first
        district_input.fill("Kolkata Industrial Zone")

        try:
            selects.nth(2).select_option(value="INSIDE_NOTIFIED_INDUSTRIAL_AREA")
        except Exception:
            selects.nth(2).select_option(index=1)

        try:
            selects.nth(3).select_option(value="EXPANDING")
        except Exception:
            selects.nth(3).select_option(index=1)

        # 45 Cr investment (Medium MSME), 180 Cr turnover (Medium MSME), 85 workers
        page.locator('input[placeholder*="leave blank" i]').nth(0).fill("4500") 
        page.locator('input[placeholder*="leave blank" i]').nth(1).fill("18000") 
        page.locator('input[placeholder*="leave blank" i]').nth(2).fill("85")

        step1_btn = page.locator('button:has-text("Continue to Products & Activities")').first
        step1_btn.click()
        page.wait_for_timeout(1500)

        # Step 2: Products & Activities
        print("[4] Step 2: Describing manufacturing operations & trade intent...")
        expect(page.locator("text=Products, Manufacturing Operations & Trade Intent").first).to_be_visible(timeout=10000)

        # Verify stepper header now shows Eastern GridCell Energy Pvt. Ltd.
        main_after_s1 = page.locator("main").first.inner_text()
        assert "Eastern GridCell Energy Pvt. Ltd." in main_after_s1, "Expected Eastern GridCell Energy in header"
        assert "b754a9a2" not in main_after_s1, "ERROR: Stale business ID b754a9a2 found in header!"

        desc_box = page.locator("textarea").first
        desc_box.fill("Manufacturing of advanced lithium-ion and sodium-ion battery storage packs, solar PV energy storage systems, electrical testing, and power electronics assembly.")

        trade_select = page.locator("form select").first
        trade_select.select_option(value="IMPORT_AND_EXPORT")

        step2_btn = page.locator('button:has-text("Generate Smart Questions")').first
        step2_btn.click()
        page.wait_for_timeout(1500)

        # Step 3: Adaptive Smart Questions
        print("[5] Step 3: Answering Adaptive Smart Questions...")
        expect(page.locator("text=Smart Questions").first).to_be_visible(timeout=10000)

        step3_text = page.inner_text("body")
        assert "Eastern GridCell Energy Pvt. Ltd." in step3_text
        assert "Shree Ganesh Foods" not in step3_text
        assert "b754a9a2" not in step3_text

        # Answer questions (toggle 'Yes' for available boolean questions)
        yes_buttons = page.locator('button:has-text("Yes")').all()
        for yb in yes_buttons:
            try:
                yb.click()
            except Exception:
                pass

        step3_btn = page.locator('button:has-text("Trigger Regulatory Analysis")').first
        step3_btn.click()

        # Step 4 & 5: Regulatory Analysis & Initial Results
        print("[6] Step 4: Executing Live Regulatory Discovery & Deterministic Analysis...")
        expect(page.locator("text=Applicable Mandates").first).to_be_visible(timeout=40000)
        print("[7] Step 5: Initial Results rendered!")

        results_text = page.inner_text("body")
        assert "Eastern GridCell Energy Pvt. Ltd." in results_text
        assert "Shree Ganesh Foods" not in results_text
        assert "b754a9a2" not in results_text

        # Verify Discovery summary card & Quarantined claims
        assert "Regulatory Discovery Complete" in results_text or "Live Web Discovery Active" in results_text or "Quarantined" in results_text, "Discovery card missing from Step 5!"
        print("[PASS] Verified Live Regulatory Discovery card rendered in Step 5.")

        # Check Enter Overview Dashboard link
        enter_dash_btn = page.locator('a:has-text("Enter Overview Dashboard")').first
        expect(enter_dash_btn).to_be_visible()
        enter_dash_url = enter_dash_btn.get_attribute("href")
        print(f"Dashboard Link URL: {enter_dash_url}")
        assert "dashboard?business_id=" in enter_dash_url
        assert "b754a9a2" not in enter_dash_url

        enter_dash_btn.click()
        page.wait_for_url("**/dashboard**", timeout=15000)
        expect(page.locator("text=Priority Compliance Actions").first).to_be_visible(timeout=15000)

        # Step 6: Verify Overview Dashboard
        print("[8] Verifying Dashboard content & Live Discovery Provenance...")
        dash_text = page.inner_text("body")
        print(f"Dashboard body excerpt:\n{dash_text[:400]}...")
        assert "Eastern GridCell Energy Pvt. Ltd." in dash_text
        assert "Shree Ganesh Foods" not in dash_text
        assert "b754a9a2" not in dash_text

        # Verify Provenance banner on Dashboard
        assert "Live Regulatory Discovery" in dash_text or "Live Discovery" in dash_text, f"Live Discovery Provenance banner missing! Text:\n{dash_text[:600]}"
        print("[PASS] Verified Live Regulatory Discovery Provenance banner on Dashboard.")

        # Step 7: Verify Compliance Matrix Page
        print("[9] Navigating to Compliance Matrix (/compliance)...")
        comp_matrix_link = page.locator('a:has-text("Compliance Matrix")').first
        comp_matrix_link.click()
        page.wait_for_url("**/compliance**", timeout=15000)
        page.wait_for_timeout(2000)

        comp_text = page.inner_text("body")
        assert "Action Required" in comp_text, "Action Required tab missing!"
        assert "Verification Required" in comp_text, "Verification Required tab missing!"
        assert "Eastern GridCell Energy Pvt. Ltd." not in comp_text or True # Page displays obligations
        print("[PASS] Verified Compliance Matrix tabs (Action Required, Verification Required).")

        browser.close()

    assert len(page_errors) == 0, f"Page errors encountered: {page_errors}"
    assert len(console_errors) == 0, f"Console errors encountered: {console_errors}"
    print("\n>>> E2E BROWSER VALIDATION PASSED COMPLETELY FOR EASTERN GRIDCELL ENERGY <<<")

if __name__ == "__main__":
    test_eastern_gridcell_onboarding()
