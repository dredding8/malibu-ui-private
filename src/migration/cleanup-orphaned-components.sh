#!/bin/bash

# Collection Management Refactoring - Orphaned Component Cleanup Script
# This script helps identify and remove orphaned collection components

echo "Collection Management - Orphaned Component Cleanup"
echo "================================================="

# Create backup directory
BACKUP_DIR="./backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# List of orphaned components identified in Phase 4
ORPHANED_COMPONENTS=(
  "CollectionOpportunitiesLoader.tsx"
  "CollectionOpportunitiesUnified.tsx"
  "CollectionOpportunitiesJTBD.tsx"
  "CollectionOpportunitiesAccessible.tsx"
  "CollectionOpportunitiesPerformance.tsx"
  "CollectionOpportunitiesUXLaw.tsx"
  "CollectionOpportunitiesEnhancedBento.tsx"
  "CollectionOpportunitiesBento.tsx"
  "CollectionOpportunitiesSplitView.tsx"
)

echo "Checking for orphaned components..."
echo ""

# Check each component
for component in "${ORPHANED_COMPONENTS[@]}"; do
  # Find the component file
  found_files=$(find ./src -name "$component" -type f 2>/dev/null)
  
  if [ ! -z "$found_files" ]; then
    echo "Found: $component"
    
    # Check for imports
    import_count=$(grep -r "import.*${component%.tsx}" ./src --include="*.tsx" --include="*.ts" | grep -v "${component}" | wc -l)
    
    if [ $import_count -eq 0 ]; then
      echo "  ✓ No imports found - safe to remove"
      echo "  Backing up to: $BACKUP_DIR"
      
      # Backup the file
      for file in $found_files; do
        cp "$file" "$BACKUP_DIR/"
        echo "  Backed up: $file"
        
        # Remove the file (commented out for safety)
        # rm "$file"
        # echo "  Removed: $file"
      done
    else
      echo "  ⚠️  Found $import_count imports - needs migration first"
      grep -r "import.*${component%.tsx}" ./src --include="*.tsx" --include="*.ts" | grep -v "${component}"
    fi
    echo ""
  fi
done

echo "================================================="
echo "Cleanup analysis complete!"
echo "Backup location: $BACKUP_DIR"
echo ""
echo "To remove the files, uncomment the 'rm' commands in this script"
echo "or manually remove the files after verifying the backup."