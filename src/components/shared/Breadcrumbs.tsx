import React from 'react';
import { Breadcrumbs as BPBreadcrumbs, BreadcrumbProps, Intent } from '@blueprintjs/core';
import { Icon } from '../../utils/blueprintIconWrapper';

interface BreadcrumbItem {
    text: string;
    href?: string;
    icon?: any;  // Blueprint's icon type
    intent?: Intent;
    current?: boolean;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

interface ContextualBreadcrumbsProps {
    items: BreadcrumbItem[];
    minVisibleItems?: number;
    collapseFrom?: 'start' | 'end';
    context?: 'allocation' | 'field-mapping' | 'data-validation';
    showContextIndicator?: boolean;
}

export const ContextualBreadcrumbs: React.FC<ContextualBreadcrumbsProps> = ({
    items,
    minVisibleItems = 2,
    collapseFrom = 'start',
    context,
    showContextIndicator = true
}) => {
    const getContextIcon = () => {
        switch (context) {
            case 'allocation':
                return 'satellite';
            case 'field-mapping':
                return 'data-connection';
            case 'data-validation':
                return 'tick-circle';
            default:
                return 'path';
        }
    };

    const getContextColor = () => {
        switch (context) {
            case 'allocation':
                return '#00B3A4'; // Teal
            case 'field-mapping':
                return '#5C7080'; // Gray
            case 'data-validation':
                return '#0F9960'; // Green
            default:
                return '#1C4E80'; // Blue
        }
    };

    const breadcrumbItems: any[] = items.map((item, index) => ({
        text: item.text,
        href: item.href,
        icon: item.icon || (index === 0 && showContextIndicator ? getContextIcon() : undefined),
        intent: item.intent,
        current: item.current || index === items.length - 1,
        onClick: item.onClick,
        className: item.current ? 'current-breadcrumb' : undefined
    }));

    return (
        <div 
            className="contextual-breadcrumbs"
            style={{ 
                padding: '8px 0',
                borderBottom: '1px solid rgba(92, 112, 128, 0.2)',
                marginBottom: 16,
                backgroundColor: 'rgba(245, 248, 250, 0.8)'
            }}
        >
            {showContextIndicator && context && (
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        marginRight: 12,
                        padding: '2px 8px',
                        backgroundColor: getContextColor(),
                        color: 'white',
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                    }}
                >
                    <Icon 
                        icon={getContextIcon()} 
                        size={12} 
                        style={{ marginRight: 4 }}
                    />
                    {context.replace('-', ' ')}
                </span>
            )}
            <BPBreadcrumbs
                items={breadcrumbItems}
                minVisibleItems={minVisibleItems}
                collapseFrom={collapseFrom}
            />
        </div>
    );
};

// Helper hook for managing breadcrumb state
export const useBreadcrumbs = (initialItems: BreadcrumbItem[] = []) => {
    const [items, setItems] = React.useState<BreadcrumbItem[]>(initialItems);

    const push = React.useCallback((item: BreadcrumbItem) => {
        setItems(prev => [...prev, item]);
    }, []);

    const pop = React.useCallback(() => {
        setItems(prev => prev.slice(0, -1));
    }, []);

    const replace = React.useCallback((newItems: BreadcrumbItem[]) => {
        setItems(newItems);
    }, []);

    const update = React.useCallback((index: number, updates: Partial<BreadcrumbItem>) => {
        setItems(prev => 
            prev.map((item, i) => i === index ? { ...item, ...updates } : item)
        );
    }, []);

    return { items, push, pop, replace, update };
};

// Pre-configured breadcrumbs for common workflows
export const BREADCRUMB_PRESETS: Record<string, BreadcrumbItem[]> = {
    collectionOpportunities: [
        { text: 'Operations', href: '/operations' },
        { text: 'Collection Management', href: '/operations/collections' },
        { text: 'Opportunities', current: true }
    ],
    collectionOpportunitiesReview: [
        { text: 'Operations', href: '/operations' },
        { text: 'Collection Management', href: '/operations/collections' },
        { text: 'Opportunities', href: '/operations/collections/opportunities' },
        { text: 'Review Required', current: true }
    ],
    fieldMapping: [
        { text: 'Data Management', href: '/data' },
        { text: 'Field Mapping', current: true }
    ],
    dataValidation: [
        { text: 'Data Management', href: '/data' },
        { text: 'Validation', current: true }
    ]
};