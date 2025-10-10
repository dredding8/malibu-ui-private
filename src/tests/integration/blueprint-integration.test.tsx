import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, Card, Tag, ProgressBar, Icon, Callout, Intent } from '@blueprintjs/core';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';

describe('Blueprint.js Integration Test Suite', () => {
  describe('Core Components', () => {
    it('renders Button component with correct styling', () => {
      render(
        <Button intent={Intent.PRIMARY} icon="add" text="Click me" />
      );
      
      const button = screen.getByText('Click me');
      expect(button).toBeInTheDocument();
      expect(button.closest('button')).toHaveClass('bp6-button');
      expect(button.closest('button')).toHaveClass('bp6-intent-primary');
    });

    it('renders Card component with elevation', () => {
      render(
        <Card elevation={2}>
          <h4>Card Title</h4>
          <p>Card content</p>
        </Card>
      );
      
      const card = screen.getByText('Card Title').closest('.bp6-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bp6-elevation-2');
    });

    it('renders Tag component with intent', () => {
      render(
        <Tag intent={Intent.SUCCESS} large>
          Success Tag
        </Tag>
      );
      
      const tag = screen.getByText('Success Tag').closest('.bp6-tag');
      expect(tag).toBeInTheDocument();
      expect(tag).toHaveClass('bp6-intent-success');
      expect(tag).toHaveClass('bp6-large');
    });

    it('renders ProgressBar with correct value', () => {
      render(
        <ProgressBar intent={Intent.PRIMARY} value={0.7} />
      );
      
      const progressBar = document.querySelector('.bp6-progress-bar');
      expect(progressBar).toBeInTheDocument();
      
      const progressMeter = progressBar?.querySelector('.bp6-progress-meter');
      expect(progressMeter).toHaveStyle({ width: '70%' });
    });

    it('renders Callout with icon and intent', () => {
      render(
        <Callout intent={Intent.WARNING} icon="warning-sign">
          This is a warning message
        </Callout>
      );
      
      const callout = screen.getByText('This is a warning message').closest('.bp6-callout');
      expect(callout).toBeInTheDocument();
      expect(callout).toHaveClass('bp6-intent-warning');
      
      const icon = callout?.querySelector('.bp6-icon-warning-sign');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Interactive Components', () => {
    it('handles Button click events', () => {
      const handleClick = jest.fn();
      render(
        <Button onClick={handleClick} text="Click me" />
      );
      
      fireEvent.click(screen.getByText('Click me'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables Button when specified', () => {
      render(
        <Button disabled text="Disabled Button" />
      );
      
      const button = screen.getByText('Disabled Button').closest('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('bp6-disabled');
    });

    it('shows loading state on Button', () => {
      render(
        <Button loading text="Loading..." />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bp6-loading');
      
      const spinner = button.querySelector('.bp6-spinner');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Styling and Theming', () => {
    it('applies minimal style to components', () => {
      render(
        <>
          <Button minimal text="Minimal Button" />
          <Tag minimal>Minimal Tag</Tag>
        </>
      );
      
      const button = screen.getByText('Minimal Button').closest('button');
      expect(button).toHaveClass('bp6-minimal');
      
      const tag = screen.getByText('Minimal Tag').closest('.bp6-tag');
      expect(tag).toHaveClass('bp6-minimal');
    });

    it('renders large variants of components', () => {
      render(
        <>
          <Button large text="Large Button" />
          <Tag large>Large Tag</Tag>
        </>
      );
      
      const button = screen.getByText('Large Button').closest('button');
      expect(button).toHaveClass('bp6-large');
      
      const tag = screen.getByText('Large Tag').closest('.bp6-tag');
      expect(tag).toHaveClass('bp6-large');
    });
  });

  describe('Intent System', () => {
    const intents = [
      { intent: Intent.PRIMARY, className: 'bp6-intent-primary' },
      { intent: Intent.SUCCESS, className: 'bp6-intent-success' },
      { intent: Intent.WARNING, className: 'bp6-intent-warning' },
      { intent: Intent.DANGER, className: 'bp6-intent-danger' },
    ];

    intents.forEach(({ intent, className }) => {
      it(`applies ${intent} intent correctly`, () => {
        render(
          <>
            <Button intent={intent} text={`${intent} Button`} />
            <Tag intent={intent}>{intent} Tag</Tag>
            <Callout intent={intent}>{intent} Callout</Callout>
          </>
        );
        
        const button = screen.getByText(`${intent} Button`).closest('button');
        expect(button).toHaveClass(className);
        
        const tag = screen.getByText(`${intent} Tag`).closest('.bp6-tag');
        expect(tag).toHaveClass(className);
        
        const callout = screen.getByText(`${intent} Callout`).closest('.bp6-callout');
        expect(callout).toHaveClass(className);
      });
    });
  });

  describe('Icon Integration', () => {
    it('renders icons in buttons', () => {
      render(
        <Button icon="add" rightIcon="arrow-right" text="Button with Icons" />
      );
      
      const button = screen.getByText('Button with Icons').closest('button');
      expect(button?.querySelector('.bp6-icon-add')).toBeInTheDocument();
      expect(button?.querySelector('.bp6-icon-arrow-right')).toBeInTheDocument();
    });

    it('renders standalone icons', () => {
      render(
        <Icon icon="info-sign" intent={Intent.PRIMARY} size={20} />
      );
      
      const icon = document.querySelector('.bp6-icon-info-sign');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('bp6-intent-primary');
    });
  });

  describe('Accessibility', () => {
    it('maintains proper ARIA attributes', () => {
      render(
        <Button 
          intent={Intent.PRIMARY}
          text="Accessible Button"
          aria-label="Primary action button"
        />
      );
      
      const button = screen.getByRole('button', { name: 'Primary action button' });
      expect(button).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      const handleClick = jest.fn();
      render(
        <Button onClick={handleClick} text="Keyboard Button" />
      );
      
      const button = screen.getByText('Keyboard Button');
      button.focus();
      
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
      
      handleClick.mockClear();
      fireEvent.keyDown(button, { key: ' ' });
      expect(handleClick).toHaveBeenCalled();
    });
  });
});