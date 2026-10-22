/** Presentation sections over the frozen AIAgent draft spec; no execution policy is inferred here. */
export const agentSections = [
  {
    key: 'connection',
    title: 'Connection and model',
    keys: ['connection_ref', 'provider_key', 'model_id'],
  },
  {
    key: 'instructions',
    title: 'Instructions and decision',
    keys: ['instructions', 'prompt_version', 'decision'],
  },
  {
    key: 'data',
    title: 'Permitted data',
    keys: ['data_policy', 'field_classifications'],
  },
  { key: 'limits', title: 'Usage limits', keys: ['user_limits'] },
] as const;
