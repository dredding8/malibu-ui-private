import React, { useState, useEffect } from 'react';
import { ProgressBar, Card, Colors, Classes, Intent, Tag } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

export interface ProcessingJob {
  id: string;
  name: string;
  status: 'processing' | 'queued' | 'ready' | 'failed';
  progress: number;
  estimatedTimeRemaining?: number;
  startTime: Date;
  currentPhase?: string;
}

interface PredictiveProgressProps {
  jobs: ProcessingJob[];
  className?: string;
}

const PredictiveProgress: React.FC<PredictiveProgressProps> = ({ jobs, className = '' }) => {
  const [timeEstimates, setTimeEstimates] = useState<Record<string, number>>({});

  const activeJobs = jobs.filter(job => job.status === 'processing');
  const queuedJobs = jobs.filter(job => job.status === 'queued');

  // Calculate predictive time estimates based on historical data and current progress
  useEffect(() => {
    const calculateEstimates = () => {
      const estimates: Record<string, number> = {};
      
      activeJobs.forEach(job => {
        if (job.progress > 0 && job.progress < 100) {
          const elapsedTime = (Date.now() - job.startTime.getTime()) / 1000; // seconds
          const progressRate = job.progress / elapsedTime; // progress per second
          const remainingProgress = 100 - job.progress;
          const estimatedRemainingTime = remainingProgress / progressRate;
          
          // Add buffer for accuracy and round to nearest 30 seconds
          estimates[job.id] = Math.ceil(estimatedRemainingTime * 1.2 / 30) * 30;
        } else if (job.estimatedTimeRemaining) {
          estimates[job.id] = job.estimatedTimeRemaining;
        }
      });
      
      setTimeEstimates(estimates);
    };

    if (activeJobs.length > 0) {
      calculateEstimates();
      const interval = setInterval(calculateEstimates, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [activeJobs]);

  const formatTimeEstimate = (seconds: number): string => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
    return `${Math.ceil(seconds / 3600)}h`;
  };

  const getPhaseProgress = (phase: string): number => {
    const phaseMap: Record<string, number> = {
      'initializing': 5,
      'data-gathering': 25,
      'processing': 60,
      'optimization': 80,
      'finalizing': 95,
      'complete': 100
    };
    return phaseMap[phase] || 0;
  };

  const getProgressIntent = (progress: number): Intent => {
    if (progress >= 90) return Intent.SUCCESS;
    if (progress >= 70) return Intent.PRIMARY;
    if (progress >= 40) return Intent.WARNING;
    return Intent.NONE;
  };

  if (activeJobs.length === 0 && queuedJobs.length === 0) {
    return null;
  }

  return (
    <Card 
      className={className}
      style={{ 
        backgroundColor: Colors.WHITE,
        border: `1px solid ${Colors.LIGHT_GRAY3}`,
        borderRadius: '8px',
        marginBottom: '16px'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>⚡</span>
          <span className={Classes.HEADING} style={{ 
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: Colors.DARK_GRAY1
          }}>
            Processing Activity
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeJobs.length > 0 && (
            <Tag intent={Intent.PRIMARY} minimal>
              {activeJobs.length} active
            </Tag>
          )}
          {queuedJobs.length > 0 && (
            <Tag intent={Intent.WARNING} minimal>
              {queuedJobs.length} queued
            </Tag>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Active Jobs */}
        {activeJobs.map(job => {
          const estimate = timeEstimates[job.id];
          const phaseProgress = job.currentPhase ? getPhaseProgress(job.currentPhase) : job.progress;
          
          return (
            <div key={job.id} style={{
              padding: '16px',
              backgroundColor: Colors.LIGHT_GRAY5,
              borderRadius: '6px',
              border: `1px solid ${Colors.LIGHT_GRAY3}`
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <div>
                  <div style={{ 
                    fontWeight: '600', 
                    color: Colors.DARK_GRAY1,
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}>
                    {job.name}
                  </div>
                  {job.currentPhase && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: Colors.GRAY2,
                      textTransform: 'capitalize'
                    }}>
                      {job.currentPhase.replace('-', ' ')}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '700',
                    color: getProgressIntent(job.progress) === Intent.SUCCESS ? Colors.GREEN1 : Colors.BLUE1
                  }}>
                    {Math.round(job.progress)}%
                  </div>
                  {estimate && (
                    <div style={{ 
                      fontSize: '11px', 
                      color: Colors.GRAY2,
                      fontStyle: 'italic'
                    }}>
                      ~{formatTimeEstimate(estimate)} remaining
                    </div>
                  )}
                </div>
              </div>
              
              <ProgressBar 
                value={job.progress / 100}
                intent={getProgressIntent(job.progress)}
                stripes={job.progress < 100}
                animate={job.progress < 100}
              />
              
              {/* Phase indicator */}
              {job.currentPhase && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  fontSize: '10px',
                  color: Colors.GRAY3
                }}>
                  <span>Initializing</span>
                  <span>Data Gathering</span>
                  <span>Processing</span>
                  <span>Optimization</span>
                  <span>Finalizing</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Queued Jobs Preview */}
        {queuedJobs.length > 0 && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: Colors.ORANGE5,
            borderRadius: '6px',
            border: `1px solid ${Colors.ORANGE3}`
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <div>
                <div style={{ 
                  fontWeight: '600', 
                  color: Colors.ORANGE1,
                  fontSize: '14px',
                  marginBottom: '4px'
                }}>
                  Queue Status
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: Colors.ORANGE2
                }}>
                  {queuedJobs.length} collection{queuedJobs.length !== 1 ? 's' : ''} waiting to start
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: Colors.ORANGE2,
                fontSize: '12px'
              }}>
                <span>🕒</span>
                <span>Processing will begin shortly</span>
              </div>
            </div>
            
            {queuedJobs.slice(0, 3).map((job, index) => (
              <div key={job.id} style={{
                fontSize: '12px',
                color: Colors.ORANGE2,
                marginTop: '4px',
                paddingLeft: '16px'
              }}>
                {index + 1}. {job.name}
              </div>
            ))}
            
            {queuedJobs.length > 3 && (
              <div style={{
                fontSize: '11px',
                color: Colors.ORANGE2,
                marginTop: '4px',
                paddingLeft: '16px',
                fontStyle: 'italic'
              }}>
                ...and {queuedJobs.length - 3} more
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default PredictiveProgress;