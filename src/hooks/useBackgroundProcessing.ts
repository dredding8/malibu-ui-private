import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackgroundProcessing as useBackgroundProcessingContext } from '../contexts/BackgroundProcessingContext';
import { OverlayToaster, Position, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

export interface UseBackgroundProcessingReturn {
  startProcessing: (deckData: any) => Promise<void>;
  isProcessing: boolean;
}

export const useBackgroundProcessing = (): UseBackgroundProcessingReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { startNewDeckCreation } = useBackgroundProcessingContext();

  const startProcessing = useCallback(async (deckData: any) => {
    setIsProcessing(true);
    
    try {
      startNewDeckCreation(deckData.name || 'New Collection Deck');
      
      // Show processing started notification
      const toaster = await OverlayToaster.create({ position: Position.TOP_RIGHT });
      toaster.show({
        message: 'Match generation started! Your collection deck is being processed in the background. Estimated completion time: ~1 hour.',
        intent: Intent.PRIMARY,
        icon: IconNames.INFO_SIGN,
        timeout: 5000,
      });
      
      // Redirect to History page
      navigate('/history');
      
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
    } finally {
      setIsProcessing(false);
    }
  }, [navigate, startNewDeckCreation]);

  return {
    startProcessing,
    isProcessing,
  };
};
