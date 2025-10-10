#!/usr/bin/env python3
"""
Quick UX Testing Script for Collection Management App
Lightweight testing that can run within the notebook environment
"""

import asyncio
import json
import time
from playwright.async_api import async_playwright

async def test_collection_app_ux():
    """
    Comprehensive UX testing for the collection management app
    Tests performance, accessibility, interactions, and user journey
    """
    
    print("🎭 Starting Collection Management App UX Test")
    print("=" * 60)
    
    results = {
        'performance': {},
        'structure': {},
        'interactions': {},
        'accessibility': {},
        'user_journey': {},
        'issues': [],
        'recommendations': []
    }
    
    async with async_playwright() as p:
        # Launch browser with optimal settings for testing
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=500,  # Slow down for visual debugging
            args=['--disable-web-security', '--disable-dev-shm-usage']
        )
        
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        
        page = await context.new_page()
        
        # Set up monitoring
        console_messages = []
        page_errors = []
        
        def handle_console(msg):
            console_messages.append({
                'type': msg.type,
                'text': msg.text,
                'location': str(msg.location) if hasattr(msg, 'location') else None
            })
            print(f"  📢 Console {msg.type}: {msg.text}")
        
        def handle_error(error):
            page_errors.append({
                'message': str(error),
                'stack': getattr(error, 'stack', None)
            })
            print(f"  🚨 Page Error: {error}")
        
        page.on('console', handle_console)
        page.on('pageerror', handle_error)
        
        try:
            # === PERFORMANCE TESTING ===
            print("\n⚡ Testing Performance & Load Times...")
            
            start_time = time.time()
            await page.goto('http://localhost:3001', wait_until='networkidle', timeout=30000)
            load_time = time.time() - start_time
            
            print(f"  ✅ Page loaded in {load_time:.2f} seconds")
            
            # Capture performance metrics
            perf_metrics = await page.evaluate("""
                () => {
                    const timing = performance.timing;
                    const navigation = performance.getEntriesByType('navigation')[0];
                    const paint = performance.getEntriesByType('paint');
                    
                    return {
                        pageLoad: timing.loadEventEnd - timing.navigationStart,
                        domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
                        resourceCount: performance.getEntriesByType('resource').length
                    };
                }
            """)
            
            results['performance'] = {
                'totalLoadTime': load_time * 1000,  # Convert to ms
                **perf_metrics,
                'grade': 'excellent' if load_time < 2 else 'good' if load_time < 4 else 'needs-improvement'
            }
            
            print(f"  📊 DOM Ready: {perf_metrics['domReady']}ms")
            print(f"  🎨 First Paint: {perf_metrics['firstPaint']}ms")
            print(f"  📦 Resources Loaded: {perf_metrics['resourceCount']}")
            
            # Take initial screenshot
            await page.screenshot(path='ux-test-initial.png', full_page=True)
            print(f"  📸 Initial screenshot saved")
            
            # === PAGE STRUCTURE ANALYSIS ===
            print("\n🏗️ Analyzing Page Structure...")
            
            structure_data = await page.evaluate("""
                () => {
                    const countElements = (selector) => document.querySelectorAll(selector).length;
                    
                    return {
                        navigation: {
                            navElements: countElements('nav, [role="navigation"]'),
                            menuItems: countElements('nav a, nav button, [role="menuitem"]'),
                            breadcrumbs: countElements('.bp5-breadcrumbs, .breadcrumb')
                        },
                        content: {
                            headings: {
                                h1: countElements('h1'),
                                h2: countElements('h2'),
                                h3: countElements('h3'),
                                total: countElements('h1, h2, h3, h4, h5, h6')
                            },
                            cards: countElements('.bp5-card, .card'),
                            tables: countElements('table, .bp5-html-table'),
                            lists: countElements('ul, ol')
                        },
                        interactive: {
                            buttons: countElements('button, [role="button"]'),
                            inputs: countElements('input, textarea, select'),
                            links: countElements('a[href]'),
                            forms: countElements('form')
                        },
                        blueprint: {
                            bpComponents: countElements('[class*="bp5-"], [class*="bp4-"]'),
                            icons: countElements('.bp5-icon, .bp4-icon'),
                            dialogs: countElements('.bp5-dialog, .bp5-drawer')
                        }
                    };
                }
            """)
            
            results['structure'] = structure_data
            
            print(f"  🧭 Navigation: {structure_data['navigation']['navElements']} nav elements")
            print(f"  📋 Content: {structure_data['content']['cards']} cards, {structure_data['content']['tables']} tables")
            print(f"  🎯 Interactive: {structure_data['interactive']['buttons']} buttons, {structure_data['interactive']['inputs']} inputs")
            print(f"  🎨 Blueprint UI: {structure_data['blueprint']['bpComponents']} components")
            
            # === INTERACTION TESTING ===
            print("\n🎯 Testing User Interactions...")
            
            # Test clickable elements
            buttons = await page.query_selector_all('button:visible')
            print(f"  🖱️ Found {len(buttons)} visible buttons")
            
            interaction_results = []
            for i, button in enumerate(buttons[:4]):  # Test first 4 buttons
                try:
                    text = await button.text_content()
                    is_enabled = await button.is_enabled()
                    
                    print(f"    Button {i+1}: '{text[:25]}' - {'enabled' if is_enabled else 'disabled'}")
                    
                    if is_enabled:
                        # Take before screenshot
                        await page.screenshot(path=f'interaction-before-{i+1}.png')
                        
                        # Click and observe
                        await button.click()
                        await page.wait_for_timeout(750)
                        
                        # Take after screenshot
                        await page.screenshot(path=f'interaction-after-{i+1}.png')
                        
                        interaction_results.append({
                            'button': i+1,
                            'text': text[:50],
                            'success': True
                        })
                        
                        print(f"    ✅ Successfully clicked button {i+1}")
                    
                except Exception as e:
                    print(f"    ❌ Failed to click button {i+1}: {str(e)[:50]}")
                    interaction_results.append({
                        'button': i+1,
                        'success': False,
                        'error': str(e)[:100]
                    })
            
            # Test form inputs
            inputs = await page.query_selector_all('input:visible, textarea:visible')
            print(f"  📝 Found {len(inputs)} visible inputs")
            
            input_results = []
            for i, input_elem in enumerate(inputs[:3]):  # Test first 3 inputs
                try:
                    input_type = await input_elem.get_attribute('type')
                    placeholder = await input_elem.get_attribute('placeholder')
                    
                    print(f"    Input {i+1}: type='{input_type}', placeholder='{placeholder}'")
                    
                    if input_type in ['text', 'search', 'email', 'number', None]:
                        await input_elem.fill('test value')
                        await page.wait_for_timeout(300)
                        
                        value = await input_elem.input_value()
                        input_results.append({
                            'input': i+1,
                            'type': input_type,
                            'success': True,
                            'testValue': value
                        })
                        
                        print(f"    ✅ Successfully filled input {i+1}")
                
                except Exception as e:
                    print(f"    ❌ Failed to test input {i+1}: {str(e)[:50]}")
                    input_results.append({
                        'input': i+1,
                        'success': False,
                        'error': str(e)[:100]
                    })
            
            results['interactions'] = {
                'buttons': interaction_results,
                'inputs': input_results,
                'summary': {
                    'buttonsFound': len(buttons),
                    'inputsFound': len(inputs),
                    'successfulClicks': len([r for r in interaction_results if r.get('success')]),
                    'successfulInputs': len([r for r in input_results if r.get('success')])
                }
            }
            
            # === ACCESSIBILITY TESTING ===
            print("\n♿ Testing Accessibility...")
            
            accessibility_data = await page.evaluate("""
                () => {
                    const images = document.querySelectorAll('img');
                    const inputs = document.querySelectorAll('input, textarea, select');
                    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                    const focusableElements = document.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
                    
                    // Check alt text on images
                    let imagesWithAlt = 0;
                    images.forEach(img => {
                        const alt = img.getAttribute('alt');
                        if (alt && alt.trim().length > 0) imagesWithAlt++;
                    });
                    
                    // Check form labels
                    let labeledInputs = 0;
                    inputs.forEach(input => {
                        const hasLabel = document.querySelector(`label[for="${input.id}"]`) ||
                                        input.closest('label') ||
                                        input.getAttribute('aria-label') ||
                                        input.getAttribute('aria-labelledby');
                        if (hasLabel) labeledInputs++;
                    });
                    
                    // Check heading hierarchy
                    let headingIssues = 0;
                    let lastLevel = 0;
                    headings.forEach(heading => {
                        const level = parseInt(heading.tagName.charAt(1));
                        if (level > lastLevel + 1) headingIssues++;
                        lastLevel = level;
                    });
                    
                    return {
                        images: { total: images.length, withAlt: imagesWithAlt },
                        forms: { total: inputs.length, labeled: labeledInputs },
                        headings: { total: headings.length, hierarchyIssues: headingIssues },
                        navigation: {
                            focusableElements: focusableElements.length,
                            landmarks: document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer').length,
                            skipLinks: document.querySelectorAll('a[href^="#"], .skip-link').length
                        }
                    };
                }
            """)
            
            # Calculate accessibility score
            accessibility_score = 0
            max_score = 100
            
            # Images (20 points)
            if accessibility_data['images']['total'] > 0:
                accessibility_score += (accessibility_data['images']['withAlt'] / accessibility_data['images']['total']) * 20
            else:
                accessibility_score += 20
            
            # Form labels (30 points)
            if accessibility_data['forms']['total'] > 0:
                accessibility_score += (accessibility_data['forms']['labeled'] / accessibility_data['forms']['total']) * 30
            else:
                accessibility_score += 30
            
            # Landmarks (20 points)
            accessibility_score += min(accessibility_data['navigation']['landmarks'] * 5, 20)
            
            # Heading hierarchy (20 points)
            if accessibility_data['headings']['total'] > 0:
                accessibility_score += max(0, 20 - accessibility_data['headings']['hierarchyIssues'] * 5)
            
            # Focusable elements (10 points)
            if accessibility_data['navigation']['focusableElements'] > 0:
                accessibility_score += 10
            
            results['accessibility'] = {
                **accessibility_data,
                'score': round(accessibility_score),
                'grade': 'A' if accessibility_score >= 90 else 'B' if accessibility_score >= 80 else 'C' if accessibility_score >= 70 else 'D'
            }
            
            print(f"  📊 Accessibility Score: {round(accessibility_score)}% (Grade: {results['accessibility']['grade']})")
            print(f"  🖼️ Images with alt text: {accessibility_data['images']['withAlt']}/{accessibility_data['images']['total']}")
            print(f"  📝 Labeled form inputs: {accessibility_data['forms']['labeled']}/{accessibility_data['forms']['total']}")
            print(f"  🏷️ Navigation landmarks: {accessibility_data['navigation']['landmarks']}")
            print(f"  📋 Heading hierarchy issues: {accessibility_data['headings']['hierarchyIssues']}")
            
            # === USER JOURNEY ASSESSMENT ===
            print("\n🛤️ Assessing User Journey Flow...")
            
            # Test navigation flow
            nav_links = await page.query_selector_all('nav a, [role="navigation"] a')
            print(f"  🔗 Found {len(nav_links)} navigation links")
            
            journey_results = []
            for i, link in enumerate(nav_links[:3]):  # Test first 3 nav links
                try:
                    href = await link.get_attribute('href')
                    text = await link.text_content()
                    
                    if href and not href.startswith('http') and not href.startswith('mailto:'):
                        print(f"    Testing navigation: '{text}' -> {href}")
                        
                        current_url = page.url
                        await link.click()
                        await page.wait_for_timeout(1000)
                        
                        new_url = page.url
                        navigation_successful = current_url != new_url
                        
                        # Take screenshot of new page
                        await page.screenshot(path=f'navigation-{i+1}.png')
                        
                        journey_results.append({
                            'link': i+1,
                            'text': text,
                            'href': href,
                            'navigationSuccessful': navigation_successful
                        })
                        
                        print(f"    {'✅' if navigation_successful else '⚠️'} Navigation {'successful' if navigation_successful else 'stayed on same page'}")
                        
                        # Return to original page
                        if navigation_successful:
                            await page.go_back()
                            await page.wait_for_timeout(500)
                
                except Exception as e:
                    print(f"    ❌ Navigation test {i+1} failed: {str(e)[:50]}")
            
            results['user_journey'] = {
                'navigation_tests': journey_results,
                'successful_navigations': len([r for r in journey_results if r.get('navigationSuccessful')])
            }
            
            # === RESPONSIVE DESIGN CHECK ===
            print("\n📱 Testing Responsive Behavior...")
            
            viewports = [
                {'name': 'mobile', 'width': 375, 'height': 667},
                {'name': 'tablet', 'width': 768, 'height': 1024},
                {'name': 'desktop', 'width': 1280, 'height': 720}
            ]
            
            responsive_results = []
            for viewport in viewports:
                await page.set_viewport_size({'width': viewport['width'], 'height': viewport['height']})
                await page.wait_for_timeout(500)
                
                # Check for layout issues
                layout_check = await page.evaluate("""
                    () => ({
                        hasHorizontalScroll: document.body.scrollWidth > window.innerWidth,
                        viewportWidth: window.innerWidth,
                        contentWidth: document.body.scrollWidth
                    })
                """)
                
                await page.screenshot(path=f'responsive-{viewport["name"]}.png')
                
                responsive_results.append({
                    'viewport': viewport['name'],
                    'dimensions': viewport,
                    'hasLayoutIssues': layout_check['hasHorizontalScroll'],
                    **layout_check
                })
                
                print(f"  📐 {viewport['name']} ({viewport['width']}x{viewport['height']}): {'⚠️ layout issues' if layout_check['hasHorizontalScroll'] else '✅ looks good'}")
            
            results['responsive'] = responsive_results
            
            # Reset viewport
            await page.set_viewport_size({'width': 1280, 'height': 720})
            
            # === FINAL ASSESSMENT ===
            print("\n📊 Generating Final Assessment...")
            
            # Count issues and generate recommendations
            issues = []
            recommendations = []
            
            if results['performance']['grade'] == 'needs-improvement':
                issues.append('Slow page load performance')
                recommendations.append('Optimize bundle size and loading strategies')
            
            if results['accessibility']['score'] < 80:
                issues.append('Accessibility compliance below 80%')
                recommendations.append('Improve form labels, alt text, and navigation landmarks')
            
            if len(page_errors) > 0:
                issues.append(f'{len(page_errors)} JavaScript errors detected')
                recommendations.append('Review and fix JavaScript errors in console')
            
            interaction_success_rate = (results['interactions']['summary']['successfulClicks'] / 
                                     max(results['interactions']['summary']['buttonsFound'], 1)) * 100
            
            if interaction_success_rate < 80:
                issues.append('Low interaction success rate')
                recommendations.append('Review button functionality and error handling')
            
            # Check for responsive issues
            responsive_issues = [r for r in responsive_results if r['hasLayoutIssues']]
            if responsive_issues:
                issues.append(f'Responsive layout issues on {len(responsive_issues)} viewports')
                recommendations.append('Fix horizontal scroll and layout overflow on mobile devices')
            
            results['issues'] = issues
            results['recommendations'] = recommendations
            
            # Final screenshot
            await page.screenshot(path='ux-test-final.png', full_page=True)
            
            # === SUMMARY REPORT ===
            print("\n🎯 UX TESTING SUMMARY")
            print("=" * 50)
            print(f"⚡ Performance Grade: {results['performance']['grade']}")
            print(f"♿ Accessibility Score: {results['accessibility']['score']}% ({results['accessibility']['grade']})")
            print(f"🎯 Interaction Success: {interaction_success_rate:.1f}%")
            print(f"🧭 Navigation Success: {len(journey_results)} links tested")
            print(f"📱 Responsive: {len(viewports) - len(responsive_issues)}/{len(viewports)} viewports clean")
            print(f"🚨 Issues Found: {len(issues)}")
            print(f"📢 Console Messages: {len(console_messages)}")
            print(f"❌ JavaScript Errors: {len(page_errors)}")
            
            if issues:
                print(f"\n⚠️ Key Issues:")
                for i, issue in enumerate(issues, 1):
                    print(f"  {i}. {issue}")
            
            if recommendations:
                print(f"\n💡 Recommendations:")
                for i, rec in enumerate(recommendations, 1):
                    print(f"  {i}. {rec}")
            
            # Save detailed results
            with open('ux-test-results.json', 'w') as f:
                json.dump({
                    **results,
                    'console_messages': console_messages,
                    'page_errors': page_errors,
                    'test_timestamp': time.time(),
                    'summary': {
                        'performance_grade': results['performance']['grade'],
                        'accessibility_score': results['accessibility']['score'],
                        'interaction_success_rate': interaction_success_rate,
                        'issues_count': len(issues),
                        'recommendations_count': len(recommendations)
                    }
                }, f, indent=2)
            
            print(f"\n📋 Detailed results saved to: ux-test-results.json")
            print(f"📸 Screenshots saved: ux-test-*.png, interaction-*.png, navigation-*.png, responsive-*.png")
            
            return results
            
        except Exception as e:
            print(f"\n💥 Testing failed: {str(e)}")
            raise e
        
        finally:
            await browser.close()
            print(f"\n🏁 UX testing completed")

# Run the test
if __name__ == "__main__":
    import asyncio
    asyncio.run(test_collection_app_ux())