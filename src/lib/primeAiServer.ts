import https from 'https';

const PRIME_AI_CONNECT_TIMEOUT_MS = 60_000;
const PRIME_AI_REQUEST_TIMEOUT_MS = 120_000;
const MAX_RETRIES = 3;

const httpsAgent = new https.Agent({
  keepAlive: true,
  timeout: PRIME_AI_CONNECT_TIMEOUT_MS,
});

function getPrimeAiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_PRIME_AI_API_URL || 'https://prime-ai-bndr.onrender.com';
}

function isRetryableFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const cause = error.cause as { code?: string } | undefined;
  return (
    error.message.includes('fetch failed') ||
    error.message.includes('timed out') ||
    error.message.includes('ECONNRESET') ||
    error.message.includes('ETIMEDOUT') ||
    cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
    cause?.code === 'UND_ERR_SOCKET' ||
    cause?.code === 'ECONNRESET' ||
    cause?.code === 'ETIMEDOUT'
  );
}

function formatFetchError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);

  const cause = error.cause as { code?: string; message?: string } | undefined;
  if (cause?.code) {
    return `${error.message} (${cause.code}${cause.message ? `: ${cause.message}` : ''})`;
  }

  return error.message;
}

interface PrimeAIResponse {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
}

function postJson(url: string, body: Record<string, unknown>): Promise<PrimeAIResponse> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const payload = JSON.stringify(body);

    const request = https.request(
      {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method: 'POST',
        agent: httpsAgent,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          const status = response.statusCode ?? 500;

          resolve({
            ok: status >= 200 && status < 300,
            status,
            text: async () => text,
            json: async () => JSON.parse(text),
          });
        });
      },
    );

    request.setTimeout(PRIME_AI_REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error(`Prime AI request timed out after ${PRIME_AI_REQUEST_TIMEOUT_MS}ms`));
    });

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

export async function fetchPrimeAI(
  path: string,
  body: Record<string, unknown>,
): Promise<PrimeAIResponse> {
  const url = `${getPrimeAiBaseUrl()}${path}`;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await postJson(url, body);
    } catch (error) {
      lastError = error;

      if (attempt < MAX_RETRIES && isRetryableFetchError(error)) {
        const delayMs = attempt * 2000;
        console.warn(
          `⚠️ Prime AI fetch attempt ${attempt}/${MAX_RETRIES} failed (${formatFetchError(error)}), retrying in ${delayMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}
