import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

// Shared API logic, used by both the Node server (server/index.ts)
// and the Netlify Function (netlify/functions/api.ts).

export type News = {
  id: string;
  content: string;
  visible: boolean;
  createdAt: string;
};

export type Storage = {
  load(): Promise<News[]>;
  save(news: News[]): Promise<void>;
};

type Options = {
  storage: Storage;
  // When undefined, admin endpoints are disabled.
  adminPassword: string | undefined;
};

function json(status: number, body?: unknown) {
  if (body === undefined) return new Response(null, { status });
  return Response.json(body, { status });
}

const sha256 = (value: string) => createHash('sha256').update(value).digest();

function isAdmin(req: Request, password: string | undefined) {
  if (!password) return false;
  const header = req.headers.get('authorization') ?? '';
  // Compare hashes so the comparison is constant-time regardless of length.
  return timingSafeEqual(sha256(header), sha256(`Bearer ${password}`));
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  const raw = await req.text();
  if (raw.length > 1_000_000) throw new Error('Body too large');
  return raw ? JSON.parse(raw) : {};
}

function parseNews(body: Record<string, unknown>) {
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const visible = body.visible !== false;
  return { content, visible };
}

// News used to have a separate title. Fold it into the content so older
// entries keep showing everything; the title is dropped on the next save.
function migrate(news: (News & { title?: string })[]): News[] {
  return news.map(({ title, ...item }) => ({
    ...item,
    content: [title, item.content].filter(Boolean).join('\n'),
  }));
}

export async function handleApi(
  req: Request,
  { storage, adminPassword }: Options,
): Promise<Response> {
  const path = new URL(req.url).pathname;
  const method = req.method;

  if (path === '/api/news' && method === 'GET') {
    const news = migrate(await storage.load());
    return json(
      200,
      news.filter((n) => n.visible),
    );
  }

  if (path === '/api/login' && method === 'POST') {
    return json(isAdmin(req, adminPassword) ? 204 : 401);
  }

  if (!isAdmin(req, adminPassword)) {
    return json(401, { error: 'Nieprawidłowe hasło' });
  }

  let news = migrate(await storage.load());

  if (path === '/api/admin/news' && method === 'GET') {
    return json(200, news);
  }

  if (path === '/api/admin/news' && method === 'POST') {
    const data = parseNews(await readBody(req));
    if (!data.content) return json(400, { error: 'Treść jest wymagana' });
    const item: News = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...data,
    };
    news.unshift(item);
    await storage.save(news);
    return json(201, item);
  }

  if (path === '/api/admin/order' && method === 'PUT') {
    const { ids } = await readBody(req);
    if (!Array.isArray(ids)) return json(400, { error: 'Brak listy ids' });
    const byId = new Map(news.map((n) => [n.id, n]));
    const ordered = ids.map((id) => byId.get(id)).filter((n): n is News => !!n);
    // Keep any items the client didn't know about (e.g. added in another tab).
    const rest = news.filter((n) => !ids.includes(n.id));
    news = [...ordered, ...rest];
    await storage.save(news);
    return json(200, news);
  }

  const match = path.match(/^\/api\/admin\/news\/([\w-]+)$/);
  if (match) {
    const index = news.findIndex((n) => n.id === match[1]);
    if (index === -1) return json(404, { error: 'Nie znaleziono' });

    if (method === 'PUT') {
      const data = parseNews(await readBody(req));
      if (!data.content) return json(400, { error: 'Treść jest wymagana' });
      news[index] = { ...news[index], ...data };
      await storage.save(news);
      return json(200, news[index]);
    }

    if (method === 'DELETE') {
      news.splice(index, 1);
      await storage.save(news);
      return json(204);
    }
  }

  return json(404, { error: 'Nie znaleziono' });
}
