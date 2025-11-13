import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackgroundProcessing as useBackgroundProcessingContext } from '../contexts/BackgroundProcessingContext';
import { OverlayToaster, Position, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

export interface UseBackgroundProcessingReturn {
  startProcessing: (deckData: any, options?: { redirect?: boolean }) => Promise<{ id: string }>;
  isProcessing: boolean;
}

export const useBackgroundProcessing = (): UseBackgroundProcessingReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { startNewDeckCreation } = useBackgroundProcessingContext();

  const startProcessing = useCallback(async (deckData: any, options?: { redirect?: boolean }) => {
    const { redirect = true } = options || {};
    setIsProcessing(true);

    try {
      const jobId = startNewDeckCreation(deckData.name || 'New Collection Deck');

      // Show processing started notification
      const toaster = await OverlayToaster.create({ position: Position.TOP_RIGHT });
      toaster.show({
        message: 'Match generation started! Your collection deck is being processed in the background. Estimated completion time: ~1 hour.',
        intent: Intent.PRIMARY,
        icon: IconNames.INFO_SIGN,
        timeout: 5000,
      });

      // Only redirect if explicitly requested (default: true for backward compatibility)
      // Wizard flow will pass redirect: false and handle navigation itself
      if (redirect) {
        navigate('/history');
      }

      return { id: jobId };

    } catch (error) {
      console.error('Failed to start processing:', error);

      // Show error notification
      const toaster = await OverlayToaster.create({ position: Position.TOP_RIGHT });
      toaster.show({
        message: 'Failed to start match generation. Please try again.',
        intent: Intent.DANGER,
        icon: IconNames.ERROR,
        timeout: 5000,
      });

      throw error; // Re-throw so wizard can handle error
    } finally {
      setIsProcessing(false);
    }
  }, [navigate, startNewDeckCreation]);

  return {
    startProcessing,
    isProcessing,
  };
};
