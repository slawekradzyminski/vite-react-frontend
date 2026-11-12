import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LlmSettingsPanel } from './LlmSettingsPanel';

const renderPanel = (isOpen: boolean) => render(
  <LlmSettingsPanel
    isOpen={isOpen}
    onToggle={vi.fn()}
    colorTheme="neutral"
    toggleTestId="generate-sidebar-toggle"
    sidebarTestId="generate-sidebar"
    settingsPanelTestId="generate-settings"
    model="qwen3.5:2b"
    onModelChange={vi.fn()}
    temperature={0.4}
    onTemperatureChange={vi.fn()}
  />,
);

describe('LlmSettingsPanel', () => {
  it('takes collapsed settings out of the tab order and the accessibility tree (T-044)', () => {
    // given / when
    renderPanel(false);

    // then
    const sidebar = screen.getByTestId('generate-sidebar');
    expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    expect(sidebar).toHaveAttribute('inert');
  });

  it('keeps open settings interactive', () => {
    // given / when
    renderPanel(true);

    // then
    const sidebar = screen.getByTestId('generate-sidebar');
    expect(sidebar).not.toHaveAttribute('inert');
    expect(sidebar).toHaveAttribute('aria-hidden', 'false');
  });
});
