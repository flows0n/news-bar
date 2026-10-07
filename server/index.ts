import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createServer, type IncomingMessage } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { handleApi, type News, type Storage } from './api.ts';

const PORT = Number(process.env.PORT ?? 3001);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin';
const ROOT = resolve(import.meta.dirname, '..');
const DATA_DIR = process.env.DATA_DIR ?? join(ROOT, 'data');
const DATA_FILE = join(DATA_DIR, 'news.json');
const DIST_DIR = join(ROOT, 'dist');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const fileStorage: Storage = {
  async load() {
    if (!existsSync(DATA_FILE)) return [];
    return JSON.parse(await readFile(DATA_FILE, 'utf8')) as News[];
  },
  // Write to a temp file and rename, so a crash mid-write never corrupts the data.
  async save(news) {
    await mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DATA_FILE}.tmp`;
    await writeFile(tmp, JSON.stringify(news, null, 2));
    await rename(tmp, DATA_FILE);
  },
};

async function toRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value);
  }
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  return new Request(new URL(req.url ?? '/', `http://localhost:${PORT}`), {
    method: req.method,
    headers,
    body: hasBody ? Buffer.concat(chunks) : undefined,
  });
}

async function serveStatic(path: string) {
  let file = normalize(join(DIST_DIR, path));
  if (!file.startsWith(DIST_DIR) || !existsSync(file) || !extname(file)) {
    // SPA fallback: /admin and any other route render index.html.
    file = join(DIST_DIR, 'index.html');
  }
  if (!existsSync(file)) {
    return new Response(
      'Brak zbudowanej aplikacji - uruchom "npm run build".',
      {
        status: 404,
      },
    );
  }
  return new Response(await readFile(file), {
    headers: {
      'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
    },
  });
}

createServer(async (req, res) => {
  let response: Response;
  try {
    const path = decodeURIComponent(
      new URL(req.url ?? '/', 'http://localhost').pathname,
    );
    response = path.startsWith('/api/')
      ? await handleApi(await toRequest(req), {
          storage: fileStorage,
          adminPassword: ADMIN_PASSWORD,
        })
      : await serveStatic(path);
  } catch (err) {
    console.error(err);
    response = Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(PORT, () => {
  console.log(`News Bar działa na http://localhost:${PORT}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      'UWAGA: używane jest domyślne hasło "admin". Ustaw ADMIN_PASSWORD.',
    );
  }
});
