import React, { createContext, useContext, useEffect, useState } from 'react';
import { backgroundProcessingService, HistoryTableRow } from '../services/backgroundProcessingService';

interface BackgroundProcessingContextType {
  jobs: HistoryTableRow[];
  startNewDeckCreation: (deckName: string) => string;
}

const BackgroundProcessingContext = createContext<BackgroundProcessingContextType | undefined>(undefined);

export const useBackgroundProcessing = () => {
  const context = useContext(BackgroundProcessingContext);
  if (context === undefined) {
    throw new Error('useBackgroundProcessing must be used within a BackgroundProcessingProvider');
  }
  return context;
};

interface BackgroundProcessingProviderProps {
  children: React.ReactNode;
}

export const BackgroundProcessingProvider: React.FC<BackgroundProcessingProviderProps> = ({ children }) => {
  const [jobs, setJobs] = useState<HistoryTableRow[]>([]);

  useEffect(() => {
    // Subscribe to job updates from the service
    const unsubscribe = backgroundProcessingService.onJobsUpdate(updatedJobs => {
      setJobs(updatedJobs);
    });

    // Cleanup subscription on component unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const startNewDeckCreation = (deckName: string): string => {
    return backgroundProcessingService.startNewJob(deckName);
  };

  const value: BackgroundProcessingContextType = {
    jobs,
    startNewDeckCreation,
  };

  return (
    <BackgroundProcessingContext.Provider value={value}>
      {children}
    </BackgroundProcessingContext.Provider>
  );
};
