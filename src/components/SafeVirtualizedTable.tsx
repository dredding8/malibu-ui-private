import React, { Suspense, lazy, Component, ErrorInfo, ReactNode } from 'react';
import { Spinner, NonIdealState, Button } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Table2, RenderMode } from '@blueprintjs/table';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class VirtualizedTableErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('VirtualizedTable Error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <NonIdealState
          icon={IconNames.ERROR}
          title="Table Loading Error"
          description="The enhanced table component failed to load. Using fallback table."
          action={
            <Button
              onClick={() => window.location.reload()}
              intent="primary"
              icon={IconNames.REFRESH}
            >
              Reload Page
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}

// Lazy load the performance table with error boundary
const LazyVirtualizedTable = lazy(() => 
  import('../hooks/collections/useCollectionPerformance').then(module => ({
    default: module.VirtualizedOpportunitiesTable
  })).catch(() => ({
    // Fallback component if import fails
    default: ({ filteredOpportunities, columnRenderers }: any) => (
      <Table2
        numRows={filteredOpportunities.length}
        renderMode={RenderMode.BATCH_ON_UPDATE}
        enableRowHeader={false}
      >
        {columnRenderers.map((_: any, idx: number) => <span key={idx}/>)}
      </Table2>
    )
  }))
);

export const SafeVirtualizedTable: React.FC<any> = (props) => {
  return (
    <VirtualizedTableErrorBoundary
      fallback={
        <Table2
          numRows={props.filteredOpportunities?.length || 0}
          renderMode={RenderMode.BATCH_ON_UPDATE}
        >
          <span />
        </Table2>
      }
    >
      <Suspense fallback={<Spinner size={50} />}>
        <LazyVirtualizedTable {...props} />
      </Suspense>
    </VirtualizedTableErrorBoundary>
  );
};

export default SafeVirtualizedTable;