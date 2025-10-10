# Collection System - Proof of Concept Code

## Overview

This document provides concrete code examples demonstrating the key architectural components of the new collection management system. These examples serve as implementation templates and validation of the proposed architecture.

## 1. Core State Management (Zustand Store)

### 1.1 Store Definition

```typescript
// src/collections/core/store.ts
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Collection {
  id: string;
  name: string;
  description: string;
  type: 'personal' | 'shared' | 'public';
  tags: string[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

interface CollectionEntities {
  collections: Record<string, Collection>;
  tags: Record<string, Tag>;
}

interface UIState {
  selectedCollectionId: string | null;
  viewMode: 'grid' | 'list' | 'card';
  sortConfig: {
    field: keyof Collection;
    direction: 'asc' | 'desc';
  };
  searchQuery: string;
  filters: {
    type: Collection['type'][];
    tags: string[];
  };
  pagination: {
    page: number;
    pageSize: number;
  };
}

interface OperationState {
  loading: Set<string>;
  errors: Record<string, Error>;
  optimisticUpdates: Record<string, Partial<Collection>>;
}

interface CollectionState {
  entities: CollectionEntities;
  ui: UIState;
  operations: OperationState;
}

interface CollectionActions {
  // Entity actions
  setCollections: (collections: Collection[]) => void;
  addCollection: (collection: Collection) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  removeCollection: (id: string) => void;
  
  // UI actions
  setViewMode: (mode: UIState['viewMode']) => void;
  setSort: (config: UIState['sortConfig']) => void;
  setSearch: (query: string) => void;
  selectCollection: (id: string | null) => void;
  setFilters: (filters: Partial<UIState['filters']>) => void;
  setPagination: (pagination: Partial<UIState['pagination']>) => void;
  
  // Operation actions
  setLoading: (operationId: string, loading: boolean) => void;
  setError: (operationId: string, error: Error | null) => void;
  addOptimisticUpdate: (id: string, update: Partial<Collection>) => void;
  removeOptimisticUpdate: (id: string) => void;
}

interface CollectionStore extends CollectionState, CollectionActions {
  // Computed getters
  get filteredCollections(): Collection[];
  get sortedCollections(): Collection[];
  get selectedCollection(): Collection | null;
  get isLoading(): boolean;
  get hasErrors(): boolean;
}

const initialState: CollectionState = {
  entities: {
    collections: {},
    tags: {},
  },
  ui: {
    selectedCollectionId: null,
    viewMode: 'grid',
    sortConfig: { field: 'updatedAt', direction: 'desc' },
    searchQuery: '',
    filters: { type: [], tags: [] },
    pagination: { page: 1, pageSize: 20 },
  },
  operations: {
    loading: new Set(),
    errors: {},
    optimisticUpdates: {},
  },
};

export const useCollectionStore = create<CollectionStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,
        
        // Entity actions
        setCollections: (collections) =>
          set((state) => {
            const normalized = collections.reduce((acc, collection) => {
              acc[collection.id] = collection;
              return acc;
            }, {} as Record<string, Collection>);
            
            state.entities.collections = normalized;
          }),
        
        addCollection: (collection) =>
          set((state) => {
            state.entities.collections[collection.id] = collection;
          }),
        
        updateCollection: (id, updates) =>
          set((state) => {
            if (state.entities.collections[id]) {
              Object.assign(state.entities.collections[id], updates);
            }
          }),
        
        removeCollection: (id) =>
          set((state) => {
            delete state.entities.collections[id];
            if (state.ui.selectedCollectionId === id) {
              state.ui.selectedCollectionId = null;
            }
          }),
        
        // UI actions
        setViewMode: (mode) =>
          set((state) => {
            state.ui.viewMode = mode;
          }),
        
        setSort: (config) =>
          set((state) => {
            state.ui.sortConfig = config;
          }),
        
        setSearch: (query) =>
          set((state) => {
            state.ui.searchQuery = query;
            state.ui.pagination.page = 1; // Reset to first page
          }),
        
        selectCollection: (id) =>
          set((state) => {
            state.ui.selectedCollectionId = id;
          }),
        
        setFilters: (filters) =>
          set((state) => {
            Object.assign(state.ui.filters, filters);
            state.ui.pagination.page = 1; // Reset to first page
          }),
        
        setPagination: (pagination) =>
          set((state) => {
            Object.assign(state.ui.pagination, pagination);
          }),
        
        // Operation actions
        setLoading: (operationId, loading) =>
          set((state) => {
            if (loading) {
              state.operations.loading.add(operationId);
            } else {
              state.operations.loading.delete(operationId);
            }
          }),
        
        setError: (operationId, error) =>
          set((state) => {
            if (error) {
              state.operations.errors[operationId] = error;
            } else {
              delete state.operations.errors[operationId];
            }
          }),
        
        addOptimisticUpdate: (id, update) =>
          set((state) => {
            state.operations.optimisticUpdates[id] = update;
          }),
        
        removeOptimisticUpdate: (id) =>
          set((state) => {
            delete state.operations.optimisticUpdates[id];
          }),
        
        // Computed getters
        get filteredCollections() {
          const state = get();
          const { collections } = state.entities;
          const { searchQuery, filters } = state.ui;
          
          let filtered = Object.values(collections);
          
          // Apply search filter
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(collection =>
              collection.name.toLowerCase().includes(query) ||
              collection.description.toLowerCase().includes(query)
            );
          }
          
          // Apply type filter
          if (filters.type.length > 0) {
            filtered = filtered.filter(collection =>
              filters.type.includes(collection.type)
            );
          }
          
          // Apply tag filter
          if (filters.tags.length > 0) {
            filtered = filtered.filter(collection =>
              filters.tags.some(tag => collection.tags.includes(tag))
            );
          }
          
          return filtered;
        },
        
        get sortedCollections() {
          const state = get();
          const filtered = state.filteredCollections;
          const { sortConfig } = state.ui;
          
          return [...filtered].sort((a, b) => {
            const aValue = a[sortConfig.field];
            const bValue = b[sortConfig.field];
            
            let comparison = 0;
            if (aValue < bValue) comparison = -1;
            if (aValue > bValue) comparison = 1;
            
            return sortConfig.direction === 'desc' ? -comparison : comparison;
          });
        },
        
        get selectedCollection() {
          const state = get();
          const { selectedCollectionId } = state.ui;
          return selectedCollectionId ? state.entities.collections[selectedCollectionId] || null : null;
        },
        
        get isLoading() {
          const state = get();
          return state.operations.loading.size > 0;
        },
        
        get hasErrors() {
          const state = get();
          return Object.keys(state.operations.errors).length > 0;
        },
      }))
    ),
    { name: 'collection-store' }
  )
);
```

## 2. Core Hooks Implementation

### 2.1 Primary Collection Hook

```typescript
// src/collections/hooks/useCollection.ts
import { useMemo } from 'react';
import { useCollectionStore } from '../core/store';

export interface UseCollectionOptions {
  id?: string;
  includeOptimistic?: boolean;
}

export interface UseCollectionReturn {
  collection: Collection | null;
  collections: Collection[];
  filteredCollections: Collection[];
  sortedCollections: Collection[];
  selectedCollection: Collection | null;
  loading: boolean;
  error: Error | null;
  isEmpty: boolean;
  total: number;
}

export const useCollection = (options: UseCollectionOptions = {}): UseCollectionReturn => {
  const { id, includeOptimistic = true } = options;
  
  const store = useCollectionStore();
  
  return useMemo(() => {
    const collections = Object.values(store.entities.collections);
    
    // Apply optimistic updates if enabled
    const processedCollections = includeOptimistic
      ? collections.map(collection => ({
          ...collection,
          ...store.operations.optimisticUpdates[collection.id],
        }))
      : collections;
    
    const collection = id ? store.entities.collections[id] || null : null;
    const processedCollection = collection && includeOptimistic
      ? { ...collection, ...store.operations.optimisticUpdates[id] }
      : collection;
    
    return {
      collection: processedCollection,
      collections: processedCollections,
      filteredCollections: store.filteredCollections,
      sortedCollections: store.sortedCollections,
      selectedCollection: store.selectedCollection,
      loading: store.isLoading,
      error: Object.values(store.operations.errors)[0] || null,
      isEmpty: processedCollections.length === 0,
      total: processedCollections.length,
    };
  }, [store, id, includeOptimistic]);
};
```

### 2.2 Collection Actions Hook

```typescript
// src/collections/hooks/useCollectionActions.ts
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCollectionStore } from '../core/store';
import { collectionAPI, CreateCollectionData, UpdateCollectionData } from '../core/api';
import { generateTempId } from '../utils/id.utils';

export interface UseCollectionActionsReturn {
  create: (data: CreateCollectionData) => Promise<Collection>;
  update: (id: string, data: UpdateCollectionData) => Promise<Collection>;
  delete: (id: string) => Promise<void>;
  duplicate: (id: string) => Promise<Collection>;
  bulkDelete: (ids: string[]) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const useCollectionActions = (): UseCollectionActionsReturn => {
  const store = useCollectionStore();
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: collectionAPI.create,
    onMutate: async (data) => {
      const tempId = generateTempId();
      const optimisticCollection: Collection = {
        id: tempId,
        ...data,
        itemCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      store.addOptimisticUpdate(tempId, optimisticCollection);
      store.addCollection(optimisticCollection);
      
      return { tempId };
    },
    onSuccess: (newCollection, _, context) => {
      store.removeOptimisticUpdate(context.tempId);
      store.removeCollection(context.tempId);
      store.addCollection(newCollection);
      
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
    onError: (error, _, context) => {
      store.removeOptimisticUpdate(context.tempId);
      store.removeCollection(context.tempId);
      store.setError('create-collection', error as Error);
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCollectionData }) =>
      collectionAPI.update(id, data),
    onMutate: async ({ id, data }) => {
      const previousCollection = store.entities.collections[id];
      
      store.addOptimisticUpdate(id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      
      return { previousCollection };
    },
    onSuccess: (updatedCollection) => {
      store.removeOptimisticUpdate(updatedCollection.id);
      store.updateCollection(updatedCollection.id, updatedCollection);
      
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.setQueryData(['collection', updatedCollection.id], updatedCollection);
    },
    onError: (error, { id }, context) => {
      store.removeOptimisticUpdate(id);
      if (context?.previousCollection) {
        store.updateCollection(id, context.previousCollection);
      }
      store.setError('update-collection', error as Error);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: collectionAPI.delete,
    onMutate: async (id) => {
      const previousCollection = store.entities.collections[id];
      store.removeCollection(id);
      
      return { previousCollection };
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.removeQueries({ queryKey: ['collection', id] });
    },
    onError: (error, id, context) => {
      if (context?.previousCollection) {
        store.addCollection(context.previousCollection);
      }
      store.setError('delete-collection', error as Error);
    },
  });
  
  const create = useCallback((data: CreateCollectionData) => {
    return createMutation.mutateAsync(data);
  }, [createMutation]);
  
  const update = useCallback((id: string, data: UpdateCollectionData) => {
    return updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);
  
  const deleteCollection = useCallback((id: string) => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);
  
  const duplicate = useCallback(async (id: string) => {
    const original = store.entities.collections[id];
    if (!original) {
      throw new Error('Collection not found');
    }
    
    const duplicateData: CreateCollectionData = {
      name: `${original.name} (Copy)`,
      description: original.description,
      type: original.type,
      tags: [...original.tags],
    };
    
    return create(duplicateData);
  }, [store.entities.collections, create]);
  
  const bulkDelete = useCallback(async (ids: string[]) => {
    const promises = ids.map(id => deleteCollection(id));
    await Promise.all(promises);
  }, [deleteCollection]);
  
  return {
    create,
    update,
    delete: deleteCollection,
    duplicate,
    bulkDelete,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
```

### 2.3 Collection Filters Hook

```typescript
// src/collections/hooks/useCollectionFilters.ts
import { useCallback, useMemo } from 'react';
import { useCollectionStore } from '../core/store';
import { useDebounce } from './useDebounce';

export interface FilterOption {
  label: string;
  value: string;
  count: number;
}

export interface UseCollectionFiltersReturn {
  searchQuery: string;
  setSearch: (query: string) => void;
  debouncedSearch: string;
  
  filters: UIState['filters'];
  setFilters: (filters: Partial<UIState['filters']>) => void;
  clearFilters: () => void;
  
  filteredCollections: Collection[];
  
  // Filter options with counts
  typeOptions: FilterOption[];
  tagOptions: FilterOption[];
  
  // Helper methods
  toggleTypeFilter: (type: Collection['type']) => void;
  toggleTagFilter: (tag: string) => void;
  hasActiveFilters: boolean;
}

export const useCollectionFilters = (): UseCollectionFiltersReturn => {
  const store = useCollectionStore();
  const debouncedSearch = useDebounce(store.ui.searchQuery, 300);
  
  const setSearch = useCallback((query: string) => {
    store.setSearch(query);
  }, [store]);
  
  const setFilters = useCallback((filters: Partial<UIState['filters']>) => {
    store.setFilters(filters);
  }, [store]);
  
  const clearFilters = useCallback(() => {
    store.setSearch('');
    store.setFilters({ type: [], tags: [] });
  }, [store]);
  
  const toggleTypeFilter = useCallback((type: Collection['type']) => {
    const currentTypes = store.ui.filters.type;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    store.setFilters({ type: newTypes });
  }, [store]);
  
  const toggleTagFilter = useCallback((tag: string) => {
    const currentTags = store.ui.filters.tags;
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    store.setFilters({ tags: newTags });
  }, [store]);
  
  // Compute filter options with counts
  const { typeOptions, tagOptions } = useMemo(() => {
    const collections = Object.values(store.entities.collections);
    
    // Count by type
    const typeCounts = collections.reduce((acc, collection) => {
      acc[collection.type] = (acc[collection.type] || 0) + 1;
      return acc;
    }, {} as Record<Collection['type'], number>);
    
    // Count by tag
    const tagCounts = collections.reduce((acc, collection) => {
      collection.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    const typeOptions: FilterOption[] = Object.entries(typeCounts).map(([type, count]) => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: type,
      count,
    }));
    
    const tagOptions: FilterOption[] = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([tag, count]) => ({
        label: tag,
        value: tag,
        count,
      }));
    
    return { typeOptions, tagOptions };
  }, [store.entities.collections]);
  
  const hasActiveFilters = useMemo(() => {
    return store.ui.searchQuery.length > 0 ||
           store.ui.filters.type.length > 0 ||
           store.ui.filters.tags.length > 0;
  }, [store.ui]);
  
  return {
    searchQuery: store.ui.searchQuery,
    setSearch,
    debouncedSearch,
    
    filters: store.ui.filters,
    setFilters,
    clearFilters,
    
    filteredCollections: store.filteredCollections,
    
    typeOptions,
    tagOptions,
    
    toggleTypeFilter,
    toggleTagFilter,
    hasActiveFilters,
  };
};
```

## 3. Compound Component Implementation

### 3.1 Core Collection Component

```typescript
// src/collections/presentation/Collection/Collection.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useCollection, UseCollectionOptions } from '../../hooks/useCollection';
import { useCollectionActions } from '../../hooks/useCollectionActions';

interface CollectionContextValue {
  collections: Collection[];
  selectedCollection: Collection | null;
  loading: boolean;
  error: Error | null;
  actions: ReturnType<typeof useCollectionActions>;
  onSelect?: (collection: Collection) => void;
  onAction?: (action: string, collection: Collection) => void;
}

const CollectionContext = createContext<CollectionContextValue | null>(null);

export const useCollectionContext = () => {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error('Collection components must be used within a Collection provider');
  }
  return context;
};

interface CollectionProps extends UseCollectionOptions {
  children: ReactNode;
  onSelect?: (collection: Collection) => void;
  onAction?: (action: string, collection: Collection) => void;
}

export const Collection: React.FC<CollectionProps> & {
  Grid: typeof CollectionGrid;
  List: typeof CollectionList;
  Card: typeof CollectionCard;
  Item: typeof CollectionItem;
  Empty: typeof CollectionEmpty;
  Header: typeof CollectionHeader;
  Actions: typeof CollectionActions;
  // Pre-configured layouts
  GridView: typeof CollectionGridView;
  ListView: typeof CollectionListView;
  CardView: typeof CollectionCardView;
} = ({ children, onSelect, onAction, ...options }) => {
  const collection = useCollection(options);
  const actions = useCollectionActions();
  
  const contextValue: CollectionContextValue = {
    ...collection,
    actions,
    onSelect,
    onAction,
  };
  
  return (
    <CollectionContext.Provider value={contextValue}>
      <div className="collection-container">
        {children}
      </div>
    </CollectionContext.Provider>
  );
};
```

### 3.2 Collection Grid Component

```typescript
// src/collections/presentation/Collection/CollectionGrid.tsx
import React, { memo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { useCollectionContext } from './Collection';
import { CollectionItem } from './CollectionItem';

interface CollectionGridProps {
  itemWidth?: number;
  itemHeight?: number;
  gap?: number;
  virtualized?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const CollectionGrid = memo<CollectionGridProps>(({
  itemWidth = 300,
  itemHeight = 200,
  gap = 16,
  virtualized = false,
  className = '',
  children,
}) => {
  const { collections, loading } = useCollectionContext();
  
  if (loading) {
    return <CollectionGridSkeleton />;
  }
  
  if (collections.length === 0) {
    return children || <Collection.Empty />;
  }
  
  if (virtualized && collections.length > 50) {
    return (
      <VirtualizedCollectionGrid
        collections={collections}
        itemWidth={itemWidth}
        itemHeight={itemHeight}
        gap={gap}
        className={className}
      />
    );
  }
  
  return (
    <div 
      className={`collection-grid ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${itemWidth}px, 1fr))`,
        gap: `${gap}px`,
      }}
    >
      {collections.map((collection) => (
        <CollectionItem key={collection.id} collection={collection} />
      ))}
    </div>
  );
});

CollectionGrid.displayName = 'CollectionGrid';

// Virtualized grid for large datasets
const VirtualizedCollectionGrid: React.FC<{
  collections: Collection[];
  itemWidth: number;
  itemHeight: number;
  gap: number;
  className: string;
}> = ({ collections, itemWidth, itemHeight, gap, className }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(800);
  
  // Calculate grid dimensions
  const columnsCount = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const rowsCount = Math.ceil(collections.length / columnsCount);
  
  React.useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const GridItem = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnsCount + columnIndex;
    const collection = collections[index];
    
    if (!collection) return null;
    
    return (
      <div style={{
        ...style,
        padding: gap / 2,
      }}>
        <CollectionItem collection={collection} />
      </div>
    );
  };
  
  return (
    <div ref={containerRef} className={`collection-grid-virtualized ${className}`}>
      <Grid
        columnCount={columnsCount}
        rowCount={rowsCount}
        columnWidth={itemWidth + gap}
        rowHeight={itemHeight + gap}
        height={600}
        width={containerWidth}
      >
        {GridItem}
      </Grid>
    </div>
  );
};

const CollectionGridSkeleton: React.FC = () => (
  <div className="collection-grid-skeleton">
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="collection-item-skeleton" />
    ))}
  </div>
);
```

### 3.3 Collection Item Component

```typescript
// src/collections/presentation/Collection/CollectionItem.tsx
import React, { memo, useCallback } from 'react';
import { useCollectionContext } from './Collection';

interface CollectionItemProps {
  collection: Collection;
  variant?: 'card' | 'list' | 'compact';
  showActions?: boolean;
  className?: string;
}

export const CollectionItem = memo<CollectionItemProps>(({
  collection,
  variant = 'card',
  showActions = true,
  className = '',
}) => {
  const { selectedCollection, onSelect, onAction, actions } = useCollectionContext();
  const isSelected = selectedCollection?.id === collection.id;
  
  const handleClick = useCallback(() => {
    onSelect?.(collection);
  }, [collection, onSelect]);
  
  const handleAction = useCallback((action: string) => {
    onAction?.(action, collection);
  }, [collection, onAction]);
  
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleAction('edit');
  }, [handleAction]);
  
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleAction('delete');
  }, [handleAction]);
  
  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    actions.duplicate(collection.id);
  }, [actions, collection.id]);
  
  if (variant === 'list') {
    return (
      <CollectionListItem
        collection={collection}
        isSelected={isSelected}
        showActions={showActions}
        onClick={handleClick}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        className={className}
      />
    );
  }
  
  if (variant === 'compact') {
    return (
      <CollectionCompactItem
        collection={collection}
        isSelected={isSelected}
        onClick={handleClick}
        className={className}
      />
    );
  }
  
  // Default card variant
  return (
    <div
      className={`collection-card ${isSelected ? 'selected' : ''} ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className="collection-card-header">
        <h3 className="collection-card-title">{collection.name}</h3>
        {showActions && (
          <div className="collection-card-actions">
            <button onClick={handleEdit} aria-label="Edit collection">
              <EditIcon />
            </button>
            <button onClick={handleDuplicate} aria-label="Duplicate collection">
              <DuplicateIcon />
            </button>
            <button onClick={handleDelete} aria-label="Delete collection">
              <DeleteIcon />
            </button>
          </div>
        )}
      </div>
      
      <div className="collection-card-body">
        <p className="collection-card-description">{collection.description}</p>
        
        <div className="collection-card-meta">
          <span className="collection-type">{collection.type}</span>
          <span className="collection-items">{collection.itemCount} items</span>
        </div>
        
        {collection.tags.length > 0 && (
          <div className="collection-tags">
            {collection.tags.map((tag) => (
              <span key={tag} className="collection-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className="collection-card-footer">
        <time className="collection-updated">
          Updated {formatDate(collection.updatedAt)}
        </time>
      </div>
    </div>
  );
});

CollectionItem.displayName = 'CollectionItem';

// Additional item variants
const CollectionListItem: React.FC<{
  collection: Collection;
  isSelected: boolean;
  showActions: boolean;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  className: string;
}> = ({ collection, isSelected, showActions, onClick, onEdit, onDelete, onDuplicate, className }) => (
  <div className={`collection-list-item ${isSelected ? 'selected' : ''} ${className}`} onClick={onClick}>
    <div className="collection-list-content">
      <h4>{collection.name}</h4>
      <p>{collection.description}</p>
      <div className="collection-list-meta">
        <span>{collection.type}</span>
        <span>{collection.itemCount} items</span>
        <time>{formatDate(collection.updatedAt)}</time>
      </div>
    </div>
    {showActions && (
      <div className="collection-list-actions">
        <button onClick={onEdit}>Edit</button>
        <button onClick={onDuplicate}>Duplicate</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    )}
  </div>
);

const CollectionCompactItem: React.FC<{
  collection: Collection;
  isSelected: boolean;
  onClick: () => void;
  className: string;
}> = ({ collection, isSelected, onClick, className }) => (
  <div className={`collection-compact-item ${isSelected ? 'selected' : ''} ${className}`} onClick={onClick}>
    <span className="collection-compact-name">{collection.name}</span>
    <span className="collection-compact-count">{collection.itemCount}</span>
  </div>
);

// Utility functions
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  }
  
  if (diffInHours < 24 * 7) {
    return `${Math.floor(diffInHours / 24)}d ago`;
  }
  
  return date.toLocaleDateString();
};

// Icon components (placeholder)
const EditIcon = () => <span>✏️</span>;
const DuplicateIcon = () => <span>📋</span>;
const DeleteIcon = () => <span>🗑️</span>;
```

## 4. Pre-configured Layout Components

### 4.1 Collection Grid View

```typescript
// src/collections/presentation/Collection/CollectionGridView.tsx
import React from 'react';
import { Collection } from './Collection';
import { CollectionFilters } from './CollectionFilters';
import { CollectionSort } from './CollectionSort';
import { CollectionPagination } from './CollectionPagination';

interface CollectionGridViewProps {
  onSelect?: (collection: Collection) => void;
  onAction?: (action: string, collection: Collection) => void;
  showFilters?: boolean;
  showSort?: boolean;
  showPagination?: boolean;
  itemsPerPage?: number;
}

export const CollectionGridView: React.FC<CollectionGridViewProps> = ({
  onSelect,
  onAction,
  showFilters = true,
  showSort = true,
  showPagination = true,
  itemsPerPage = 20,
}) => {
  return (
    <Collection onSelect={onSelect} onAction={onAction}>
      <Collection.Header>
        {showFilters && <CollectionFilters />}
        {showSort && <CollectionSort />}
      </Collection.Header>
      
      <Collection.Grid virtualized>
        <Collection.Empty>
          <div className="empty-state">
            <h3>No collections found</h3>
            <p>Create your first collection to get started</p>
            <Collection.Actions>
              <button className="btn-primary">Create Collection</button>
            </Collection.Actions>
          </div>
        </Collection.Empty>
      </Collection.Grid>
      
      {showPagination && <CollectionPagination itemsPerPage={itemsPerPage} />}
    </Collection>
  );
};
```

## 5. Feature Flag Integration

### 5.1 Feature Flag Wrapper

```typescript
// src/collections/core/FeatureFlagWrapper.tsx
import React, { ReactNode } from 'react';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { CollectionProvider } from './CollectionProvider';
import { LegacyCollectionProvider } from '../legacy/LegacyCollectionProvider';

interface FeatureFlagWrapperProps {
  children: ReactNode;
}

export const CollectionSystemWrapper: React.FC<FeatureFlagWrapperProps> = ({ children }) => {
  const newSystemEnabled = useFeatureFlag('collection_system_v2');
  const unifiedHooksEnabled = useFeatureFlag('collection_unified_hooks');
  
  if (newSystemEnabled) {
    return (
      <CollectionProvider enableUnifiedHooks={unifiedHooksEnabled}>
        <div data-collection-system="v2">
          {children}
        </div>
      </CollectionProvider>
    );
  }
  
  return (
    <LegacyCollectionProvider>
      <div data-collection-system="v1">
        {children}
      </div>
    </LegacyCollectionProvider>
  );
};

// Hook adapter for backward compatibility
export const useCollectionCompat = (id?: string) => {
  const newSystemEnabled = useFeatureFlag('collection_system_v2');
  const newHook = useCollection({ id });
  const legacyHook = useLegacyCollection(id);
  
  if (newSystemEnabled) {
    // Adapt new hook interface to legacy format
    return {
      collection: newHook.collection,
      collections: newHook.collections,
      loading: newHook.loading,
      error: newHook.error,
      // Map other properties as needed
    };
  }
  
  return legacyHook;
};
```

## 6. Testing Examples

### 6.1 Hook Testing

```typescript
// src/collections/hooks/__tests__/useCollection.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCollection } from '../useCollection';
import { createTestCollectionProvider } from '../../__tests__/test-utils';

describe('useCollection', () => {
  const mockCollections: Collection[] = [
    {
      id: '1',
      name: 'Test Collection 1',
      description: 'Description 1',
      type: 'personal',
      tags: ['tag1'],
      itemCount: 5,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      ownerId: 'user1',
    },
    {
      id: '2',
      name: 'Test Collection 2',
      description: 'Description 2',
      type: 'shared',
      tags: ['tag2'],
      itemCount: 3,
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
      ownerId: 'user1',
    },
  ];
  
  it('should return all collections when no id provided', () => {
    const { result } = renderHook(() => useCollection(), {
      wrapper: createTestCollectionProvider({
        entities: {
          collections: {
            '1': mockCollections[0],
            '2': mockCollections[1],
          },
          tags: {},
        },
      }),
    });
    
    expect(result.current.collections).toHaveLength(2);
    expect(result.current.collection).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.isEmpty).toBe(false);
  });
  
  it('should return specific collection when id provided', () => {
    const { result } = renderHook(() => useCollection({ id: '1' }), {
      wrapper: createTestCollectionProvider({
        entities: {
          collections: {
            '1': mockCollections[0],
            '2': mockCollections[1],
          },
          tags: {},
        },
      }),
    });
    
    expect(result.current.collection).toEqual(mockCollections[0]);
    expect(result.current.collections).toHaveLength(2);
  });
  
  it('should apply optimistic updates when enabled', () => {
    const optimisticUpdate = { name: 'Updated Name' };
    
    const { result } = renderHook(() => useCollection({ id: '1', includeOptimistic: true }), {
      wrapper: createTestCollectionProvider({
        entities: {
          collections: {
            '1': mockCollections[0],
          },
          tags: {},
        },
        operations: {
          optimisticUpdates: {
            '1': optimisticUpdate,
          },
          loading: new Set(),
          errors: {},
        },
      }),
    });
    
    expect(result.current.collection?.name).toBe('Updated Name');
  });
});
```

### 6.2 Component Testing

```typescript
// src/collections/presentation/Collection/__tests__/CollectionItem.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollectionItem } from '../CollectionItem';
import { createTestCollectionProvider } from '../../../__tests__/test-utils';

const mockCollection: Collection = {
  id: '1',
  name: 'Test Collection',
  description: 'Test Description',
  type: 'personal',
  tags: ['tag1', 'tag2'],
  itemCount: 5,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  ownerId: 'user1',
};

describe('CollectionItem', () => {
  it('should render collection information correctly', () => {
    render(
      <CollectionItem collection={mockCollection} />,
      { wrapper: createTestCollectionProvider() }
    );
    
    expect(screen.getByText('Test Collection')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('personal')).toBeInTheDocument();
    expect(screen.getByText('5 items')).toBeInTheDocument();
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
  });
  
  it('should call onSelect when clicked', () => {
    const onSelect = jest.fn();
    
    render(
      <CollectionItem collection={mockCollection} />,
      { 
        wrapper: createTestCollectionProvider({}, { onSelect })
      }
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockCollection);
  });
  
  it('should render different variants correctly', () => {
    const { rerender } = render(
      <CollectionItem collection={mockCollection} variant="card" />,
      { wrapper: createTestCollectionProvider() }
    );
    
    expect(screen.getByText('Test Collection').closest('.collection-card')).toBeInTheDocument();
    
    rerender(
      <CollectionItem collection={mockCollection} variant="list" />
    );
    
    expect(screen.getByText('Test Collection').closest('.collection-list-item')).toBeInTheDocument();
  });
});
```

## 7. Performance Optimization Examples

### 7.1 Memoized Selectors

```typescript
// src/collections/core/selectors.ts
import { createSelector } from 'reselect';
import { CollectionState, Collection } from './store';

// Base selectors
const getCollections = (state: CollectionState) => state.entities.collections;
const getSearchQuery = (state: CollectionState) => state.ui.searchQuery;
const getFilters = (state: CollectionState) => state.ui.filters;
const getSortConfig = (state: CollectionState) => state.ui.sortConfig;

// Memoized filtered collections selector
export const selectFilteredCollections = createSelector(
  [getCollections, getSearchQuery, getFilters],
  (collections, searchQuery, filters) => {
    let filtered = Object.values(collections);
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(collection =>
        collection.name.toLowerCase().includes(query) ||
        collection.description.toLowerCase().includes(query) ||
        collection.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Type filter
    if (filters.type.length > 0) {
      filtered = filtered.filter(collection =>
        filters.type.includes(collection.type)
      );
    }
    
    // Tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(collection =>
        filters.tags.some(tag => collection.tags.includes(tag))
      );
    }
    
    return filtered;
  }
);

// Memoized sorted collections selector
export const selectSortedCollections = createSelector(
  [selectFilteredCollections, getSortConfig],
  (filteredCollections, sortConfig) => {
    return [...filteredCollections].sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }
);

// Memoized collection groups selector
export const selectCollectionsByType = createSelector(
  [selectFilteredCollections],
  (filteredCollections) => {
    return filteredCollections.reduce((acc, collection) => {
      if (!acc[collection.type]) {
        acc[collection.type] = [];
      }
      acc[collection.type].push(collection);
      return acc;
    }, {} as Record<Collection['type'], Collection[]>);
  }
);
```

This proof of concept code demonstrates the key architectural components and validates the feasibility of the proposed design. The examples show how the different layers work together to create a maintainable, performant, and scalable collection management system.

---

**Document Version**: 1.0  
**Last Updated**: 2025-09-30  
**Review Date**: 2025-10-07