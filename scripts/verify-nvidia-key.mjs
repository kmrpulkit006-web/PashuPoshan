import fs from 'fs';
import path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
let apiKey = process.env.NVIDIA_API_KEY;

if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('NVIDIA_API_KEY=')) {
      apiKey = trimmed.substring('NVIDIA_API_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
      break;
    }
  }
}

console.log('--- PashuPoshan AI: NVIDIA NIM Key Diagnostic ---');

if (!apiKey) {
  console.log('Status: [NOT FOUND]');
  console.log('Reason: NVIDIA_API_KEY is not set in process.env or .env.local.');
  console.log('Action needed:');
  console.log('  1. In local dev: Create a .env.local file in the project root containing:');
  console.log('     NVIDIA_API_KEY=nvapi-your-key-here');
  console.log('  2. In production: Add NVIDIA_API_KEY in your Vercel Project Settings > Environment Variables.');
  console.log('Current behavior: System automatically operates in ICAR-NDRI scientific fallback mode.');
  process.exit(0);
}

const maskedKey = apiKey.length > 12 
  ? apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4)
  : '***';

console.log(`Status: [FOUND]`);
console.log(`Key: ${maskedKey}`);
console.log('Testing live connectivity to NVIDIA NIM (Nemotron-3-Ultra-550B)...');

try {
  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.NVIDIA_MODEL_ID || 'nvidia/nemotron-3-ultra-550b-a55b',
      messages: [{ role: 'user', content: 'Say OK' }],
      max_tokens: 5,
    }),
  });

  if (res.status === 200) {
    const data = await res.json();
    console.log('Live Connection: [SUCCESS - 200 OK]');
    console.log('Model: ' + (data.model || 'nvidia/nemotron-3-ultra-550b-a55b'));
    console.log('Nemotron Response: ' + (data.choices?.[0]?.message?.content || '').trim());
  } else if (res.status === 401) {
    console.log('Live Connection: [FAILED - 401 Unauthorized]');
    console.log('Reason: The API key provided in .env.local is invalid or expired.');
  } else {
    const errText = await res.text();
    console.log(`Live Connection: [FAILED - ${res.status}] ${errText}`);
  }
} catch (err) {
  console.log('Live Connection: [NETWORK ERROR] ' + err.message);
}
