import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  api,
  getPassword,
  type News,
  type NewsInput,
  setPassword,
  UnauthorizedError,
} from './api';
import { Leaf } from './Leaves';

const EMPTY: NewsInput = { content: '', visible: true };

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [password, setValue] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.login(password);
      setPassword(password);
      onLogin();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto mt-[20vh] flex max-w-sm flex-col gap-3 rounded-2xl border border-sand bg-paper p-6 shadow-sm"
    >
      <h1 className="font-serif text-2xl font-semibold">
        Panel administratora
      </h1>
      <input
        type="password"
        autoFocus
        placeholder="Hasło"
        value={password}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-lg border border-sand bg-white px-3 py-2 focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/30 focus:outline-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="rounded bg-rust px-4 py-2 font-semibold text-white hover:bg-rust-dark">
        Zaloguj
      </button>
    </form>
  );
};

const NewsForm = ({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: NewsInput;
  submitLabel: string;
  onSubmit: (data: NewsInput) => Promise<boolean>;
  onCancel?: () => void;
}) => {
  const [data, setData] = useState(initial);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (await onSubmit(data)) setData(EMPTY);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <textarea
        required
        autoFocus={!!onCancel}
        placeholder="Treść newsa"
        rows={3}
        value={data.content}
        onChange={(e) => setData({ ...data, content: e.target.value })}
        className="rounded-lg border border-sand bg-white px-3 py-2 focus:border-pumpkin focus:ring-2 focus:ring-pumpkin/30 focus:outline-none"
      />
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-rust"
            checked={data.visible}
            onChange={(e) => setData({ ...data, visible: e.target.checked })}
          />
          Widoczny na ekranie
        </label>
        <div className="ml-auto flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded px-4 py-2 text-bark-muted hover:bg-sand/50"
            >
              Anuluj
            </button>
          )}
          <button
            disabled={saving}
            className="rounded bg-rust px-4 py-2 font-semibold text-white hover:bg-rust-dark disabled:opacity-50"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
};

const Admin = () => {
  const [loggedIn, setLoggedIn] = useState(() => !!getPassword());
  const [news, setNews] = useState<News[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const logout = useCallback(() => {
    setPassword(null);
    setLoggedIn(false);
  }, []);

  // Wraps every API call so an expired/changed password sends the user back to login.
  const run = useCallback(
    async (action: () => Promise<void>) => {
      setError('');
      try {
        await action();
        return true;
      } catch (err) {
        if (err instanceof UnauthorizedError) logout();
        else setError((err as Error).message);
        return false;
      }
    },
    [logout],
  );

  useEffect(() => {
    if (!loggedIn) return;
    api.allNews().then(setNews, (err) => {
      if (err instanceof UnauthorizedError) logout();
      else setError((err as Error).message);
    });
  }, [loggedIn, logout]);

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  const saveOrder = (next: News[]) => {
    setNews(next);
    run(async () => setNews(await api.reorder(next.map((n) => n.id))));
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= news.length) return;
    const next = [...news];
    [next[index], next[target]] = [next[target], next[index]];
    saveOrder(next);
  };

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const next = news.filter((n) => n.id !== dragId);
    next.splice(
      next.findIndex((n) => n.id === targetId),
      0,
      news.find((n) => n.id === dragId)!,
    );
    saveOrder(next);
  };

  const update = (item: News, data: NewsInput) =>
    run(async () => {
      const saved = await api.update(item.id, data);
      setNews((list) => list.map((n) => (n.id === saved.id ? saved : n)));
      setEditingId(null);
    });

  const remove = (item: News) => {
    const preview =
      item.content.length > 60 ? `${item.content.slice(0, 60)}…` : item.content;
    if (!confirm(`Usunąć „${preview}”?`)) return;
    run(async () => {
      await api.remove(item.id);
      setNews((list) => list.filter((n) => n.id !== item.id));
    });
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="mb-6 flex items-center gap-4">
        <h1 className="flex items-center gap-2 font-serif text-3xl font-semibold">
          <Leaf className="h-7 w-7 text-pumpkin" />
          Panel administratora
        </h1>
        <a
          href="/"
          target="_blank"
          className="ml-auto text-sm text-rust hover:underline"
        >
          Otwórz ekran ↗
        </a>
        <button
          onClick={logout}
          className="text-sm text-bark-muted hover:underline"
        >
          Wyloguj
        </button>
      </header>

      <section className="mb-8 rounded-2xl border border-sand bg-paper p-5 shadow-sm">
        <h2 className="mb-3 font-serif text-lg font-semibold">Dodaj news</h2>
        <NewsForm
          initial={EMPTY}
          submitLabel="Dodaj"
          onSubmit={(data) =>
            run(async () => {
              const created = await api.create(data);
              setNews((list) => [created, ...list]);
            })
          }
        />
      </section>

      {error && (
        <p className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>
      )}

      <h2 className="mb-2 font-serif text-lg font-semibold">
        Newsy{' '}
        <span className="font-normal text-bark-muted">
          — przeciągnij lub użyj strzałek, aby zmienić kolejność
        </span>
      </h2>
      {news.length === 0 && <p className="text-bark-muted">Brak newsów.</p>}
      <ul className="flex flex-col gap-2">
        {news.map((item, index) => (
          <li
            key={item.id}
            draggable={editingId !== item.id}
            onDragStart={() => setDragId(item.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dropOn(item.id)}
            className={`rounded-2xl border border-sand p-4 shadow-sm ${dragId === item.id ? 'opacity-40' : ''} ${
              item.visible ? 'bg-paper' : 'bg-cream text-bark-muted'
            }`}
          >
            {editingId === item.id ? (
              <NewsForm
                initial={item}
                submitLabel="Zapisz"
                onSubmit={(data) => update(item, data)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex cursor-grab flex-col text-bark-muted/60 select-none">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="hover:text-pumpkin disabled:opacity-30"
                    title="W górę"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === news.length - 1}
                    className="hover:text-pumpkin disabled:opacity-30"
                    title="W dół"
                  >
                    ▼
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-line">{item.content}</p>
                </div>
                <label
                  className="flex shrink-0 items-center gap-1 text-sm text-bark"
                  title="Widoczny na ekranie"
                >
                  <input
                    type="checkbox"
                    className="accent-rust"
                    checked={item.visible}
                    onChange={(e) =>
                      update(item, { ...item, visible: e.target.checked })
                    }
                  />
                  Widoczny
                </label>
                <button
                  onClick={() => setEditingId(item.id)}
                  className="shrink-0 text-sm text-rust hover:underline"
                >
                  Edytuj
                </button>
                <button
                  onClick={() => remove(item)}
                  className="shrink-0 text-sm text-red-600 hover:underline"
                >
                  Usuń
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Admin;
