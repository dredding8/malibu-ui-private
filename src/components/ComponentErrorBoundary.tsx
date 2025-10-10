/**
 * Component Error Boundary
 *
 * WAVE 4 IMPROVEMENT: Enterprise-grade error handling
 *
 * Prevents component errors from crashing the entire application.
 * Provides graceful fallback UI and error reporting.
 *
 * Usage:
 * ```tsx
 * <ComponentErrorBoundary componentName="CollectionHubHeader">
 *   <CollectionHubHeader {...props} />
 * </ComponentErrorBoundary>
 * ```
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { NonIdealState, Button, Intent, Callout } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

interface Props {
  children: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ComponentErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Send error to logging service in production
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      const { componentName = 'Component' } = this.props;
      const { error, errorInfo } = this.state;

      return (
        <div style={{ padding: '20px' }}>
          <NonIdealState
            icon={IconNames.ERROR}
            title={`${componentName} Error`}
            description="An unexpected error occurred while rendering this component."
            action={
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <Button
                  intent={Intent.PRIMARY}
                  onClick={this.handleReset}
                  icon={IconNames.REFRESH}
                >
                  Try Again
                </Button>
                <Button
                  intent={Intent.NONE}
                  onClick={this.handleReload}
                  icon={IconNames.RESET}
                >
                  Reload Page
                </Button>
              </div>
            }
          />

          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && error && (
            <Callout intent={Intent.DANGER} style={{ marginTop: '20px', textAlign: 'left' }}>
              <h4>Error Details (Development Only)</h4>
              <details style={{ whiteSpace: 'pre-wrap' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                  <strong>{error.toString()}</strong>
                </summary>
                <pre style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
                  {errorInfo?.componentStack}
                </pre>
              </details>
            </Callout>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap components with error boundary
 *
 * Usage:
 * ```tsx
 * export default withErrorBoundary(CollectionHubHeader, 'CollectionHubHeader');
 * ```
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ComponentErrorBoundary componentName={componentName || WrappedComponent.displayName || WrappedComponent.name}>
      <WrappedComponent {...props} />
    </ComponentErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundary;
}

export default ComponentErrorBoundary;
