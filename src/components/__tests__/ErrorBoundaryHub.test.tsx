import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundaryHub, useErrorHandler, withErrorHandling, OpportunityLoadError, WebSocketError, ValidationError } from '../ErrorBoundaryHub';

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Component that uses error handler hook
const ComponentWithErrorHandler: React.FC = () => {
  const { captureError, resetError } = useErrorHandler();

  return (
    <div>
      <button onClick={() => captureError(new Error('Hook error'))}>
        Trigger Error
      </button>
      <button onClick={resetError}>Reset Error</button>
      <div>Component rendered</div>
    </div>
  );
};

describe('ErrorBoundaryHub', () => {
  // Mock console methods
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Boundary Component', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundaryHub>
          <div>Test content</div>
        </ErrorBoundaryHub>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should catch errors and display error UI', () => {
      render(
        <ErrorBoundaryHub>
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryHub>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
    });

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundaryHub>
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryHub>
      );

      expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();
      expect(screen.getByText(/Error: Test error message/)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundaryHub>
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryHub>
      );

      expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should provide recovery actions', () => {
      render(
        <ErrorBoundaryHub>
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryHub>
      );

      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Go Back/i })).toBeInTheDocument();
    });

    it('should reset error state on Try Again click', () => {
      const { rerender } = render(
        <ErrorBoundaryHub>
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryHub>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Mock window.confirm to return false (don't reload)
      window.confirm = jest.fn(() => false);

      fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));

      // Rerender with non-throwing component
      rerender(
        <ErrorBoundaryHub>
          <ThrowError shouldThrow={false} />
        </ErrorBoundaryHub>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should navigate back on Go Back click', () => {
      const mockBack = jest.fn();
      window.history.back = mockBack;

      render(
        <ErrorBoundaryHub>
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryHub>
      );

      fireEvent.click(screen.getByRole('button', { name: /Go Back/i }));
      expect(mockBack).toHaveBeenCalled();
    });

    it('should use custom fallback UI when provided', () => {
      const customFallback = <div>Custom error UI</div>;

      render(
        <ErrorBoundaryHub fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryHub>
      );

      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundaryHub onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryHub>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error message' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });

    it('should log error to service in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const logSpy = jest.spyOn(console, 'error');

      render(
        <ErrorBoundaryHub>
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryHub>
      );

      expect(logSpy).toHaveBeenCalledWith(
        'Would send to error service:',
        expect.objectContaining({
          message: 'Test error message',
          timestamp: expect.any(String),
          userAgent: expect.any(String),
          url: expect.any(String)
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('useErrorHandler hook', () => {
    it('should capture and throw errors', () => {
      const ErrorBoundaryWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const [hasError, setHasError] = React.useState(false);
        
        if (hasError) {
          return <div>Error caught by boundary</div>;
        }

        return (
          <ErrorBoundaryHub onError={() => setHasError(true)}>
            {children}
          </ErrorBoundaryHub>
        );
      };

      render(
        <ErrorBoundaryWrapper>
          <ComponentWithErrorHandler />
        </ErrorBoundaryWrapper>
      );

      expect(screen.getByText('Component rendered')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Trigger Error'));

      expect(screen.getByText('Error caught by boundary')).toBeInTheDocument();
    });
  });

  describe('withErrorHandling utility', () => {
    it('should handle successful promises', async () => {
      const successPromise = Promise.resolve('success');
      const result = await withErrorHandling(successPromise);

      expect(result).toEqual({ data: 'success' });
    });

    it('should handle failed promises', async () => {
      const failedPromise = Promise.reject(new Error('Failed'));
      const result = await withErrorHandling(failedPromise, 'Custom error message');

      expect(result).toEqual({ 
        error: expect.objectContaining({ message: 'Failed' }) 
      });
      expect(console.error).toHaveBeenCalledWith('Custom error message', expect.any(Error));
    });
  });

  describe('Custom Error Classes', () => {
    it('should create OpportunityLoadError with correct properties', () => {
      const error = new OpportunityLoadError('Failed to load', 'opp-123');
      
      expect(error.name).toBe('OpportunityLoadError');
      expect(error.message).toBe('Failed to load');
      expect(error.opportunityId).toBe('opp-123');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create WebSocketError with correct properties', () => {
      const error = new WebSocketError('Connection failed', 1006);
      
      expect(error.name).toBe('WebSocketError');
      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe(1006);
      expect(error).toBeInstanceOf(Error);
    });

    it('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Invalid input', 'email');
      
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid input');
      expect(error.field).toBe('email');
      expect(error).toBeInstanceOf(Error);
    });
  });
});