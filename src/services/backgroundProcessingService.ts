import { OverlayToaster, Position, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionDeckStatus, AlgorithmStatus } from '../constants/statusTypes';

// Matches the interface in HistoryTable.tsx
export interface HistoryTableRow {
  id: string;
  name: string;
  collectionDeckStatus: CollectionDeckStatus;
  algorithmStatus: AlgorithmStatus;
  progress: number;
  createdDate: Date;
  completionDate?: Date;
}

type JobUpdateListener = (jobs: HistoryTableRow[]) => void;

class BackgroundProcessingServiceImpl {
  private jobs: HistoryTableRow[] = [];
  private listeners: JobUpdateListener[] = [];
  private isInitialized = false;
  private toaster: any = null;

  constructor() {
    this.initialize();
  }

  private async getToaster() {
    if (this.toaster) return this.toaster;
    this.toaster = await OverlayToaster.create({ position: Position.TOP_RIGHT });
    return this.toaster;
  }

  private initialize() {
    if (this.isInitialized) return;
    const savedJobs = localStorage.getItem('jobHistory');
    if (savedJobs) {
      this.jobs = JSON.parse(savedJobs).map((job: any) => ({
        ...job,
        createdDate: new Date(job.createdDate),
        completionDate: job.completionDate ? new Date(job.completionDate) : undefined,
      }));
    } else {
      // Add test data for UX validation tests
      this.jobs = [
        {
          id: 'TEST-001',
          name: 'UX Test Collection Deck',
          collectionDeckStatus: 'processing' as const,
          algorithmStatus: 'running' as const,
          progress: 45,
          createdDate: new Date(Date.now() - 60000), // 1 minute ago
        },
        {
          id: 'TEST-002',
          name: 'Sample Analytics Deck',
          collectionDeckStatus: 'ready' as const,
          algorithmStatus: 'converged' as const,
          progress: 100,
          createdDate: new Date(Date.now() - 300000), // 5 minutes ago
          completionDate: new Date(Date.now() - 60000),
        },
        {
          id: 'TEST-003',
          name: 'Failed Processing Test',
          collectionDeckStatus: 'failed' as const,
          algorithmStatus: 'error' as const,
          progress: 23,
          createdDate: new Date(Date.now() - 900000), // 15 minutes ago
          completionDate: new Date(Date.now() - 300000),
        }
      ];
      this.saveJobs();
    }
    setInterval(() => this.updateJobsProgress(), 3000); // Poll every 3 seconds
    this.isInitialized = true;
  }

  public onJobsUpdate(listener: JobUpdateListener): () => void {
    this.listeners.push(listener);
    // Immediately notify the new listener with the current jobs
    listener(this.jobs);
    // Return an unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.jobs]));
  }

  private saveJobs() {
    localStorage.setItem('jobHistory', JSON.stringify(this.jobs));
  }

  public startNewJob(deckName: string): string {
    const newJob: HistoryTableRow = {
      id: `DECK-${Date.now()}`,
      name: deckName,
      collectionDeckStatus: 'processing',
      algorithmStatus: 'queued',
      progress: 0,
      createdDate: new Date(),
    };
    this.jobs.unshift(newJob); // Add to the top of the list
    this.saveJobs();
    this.notifyListeners();
    return newJob.id;
  }

  private updateJobsProgress() {
    let changed = false;
    this.jobs.forEach(job => {
      if (job.collectionDeckStatus === 'ready' || job.collectionDeckStatus === 'failed' || job.collectionDeckStatus === 'cancelled') {
        return; // Skip completed/failed jobs
      }

      changed = true;
      job.progress += Math.floor(Math.random() * 10) + 5; // Increment progress
      if (job.progress > 100) job.progress = 100;

      // Update statuses based on progress
      if (job.progress >= 100) {
        job.collectionDeckStatus = 'ready';
        job.algorithmStatus = 'converged';
        job.completionDate = new Date();
        this.showCompletionNotification(job.name);
      } else if (job.progress > 70) {
        job.collectionDeckStatus = 'processing';
        job.algorithmStatus = 'optimizing';
      } else if (job.progress > 20) {
        job.collectionDeckStatus = 'processing';
        job.algorithmStatus = 'running';
      } else {
        job.collectionDeckStatus = 'processing';
        job.algorithmStatus = 'queued';
      }

      // Randomly introduce a failure for demonstration
      if (Math.random() < 0.01) { // 1% chance of failure
          job.collectionDeckStatus = 'failed';
          job.algorithmStatus = 'error';
          job.completionDate = new Date();
      }
    });

    if (changed) {
      this.saveJobs();
      this.notifyListeners();
    }
  }
  
  async showCompletionNotification(deckName: string): Promise<void> {
    const toaster = await this.getToaster();
    toaster.show({
      message: `Collection Deck "${deckName}" is ready for review.`,
      intent: Intent.SUCCESS,
      icon: IconNames.TICK_CIRCLE,
      timeout: 5000,
      action: {
        text: 'View History',
        onClick: () => window.location.href = '/history',
      }
    });
  }
}

export const backgroundProcessingService = new BackgroundProcessingServiceImpl();
