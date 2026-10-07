import { getStore } from '@netlify/blobs';
import type { Config } from '@netlify/functions';
import { handleApi, type News, type Storage } from '../../server/api.ts';

const KEY = 'news';

// Netlify Blobs replaces the data/news.json file used by the Node server.
// Strong consistency so the admin panel sees its own changes immediately.
const blobStorage = (): Storage => {
  const store = getStore({ name: 'news-bar', consistency: 'strong' });
  return {
    async load() {
      return ((await store.get(KEY, { type: 'json' })) as News[] | null) ?? [];
    },
    async save(news) {
      await store.setJSON(KEY, news);
    },
  };
};

export default async (req: Request) => {
  try {
    return await handleApi(req, {
      storage: blobStorage(),
      // No fallback password here - the site is public, so admin stays
      // disabled until ADMIN_PASSWORD is set in the Netlify dashboard.
      adminPassword: process.env.ADMIN_PASSWORD || undefined,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
};

export const config: Config = {
  path: '/api/*',
};
