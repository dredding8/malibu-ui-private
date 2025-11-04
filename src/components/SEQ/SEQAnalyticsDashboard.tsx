/**
 * SEQ Analytics Dashboard
 *
 * UX Research dashboard for viewing and analyzing Single Ease Question responses.
 * Provides insights into task difficulty across the application.
 *
 * Features:
 * - Task-level analytics (average, median, distribution)
 * - Response timeline and trends
 * - Qualitative comments review
 * - Data export capabilities
 *
 * Intended for: UX Researchers, Product Managers, Design Team
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  H3,
  H5,
  Button,
  Intent,
  HTMLTable,
  Tag,
  Divider,
  Callout,
  Icon,
  ProgressBar,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { seqService } from '../../services/seqService';
import { SEQAnalytics } from '../../services/seqService';
import './SEQAnalyticsDashboard.css';

const SEQAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<SEQAnalytics[]>([]);
  const [selectedTask, setSelectedTask] = useState<SEQAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    setIsLoading(true);
    try {
      const data = seqService.getAllAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load SEQ analytics', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = seqService.exportData();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seq-analytics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all SEQ data? This action cannot be undone.'
      )
    ) {
      seqService.clearData();
      loadAnalytics();
    }
  };

  const getRatingIntent = (rating: number): Intent => {
    if (rating >= 6) return Intent.SUCCESS; // Easy
    if (rating >= 4) return Intent.WARNING; // Neutral
    return Intent.DANGER; // Difficult
  };

  const getRatingLabel = (rating: number): string => {
    if (rating >= 6) return 'Easy';
    if (rating >= 5) return 'Somewhat Easy';
    if (rating >= 4) return 'Neutral';
    if (rating >= 3) return 'Somewhat Difficult';
    return 'Difficult';
  };

  if (isLoading) {
    return (
      <Card>
        <H3>SEQ Analytics Dashboard</H3>
        <p>Loading analytics data...</p>
      </Card>
    );
  }

  if (analytics.length === 0) {
    return (
      <Card>
        <H3>SEQ Analytics Dashboard</H3>
        <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN}>
          <p>
            <strong>No SEQ data collected yet.</strong>
          </p>
          <p>
            Single Ease Questions (SEQ) will appear after users complete tasks.
            Data is sampled at 33% to prevent survey fatigue.
          </p>
        </Callout>
      </Card>
    );
  }

  return (
    <div className="seq-analytics-dashboard">
      <Card>
        <div className="seq-dashboard-header">
          <H3>
            <Icon icon={IconNames.CHART} /> SEQ Analytics Dashboard
          </H3>
          <div className="seq-dashboard-actions">
            <Button
              icon={IconNames.DOWNLOAD}
              onClick={handleExport}
              text="Export Data"
            />
            <Button
              icon={IconNames.REFRESH}
              onClick={loadAnalytics}
              minimal
              text="Refresh"
            />
            <Button
              icon={IconNames.TRASH}
              onClick={handleClearData}
              intent={Intent.DANGER}
              minimal
              text="Clear All Data"
            />
          </div>
        </div>

        <Divider />

        <H5>Task Difficulty Overview</H5>
        <HTMLTable striped interactive className="seq-analytics-table">
          <thead>
            <tr>
              <th>Task Name</th>
              <th>Responses</th>
              <th>Average Rating</th>
              <th>Median Rating</th>
              <th>Assessment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {analytics.map((task) => (
              <tr
                key={task.taskId}
                onClick={() => setSelectedTask(task)}
                style={{ cursor: 'pointer' }}
              >
                <td>{task.taskName}</td>
                <td>{task.totalResponses}</td>
                <td>
                  <Tag intent={getRatingIntent(task.averageRating)}>
                    {task.averageRating.toFixed(2)}
                  </Tag>
                </td>
                <td>{task.medianRating}</td>
                <td>{getRatingLabel(task.averageRating)}</td>
                <td>
                  <Button
                    small
                    minimal
                    icon={IconNames.EYE_OPEN}
                    onClick={() => setSelectedTask(task)}
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </HTMLTable>

        {selectedTask && (
          <>
            <Divider />
            <div className="seq-task-details">
              <H5>
                {selectedTask.taskName} - Detailed Analytics
              </H5>

              <div className="seq-metrics-grid">
                <Card className="seq-metric-card">
                  <div className="seq-metric-label">Total Responses</div>
                  <div className="seq-metric-value">
                    {selectedTask.totalResponses}
                  </div>
                </Card>

                <Card className="seq-metric-card">
                  <div className="seq-metric-label">Average Difficulty</div>
                  <div className="seq-metric-value">
                    <Tag
                      large
                      intent={getRatingIntent(selectedTask.averageRating)}
                    >
                      {selectedTask.averageRating.toFixed(2)} / 7.0
                    </Tag>
                  </div>
                  <div className="seq-metric-sublabel">
                    {getRatingLabel(selectedTask.averageRating)}
                  </div>
                </Card>

                <Card className="seq-metric-card">
                  <div className="seq-metric-label">Median Rating</div>
                  <div className="seq-metric-value">
                    {selectedTask.medianRating} / 7
                  </div>
                </Card>
              </div>

              <H5>Response Distribution</H5>
              <div className="seq-distribution">
                {[1, 2, 3, 4, 5, 6, 7].map((rating) => {
                  const count = selectedTask.distribution[rating] || 0;
                  const percentage =
                    selectedTask.totalResponses > 0
                      ? (count / selectedTask.totalResponses) * 100
                      : 0;

                  return (
                    <div key={rating} className="seq-distribution-row">
                      <div className="seq-distribution-label">
                        {rating} - {getRatingLabel(rating)}
                      </div>
                      <div className="seq-distribution-bar">
                        <ProgressBar
                          value={percentage / 100}
                          intent={getRatingIntent(rating)}
                          animate={false}
                        />
                      </div>
                      <div className="seq-distribution-count">
                        {count} ({percentage.toFixed(0)}%)
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedTask.comments.length > 0 && (
                <>
                  <H5>User Comments ({selectedTask.comments.length})</H5>
                  <div className="seq-comments-list">
                    {selectedTask.comments.map((comment, index) => (
                      <Callout key={index} className="seq-comment">
                        <p>"{comment}"</p>
                      </Callout>
                    ))}
                  </div>
                </>
              )}

              <Button
                minimal
                icon={IconNames.CROSS}
                onClick={() => setSelectedTask(null)}
                className="seq-close-details"
              >
                Close Details
              </Button>
            </div>
          </>
        )}
      </Card>

      <Card className="seq-research-notes">
        <H5>
          <Icon icon={IconNames.LEARNING} /> Research Guidelines
        </H5>
        <p>
          <strong>Interpreting SEQ Scores:</strong>
        </p>
        <ul>
          <li>
            <strong>6-7 (Easy):</strong> Task is intuitive and user-friendly
          </li>
          <li>
            <strong>4-5 (Neutral):</strong> Task is acceptable but has room for
            improvement
          </li>
          <li>
            <strong>1-3 (Difficult):</strong> Task needs immediate UX attention
          </li>
        </ul>
        <p>
          <strong>Sample Size:</strong> SEQ is shown to 33% of users to prevent
          survey fatigue. Minimum 10-15 responses recommended for reliable
          insights.
        </p>
        <p>
          <strong>Next Steps:</strong> For tasks scoring below 4.0, conduct
          qualitative user interviews to identify specific friction points.
        </p>
      </Card>
    </div>
  );
};

export default SEQAnalyticsDashboard;
