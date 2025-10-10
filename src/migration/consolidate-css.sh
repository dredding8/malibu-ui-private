#!/bin/bash

# Collection Management CSS Consolidation Script
# This script helps identify and consolidate duplicate CSS files

echo "Collection Management - CSS Consolidation Analysis"
echo "================================================="

# Create consolidated CSS directory
CONSOLIDATED_DIR="./src/styles/collection"
mkdir -p "$CONSOLIDATED_DIR"

# Find all collection-related CSS files
echo "Analyzing CSS files..."
echo ""

# List of CSS files to check
CSS_FILES=$(find src/components -name "*.css" | grep -i collection)

echo "Found $(echo "$CSS_FILES" | wc -l) collection-related CSS files"
echo ""

# Check each CSS file for imports
for css_file in $CSS_FILES; do
  filename=$(basename "$css_file")
  dirname=$(dirname "$css_file")
  
  # Check if the CSS file is imported
  import_count=$(grep -r "import.*${filename}" ./src --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null | wc -l)
  
  echo "File: $css_file"
  echo "  Imports: $import_count"
  
  if [ $import_count -eq 0 ]; then
    echo "  ✓ No imports - candidate for removal"
  else
    echo "  ⚠️  Active imports found"
    # Show first 3 imports
    grep -r "import.*${filename}" ./src --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null | head -3 | sed 's/^/    /'
  fi
  
  # Check file size
  file_size=$(wc -c < "$css_file")
  echo "  Size: $file_size bytes"
  echo ""
done

echo "================================================="
echo "CSS Consolidation Recommendations:"
echo ""
echo "1. Move shared styles to: $CONSOLIDATED_DIR/shared.css"
echo "2. Create component-specific CSS modules"
echo "3. Remove unused CSS files (0 imports)"
echo "4. Use CSS-in-JS for dynamic styles"
echo ""
echo "Run 'npm run build:css' to analyze CSS bundle size"