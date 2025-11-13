import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import AppNavbar from '../components/AppNavbar';
import HistoryCore from '../components/HistoryCore';

const History: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract collection ID from URL params for auto-selection
  const searchParams = new URLSearchParams(location.search);
  const autoSelectId = searchParams.get('id');

  return (
    <div className="history">
      {/* Header */}
      <AppNavbar />

      {/* Breadcrumbs */}
      <div style={{
        padding: '16px 24px 0 24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <Breadcrumbs
          items={[
            {
              text: 'Data Sources',
              icon: IconNames.DATABASE,
              onClick: () => navigate('/')
            },
            {
              text: 'Collection History',
              icon: IconNames.HISTORY,
              current: true
            }
          ]}
        />
      </div>

      {/* Main Content - delegated to HistoryCore */}
      <HistoryCore autoSelectId={autoSelectId || undefined} newDeckId={autoSelectId || undefined} />
    </div>
  );
};

export default History;
