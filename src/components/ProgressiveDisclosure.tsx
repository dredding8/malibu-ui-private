import React, { useState, useCallback, useMemo } from 'react';
import {
  Collapse,
  Button,
  Card,
  Elevation,
  Classes,
  Tag,
  Intent,
  Position,
  Tooltip,
  Callout,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import './ProgressiveDisclosure.css';

interface DisclosureSection {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  intent?: Intent;
  priority: 'essential' | 'important' | 'optional';
  defaultExpanded?: boolean;
  children: React.ReactNode;
  badge?: string | number;
  helpText?: string;
}

interface ProgressiveDisclosureProps {
  sections: DisclosureSection[];
  mode?: 'accordion' | 'independent' | 'progressive';
  showPriorityIndicators?: boolean;
  onSectionToggle?: (sectionId: string, isOpen: boolean) => void;
  className?: string;
}

/**
 * Progressive Disclosure component for managing complex workflows
 * Reveals information progressively based on user needs and workflow stage
 */
export const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  sections,
  mode = 'progressive',
  showPriorityIndicators = true,
  onSectionToggle,
  className
}) => {
  // Track expanded state for each section
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    sections.forEach(section => {
      if (section.defaultExpanded || section.priority === 'essential') {
        initial.add(section.id);
      }
    });
    return initial;
  });

  // Track which sections have been viewed
  const [viewedSections, setViewedSections] = useState<Set<string>>(new Set());

  const handleToggle = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
        onSectionToggle?.(sectionId, false);
      } else {
        // Handle different modes
        if (mode === 'accordion') {
          // Close all others
          next.clear();
        }
        next.add(sectionId);
        setViewedSections(viewed => new Set(viewed).add(sectionId));
        onSectionToggle?.(sectionId, true);
      }
      return next;
    });
  }, [mode, onSectionToggle]);

  // Calculate progress for progressive mode
  const progress = useMemo(() => {
    if (mode !== 'progressive') return 0;
    const essentialSections = sections.filter(s => s.priority === 'essential');
    const viewedEssential = essentialSections.filter(s => viewedSections.has(s.id));
    return essentialSections.length > 0 
      ? (viewedEssential.length / essentialSections.length) * 100 
      : 0;
  }, [mode, sections, viewedSections]);

  const getPriorityIcon = (priority: DisclosureSection['priority']) => {
    switch (priority) {
      case 'essential':
        return IconNames.STAR;
      case 'important':
        return IconNames.INFO_SIGN;
      case 'optional':
        return IconNames.MORE;
      default:
        return undefined;
    }
  };

  const getPriorityIntent = (priority: DisclosureSection['priority']) => {
    switch (priority) {
      case 'essential':
        return Intent.PRIMARY;
      case 'important':
        return Intent.NONE;
      case 'optional':
        return Intent.NONE;
      default:
        return Intent.NONE;
    }
  };

  return (
    <div className={`progressive-disclosure ${className || ''}`}>
      {mode === 'progressive' && progress < 100 && (
        <Card className="progress-indicator" elevation={Elevation.ONE}>
          <div className="progress-header">
            <span className="bp5-icon" data-icon={IconNames.TRENDING_UP} style={{ fontSize: 16 }} />
            <span>Workflow Progress</span>
            <Tag intent={Intent.PRIMARY}>{Math.round(progress)}%</Tag>
          </div>
          <div className="bp5-progress-bar bp5-intent-primary">
            <div 
              className="bp5-progress-meter" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={Classes.TEXT_MUTED}>
            Complete essential sections to proceed
          </p>
        </Card>
      )}

      <div className="disclosure-sections">
        {sections.map((section, index) => {
          const isExpanded = expandedSections.has(section.id);
          const isViewed = viewedSections.has(section.id);
          const isLocked = mode === 'progressive' && 
            index > 0 && 
            !viewedSections.has(sections[index - 1].id) &&
            section.priority === 'essential';

          return (
            <Card 
              key={section.id}
              className={`disclosure-section ${isViewed ? 'viewed' : ''} ${isLocked ? 'locked' : ''}`}
              elevation={isExpanded ? Elevation.TWO : Elevation.ONE}
            >
              <div className="section-header">
                <Button
                  className="section-toggle"
                  minimal
                  large
                  disabled={isLocked}
                  onClick={() => handleToggle(section.id)}
                  icon={isExpanded ? IconNames.CHEVRON_DOWN : IconNames.CHEVRON_RIGHT}
                  rightIcon={
                    <div className="section-indicators">
                      {section.badge && (
                        <Tag 
                          minimal 
                          intent={section.intent}
                          className="section-badge"
                        >
                          {section.badge}
                        </Tag>
                      )}
                      {showPriorityIndicators && (
                        <Tooltip 
                          content={`${section.priority} section`}
                          position={Position.TOP}
                        >
                          <span 
                            className={`bp5-icon priority-icon ${getPriorityIntent(section.priority) ? `bp5-intent-${getPriorityIntent(section.priority).toLowerCase()}` : ''}`}
                            data-icon={getPriorityIcon(section.priority)}
                            style={{ fontSize: 16 }}
                          />
                        </Tooltip>
                      )}
                    </div>
                  }
                >
                  <div className="section-title-wrapper">
                    {section.icon && (
                      <span 
                        className={`bp5-icon section-icon ${section.intent ? `bp5-intent-${section.intent.toLowerCase()}` : ''}`}
                        data-icon={section.icon}
                        style={{ fontSize: 16 }}
                      />
                    )}
                    <div>
                      <h4 className="section-title">{section.title}</h4>
                      {section.subtitle && (
                        <p className="section-subtitle">{section.subtitle}</p>
                      )}
                    </div>
                  </div>
                </Button>
                {isLocked && (
                  <Tooltip content="Complete previous section to unlock">
                    <span 
                      className="bp5-icon lock-icon bp5-intent-warning"
                      data-icon={IconNames.LOCK}
                      style={{ fontSize: 16 }}
                    />
                  </Tooltip>
                )}
              </div>

              <Collapse isOpen={isExpanded}>
                <div className="section-content">
                  {section.helpText && (
                    <Callout 
                      intent={Intent.NONE}
                      icon={IconNames.HELP}
                      className="section-help"
                    >
                      {section.helpText}
                    </Callout>
                  )}
                  {section.children}
                </div>
              </Collapse>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Hook for managing progressive disclosure state
 */
export function useProgressiveDisclosure(
  sections: DisclosureSection[],
  options?: {
    saveToSession?: boolean;
    sessionKey?: string;
  }
) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    if (options?.saveToSession && options.sessionKey) {
      const saved = sessionStorage.getItem(options.sessionKey);
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch {}
      }
    }
    
    const initial = new Set<string>();
    sections.forEach(section => {
      if (section.defaultExpanded || section.priority === 'essential') {
        initial.add(section.id);
      }
    });
    return initial;
  });

  // Save to session when state changes
  React.useEffect(() => {
    if (options?.saveToSession && options.sessionKey) {
      sessionStorage.setItem(
        options.sessionKey,
        JSON.stringify(Array.from(expandedSections))
      );
    }
  }, [expandedSections, options]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedSections(new Set(sections.map(s => s.id)));
  }, [sections]);

  const collapseAll = useCallback(() => {
    setExpandedSections(new Set());
  }, []);

  return {
    expandedSections,
    toggleSection,
    expandAll,
    collapseAll
  };
}