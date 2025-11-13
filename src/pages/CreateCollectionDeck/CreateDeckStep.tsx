import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  H3,
  H4,
  H5,
  Divider,
  Button,
  Intent,
  Card,
  Callout,
  Tag,
  Spinner,
  ProgressBar,
  Section,
  SectionCard
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

interface CreateDeckStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

// Reuse sample matches from ReviewAndSelectForm
const sampleMatches = [
  {
    id: '1',
    sccNumber: '13113',
    priority: 51,
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY',
    match: 'Optimal',
    matchNotes: '',
    siteAllocation: ['THU 2', 'FYL 2', 'ASC 2', 'CLR 2', 'HOLT 2'],
    notes: '',
    selected: true,
    needsReview: false,
    unmatched: false,
    duration: 45,
    site: 'THU'
  },
  {
    id: '2',
    sccNumber: '13162',
    priority: 51,
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY',
    match: 'Optimal',
    matchNotes: '',
    siteAllocation: ['THU 2', 'FYL 2', 'ASC 2', 'CLR 2', 'HOLT 2'],
    notes: '',
    selected: true,
    needsReview: false,
    unmatched: false,
    duration: 38,
    site: 'FYL'
  },
  {
    id: '3',
    sccNumber: '13777',
    priority: 51,
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY',
    match: 'Baseline',
    matchNotes: 'Capacity Issue',
    siteAllocation: ['CLR 2', 'PPW 1', 'THU 1', 'CLR 1', 'ASC 1'],
    notes: '',
    selected: false,
    needsReview: true,
    unmatched: false,
    duration: 22,
    site: 'CLR'
  },
  {
    id: '4',
    sccNumber: '58253',
    priority: 1,
    function: 'Counterspace',
    orbit: 'GEO',
    periodicity: 6,
    collectionType: 'Optical',
    classification: 'S//REL FVEY',
    match: 'No matches',
    matchNotes: 'Capacity Issue',
    siteAllocation: [],
    notes: '',
    selected: false,
    needsReview: false,
    unmatched: true,
    duration: 0,
    site: ''
  },
  {
    id: '5',
    sccNumber: '34546',
    priority: 3,
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 3,
    collectionType: 'Narrowband',
    classification: 'S//NF',
    match: 'No matches',
    matchNotes: 'Capacity Issue',
    siteAllocation: [],
    notes: '',
    selected: false,
    needsReview: false,
    unmatched: true,
    duration: 0,
    site: ''
  },
  {
    id: '6',
    sccNumber: '25404',
    priority: 12,
    function: 'Counterspace',
    orbit: 'LEO',
    periodicity: 8,
    collectionType: 'Optical',
    classification: 'S//NF',
    match: 'No matches',
    matchNotes: 'Not Seen',
    siteAllocation: [],
    notes: '',
    selected: false,
    needsReview: false,
    unmatched: true,
    duration: 0,
    site: ''
  }
];

const CreateDeckStep: React.FC<CreateDeckStepProps> = ({
  data,
  onUpdate,
  onNext,
  onBack
}) => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState('Initializing...');
  const [deckCreated, setDeckCreated] = useState(false);
  const [deckId, setDeckId] = useState<string | null>(null);

  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate loading with smart defaults (extracted from ReviewAndSelectForm)
  const simulateLoading = useCallback(async () => {
    setProgress(0);
    setLoadingStep('Initializing analysis engine...');

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15;

        if (newProgress < 25) {
          setLoadingStep('Loading satellite data...');
        } else if (newProgress < 50) {
          setLoadingStep('Analyzing orbital parameters...');
        } else if (newProgress < 75) {
          setLoadingStep('Calculating collection opportunities...');
        } else if (newProgress < 90) {
          setLoadingStep('Generating match results...');
        } else {
          setLoadingStep('Finalizing results...');
        }

        return Math.min(newProgress, 100);
      });
    }, 200);

    loadingTimeoutRef.current = setTimeout(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      const generatedDeckId = `DECK-${Date.now()}`;
      setDeckId(generatedDeckId);

      // Update wizard data with generated matches and deck ID
      onUpdate({
        matches: sampleMatches,
        deckId: generatedDeckId
      });

      setIsGenerating(false);
      setDeckCreated(true);
      setProgress(100);
      setLoadingStep('Complete');
    }, 3000);
  }, [onUpdate]);

  const cleanupLoading = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const handleCreateDeck = () => {
    setIsGenerating(true);
    simulateLoading();
  };

  useEffect(() => {
    return () => {
      cleanupLoading();
    };
  }, [cleanupLoading]);

  const optimalCount = sampleMatches.filter(m => m.match === 'Optimal').length;
  const baselineCount = sampleMatches.filter(m => m.match === 'Baseline').length;
  const needsReviewCount = sampleMatches.filter(m => m.needsReview).length;

  return (
    <div>
      <H3 id="step-heading">Step 2: Create Collection Deck</H3>
      <Divider className="bp6-margin-bottom" />

      {!isGenerating && !deckCreated && (
        <>
          {/* Configuration Summary */}
          <Section>
            <SectionCard>
              <H4>Configuration Summary</H4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', fontSize: '14px' }}>
                <div>
                  <strong>Tasking Window:</strong><br />
                  {data.taskingWindow?.startDate
                    ? `${new Date(data.taskingWindow.startDate).toLocaleDateString()} to ${new Date(data.taskingWindow.endDate).toLocaleDateString()}`
                    : 'Not specified'}
                </div>
                <div>
                  <strong>Parameters:</strong><br />
                  Capacity: {data.parameters?.hardCapacity || 'N/A'},
                  Duration: {data.parameters?.minDuration || 'N/A'}min,
                  Elevation: {data.parameters?.elevation || 'N/A'}°
                </div>
                <div>
                  <strong>Data Sources:</strong><br />
                  TLE: {data.tleData?.source || 'N/A'},
                  Sites: {data.unavailableSites?.sites?.length || 0} unavailable
                </div>
              </div>
            </SectionCard>
          </Section>

          {/* Ready to Create */}
          <Card className="bp6-margin-top" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚀</div>
            <H3>Ready to Create Your Collection Deck</H3>
            <p style={{ color: '#666', marginTop: '10px', marginBottom: '30px', maxWidth: '600px', margin: '0 auto' }}>
              This will generate orbital matches and create your collection deck entity.
              The system will analyze satellite passes and identify collection opportunities
              based on your configured parameters.
            </p>
            <Button
              large
              intent={Intent.PRIMARY}
              text="Create Collection Deck"
              icon={IconNames.ROCKET}
              onClick={handleCreateDeck}
              style={{ marginTop: '20px' }}
              data-testid="create-deck-button"
            />
          </Card>
        </>
      )}

      {isGenerating && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spinner size={50} aria-label="Loading collection opportunities..." />
            <H4 className="bp6-margin-top">Creating Collection Deck...</H4>
            <p style={{ color: '#666', marginTop: '10px', marginBottom: '20px' }}>
              {loadingStep}
            </p>
            <ProgressBar
              intent={Intent.PRIMARY}
              className="bp6-margin-top"
              value={progress / 100}
            />
            <p style={{ color: '#666', marginTop: '15px', fontSize: '14px' }}>
              Analyzing satellite passes and identifying collection opportunities...
            </p>
          </div>
        </Card>
      )}

      {deckCreated && !isGenerating && (
        <>
          {/* Success State */}
          <Card className="bp6-margin-bottom" style={{ backgroundColor: '#f5f8fa', border: '2px solid #0F9960' }}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>✓</div>
              <H3 style={{ color: '#0F9960', marginBottom: '15px' }}>Deck Created Successfully!</H3>
              <Tag large intent={Intent.PRIMARY} style={{ fontSize: '16px' }}>
                Deck ID: {deckId}
              </Tag>
            </div>
          </Card>

          {/* Matches Summary */}
          <Card>
            <H4>Opportunities Found: {sampleMatches.length} matches</H4>
            <Divider style={{ margin: '15px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <Card elevation={1} style={{ padding: '20px', textAlign: 'center', backgroundColor: '#e8f5e9' }}>
                <H5 style={{ color: '#0F9960', marginBottom: '10px' }}>
                  {optimalCount}
                </H5>
                <Tag intent={Intent.SUCCESS} large>Optimal matches</Tag>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  Best match quality
                </p>
              </Card>

              <Card elevation={1} style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fff3e0' }}>
                <H5 style={{ color: '#D9822B', marginBottom: '10px' }}>
                  {baselineCount}
                </H5>
                <Tag intent={Intent.WARNING} large>Baseline matches</Tag>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  Acceptable quality
                </p>
              </Card>

              <Card elevation={1} style={{ padding: '20px', textAlign: 'center', backgroundColor: '#ffebee' }}>
                <H5 style={{ color: '#DB3737', marginBottom: '10px' }}>
                  {needsReviewCount}
                </H5>
                <Tag intent={Intent.DANGER} large>Needs review</Tag>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  Requires attention
                </p>
              </Card>
            </div>

            <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} className="bp6-margin-top">
              <strong>Next Step:</strong> Your collection deck is ready! Continue to the management interface to work with these opportunities,
              allocate sites, and refine your collection.
            </Callout>
          </Card>
        </>
      )}

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
        <Button
          text="Back"
          onClick={onBack}
          disabled={isGenerating}
          data-testid="back-button"
        />
        {deckCreated && (
          <Button
            text="Continue to Management"
            intent={Intent.PRIMARY}
            onClick={() => navigate(`/create-collection-deck/manage?id=${deckId}`)}
            rightIcon={IconNames.ARROW_RIGHT}
            large
            data-testid="next-button"
          />
        )}
      </div>
    </div>
  );
};

export default CreateDeckStep;
