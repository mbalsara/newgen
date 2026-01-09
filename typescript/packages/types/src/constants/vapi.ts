/**
 * VAPI Provider and Model Configuration
 * Based on VAPI's supported integrations
 * https://docs.vapi.ai/
 */

// Model providers supported by VAPI (matching VAPI's UI)
export const MODEL_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', icon: 'openai' },
  { id: 'azure-openai', name: 'Azure OpenAI', icon: 'azure' },
  { id: 'anthropic', name: 'Anthropic', icon: 'anthropic' },
  { id: 'google', name: 'Google', icon: 'google' },
  { id: 'groq', name: 'Groq', icon: 'groq' },
  { id: 'cerebras', name: 'Cerebras', icon: 'cerebras' },
  { id: 'deepseek', name: 'DeepSeek', icon: 'deepseek' },
  { id: 'xai', name: 'xAI', icon: 'xai' },
  { id: 'mistral', name: 'Mistral', icon: 'mistral' },
  { id: 'perplexity-ai', name: 'Perplexity AI', icon: 'perplexity' },
  { id: 'together-ai', name: 'Together AI', icon: 'together' },
  { id: 'anyscale', name: 'Anyscale', icon: 'anyscale' },
  { id: 'openrouter', name: 'OpenRouter', icon: 'openrouter' },
  { id: 'deepinfra', name: 'DeepInfra', icon: 'deepinfra' },
  { id: 'custom-llm', name: 'Custom LLM', icon: 'custom' },
] as const

// Model info type
export interface ModelInfo {
  id: string
  name: string
  latency?: string
  price?: string
  tags?: ('Multimodal' | 'Standard' | 'Latest' | 'New' | 'Fast' | 'Vision')[]
}

// Models by provider (comprehensive list matching VAPI)
export const MODELS_BY_PROVIDER: Record<string, ModelInfo[]> = {
  openai: [
    { id: 'gpt-5.2', name: 'GPT 5.2', latency: '1350ms', price: '$0.08', tags: ['Multimodal', 'Standard', 'Latest'] },
    { id: 'gpt-5.2-instant', name: 'GPT 5.2 Instant', latency: '700ms', price: '$0.08', tags: ['Standard', 'Latest', 'Fast'] },
    { id: 'gpt-5.1', name: 'GPT 5.1', latency: '1350ms', price: '$0.08', tags: ['Multimodal', 'Standard'] },
    { id: 'gpt-5.1-instant', name: 'GPT 5.1 Instant', latency: '700ms', price: '$0.08', tags: ['Standard', 'Fast'] },
    { id: 'gpt-5', name: 'GPT 5', latency: '1550ms', price: '$0.08', tags: ['Standard'] },
    { id: 'gpt-4o', name: 'GPT-4o', latency: '800ms', price: '$0.05', tags: ['Multimodal'] },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', latency: '500ms', price: '$0.01', tags: ['Fast'] },
    { id: 'gpt-4o-realtime', name: 'GPT-4o Realtime', latency: '300ms', price: '$0.10', tags: ['New', 'Fast'] },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', latency: '1200ms', price: '$0.03' },
    { id: 'gpt-4', name: 'GPT-4', latency: '1500ms', price: '$0.06' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', latency: '600ms', price: '$0.002', tags: ['Fast'] },
  ],
  'azure-openai': [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', tags: ['Latest'] },
    { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet (Jun 2024)' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', tags: ['Fast'] },
  ],
  google: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tags: ['New', 'Fast'] },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', tags: ['New', 'Fast'] },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro Latest', tags: ['Latest'] },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', tags: ['Fast'] },
    { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash Latest', tags: ['Fast'] },
    { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro' },
    { id: 'gemini-pro', name: 'Gemini Pro' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B', tags: ['New'] },
    { id: 'llama-3.2-90b-vision-preview', name: 'LLaMA 3.2 90B Vision', tags: ['Vision'] },
    { id: 'llama-3.2-11b-vision-preview', name: 'LLaMA 3.2 11B Vision', tags: ['Vision'] },
    { id: 'llama-3.1-70b-versatile', name: 'LLaMA 3.1 70B' },
    { id: 'llama-3.1-8b-instant', name: 'LLaMA 3.1 8B Instant', tags: ['Fast'] },
    { id: 'llama3-70b-8192', name: 'LLaMA 3 70B' },
    { id: 'llama3-8b-8192', name: 'LLaMA 3 8B', tags: ['Fast'] },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
  ],
  cerebras: [
    { id: 'llama3.1-70b', name: 'LLaMA 3.1 70B' },
    { id: 'llama3.1-8b', name: 'LLaMA 3.1 8B', tags: ['Fast'] },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat' },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', tags: ['New'] },
  ],
  xai: [
    { id: 'grok-2', name: 'Grok 2' },
    { id: 'grok-2-mini', name: 'Grok 2 Mini' },
    { id: 'grok-beta', name: 'Grok Beta' },
  ],
  mistral: [
    { id: 'mistral-large-latest', name: 'Mistral Large' },
    { id: 'mistral-medium-latest', name: 'Mistral Medium' },
    { id: 'mistral-small-latest', name: 'Mistral Small' },
    { id: 'open-mixtral-8x22b', name: 'Mixtral 8x22B' },
    { id: 'open-mixtral-8x7b', name: 'Mixtral 8x7B' },
    { id: 'open-mistral-7b', name: 'Mistral 7B' },
    { id: 'codestral-latest', name: 'Codestral' },
  ],
  'perplexity-ai': [
    { id: 'llama-3.1-sonar-large-128k-online', name: 'Sonar Large 128K (Online)' },
    { id: 'llama-3.1-sonar-small-128k-online', name: 'Sonar Small 128K (Online)' },
    { id: 'llama-3.1-sonar-large-128k-chat', name: 'Sonar Large 128K (Chat)' },
    { id: 'llama-3.1-sonar-small-128k-chat', name: 'Sonar Small 128K (Chat)' },
  ],
  'together-ai': [
    { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', name: 'LLaMA 3.1 405B Turbo' },
    { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', name: 'LLaMA 3.1 70B Turbo' },
    { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', name: 'LLaMA 3.1 8B Turbo' },
    { id: 'mistralai/Mixtral-8x22B-Instruct-v0.1', name: 'Mixtral 8x22B' },
    { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B' },
    { id: 'Qwen/Qwen2-72B-Instruct', name: 'Qwen 2 72B' },
  ],
  anyscale: [
    { id: 'meta-llama/Meta-Llama-3-70B-Instruct', name: 'LLaMA 3 70B' },
    { id: 'meta-llama/Meta-Llama-3-8B-Instruct', name: 'LLaMA 3 8B' },
    { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B' },
    { id: 'mistralai/Mistral-7B-Instruct-v0.1', name: 'Mistral 7B' },
  ],
  openrouter: [
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro' },
    { id: 'meta-llama/llama-3.1-405b-instruct', name: 'LLaMA 3.1 405B' },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'LLaMA 3.1 70B' },
  ],
  deepinfra: [
    { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct', name: 'LLaMA 3.1 405B' },
    { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct', name: 'LLaMA 3.1 70B' },
    { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct', name: 'LLaMA 3.1 8B' },
    { id: 'mistralai/Mixtral-8x22B-Instruct-v0.1', name: 'Mixtral 8x22B' },
    { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B' },
  ],
  'custom-llm': [
    { id: 'custom', name: 'Custom Endpoint' },
  ],
}

// Voice providers supported by VAPI
export const VOICE_PROVIDERS = [
  { id: '11labs', name: 'ElevenLabs', icon: 'elevenlabs' },
  { id: 'azure', name: 'Azure', icon: 'azure' },
  { id: 'cartesia', name: 'Cartesia', icon: 'cartesia' },
  { id: 'deepgram', name: 'Deepgram', icon: 'deepgram' },
  { id: 'lmnt', name: 'LMNT', icon: 'lmnt' },
  { id: 'openai', name: 'OpenAI', icon: 'openai' },
  { id: 'playht', name: 'PlayHT', icon: 'playht' },
  { id: 'rime-ai', name: 'Rime AI', icon: 'rime' },
] as const

// Voice speed range (VAPI standard)
export const VOICE_SPEED = {
  min: 0.5,
  max: 2.0,
  default: 0.9,
  step: 0.05,
} as const

// Common voice speed presets
export const VOICE_SPEED_PRESETS = [
  { value: 0.7, label: 'Slow' },
  { value: 0.85, label: 'Relaxed' },
  { value: 0.9, label: 'Normal' },
  { value: 1.0, label: 'Default' },
  { value: 1.1, label: 'Brisk' },
  { value: 1.25, label: 'Fast' },
] as const

// Provider icons as simple SVG components or emoji fallbacks
export const PROVIDER_ICONS: Record<string, string> = {
  openai: '🟢',
  azure: '🔷',
  anthropic: '🟠',
  google: '🔵',
  groq: '🟡',
  cerebras: '🟣',
  deepseek: '🔮',
  xai: '⚡',
  mistral: '🟧',
  perplexity: '🌐',
  together: '🤝',
  anyscale: '📊',
  openrouter: '🔀',
  deepinfra: '🏗️',
  custom: '⚙️',
  elevenlabs: '🎙️',
  cartesia: '🗣️',
  deepgram: '🎧',
  lmnt: '🔊',
  playht: '▶️',
  rime: '🎤',
}
