import React, { Component, ErrorInfo, ReactNode } from 'react';
import { NonIdealState, Button, Intent, Classes } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary for CollectionOpportunitiesHub
 * Provides graceful error handling and recovery
 */
export class ErrorBoundaryHub extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundaryHub caught error:', error, errorInfo);
    }

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Implement error logging service integration
    // Example: Sentry, LogRocket, etc.
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Send to logging service
    console.error('Would send to error service:', errorData);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Optionally reload the page
    if (window.confirm('Would you like to reload the page to ensure a clean state?')) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="error-boundary-container" style={{ padding: '20px' }}>
          <NonIdealState
            icon={IconNames.ERROR}
            title="Something went wrong"
            description={
              <div>
                <p>
                  We encountered an unexpected error while loading the Collection Opportunities Hub.
                </p>
                {isDevelopment && error && (
                  <details style={{ marginTop: '20px', textAlign: 'left' }}>
                    <summary className={Classes.TEXT_MUTED}>
                      Error Details (Development Only)
                    </summary>
                    <pre style={{
                      background: '#f5f5f5',
                      padding: '10px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '12px',
                      marginTop: '10px'
                    }}>
                      <strong>Error:</strong> {error.toString()}
                      {'\n\n'}
                      <strong>Component Stack:</strong>
                      {errorInfo?.componentStack}
                      {'\n\n'}
                      <strong>Stack Trace:</strong>
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            }
            action={
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <Button
                  intent={Intent.PRIMARY}
                  onClick={this.handleReset}
                  icon={IconNames.REFRESH}
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => window.history.back()}
                  icon={IconNames.ARROW_LEFT}
                >
                  Go Back
                </Button>
              </div>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for error handling in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = () => setError(null);

  const captureError = (error: Error) => {
    console.error('Captured error:', error);
    setError(error);
  };

  return { captureError, resetError };
}

/**
 * Async error wrapper for handling promise rejections
 */
export async function withErrorHandling<T>(
  promise: Promise<T>,
  errorMessage = 'An error occurred'
): Promise<{ data?: T; error?: Error }> {
  try {
    const data = await promise;
    return { data };
  } catch (error) {
    console.error(errorMessage, error);
    return { error: error as Error };
  }
}

/**
 * Component-specific error types
 */
export class OpportunityLoadError extends Error {
  constructor(message: string, public readonly opportunityId?: string) {
    super(message);
    this.name = 'OpportunityLoadError';
  }
}

export class WebSocketError extends Error {
  constructor(message: string, public readonly code?: number) {
    super(message);
    this.name = 'WebSocketError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}