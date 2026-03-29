import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Input } from '../ui/input';
import { Surface } from '../ui/surface';

export type LlmColorTheme = 'neutral';

interface LlmSettingsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  model: string;
  onModelChange: (model: string) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
  colorTheme: LlmColorTheme;
  toggleLabel?: string;
  toggleLabelOpen?: string;
  modelInputId?: string;
  temperatureInputId?: string;
  settingsPanelTestId: string;
  sidebarTestId: string;
  toggleTestId: string;
  showThinkingControl?: boolean;
  think?: boolean;
  onThinkChange?: (think: boolean) => void;
  extraContent?: ReactNode;
  maxHeight?: string;
}

const themeClasses = {
  neutral: {
    icon: 'text-slate-700',
    accent: 'accent-slate-700',
    checkbox: 'text-slate-700 focus:ring-slate-400',
    toggleActive: 'bg-slate-900 text-stone-50 hover:bg-slate-800',
  },
};

export function LlmSettingsPanel({
  isOpen,
  onToggle,
  model,
  onModelChange,
  temperature,
  onTemperatureChange,
  colorTheme,
  toggleLabel = 'Settings',
  toggleLabelOpen = 'Hide Settings',
  modelInputId = 'model',
  temperatureInputId = 'temperature',
  settingsPanelTestId,
  sidebarTestId,
  toggleTestId,
  showThinkingControl = false,
  think = false,
  onThinkChange,
  extraContent,
  maxHeight = '500px',
}: LlmSettingsPanelProps) {
  const theme = themeClasses[colorTheme];
  const gridCols = showThinkingControl ? 'sm:grid-cols-3' : 'sm:grid-cols-2';

  return (
    <>
      <div
        className={clsx(
          'overflow-hidden transition-all duration-300',
          isOpen ? `max-h-[${maxHeight}] opacity-100` : 'max-h-0 opacity-0'
        )}
        style={{ maxHeight: isOpen ? maxHeight : 0 }}
        aria-hidden={!isOpen}
        data-testid={sidebarTestId}
      >
        <Surface variant="muted" padding="md" className="space-y-4" data-testid={settingsPanelTestId}>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <SettingsIcon className={theme.icon} />
            Generation Settings
          </div>
          <div className={clsx('grid gap-4', gridCols)}>
            <div className="space-y-1.5" data-testid="model-selection">
              <label htmlFor={modelInputId} className="block text-xs font-medium text-slate-600" data-testid="model-label">
                Model
              </label>
              <Input
                id={modelInputId}
                type="text"
                className="h-10 rounded-[1.1rem] bg-white/92"
                value={model}
                onChange={(e) => onModelChange(e.target.value)}
                placeholder="Enter model name"
                data-testid="model-input"
              />
            </div>

            <div className="space-y-1.5" data-testid="temperature-control">
              <label htmlFor={temperatureInputId} className="block text-xs font-medium text-slate-600" data-testid="temperature-label">
                Temperature: {temperature.toFixed(2)}
              </label>
              <input
                id={temperatureInputId}
                type="range"
                min="0"
                max="1"
                step="0.1"
                className={clsx('mt-2 w-full', theme.accent)}
                value={temperature}
                onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
                data-testid="temperature-slider"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span data-testid="temperature-focused">Focused</span>
                <span data-testid="temperature-creative">Creative</span>
              </div>
            </div>

            {showThinkingControl && onThinkChange && (
              <div className="flex items-center" data-testid="thinking-control">
                <label className="flex cursor-pointer items-center gap-2 rounded-[1.1rem] border border-stone-200 bg-stone-50 px-3 py-2 transition-colors hover:bg-white" data-testid="thinking-label">
                  <input
                    type="checkbox"
                    checked={think}
                    onChange={(e) => onThinkChange(e.target.checked)}
                    className={clsx('h-4 w-4 rounded border-slate-300', theme.checkbox)}
                    data-testid="thinking-checkbox"
                  />
                  <div className="flex items-center gap-1.5">
                    <ThinkingIcon />
                    <span className="text-xs font-medium text-slate-700">Thinking</span>
                  </div>
                </label>
              </div>
            )}
          </div>
          {extraContent}
        </Surface>
      </div>

      <SettingsToggleButton
        isOpen={isOpen}
        onToggle={onToggle}
        label={toggleLabel}
        labelOpen={toggleLabelOpen}
        colorTheme={colorTheme}
        testId={toggleTestId}
      />
    </>
  );
}

interface SettingsToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  label: string;
  labelOpen: string;
  colorTheme: LlmColorTheme;
  testId: string;
}

export function SettingsToggleButton({
  isOpen,
  onToggle,
  label,
  labelOpen,
  colorTheme,
  testId,
}: SettingsToggleButtonProps) {
  const theme = themeClasses[colorTheme];

  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        isOpen
          ? theme.toggleActive
          : 'border-stone-200 bg-white/85 text-slate-600 hover:bg-white hover:text-slate-900'
      )}
      data-testid={testId}
    >
      <SettingsIcon className="h-3.5 w-3.5" />
      {isOpen ? labelOpen : label}
      {isOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
    </button>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={clsx('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ThinkingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55 1 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.86-3.14-7-7-7z" />
    </svg>
  );
}
