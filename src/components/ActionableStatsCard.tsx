import React from 'react';
import { Card, Elevation, Intent, ProgressBar, Button, Classes } from '@blueprintjs/core';
import { IconName } from '@blueprintjs/core';
import { Line } from 'react-chartjs-2';

// Blueprint v6 Icon wrapper to handle type issues
const BpIcon: React.FC<{ icon: IconName; size?: number; intent?: Intent; style?: React.CSSProperties }> = (props) => {
  const { Icon } = require('@blueprintjs/core');
  return React.createElement(Icon, props);
};
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './ActionableStatsCard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ActionableStatsCardProps {
  title: string;
  value: number;
  total?: number;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  intent?: Intent;
  icon?: IconName;
  actionableInsight?: string | null;
  quickAction?: {
    label: string;
    onClick: () => void;
  };
  sparkline?: number[];
  isLoading?: boolean;
}

const ActionableStatsCard: React.FC<ActionableStatsCardProps> = ({
  title,
  value,
  total,
  trend,
  trendPercentage,
  intent = Intent.NONE,
  icon = 'dashboard',
  actionableInsight,
  quickAction,
  sparkline = [],
  isLoading = false,
}) => {
  // Sparkline configuration
  const sparklineData = {
    labels: sparkline.map((_, i) => ''),
    datasets: [{
      data: sparkline,
      borderColor: intent === Intent.DANGER ? '#DB3737' : 
                   intent === Intent.WARNING ? '#D9822B' : 
                   intent === Intent.SUCCESS ? '#0F9960' : '#106BA3',
      borderWidth: 2,
      fill: false,
      pointRadius: 0,
      tension: 0.4
    }]
  };

  const sparklineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    }
  };

  const getTrendIcon = (): IconName => {
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return 'minus';
  };

  const getTrendIntent = () => {
    // For critical/warning stats, down trend is good
    if (intent === Intent.DANGER || intent === Intent.WARNING) {
      return trend === 'down' ? Intent.SUCCESS : Intent.DANGER;
    }
    // For optimal stats, up trend is good
    return trend === 'up' ? Intent.SUCCESS : Intent.WARNING;
  };

  return (
    <Card 
      elevation={Elevation.TWO} 
      className={`actionable-stats-card ${Classes.SKELETON} ${isLoading ? Classes.LOADING : ''}`}
    >
      <div className="stats-card-header">
        <div className="stats-card-title-row">
          <span className="stats-icon">
            <BpIcon icon={icon} intent={intent} size={20} />
          </span>
          <h3 className="stats-card-title">{title}</h3>
        </div>
        {trend && (
          <div className={`stats-card-trend trend-${getTrendIntent()}`}>
            <span className="trend-icon">
              <BpIcon icon={getTrendIcon()} size={16} />
            </span>
            {trendPercentage && (
              <span className="trend-percentage">{Math.abs(trendPercentage)}%</span>
            )}
          </div>
        )}
      </div>

      <div className="stats-card-body">
        <div className="stats-card-value-section">
          <div className="stats-card-value" data-intent={intent}>
            {value}
            {total && <span className="stats-card-total">/{total}</span>}
          </div>
          {total && (
            <ProgressBar 
              value={value / total} 
              intent={intent} 
              animate={!isLoading}
              stripes={false}
            />
          )}
        </div>

        {sparkline.length > 0 && (
          <div className="stats-card-sparkline">
            <Line data={sparklineData} options={sparklineOptions} />
          </div>
        )}
      </div>

      {(actionableInsight || quickAction) && (
        <div className="stats-card-footer">
          {actionableInsight && (
            <p className="stats-card-insight">
              <BpIcon icon="lightbulb" size={12} />
              {actionableInsight}
            </p>
          )}
          {quickAction && (
            <Button
              small
              minimal
              intent={intent}
              rightIcon="arrow-right"
              onClick={quickAction.onClick}
            >
              {quickAction.label}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default ActionableStatsCard;