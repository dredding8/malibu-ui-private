import React, { useState, useEffect } from 'react';
import { Tooltip, Position, Intent, Tag } from '@blueprintjs/core';
import { Icon } from '../../utils/blueprintIconWrapper';

interface SmartTooltipProps {
    term: string;
    context?: 'allocation' | 'field-mapping' | 'data-validation' | 'general';
    children: React.ReactNode;
    position?: Position;
    showGlossaryIcon?: boolean;
}

// Contextual glossary definitions
const glossary: Record<string, Record<string, string>> = {
    allocation: {
        'Status': 'Current satellite allocation state for this collection opportunity',
        'Confirmed': 'Allocation has been verified and meets all requirements',
        'Needs Review': 'Allocation requires manual review due to suboptimal conditions',
        'Not Allocated': 'No satellite has been assigned to this opportunity yet',
        'Quality Score': 'Percentage indicating how well the allocation matches requirements (0-100%)',
        'Alternative Options': 'Other possible satellite allocations that could work for this opportunity',
    },
    'field-mapping': {
        'Status': 'Data field validation state between source and target systems',
        'Confirmed': 'Field mapping has been validated and data types match',
        'Needs Review': 'Field mapping has potential issues requiring attention',
        'Not Allocated': 'Field has not been mapped to a target field',
    },
    'data-validation': {
        'Status': 'Current validation state of the data quality checks',
        'Confirmed': 'Data passes all validation rules',
        'Needs Review': 'Data has warnings or minor validation issues',
        'Not Allocated': 'Data has not been validated yet',
    },
    general: {
        'Priority': 'Urgency level for processing this item (1=Critical, 2=High, 3=Medium, 4=Low)',
        'Health': 'Overall system assessment based on coverage, efficiency, and balance metrics',
        'Sites': 'Ground stations capable of receiving satellite data',
        'Capacity': 'Maximum number of passes this opportunity can handle',
        'Coverage': 'Percentage of requirements covered by current allocation',
        'Efficiency': 'How well resources are being utilized (higher is better)',
        'Balance': 'Distribution of workload across available resources',
    }
};

export const SmartTooltip: React.FC<SmartTooltipProps> = ({
    term,
    context = 'general',
    children,
    position = Position.TOP,
    showGlossaryIcon = false
}) => {
    const [definition, setDefinition] = useState<string>('');
    const [showFullGlossary, setShowFullGlossary] = useState(false);

    useEffect(() => {
        // First check context-specific definitions
        const contextDef = glossary[context]?.[term];
        if (contextDef) {
            setDefinition(contextDef);
            return;
        }

        // Fall back to general definitions
        const generalDef = glossary.general[term];
        if (generalDef) {
            setDefinition(generalDef);
            return;
        }

        // No definition found
        setDefinition('');
    }, [term, context]);

    if (!definition) {
        return <>{children}</>;
    }

    const tooltipContent = (
        <div style={{ maxWidth: 300 }}>
            <div style={{ marginBottom: 8 }}>
                <strong>{term}</strong>
                {context !== 'general' && (
                    <Tag minimal intent={Intent.PRIMARY} style={{ marginLeft: 8 }}>
                        {context}
                    </Tag>
                )}
            </div>
            <div style={{ lineHeight: 1.5 }}>{definition}</div>
            {showFullGlossary && (
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                    <Icon icon="info-sign" size={12} style={{ marginRight: 4 }} />
                    Click for full glossary
                </div>
            )}
        </div>
    );

    return (
        <Tooltip
            content={tooltipContent}
            position={position}
            intent={Intent.NONE}
            hoverOpenDelay={250}
            hoverCloseDelay={100}
        >
            <span style={{ 
                borderBottom: '1px dashed rgba(92, 112, 128, 0.5)', 
                cursor: 'help',
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center'
            }}>
                {children}
                {showGlossaryIcon && (
                    <Icon 
                        icon="help" 
                        size={12} 
                        style={{ marginLeft: 4, opacity: 0.6 }}
                    />
                )}
            </span>
        </Tooltip>
    );
};

// Context-aware wrapper for automatic context detection
export const ContextAwareTooltip: React.FC<{
    children: React.ReactNode;
    autoDetectContext?: boolean;
}> = ({ children, autoDetectContext = true }) => {
    const [context, setContext] = useState<'allocation' | 'field-mapping' | 'data-validation' | 'general'>('general');

    useEffect(() => {
        if (!autoDetectContext) return;

        // Detect context based on URL or component hierarchy
        const pathname = window.location.pathname;
        if (pathname.includes('collection-opportunities')) {
            setContext('allocation');
        } else if (pathname.includes('field-mapping')) {
            setContext('field-mapping');
        } else if (pathname.includes('data-validation')) {
            setContext('data-validation');
        }
    }, [autoDetectContext]);

    // Clone children and wrap text nodes with SmartTooltip
    const processChildren = (node: React.ReactNode): React.ReactNode => {
        if (typeof node === 'string') {
            // Check if the text matches any glossary term
            const words = node.split(' ');
            return words.map((word, index) => {
                const cleanWord = word.replace(/[.,!?;:]/, '');
                const hasDefinition = Object.values(glossary).some(g => g[cleanWord]);
                
                if (hasDefinition) {
                    return (
                        <React.Fragment key={index}>
                            {index > 0 && ' '}
                            <SmartTooltip term={cleanWord} context={context}>
                                {word}
                            </SmartTooltip>
                        </React.Fragment>
                    );
                }
                return (index > 0 ? ' ' : '') + word;
            }).filter(Boolean);
        }

        if (React.isValidElement(node) && node.props.children) {
            return React.cloneElement(node, {
                ...node.props,
                children: React.Children.map(node.props.children, processChildren)
            });
        }

        return node;
    };

    return <>{React.Children.map(children, processChildren)}</>;
};