const Anthropic = require('@anthropic-ai/sdk');

async function generateFromClaude(apiKey, model, prompt, maxTokens = 1500, system = undefined) {
  if (!apiKey) throw new Error('CLAUDE_API_KEY is not configured');

  const client = new Anthropic({ apiKey });

  const params = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  };
  if (system) params.system = system;

  const response = await client.messages.create(params);

  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

module.exports = { generateFromClaude };
