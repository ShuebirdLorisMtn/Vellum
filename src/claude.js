const fetch = global.fetch || ((...args) => import('node-fetch').then(m => m.default(...args)));
const CLAUDE_API_BASE = 'https://api.anthropic.com';

async function generateFromClaude(apiKey, model, prompt, max_tokens = 1500) {
  // This is a thin wrapper — verify Anthropic endpoint/params for the model you choose.
  const url = `${CLAUDE_API_BASE}/v1/complete`;
  const body = {
    model: model,
    prompt: prompt,
    max_tokens_to_sample: max_tokens,
    temperature: 0.2,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Claude API error: ${res.status} ${txt}`);
  }
  const data = await res.json();
  // Anthropic responses vary by model; adapt if needed.
  return data.completion || data.output || (data.choices && data.choices[0] && data.choices[0].text) || JSON.stringify(data);
}

module.exports = { generateFromClaude };
