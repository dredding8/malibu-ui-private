import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  FormGroup,
  InputGroup,
  H3,
  H5,
  Divider,
  Intent,
  TextArea,
  Callout,
  HTMLSelect,
  Breadcrumbs
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import AppNavbar from '../components/AppNavbar';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const AddSCC: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sccNumber: '',
    priority: '',
    function: '',
    orbit: '',
    periodicity: '',
    collectionType: '',
    classification: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.sccNumber.trim()) {
      newErrors.sccNumber = 'SCC Number is required';
    }
    if (!formData.priority.trim()) {
      newErrors.priority = 'Priority is required';
    }
    if (!formData.function.trim()) {
      newErrors.function = 'Function is required';
    }
    if (!formData.orbit.trim()) {
      newErrors.orbit = 'Orbit is required';
    }
    if (!formData.periodicity.trim()) {
      newErrors.periodicity = 'Periodicity is required';
    }
    if (!formData.collectionType.trim()) {
      newErrors.collectionType = 'Collection Type is required';
    }
    if (!formData.classification.trim()) {
      newErrors.classification = 'Classification is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    // Simulate API call to save SCC
    setTimeout(() => {
      setIsSaving(false);
      navigate('/sccs');
    }, 1500);
  };

  const handleCancel = () => {
    navigate('/sccs');
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onEscape: () => navigate('/sccs'),
  });

  return (
    <div className="add-scc">
      {/* Header */}
      <AppNavbar />

      {/* Breadcrumbs */}
      <div style={{ 
        padding: '16px 24px 0 24px',
        maxWidth: '1200px',
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
              text: 'SCCs',
              icon: IconNames.CUBE,
              onClick: () => navigate('/sccs')
            },
            {
              text: 'Add SCC',
              icon: IconNames.PLUS,
              current: true
            }
          ]}
        />
      </div>

      {/* Main Content */}
      <div className="add-scc-content" style={{ 
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto' 
      }}>
        <H3>Add New SCC</H3>
        
        <Card>
          <H5>SCC Information</H5>
          <Divider className="bp4-margin-bottom" />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <FormGroup 
              label="SCC Number" 
              labelFor="scc-number"
              intent={errors.sccNumber ? Intent.DANGER : Intent.NONE}
              helperText={errors.sccNumber}
            >
              <InputGroup
                id="scc-number"
                placeholder="Enter SCC number..."
                value={formData.sccNumber}
                onChange={(e) => handleInputChange('sccNumber', e.target.value)}
                intent={errors.sccNumber ? Intent.DANGER : Intent.NONE}
              />
            </FormGroup>

            <FormGroup 
              label="Priority" 
              labelFor="priority"
              intent={errors.priority ? Intent.DANGER : Intent.NONE}
              helperText={errors.priority}
            >
              <InputGroup
                id="priority"
                placeholder="Enter priority (1-999)"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                intent={errors.priority ? Intent.DANGER : Intent.NONE}
              />
            </FormGroup>

            <FormGroup 
              label="Function" 
              labelFor="function"
              intent={errors.function ? Intent.DANGER : Intent.NONE}
              helperText={errors.function}
            >
              <HTMLSelect
                id="function"
                value={formData.function}
                onChange={(e) => handleInputChange('function', e.currentTarget.value)}
                fill
              >
                <option value="">Select function...</option>
                <option value="ISR">ISR</option>
                <option value="COMM">COMM</option>
                <option value="NAV">NAV</option>
                <option value="MET">MET</option>
              </HTMLSelect>
            </FormGroup>

            <FormGroup 
              label="Orbit" 
              labelFor="orbit"
              intent={errors.orbit ? Intent.DANGER : Intent.NONE}
              helperText={errors.orbit}
            >
              <HTMLSelect
                id="orbit"
                value={formData.orbit}
                onChange={(e) => handleInputChange('orbit', e.currentTarget.value)}
                fill
              >
                <option value="">Select orbit...</option>
                <option value="LEO">LEO</option>
                <option value="MEO">MEO</option>
                <option value="GEO">GEO</option>
                <option value="HEO">HEO</option>
              </HTMLSelect>
            </FormGroup>

            <FormGroup 
              label="Periodicity" 
              labelFor="periodicity"
              intent={errors.periodicity ? Intent.DANGER : Intent.NONE}
              helperText={errors.periodicity}
            >
              <InputGroup
                id="periodicity"
                placeholder="Enter periodicity in hours"
                value={formData.periodicity}
                onChange={(e) => handleInputChange('periodicity', e.target.value)}
                intent={errors.periodicity ? Intent.DANGER : Intent.NONE}
              />
            </FormGroup>

            <FormGroup 
              label="Collection Type" 
              labelFor="collection-type"
              intent={errors.collectionType ? Intent.DANGER : Intent.NONE}
              helperText={errors.collectionType}
            >
              <HTMLSelect
                id="collection-type"
                value={formData.collectionType}
                onChange={(e) => handleInputChange('collectionType', e.currentTarget.value)}
                fill
              >
                <option value="">Select collection type...</option>
                <option value="Wideband">Wideband</option>
                <option value="Narrowband">Narrowband</option>
                <option value="Imagery">Imagery</option>
                <option value="Signals">Signals</option>
              </HTMLSelect>
            </FormGroup>

            <FormGroup 
              label="Classification" 
              labelFor="classification"
              intent={errors.classification ? Intent.DANGER : Intent.NONE}
              helperText={errors.classification}
            >
              <HTMLSelect
                id="classification"
                value={formData.classification}
                onChange={(e) => handleInputChange('classification', e.currentTarget.value)}
                fill
              >
                <option value="">Select classification...</option>
                <option value="S//REL FVEY">S//REL FVEY</option>
                <option value="S//NF">S//NF</option>
                <option value="S">S</option>
                <option value="U">U</option>
              </HTMLSelect>
            </FormGroup>
          </div>

          <FormGroup label="Notes" labelFor="notes">
            <TextArea
              id="notes"
              placeholder="Additional notes or comments..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              fill
            />
          </FormGroup>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <Button
              text="Cancel"
              onClick={handleCancel}
              disabled={isSaving}
            />
            <Button
              text="Save"
              intent={Intent.SUCCESS}
              loading={isSaving}
              onClick={handleSave}
            />
          </div>
        </Card>

        {isSaving && (
          <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} className="bp4-margin-top">
            Saving new SCC...
          </Callout>
        )}
      </div>
    </div>
  );
};

export default AddSCC;
