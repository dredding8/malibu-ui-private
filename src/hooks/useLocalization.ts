import { useMemo } from 'react';

// Simple localization hook without complex dependencies
const translations = {
  history: {
    title: "Collection Deck History",
    subtitle: "Track your collection deck processing and results",
    noResults: "No collection decks found for the selected date range.",
    columns: {
      name: "Deck Name",
      collectionStatus: "Collection Deck Status",
      algorithmStatus: "Matching status", 
      progress: "Progress",
      created: "Created",
      completed: "Completed"
    },
    collection: {
      // User-facing deck status messaging (Job 1: Collection Deck Progress)
      initializing: "Setting up your collection deck...",
      processing: "Building your collection deck...",
      ready: "Deck ready to view",
      failed: "Deck creation failed - retry available",
      cancelled: "Deck creation cancelled",
      help: "Shows your collection deck creation progress"
    },
    algorithm: {
      // Processing execution awareness (Job 2: Processing Context)
      queued: "Queued for processing",
      running: "Processing collection data...",
      optimizing: "Optimizing collection matches...",
      converged: "Processing complete",
      error: "Processing error - support notified", 
      timeout: "Processing timed out",
      help: "Shows collection data processing state"
    },
    tooltips: {
      deckName: "Collection deck name and identifier",
      collectionStatus: "Your collection deck creation status",
      algorithmStatus: "Collection data processing state",
      progressBar: "Overall deck completion percentage"
    },
    filters: {
      title: "Filter Collection Decks",
      startDate: "Start Date",
      endDate: "End Date",
      reset: "Clear Filters",
      apply: "Apply Filters"
    },
    actions: {
      viewDeck: "View Deck",
      retryDeck: "Retry Creation",
      downloadResults: "Download Results"
    }
  }
};

export const useLocalization = () => {
  const t = useMemo(() => {
    return (key: string): string => {
      const keys = key.split('.');
      let value: any = translations;
      
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) {
          return key; // Return key if translation not found
        }
      }
      
      return typeof value === 'string' ? value : key;
    };
  }, []);

  return { t };
};