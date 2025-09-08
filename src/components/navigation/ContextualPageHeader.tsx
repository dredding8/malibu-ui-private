import React from 'react';
import { H2, H5, Intent, Colors, Button } from '@blueprintjs/core';
import { NavigationBreadcrumbs } from './NavigationBreadcrumbs';
import { useNavigationContext } from '../../contexts/NavigationContext';
import styled from 'styled-components';

// Styled components for theme-based styling
const HeaderContainer = styled.div<{ gradient?: string; backgroundColor?: string }>`
  padding: 24px;
  margin-bottom: 24px;
  border-radius: 8px;
  background: ${props => props.gradient || props.backgroundColor || Colors.LIGHT_GRAY5};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

const IconContainer = styled.div<{ intent?: Intent }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: ${props => {
    switch (props.intent) {
      case Intent.PRIMARY: return Colors.BLUE5;
      case Intent.SUCCESS: return Colors.GREEN5;
      case Intent.WARNING: return Colors.ORANGE5;
      case Intent.DANGER: return Colors.RED5;
      default: return Colors.GRAY5;
    }
  }};
  color: ${props => {
    switch (props.intent) {
      case Intent.PRIMARY: return Colors.BLUE1;
      case Intent.SUCCESS: return Colors.GREEN1;
      case Intent.WARNING: return Colors.ORANGE1;
      case Intent.DANGER: return Colors.RED1;
      default: return Colors.GRAY1;
    }
  }};
`;

const TextContainer = styled.div`
  flex: 1;
`;

const Subtitle = styled(H5)`
  margin: 4px 0 0 0;
  color: ${Colors.GRAY1};
  font-weight: 400;
`;

interface ContextualPageHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  intent?: Intent;
  showBreadcrumbs?: boolean;
  className?: string;
}

/**
 * Context-aware page header that adapts to navigation context
 * Provides consistent header styling across different domains
 */
export const ContextualPageHeader: React.FC<ContextualPageHeaderProps> = ({
  title,
  subtitle,
  icon,
  intent,
  showBreadcrumbs = true,
  className
}) => {
  const { currentContext } = useNavigationContext();
  
  // Use provided values or fall back to context
  const displayTitle = title || currentContext.title;
  const displaySubtitle = subtitle || currentContext.subtitle;
  const displayIcon = icon || currentContext.icon;
  const displayIntent = intent || currentContext.intent;

  // Theme configuration based on domain
  const getThemeConfig = () => {
    switch (currentContext.domain) {
      case 'fieldMapping':
        return {
          gradient: 'linear-gradient(135deg, #2965CC 0%, #48AFF0 100%)',
          textColor: Colors.WHITE
        };
      case 'collectionOpportunity':
        return {
          gradient: 'linear-gradient(135deg, #0F9960 0%, #3DCC91 100%)',
          textColor: Colors.WHITE
        };
      case 'creation':
        return {
          backgroundColor: Colors.LIGHT_GRAY5,
          textColor: Colors.DARK_GRAY1
        };
      default:
        return {
          backgroundColor: Colors.LIGHT_GRAY5,
          textColor: Colors.DARK_GRAY1
        };
    }
  };

  const theme = getThemeConfig();

  return (
    <div className={className}>
      {showBreadcrumbs && (
        <NavigationBreadcrumbs 
          items={currentContext.breadcrumbs} 
          large={false}
        />
      )}
      
      <HeaderContainer 
        gradient={theme.gradient} 
        backgroundColor={theme.backgroundColor}
        style={{ marginTop: showBreadcrumbs ? '16px' : '0' }}
      >
        <HeaderContent>
          <IconContainer intent={displayIntent}>
            <Button 
              minimal
              large
              icon={displayIcon as any}
              intent={displayIntent}
              style={{ pointerEvents: 'none' }}
            />
          </IconContainer>
          
          <TextContainer>
            <H2 style={{ 
              margin: 0, 
              color: theme.textColor,
              fontWeight: 600 
            }}>
              {displayTitle}
            </H2>
            
            {displaySubtitle && (
              <Subtitle style={{ 
                color: theme.textColor === Colors.WHITE 
                  ? 'rgba(255, 255, 255, 0.8)' 
                  : Colors.GRAY1 
              }}>
                {displaySubtitle}
              </Subtitle>
            )}
          </TextContainer>
        </HeaderContent>
      </HeaderContainer>
    </div>
  );
};