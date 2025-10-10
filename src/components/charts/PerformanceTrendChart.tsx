/**
 * Performance Trend Chart Component
 * Visualizes performance metrics over time using Chart.js
 */

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, H5, Button, ButtonGroup, Intent, Tag } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { TrendData } from '../../services/analyticsService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

interface PerformanceTrendChartProps {
  title: string;
  data: TrendData[];
  type: 'line' | 'bar' | 'area';
  color?: string;
  showChange?: boolean;
  height?: number;
  onDownload?: () => void;
}

export const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({
  title,
  data,
  type = 'line',
  color = '#0F9960',
  showChange = true,
  height = 300,
  onDownload
}) => {
  const chartData = useMemo(() => {
    const labels = data.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const values = data.map(d => d.value);
    
    return {
      labels,
      datasets: [
        {
          label: title,
          data: values,
          borderColor: color,
          backgroundColor: type === 'area' ? `${color}20` : color,
          borderWidth: 2,
          fill: type === 'area',
          tension: 0.1,
          pointBackgroundColor: color,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };
  }, [data, title, color, type]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: color,
        borderWidth: 1,
        callbacks: {
          afterBody: (context: any) => {
            const index = context[0].dataIndex;
            const item = data[index];
            if (item.changePercentage !== undefined) {
              return [
                `Change: ${item.change && item.change > 0 ? '+' : ''}${item.change?.toFixed(1) || 0}`,
                `Trend: ${item.changePercentage && item.changePercentage > 0 ? '+' : ''}${item.changePercentage?.toFixed(1) || 0}%`
              ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxTicksLimit: 8
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value: any) {
            return typeof value === 'number' ? `${value.toFixed(1)}%` : value;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  }), [data, color]);

  const latestValue = data[data.length - 1];
  const trend = latestValue?.changePercentage || 0;
  const trendIntent = trend > 5 ? Intent.SUCCESS : trend < -5 ? Intent.DANGER : Intent.WARNING;

  const ChartComponent = type === 'bar' ? Bar : Line;

  return (
    <Card className="performance-trend-chart">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <H5 style={{ margin: 0 }}>{title}</H5>
          {showChange && latestValue && (
            <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>
                Current: {latestValue.value.toFixed(1)}%
              </span>
              {trend !== 0 && (
                <Tag intent={trendIntent} minimal>
                  {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                </Tag>
              )}
            </div>
          )}
        </div>
        {onDownload && (
          <Button
            small
            minimal
            icon={IconNames.DOWNLOAD}
            onClick={onDownload}
            title="Download chart"
          />
        )}
      </div>
      
      <div style={{ height, position: 'relative' }}>
        <ChartComponent data={chartData} options={options} />
      </div>
    </Card>
  );
};

interface MetricsSummaryChartProps {
  metrics: {
    matchSuccessRate: number;
    capacityUtilization: number;
    conflictResolutionRate: number;
    dataIntegrityScore: number;
  };
  onDownload?: () => void;
}

export const MetricsSummaryChart: React.FC<MetricsSummaryChartProps> = ({
  metrics,
  onDownload
}) => {
  const chartData = useMemo(() => ({
    labels: ['Match Success', 'Capacity Usage', 'Conflict Resolution', 'Data Integrity'],
    datasets: [
      {
        data: [
          metrics.matchSuccessRate,
          metrics.capacityUtilization,
          metrics.conflictResolutionRate,
          metrics.dataIntegrityScore
        ],
        backgroundColor: [
          '#0F9960', // Success green
          '#2965CC', // Primary blue
          '#D9822B', // Warning orange
          '#A82A2A'  // Danger red
        ],
        borderWidth: 0,
        hoverBorderWidth: 3,
        hoverBorderColor: '#ffffff'
      }
    ]
  }), [metrics]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value.toFixed(1)}%`;
          }
        }
      }
    }
  }), []);

  return (
    <Card className="metrics-summary-chart">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <H5 style={{ margin: 0 }}>Performance Overview</H5>
        {onDownload && (
          <Button
            small
            minimal
            icon={IconNames.DOWNLOAD}
            onClick={onDownload}
            title="Download chart"
          />
        )}
      </div>
      
      <div style={{ height: 300, position: 'relative' }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </Card>
  );
};

interface ConflictAnalysisChartProps {
  conflictsByType: { [key: string]: number };
  resolutionTrends: TrendData[];
  onDownload?: () => void;
}

export const ConflictAnalysisChart: React.FC<ConflictAnalysisChartProps> = ({
  conflictsByType,
  resolutionTrends,
  onDownload
}) => {
  const conflictData = useMemo(() => ({
    labels: Object.keys(conflictsByType),
    datasets: [
      {
        label: 'Conflicts by Type',
        data: Object.values(conflictsByType),
        backgroundColor: [
          '#D9822B', // Orange
          '#A82A2A', // Red
          '#2965CC', // Blue
          '#0F9960'  // Green
        ],
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  }), [conflictsByType]);

  const resolutionData = useMemo(() => ({
    labels: resolutionTrends.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Resolution Rate',
        data: resolutionTrends.map(d => d.value),
        borderColor: '#0F9960',
        backgroundColor: '#0F996020',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
      }
    ]
  }), [resolutionTrends]);

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.label}: ${context.parsed.y} conflicts`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  }), []);

  const lineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`
        }
      }
    }
  }), []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <Card className="conflict-type-chart">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <H5 style={{ margin: 0 }}>Conflicts by Type</H5>
          {onDownload && (
            <Button
              small
              minimal
              icon={IconNames.DOWNLOAD}
              onClick={onDownload}
              title="Download chart"
            />
          )}
        </div>
        
        <div style={{ height: 250, position: 'relative' }}>
          <Bar data={conflictData} options={barOptions} />
        </div>
      </Card>

      <Card className="resolution-trend-chart">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <H5 style={{ margin: 0 }}>Resolution Trends</H5>
        </div>
        
        <div style={{ height: 250, position: 'relative' }}>
          <Line data={resolutionData} options={lineOptions} />
        </div>
      </Card>
    </div>
  );
};

export default PerformanceTrendChart;