# Playwright Visual Design Testing for History Table
# Initial baseline capture and navigation testing

from playwright.sync_api import sync_playwright
import os
import time
from pathlib import Path

def capture_history_table_baseline():
    """
    Comprehensive visual baseline capture for the History Table component
    Testing URL: http://localhost:3000/history
    """
    
    # Create screenshots directory
    screenshots_dir = Path("visual-audit-screenshots")
    screenshots_dir.mkdir(exist_ok=True)
    
    with sync_playwright() as p:
        # Launch browser with comprehensive options
        browser = p.chromium.launch(
            headless=False,  # Keep visible for debugging
            args=[
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--force-device-scale-factor=1'
            ]
        )
        
        context = browser.new_context(
            viewport={'width': 1440, 'height': 900},
            device_scale_factor=1
        )
        
        page = context.new_page()
        
        try:
            print("🔍 Starting Visual Design Audit for History Table")
            print("=" * 60)
            
            # Navigate to history page
            print("📍 Navigating to http://localhost:3000/history")
            response = page.goto("http://localhost:3000/history", wait_until="networkidle")
            
            if response.status != 200:
                print(f"❌ Failed to load page. Status: {response.status}")
                return False
            
            print("✅ Page loaded successfully")
            
            # Wait for table to render
            print("⏳ Waiting for history table to render...")
            page.wait_for_selector(".bp6-history-table", timeout=10000)
            
            # Capture full page baseline
            print("📸 Capturing full page baseline screenshot")
            page.screenshot(path=screenshots_dir / "01_full_page_baseline.png", full_page=True)
            
            # Capture table element isolation
            print("📸 Capturing isolated table component")
            table_element = page.locator(".bp6-history-table")
            if table_element.count() > 0:
                table_element.screenshot(path=screenshots_dir / "02_table_component_isolated.png")
                print("✅ Table component captured")
            else:
                print("⚠️  Table component not found with .bp6-history-table selector")
            
            # Test different viewport sizes for responsive design
            viewports = [
                {'name': 'mobile', 'width': 375, 'height': 812},
                {'name': 'tablet', 'width': 768, 'height': 1024}, 
                {'name': 'desktop', 'width': 1440, 'height': 900},
                {'name': 'large_desktop', 'width': 1920, 'height': 1080}
            ]
            
            print("📱 Testing responsive design across viewports")
            for viewport in viewports:
                print(f"  → Testing {viewport['name']} ({viewport['width']}x{viewport['height']})")
                page.set_viewport_size(viewport['width'], viewport['height'])
                time.sleep(0.5)  # Allow reflow
                
                page.screenshot(
                    path=screenshots_dir / f"03_responsive_{viewport['name']}.png",
                    full_page=True
                )
            
            # Return to desktop view for detailed analysis
            page.set_viewport_size(1440, 900)
            
            # Analyze table structure
            print("🔍 Analyzing table structure and elements")
            
            # Check if Blueprint Table2 is being used
            blueprint_table = page.locator(".bp5-table, .bp6-table")
            if blueprint_table.count() > 0:
                print("✅ Blueprint Table component detected")
                blueprint_table.screenshot(path=screenshots_dir / "04_blueprint_table_structure.png")
            else:
                print("⚠️  Blueprint Table component not found")
            
            # Capture table headers specifically
            headers = page.locator(".bp5-table-column-headers, .bp6-column-header")
            if headers.count() > 0:
                print("✅ Table headers found")
                headers.screenshot(path=screenshots_dir / "05_table_headers.png")
            
            # Capture table body/rows
            table_body = page.locator(".bp5-table-body")
            if table_body.count() > 0:
                print("✅ Table body found")
                table_body.screenshot(path=screenshots_dir / "06_table_body_rows.png")
            
            print("\n📊 Visual Baseline Capture Complete")
            print(f"📁 Screenshots saved to: {screenshots_dir}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error during baseline capture: {e}")
            return False
        
        finally:
            browser.close()

if __name__ == "__main__":
    # Execute baseline capture
    success = capture_history_table_baseline()
    print(f"\n{'✅ Baseline capture successful' if success else '❌ Baseline capture failed'}")