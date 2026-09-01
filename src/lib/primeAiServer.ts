import https from 'https';
import http from 'http';

const PRIME_AI_CONNECT_TIMEOUT_MS = 60_000;
// This route's own `export const maxDuration = 120` is the hard ceiling Next.js/the hosting
// platform enforces on the WHOLE request — if that's exceeded, the platform kills the
// function mid-response, and the browser receives a truncated body (`SyntaxError: Unexpected
// end of JSON input` when it tries to JSON.parse it). The previous values here (180s timeout,
// 3 retries) could never respect that ceiling: a single attempt could already run 60s past
// maxDuration, and retrying an attempt that just spent its full timeout budget only guarantees
// blowing it further. 100s leaves ~20s of the 120s budget for the retry decision + response
// write; retries below are also restricted to fast connection failures, never to a timeout
// (see isRetryableFetchError) — retrying something that already consumed 100s can't possibly
// finish inside the remaining budget.
const PRIME_AI_REQUEST_TIMEOUT_MS = 100_000;
const MAX_RETRIES = 2;

const httpsAgent = new https.Agent({
  keepAlive: true,
  timeout: PRIME_AI_CONNECT_TIMEOUT_MS,
});

const httpAgent = new http.Agent({
  keepAlive: true,
  timeout: PRIME_AI_CONNECT_TIMEOUT_MS,
});

function getPrimeAiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_PRIME_AI_API_URL || 'https://prime-ai-bndr.onrender.com';
}

function isRetryableFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  // Deliberately excludes "timed out"/ETIMEDOUT: a timeout means the attempt already
  // consumed its full PRIME_AI_REQUEST_TIMEOUT_MS budget, so retrying it can only push the
  // total request time further past this route's maxDuration, not recover anything. Only
  // fast, connection-level failures (refused/reset before or shortly after the request
  // started) are worth retrying — those fail in milliseconds, not after the full timeout.
  const cause = error.cause as { code?: string } | undefined;
  return (
    error.message.includes('fetch failed') ||
    error.message.includes('ECONNRESET') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ended prematurely') ||
    cause?.code === 'UND_ERR_SOCKET' ||
    cause?.code === 'ECONNRESET' ||
    cause?.code === 'ECONNREFUSED'
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
    
    // Use http for localhost, https for production
    const isHttps = parsedUrl.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    const agent = isHttps ? httpsAgent : httpAgent;
    const defaultPort = isHttps ? 443 : 80;

    const request = httpModule.request(
      {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || defaultPort,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method: 'POST',
        agent: agent,
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
          // `response.complete` is Node's own signal that the full HTTP message (including
          // the chunked-encoding terminator, or the declared Content-Length) was actually
          // received — `false` here means the underlying socket closed before the body
          // finished arriving (e.g. the backend process was killed/restarted mid-response).
          // Treating that case as a normal "successful" response was the root cause of
          // `SyntaxError: Unexpected end of JSON input` reaching the browser: the caller only
          // ever found out when it later called .json() on a body that looked complete
          // (status 200, `end` fired) but silently wasn't — by then it's too late to retry
          // and too far from here to log anything useful. Reject it here instead, as a
          // clearly-labeled, retryable network error.
          if (!response.complete) {
            reject(
              new Error(
                `Prime AI response ended prematurely (connection closed before the body finished) — received ${Buffer.concat(chunks).length} bytes`,
              ),
            );
            return;
          }

          const text = Buffer.concat(chunks).toString('utf8');
          const status = response.statusCode ?? 500;

          resolve({
            ok: status >= 200 && status < 300,
            status,
            text: async () => text,
            json: async () => {
              try {
                return JSON.parse(text);
              } catch (parseError) {
                // A genuinely complete response (response.complete === true, checked above)
                // that still isn't valid JSON is a real backend bug, not a network hiccup —
                // surface enough of the body to diagnose it instead of the bare SyntaxError.
                const preview = text.slice(0, 300);
                throw new Error(
                  `Prime AI returned a complete but non-JSON response (status ${status}): ${preview}${text.length > 300 ? '…' : ''}`,
                  { cause: parseError },
                );
              }
            },
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
