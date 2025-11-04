/**
 * Single Ease Question (SEQ) Service
 *
 * Handles data collection, sampling, storage, and analytics for SEQ responses.
 *
 * Features:
 * - Intelligent sampling to prevent survey fatigue (33% default)
 * - Local storage with future API integration capability
 * - Analytics and reporting
 * - Session management
 *
 * Ethnographic Research Principles:
 * - Respect user time (sampling)
 * - Capture immediate response (peak-end rule)
 * - Privacy-first (anonymized data)
 * - Context preservation (task metadata)
 */

import { SEQResponse } from '../components/SEQ/SingleEaseQuestion';

export interface SEQConfig {
  /** Sampling rate (0-1, default 0.33 = 33% of completions) */
  samplingRate?: number;

  /** Enable local storage persistence */
  enableStorage?: boolean;

  /** API endpoint for sending responses (future integration) */
  apiEndpoint?: string;

  /** Enable debug logging */
  debug?: boolean;
}

export interface SEQAnalytics {
  taskId: string;
  taskName: string;
  totalResponses: number;
  averageRating: number;
  medianRating: number;
  distribution: Record<number, number>; // rating -> count
  comments: string[];
  lastUpdated: string;
}

class SEQService {
  private config: SEQConfig;
  private sessionId: string;
  private responseCount: number = 0;
  private storageKey = 'seq_responses';

  constructor(config: SEQConfig = {}) {
    this.config = {
      samplingRate: 1.0, // 100% sampling rate (always show SEQ)
      enableStorage: true,
      debug: false,
      ...config,
    };

    // Generate session ID
    this.sessionId = this.generateSessionId();

    if (this.config.debug) {
      console.log('[SEQ Service] Initialized', {
        sessionId: this.sessionId,
        samplingRate: this.config.samplingRate,
      });
    }
  }

  /**
   * Determine if SEQ should be shown based on sampling rate
   * Uses random sampling to prevent survey fatigue
   */
  shouldShowSEQ(taskId: string): boolean {
    // Check sampling rate
    const random = Math.random();
    const shouldShow = random < (this.config.samplingRate || 1.0);

    if (this.config.debug) {
      console.log('[SEQ Service] shouldShowSEQ', {
        taskId,
        random,
        samplingRate: this.config.samplingRate,
        result: shouldShow,
      });
    }

    return shouldShow;
  }

  /**
   * Record a SEQ response
   */
  async recordResponse(response: SEQResponse): Promise<void> {
    this.responseCount++;

    // Add session ID if not present
    const enrichedResponse: SEQResponse = {
      ...response,
      sessionId: response.sessionId || this.sessionId,
    };

    if (this.config.debug) {
      console.log('[SEQ Service] Recording response', enrichedResponse);
    }

    // Store locally
    if (this.config.enableStorage) {
      this.saveToLocalStorage(enrichedResponse);
    }

    // Send to API (future implementation)
    if (this.config.apiEndpoint) {
      await this.sendToAPI(enrichedResponse);
    }
  }

  /**
   * Record dismissal (for analytics on survey completion rate)
   */
  recordDismissal(taskId: string, taskName: string): void {
    if (this.config.debug) {
      console.log('[SEQ Service] User dismissed SEQ', { taskId, taskName });
    }

    // Track dismissals for completion rate analysis
    const dismissalKey = 'seq_dismissals';
    const dismissals = this.getFromLocalStorage(dismissalKey) || [];
    dismissals.push({
      taskId,
      taskName,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    });
    localStorage.setItem(dismissalKey, JSON.stringify(dismissals));
  }

  /**
   * Get analytics for a specific task
   */
  getTaskAnalytics(taskId: string): SEQAnalytics | null {
    const responses = this.getAllResponses().filter((r) => r.taskId === taskId);

    if (responses.length === 0) {
      return null;
    }

    const ratings = responses.map((r) => r.rating);
    const distribution: Record<number, number> = {};

    ratings.forEach((rating) => {
      distribution[rating] = (distribution[rating] || 0) + 1;
    });

    const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    const sorted = [...ratings].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return {
      taskId,
      taskName: responses[0].taskName,
      totalResponses: responses.length,
      averageRating: parseFloat(average.toFixed(2)),
      medianRating: median,
      distribution,
      comments: responses
        .filter((r) => r.optionalComment)
        .map((r) => r.optionalComment!),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get all analytics (grouped by task)
   */
  getAllAnalytics(): SEQAnalytics[] {
    const responses = this.getAllResponses();
    const taskIds = [...new Set(responses.map((r) => r.taskId))];

    return taskIds
      .map((taskId) => this.getTaskAnalytics(taskId))
      .filter((a) => a !== null) as SEQAnalytics[];
  }

  /**
   * Export all data for external analysis
   */
  exportData(): {
    responses: SEQResponse[];
    analytics: SEQAnalytics[];
    metadata: {
      totalResponses: number;
      sessionId: string;
      exportDate: string;
    };
  } {
    return {
      responses: this.getAllResponses(),
      analytics: this.getAllAnalytics(),
      metadata: {
        totalResponses: this.responseCount,
        sessionId: this.sessionId,
        exportDate: new Date().toISOString(),
      },
    };
  }

  /**
   * Clear all stored data (for testing or privacy)
   */
  clearData(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem('seq_dismissals');
    this.responseCount = 0;

    if (this.config.debug) {
      console.log('[SEQ Service] All data cleared');
    }
  }

  // Private methods

  private generateSessionId(): string {
    return `seq_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveToLocalStorage(response: SEQResponse): void {
    const existing = this.getAllResponses();
    existing.push(response);
    localStorage.setItem(this.storageKey, JSON.stringify(existing));
  }

  private getAllResponses(): SEQResponse[] {
    return this.getFromLocalStorage(this.storageKey) || [];
  }

  private getFromLocalStorage(key: string): any {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[SEQ Service] Error reading from localStorage', error);
      return null;
    }
  }

  private async sendToAPI(response: SEQResponse): Promise<void> {
    if (!this.config.apiEndpoint) return;

    try {
      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response),
      });

      if (this.config.debug) {
        console.log('[SEQ Service] Response sent to API');
      }
    } catch (error) {
      console.error('[SEQ Service] Error sending to API', error);
    }
  }

  /**
   * Get session ID for use in components
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

// Singleton instance
export const seqService = new SEQService({
  samplingRate: 1.0, // Show SEQ to 100% of users (always visible)
  enableStorage: true,
  debug: process.env.NODE_ENV === 'development',
});

export default seqService;
