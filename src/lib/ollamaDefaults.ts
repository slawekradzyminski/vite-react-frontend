export const BONSAI_MODEL = 'hf.co/prism-ml/Bonsai-27B-gguf:Q1_0';

export const DEFAULT_OLLAMA_MODEL =
  import.meta.env.VITE_DEFAULT_OLLAMA_MODEL?.trim() || BONSAI_MODEL;

export const DEFAULT_OLLAMA_MODEL_LABEL =
  DEFAULT_OLLAMA_MODEL === BONSAI_MODEL ? 'Bonsai 27B · 1-bit' : DEFAULT_OLLAMA_MODEL;
