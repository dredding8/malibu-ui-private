#!/usr/bin/env python3

import sys
import time
from playwright.sync_api import sync_playwright

def test_history_table():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        try:
            # Navigate to the history page
            print("Navigating to http://localhost:3000/history...")
            page.goto("http://localhost:3000/history", wait_until="networkidle")
            
            # Wait for content to load
            time.sleep(3)
            
            # Take a screenshot
            screenshot_path = "history_table_test.png"
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"Screenshot saved to {screenshot_path}")
            
            # Count header instances
            headers_to_check = [
                "Deck Name", 
                "Deck Status", 
                "Processing Status", 
                "Progress", 
                "Created", 
                "Completed", 
                "Actions"
            ]
            
            print("\n=== HEADER ANALYSIS ===")
            
            header_counts = {}
            all_headers_visible = True
            
            for header in headers_to_check:
                # Count all instances of each header text
                elements = page.locator(f"text={header}").all()
                count = len(elements)
                header_counts[header] = count
                
                print(f"'{header}': {count} instance(s)")
                
                if count == 0:
                    all_headers_visible = False
                    print(f"  ❌ Missing header: {header}")
                elif count > 1:
                    print(f"  ⚠️  Duplicate header detected: {header}")
                else:
                    print(f"  ✅ Correct count: {header}")
            
            # Check if table headers are in the expected location (thead)
            print("\n=== HEADER LOCATION CHECK ===")
            thead_elements = page.locator("thead").all()
            print(f"Number of <thead> elements: {len(thead_elements)}")
            
            if len(thead_elements) > 0:
                thead_text = page.locator("thead").text_content()
                print(f"Content in <thead>: {thead_text}")
                
                # Check if all expected headers are in thead
                headers_in_thead = all(header in thead_text for header in headers_to_check)
                print(f"All headers found in <thead>: {headers_in_thead}")
            else:
                print("❌ No <thead> element found")
            
            # Check for any duplicate table structures
            print("\n=== TABLE STRUCTURE CHECK ===")
            table_elements = page.locator("table").all()
            print(f"Number of <table> elements: {len(table_elements)}")
            
            # Look for any duplicate table headers outside of thead
            print("\n=== DUPLICATE DETECTION ===")
            for header in headers_to_check:
                # Find all elements containing this header text
                all_elements = page.locator(f"text={header}").all()
                if len(all_elements) > 1:
                    print(f"⚠️  Found {len(all_elements)} instances of '{header}':")
                    for i, element in enumerate(all_elements):
                        try:
                            tag_name = element.evaluate("el => el.tagName")
                            parent_tag = element.evaluate("el => el.parentElement?.tagName")
                            print(f"  {i+1}. <{tag_name.lower()}> inside <{parent_tag.lower() if parent_tag else 'unknown'}>")
                        except:
                            print(f"  {i+1}. Could not determine element details")
            
            # Overall assessment
            print("\n=== OVERALL ASSESSMENT ===")
            total_issues = 0
            
            # Check for missing headers
            missing_headers = [h for h, c in header_counts.items() if c == 0]
            if missing_headers:
                print(f"❌ Missing headers: {missing_headers}")
                total_issues += len(missing_headers)
            
            # Check for duplicate headers
            duplicate_headers = [h for h, c in header_counts.items() if c > 1]
            if duplicate_headers:
                print(f"⚠️  Duplicate headers: {duplicate_headers}")
                total_issues += len(duplicate_headers)
            
            # Check if headers are properly positioned
            if len(thead_elements) == 0:
                print("❌ No table header structure found")
                total_issues += 1
            elif len(thead_elements) > 1:
                print("⚠️  Multiple table header structures found")
                total_issues += 1
            
            if total_issues == 0:
                print("✅ BLUEPRINT NATIVE HEADERS WORKING CORRECTLY!")
                print("- All 7 headers present exactly once")
                print("- Headers properly positioned in table structure")
                print("- No duplicates detected")
            else:
                print(f"❌ ISSUES DETECTED: {total_issues} problems found")
            
            return total_issues == 0
            
        except Exception as e:
            print(f"Error during test: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            browser.close()

if __name__ == "__main__":
    success = test_history_table()
    print(f"\nTest completed. Success: {success}")
    sys.exit(0 if success else 1)