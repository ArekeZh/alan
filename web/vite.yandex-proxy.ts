import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { loadEnv } from 'vite';

const TTS_V3_URL = 'https://tts.api.ml.yandexcloud.kz/tts/v3/utteranceSynthesis';
const TTS_V1_URL = 'https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize';
const STT_V3_RECOGNIZE_URL = 'https://stt.api.ml.yandexcloud.kz/stt/v3/recognizeFileAsync';
const STT_V3_RESULT_URL = 'https://stt.api.ml.yandexcloud.kz/stt/v3/getRecognition';

function credentials(env: Record<string, string>) {
  const folderId =
    env.VITE_YANDEX_FOLDER_ID ||
    env.EXPO_PUBLIC_YANDEX_FOLDER_ID ||
    env.YANDEX_FOLDER_ID ||
    '';
  const apiKey =
    env.VITE_YANDEX_API_KEY ||
    env.EXPO_PUBLIC_YANDEX_API_KEY ||
    env.YANDEX_API_KEY ||
    '';

  return { folderId, apiKey };
}

function readBody(req: IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk as Buffer));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function pathnameOf(req: IncomingMessage) {
  const url = req.url ?? '';
  return url.split('?')[0] ?? '';
}

function queryOf(req: IncomingMessage) {
  const url = req.url ?? '';
  const index = url.indexOf('?');
  return index >= 0 ? url.slice(index) : '';
}

async function forwardToYandex(
  targetUrl: string,
  req: IncomingMessage,
  res: ServerResponse,
  env: Record<string, string>,
) {
  const { folderId, apiKey } = credentials(env);
  if (!folderId || !apiKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Yandex credentials are missing' }));
    return;
  }

  const method = req.method ?? 'GET';
  const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(req);
  const contentType = req.headers['content-type'] ?? 'application/json';

  const yandexResponse = await fetch(targetUrl, {
    method,
    headers: {
      Authorization: `Api-Key ${apiKey}`,
      'x-folder-id': folderId,
      'Content-Type': contentType,
    },
    body: body ? new Uint8Array(body) : undefined,
  });

  res.statusCode = yandexResponse.status;
  const responseType = yandexResponse.headers.get('content-type');
  if (responseType) {
    res.setHeader('Content-Type', responseType);
  }

  const payload = Buffer.from(await yandexResponse.arrayBuffer());
  res.end(payload);
}

function yandexMiddleware(env: Record<string, string>) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const pathname = pathnameOf(req);
    if (!pathname.startsWith('/api/yandex/')) {
      next();
      return;
    }

    void (async () => {
      if (pathname === '/api/yandex/ready') {
        const { folderId, apiKey } = credentials(env);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ready: folderId.length > 0 && apiKey.length > 0 }));
        return;
      }

      if (pathname === '/api/yandex/tts-v3') {
        await forwardToYandex(TTS_V3_URL, req, res, env);
        return;
      }

      if (pathname === '/api/yandex/tts-v1') {
        await forwardToYandex(TTS_V1_URL, req, res, env);
        return;
      }

      if (pathname === '/api/yandex/stt-recognize') {
        await forwardToYandex(STT_V3_RECOGNIZE_URL, req, res, env);
        return;
      }

      if (pathname === '/api/yandex/stt-result') {
        await forwardToYandex(`${STT_V3_RESULT_URL}${queryOf(req)}`, req, res, env);
        return;
      }

      next();
    })().catch((error: unknown) => {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Yandex proxy failed' }));
    });
  };
}

export function yandexProxyPlugin(): Plugin {
  let env: Record<string, string> = {};

  return {
    name: 'yandex-proxy',
    configResolved(config) {
      env = loadEnv(config.mode, config.root, '');
    },
    configureServer(server) {
      server.middlewares.use(yandexMiddleware(env));
    },
    configurePreviewServer(server) {
      server.middlewares.use(yandexMiddleware(env));
    },
  };
}
