import { OverlayToaster, Position, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionDeckStatus, AlgorithmStatus, resolveCollectionStatus } from '../constants/statusTypes';

// Matches the interface in HistoryTable.tsx
export interface HistoryTableRow {
  id: string;
  name: string;
  collectionDeckStatus: CollectionDeckStatus;
  algorithmStatus: AlgorithmStatus;
  progress: number;
  createdDate: Date;
  createdBy: string;
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
          collectionDeckStatus: 'in-progress' as const,
          algorithmStatus: 'running' as const,
          progress: 45,
          createdDate: new Date(Date.now() - 60000), // 1 minute ago
          createdBy: 'John Smith',
        },
        {
          id: 'TEST-002',
          name: 'Sample Analytics Deck',
          collectionDeckStatus: 'complete' as const,
          algorithmStatus: 'converged' as const,
          progress: 100,
          createdDate: new Date(Date.now() - 300000), // 5 minutes ago
          createdBy: 'Sarah Johnson',
          completionDate: new Date(Date.now() - 60000),
        },
        {
          id: 'TEST-003',
          name: 'Failed Processing Test',
          collectionDeckStatus: 'in-progress' as const,
          algorithmStatus: 'error' as const,
          progress: 23,
          createdDate: new Date(Date.now() - 900000), // 15 minutes ago
          createdBy: 'Mike Chen',
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
      collectionDeckStatus: 'in-progress',
      algorithmStatus: 'queued',
      progress: 0,
      createdDate: new Date(),
      createdBy: 'Current User', // TODO: Get from user context
    };
    this.jobs.unshift(newJob); // Add to the top of the list
    this.saveJobs();
    this.notifyListeners();
    return newJob.id;
  }

  private updateJobsProgress() {
    let changed = false;
    this.jobs.forEach(job => {
      // Skip completed jobs
      if (job.algorithmStatus === 'converged') {
        return;
      }

      changed = true;
      job.progress += Math.floor(Math.random() * 10) + 5; // Increment progress
      if (job.progress > 100) job.progress = 100;

      // Update statuses based on progress
      if (job.progress >= 100) {
        job.algorithmStatus = 'converged';
        job.completionDate = new Date();
        this.showCompletionNotification(job.name);
      } else if (job.progress > 70) {
        job.algorithmStatus = 'optimizing';
      } else if (job.progress > 20) {
        job.algorithmStatus = 'running';
      } else {
        job.algorithmStatus = 'queued';
      }

      // Randomly introduce a failure for demonstration
      if (Math.random() < 0.01) { // 1% chance of failure
          job.algorithmStatus = 'error';
          job.completionDate = new Date();
      }
      
      // Always update collectionDeckStatus based on algorithmStatus
      job.collectionDeckStatus = resolveCollectionStatus(job.algorithmStatus);
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
