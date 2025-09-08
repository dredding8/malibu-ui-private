import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      history: {
        title: "Your Collection Results",
        subtitle: "Monitor your collection processing and access completed results",
        noResults: "No collections found for the selected time period.",
        columns: {
          name: "Collection Name",
          collectionStatus: "What's Happening",
          algorithmStatus: "Processing Update",
          progress: "Completion",
          created: "Started",
          completed: "Finished"
        },
        collection: {
          // User-focused outcome messaging (Job 1: Collection Progress Monitoring)
          initializing: "Getting your data ready",
          processing: "Creating your collection",
          ready: "Your collection is ready!",
          failed: "Something went wrong - we can try again",
          cancelled: "You stopped this process",
          help: "Shows what's happening with your collection right now"
        },
        algorithm: {
          // User-centered progress context (Job 2: Algorithm Execution Context)
          queued: "Waiting to start",
          running: "Finding your matches",
          optimizing: "Making it better",
          converged: "All done!",
          error: "Hit a snag - our team is notified", 
          timeout: "Taking longer than expected",
          help: "Shows how we're working on your collection behind the scenes"
        },
        tooltips: {
          collectionStatus: "What's happening with your collection right now",
          algorithmStatus: "How we're processing your data behind the scenes",
          progressBar: "How much of your collection is complete"
        },
        actions: {
          viewDeck: "See Results",
          retryDeck: "Try Again",
          downloadResults: "Save Results"
        },
        filters: {
          startDate: "From Date",
          endDate: "To Date",
          apply: "Show Results"
        }
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false // React already escapes by default
    }
  });

export default i18n;