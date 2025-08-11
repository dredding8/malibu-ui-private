import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Navbar,
  NavbarGroup,
  NavbarHeading,
  NavbarDivider,
  Button,
  Alignment,
  Card,
  H3,
  H5,
  Divider,
  Icon,
  HTMLSelect,
  Tag,
  FormGroup,
  Intent,
  ProgressBar,
  NumericInput,
  Callout
} from '@blueprintjs/core';
import { Cell, Column, Table } from '@blueprintjs/table';
import { IconNames } from '@blueprintjs/icons';

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const [viewingOption, setViewingOption] = useState('daily');

  const handleExportToExcel = () => {
    console.log('Exporting to Excel...');
  };

  const handleDownloadChart = (chartType: string) => {
    console.log(`Downloading ${chartType} chart...`);
  };

  // Sample data for analytics
  const analyticsData = {
    matching: {
      optimal: 45,
      baseline: 25,
      suboptimal: 15,
      manual: 15,
      total: 100
    },
    general: {
      optimal: 120,
      baseline: 80,
      suboptimal: 50,
      manual: 30,
      total: 280
    },
    cumulative: {
      optimal: 450,
      baseline: 320,
      suboptimal: 200,
      manual: 150,
      cumulative: 1120,
      total: 1120
    }
  };

  // Audit log data
  const auditLogData = [
    { scc: '00001', action: 'Created', date: '2024-01-25' },
    { scc: '00002', action: 'Updated', date: '2024-01-25' },
    { scc: '00003', action: 'Completed', date: '2024-01-24' },
    { scc: '00004', action: 'Deleted', date: '2024-01-24' }
  ];

  // Table renderers for audit log
  const sccCellRenderer = (rowIndex: number) => (
    <Cell>{auditLogData[rowIndex].scc}</Cell>
  );

  const actionCellRenderer = (rowIndex: number) => {
    const action = auditLogData[rowIndex].action;
    let intent: Intent;
    switch (action) {
      case 'Created':
        intent = Intent.SUCCESS;
        break;
      case 'Updated':
        intent = Intent.PRIMARY;
        break;
      case 'Completed':
        intent = Intent.WARNING;
        break;
      case 'Deleted':
        intent = Intent.DANGER;
        break;
      default:
        intent = Intent.NONE;
    }
    return (
      <Cell>
        <Tag intent={intent}>{action}</Tag>
      </Cell>
    );
  };

  const dateCellRenderer = (rowIndex: number) => (
    <Cell>{auditLogData[rowIndex].date}</Cell>
  );

  return (
    <div className="analytics">
      {/* Header */}
      <Navbar className="bp4-dark">
        <NavbarGroup align={Alignment.START}>
          <NavbarHeading>
            <span className="bp4-icon bp4-icon-cube bp4-margin-right" />
            VUE Dashboard
          </NavbarHeading>
          <NavbarDivider />
          <Button 
            className="bp4-minimal" 
            icon={IconNames.DATABASE} 
            text="Master" 
            onClick={() => navigate('/')}
          />
          <Button 
            className="bp4-minimal" 
            icon={IconNames.CUBE} 
            text="SCCs" 
            onClick={() => navigate('/sccs')}
          />
          <Button 
            className="bp4-minimal" 
            icon={IconNames.NEW_OBJECT} 
            text="Decks" 
            onClick={() => navigate('/decks')}
          />
          <Button 
            className="bp4-minimal" 
            icon={IconNames.HISTORY} 
            text="History" 
            onClick={() => navigate('/history')}
          />
          <Button 
            className="bp4-minimal" 
            icon={IconNames.CHART} 
            text="Analytics" 
            onClick={() => navigate('/analytics')}
            intent="primary"
          />
        </NavbarGroup>
        <NavbarGroup align={Alignment.END}>
          <Button 
            className="bp4-minimal" 
            icon={IconNames.LOG_OUT} 
            text="Logout"
            intent="danger"
          />
        </NavbarGroup>
      </Navbar>

      {/* Main Content */}
      <div className="analytics-content" style={{ padding: '20px' }}>
        <H3>Analytics</H3>
        
        {/* Controls */}
        <Card className="bp4-margin-bottom">
          <H5>Controls</H5>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <FormGroup label="Viewing" labelFor="viewing-option">
              <HTMLSelect
                id="viewing-option"
                value={viewingOption}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setViewingOption(e.currentTarget.value)}
                fill
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </HTMLSelect>
            </FormGroup>
            <Button
              icon={IconNames.DOWNLOAD}
              text="Export to Excel"
              intent="success"
              onClick={handleExportToExcel}
            />
          </div>
        </Card>

        {/* Charts and Audit Log Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left Section - Analytics Charts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* % of Matching */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <H5 style={{ margin: 0 }}>% of Matching</H5>
                <Button
                  small
                  minimal
                  icon={IconNames.DOWNLOAD}
                  text="Download"
                  onClick={() => handleDownloadChart('matching')}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px' }}>Optimal</span>
                  <NumericInput
                    value={analyticsData.matching.optimal}
                    readOnly
                    small
                    style={{ width: '60px' }}
                  />
                </div>
                <ProgressBar value={analyticsData.matching.optimal / analyticsData.matching.total} intent={Intent.SUCCESS} />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px' }}>Baseline</span>
                  <NumericInput
                    value={analyticsData.matching.baseline}
                    readOnly
                    small
                    style={{ width: '60px' }}
                  />
                </div>
                <ProgressBar value={analyticsData.matching.baseline / analyticsData.matching.total} intent={Intent.WARNING} />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px' }}>Suboptimal</span>
                  <NumericInput
                    value={analyticsData.matching.suboptimal}
                    readOnly
                    small
                    style={{ width: '60px' }}
                  />
                </div>
                <ProgressBar value={analyticsData.matching.suboptimal / analyticsData.matching.total} intent={Intent.DANGER} />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px' }}>Manual</span>
                  <NumericInput
                    value={analyticsData.matching.manual}
                    readOnly
                    small
                    style={{ width: '60px' }}
                  />
                </div>
                <ProgressBar value={analyticsData.matching.manual / analyticsData.matching.total} />
              </div>
            </Card>

            {/* General Matches */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <H5 style={{ margin: 0 }}>General Matches</H5>
                <Button
                  small
                  minimal
                  icon={IconNames.DOWNLOAD}
                  text="Download"
                  onClick={() => handleDownloadChart('general')}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px' }}>Optimal</span>
                  <NumericInput
                    value={analyticsData.general.optimal}
                    readOnly
                    small
                    style={{ width: '60px' }}
                  />
                </div>
                <ProgressBar value={analyticsData.general.optimal / analyticsData.general.total} intent={Intent.SUCCESS} />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px' }}>Baseline</span>
                  <NumericInput
                    value={analyticsData.general.baseline}
                    readOnly
                    small
                    style={{ width: '60px' }}
                  />
                </div>
                <ProgressBar value={analyticsData.general.baseline / analyticsData.general.total} intent={Intent.WARNING} />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px' }}>Suboptimal</span>
                  <NumericInput
                    value={analyticsData.general.suboptimal}
                    readOnly
                    small
                    style={{ width: '60px' }}
                  />
                </div>
                <ProgressBar value={analyticsData.general.suboptimal / analyticsData.general.total} intent={Intent.DANGER} />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px' }}>Manual</span>
                  <NumericInput
                    value={analyticsData.general.manual}
                    readOnly
                    small
                    style={{ width: '60px' }}
                  />
                </div>
                <ProgressBar value={analyticsData.general.manual / analyticsData.general.total} />
              </div>
            </Card>

            {/* Cumulative Matches */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <H5 style={{ margin: 0 }}>Cumulative Matches</H5>
                <Button
                  small
                  minimal
                  icon={IconNames.DOWNLOAD}
                  text="Download"
                  onClick={() => handleDownloadChart('cumulative')}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px' }}>Optimal</span>
                  <NumericInput
                    value={analyticsData.cumulative.optimal}
                    readOnly
                    small
                    style={{ width: '60px' }}
                  />
                </div>
                <ProgressBar value={analyticsData.cumulative.optimal / analyticsData.cumulative.total} intent={Intent.SUCCESS} />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px' }}>Baseline</span>
                  <NumericInput
                    value={analyticsData.cumulative.baseline}
                    readOnly
                    small
                    style={{ width: '60px' }}
                  />
                </div>
                <ProgressBar value={analyticsData.cumulative.baseline / analyticsData.cumulative.total} intent={Intent.WARNING} />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px' }}>Suboptimal</span>
                  <NumericInput
                    value={analyticsData.cumulative.suboptimal}
                    readOnly
                    small
                    style={{ width: '60px' }}
                  />
                </div>
                <ProgressBar value={analyticsData.cumulative.suboptimal / analyticsData.cumulative.total} intent={Intent.DANGER} />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px' }}>Manual</span>
                  <NumericInput
                    value={analyticsData.cumulative.manual}
                    readOnly
                    small
                    style={{ width: '60px' }}
                  />
                </div>
                <ProgressBar value={analyticsData.cumulative.manual / analyticsData.cumulative.total} />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px' }}>Cumulative</span>
                  <NumericInput
                    value={analyticsData.cumulative.cumulative}
                    readOnly
                    small
                    style={{ width: '60px' }}
                  />
                </div>
                <ProgressBar value={analyticsData.cumulative.cumulative / analyticsData.cumulative.total} intent={Intent.PRIMARY} />
              </div>
            </Card>
          </div>

          {/* Right Section - Audit Log */}
          <Card>
            <H5>Audit Log</H5>
            <Divider className="bp4-margin-bottom" />
            <Table numRows={auditLogData.length} enableRowHeader={false}>
              <Column name="SCC #" cellRenderer={sccCellRenderer} />
              <Column name="Action" cellRenderer={actionCellRenderer} />
              <Column name="Date" cellRenderer={dateCellRenderer} />
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
