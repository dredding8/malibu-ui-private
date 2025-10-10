/**
 * Quick verification script for split view activation
 * Run this in the browser console on the Collection Opportunities page
 */

console.clear();
console.log('%c🔍 Split View Activation Verification', 'font-size: 20px; color: #007bff; font-weight: bold;');
console.log('=' .repeat(50));

// Check feature flags
const flags = JSON.parse(localStorage.getItem('featureFlags') || '{}');
console.log('\n📋 Feature Flags:');
console.table({
  enableSplitView: flags.enableSplitView ?? 'not set',
  useRefactoredComponents: flags.useRefactoredComponents ?? 'not set'
});

// Check component rendering
const components = {
  splitViewContainer: !!document.querySelector('.collection-opportunities-split-view'),
  splitViewPanel: !!document.querySelector('.split-view-panel'),
  refactoredComponent: !!document.querySelector('.collection-opportunities-refactored'),
  modalOverlay: !!document.querySelector('.bp5-overlay'),
  mainContent: !!document.querySelector('.main-content')
};

console.log('\n🧩 Component Status:');
console.table(components);

// Determine active implementation
const implementation = components.splitViewContainer ? '✅ SPLIT VIEW' : 
                      components.refactoredComponent ? '❌ MODAL (Refactored)' : 
                      '❓ UNKNOWN';

console.log('\n📊 Active Implementation:', implementation);

// Force split view activation
if (!components.splitViewContainer) {
  console.log('\n⚠️  Split view not active. To activate, run:');
  console.log(`
%cconst flags = JSON.parse(localStorage.getItem('featureFlags') || '{}');
flags.enableSplitView = true;
flags.useRefactoredComponents = false;
localStorage.setItem('featureFlags', JSON.stringify(flags));
location.reload();`,
    'background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace;'
  );
} else {
  console.log('\n✅ Split view is active!');
  console.log('Click any row in the table to open the split panel.');
  
  // Test interaction
  console.log('\nTesting interaction...');
  const firstRow = document.querySelector('.opportunities-table tbody tr:first-child .opportunity-name-wrapper');
  if (firstRow) {
    console.log('📍 Found first row. Click it to test split view.');
  }
}

// Summary
console.log('\n' + '=' .repeat(50));
console.log('📝 Summary:');
console.log('- Split View Component:', components.splitViewContainer ? '✅ Present' : '❌ Missing');
console.log('- Modal Elements:', components.modalOverlay ? '❌ Still Present' : '✅ Removed');
console.log('- Implementation:', implementation);
console.log('=' .repeat(50));