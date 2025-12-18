import { useCallback, useState } from 'react';

interface OllamaParamsDefaults {
  model: string;
  temperature: number;
  think?: boolean;
}

export function useOllamaParams(defaults: OllamaParamsDefaults) {
  const [model, setModel] = useState(defaults.model);
  const [temperature, setTemperature] = useState(defaults.temperature);
  const [think, setThink] = useState(defaults.think ?? false);

  return {
    model,
    setModel,
    temperature,
    setTemperature,
    think,
    setThink,
  };
}

export function useInFlightRequest(initialState = false) {
  const [inFlight, setInFlight] = useState(initialState);

  const start = useCallback((onBusy?: () => void) => {
    if (inFlight) {
      onBusy?.();
      return false;
    }

    setInFlight(true);
    return true;
  }, [inFlight]);

  const stop = useCallback(() => {
    setInFlight(false);
  }, []);

  return {
    inFlight,
    start,
    stop,
  };
}
