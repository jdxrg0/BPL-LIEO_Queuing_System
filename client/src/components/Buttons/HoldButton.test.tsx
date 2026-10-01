import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HoldButton from './HoldButton';

describe('HoldButton Component', () => {
  const mockColorMap = { bg: '#eee', main: '#f00' };

  it('renders the tooltip properly', () => {
    render(
      <HoldButton 
        onClick={vi.fn()} 
        icon={<div data-testid="mock-icon" />} 
        colorMap={mockColorMap} 
        tooltip="Hold me"
      />
    );
    expect(screen.getByTitle('Hold me')).toBeInTheDocument();
  });

  it('triggers onClick only after holding for the specified holdTime', async () => {
    const onClickMock = vi.fn();
    render(
      <HoldButton 
        onClick={onClickMock} 
        icon={<div />} 
        colorMap={mockColorMap} 
        holdTime={200}
        tooltip="Test Hold"
      />
    );

    const button = screen.getByTitle('Test Hold');

    // Trigger mousedown (start holding)
    fireEvent.mouseDown(button);

    // After 100ms, it should NOT have fired yet
    await new Promise((r) => setTimeout(r, 100));
    expect(onClickMock).not.toHaveBeenCalled();

    // After another 150ms (total 250ms), it SHOULD have fired
    await new Promise((r) => setTimeout(r, 150));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('cancels the click if the mouse is released too early', async () => {
    const onClickMock = vi.fn();
    render(
      <HoldButton 
        onClick={onClickMock} 
        icon={<div />} 
        colorMap={mockColorMap} 
        holdTime={300}
        tooltip="Test Hold Cancel"
      />
    );

    const button = screen.getByTitle('Test Hold Cancel');

    // Hold it
    fireEvent.mouseDown(button);

    // Wait 100ms
    await new Promise((r) => setTimeout(r, 100));
    
    // Let go too early!
    fireEvent.mouseUp(button);

    // Wait until past the original holdTime
    await new Promise((r) => setTimeout(r, 250));

    // It should NEVER have been called because we let go
    expect(onClickMock).not.toHaveBeenCalled();
  });
});
