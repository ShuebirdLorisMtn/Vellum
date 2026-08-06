const Anthropic = require('@anthropic-ai/sdk');

// Models that support the server-side refusal-fallback beta.
const FALLBACK_MODELS = /^claude-(opus-5|fable-5)/;

/**
 * Generate a document from Claude.
 *
 * @param {string} apiKey  Anthropic API key (CLAUDE_API_KEY)
 * @param {string} model   Model ID, e.g. "claude-opus-5"
 * @param {string} prompt  The user's document prompt
 * @param {number} maxTokens
 * @param {string} [system]  Optional system prompt
 * @returns {Promise<string>} The generated document text
 */
async function generateFromClaude(apiKey, model, prompt, maxTokens = 1500, system = undefined) {
  if (!apiKey) throw new Error('CLAUDE_API_KEY is not configured');

  const client = new Anthropic({ apiKey });

  const params = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  };
  if (system) params.system = system;

  let response;
  if (FALLBACK_MODELS.test(model)) {
    // Opus 5 safety classifiers can decline a request (stop_reason "refusal").
    // fallbacks: "default" re-runs a declined request on Anthropic's
    // recommended substitute model server-side instead of failing the call.
    response = await client.beta.messages.create({
      ...params,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
  } else {
    response = await client.messages.create(params);
  }

  if (response.stop_reason === 'refusal') {
    const err = new Error('claude_refused');
    err.code = 'claude_refused';
    throw err;
  }

  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

module.exports = { generateFromClaude };
