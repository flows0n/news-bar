import { type RefObject, useEffect, useRef, useState } from 'react';
import { api, type News } from './api';
import { FallingLeaves, Leaf } from './Leaves';

const REFRESH_MS = 60_000;
const SCROLL_PX_PER_SEC = 40;
const PAUSE_MS = 5_000;

// Card stripe colors cycle through the autumn palette.
const ACCENTS = [
  'border-pumpkin',
  'border-mustard',
  'border-rust',
  'border-olive',
];

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function useNews() {
  const [news, setNews] = useState<News[] | null>(null);
  useEffect(() => {
    // On a network hiccup keep showing the last known list instead of blanking the screen.
    const refresh = () => api.publicNews().then(setNews, console.error);
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);
  return news;
}

// Slowly scrolls the container down when content overflows, pauses, then jumps back to the top.
function useAutoScroll(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    let last = performance.now();
    let phase: 'top' | 'scrolling' | 'bottom' = 'top';
    let phaseStart = last;
    let position = 0;

    const tick = (time: number) => {
      const dt = time - last;
      last = time;
      const max = el.scrollHeight - el.clientHeight;

      if (max <= 0) {
        position = 0;
        phase = 'top';
        phaseStart = time;
      } else if (phase === 'top' && time - phaseStart > PAUSE_MS) {
        phase = 'scrolling';
      } else if (phase === 'scrolling') {
        position = Math.min(position + (SCROLL_PX_PER_SEC * dt) / 1000, max);
        if (position >= max) {
          phase = 'bottom';
          phaseStart = time;
        }
      } else if (phase === 'bottom' && time - phaseStart > PAUSE_MS) {
        position = 0;
        phase = 'top';
        phaseStart = time;
      }

      el.scrollTop = position;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ref]);
}

const Display = () => {
  const now = useNow();
  const news = useNews();
  const listRef = useRef<HTMLDivElement>(null);
  useAutoScroll(listRef);

  return (
    <div className="relative flex h-screen flex-col bg-linear-to-b from-cream to-[#f5e3c8] text-bark">
      <FallingLeaves />

      <header className="relative z-10 flex items-end justify-between px-6 pt-4 pb-3">
        <h1 className="flex items-center gap-[1vw] font-serif text-[4vw] leading-none font-semibold">
          <Leaf className="h-[3.4vw] w-[3.4vw] text-pumpkin" />
          Aktualności
        </h1>
        <div className="text-right">
          <div className="font-serif text-[4vw] leading-none font-semibold text-rust tabular-nums">
            {now.toLocaleTimeString('pl-PL', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="mt-2 text-[1.6vw] text-bark-muted capitalize">
            {now.toLocaleDateString('pl-PL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>
      </header>
      <div className="relative z-10 mx-6 h-1.5 rounded-full bg-linear-to-r from-mustard via-pumpkin to-rust" />

      <div
        ref={listRef}
        className="relative z-10 flex-1 overflow-hidden px-6 py-4"
      >
        {news?.length === 0 && (
          <p className="mt-[20vh] text-center font-serif text-[2.5vw] text-bark-muted">
            Brak aktualności
          </p>
        )}
        <ul className="flex flex-col gap-4">
          {news?.map((item, index) => (
            <li
              key={item.id}
              className={`rounded-2xl border-l-8 bg-paper/90 px-4 py-4 shadow-[0_4px_16px_-6px_rgb(120_70_30/0.25)] ${ACCENTS[index % ACCENTS.length]}`}
            >
              <p className="text-[3vw] leading-snug font-semibold whitespace-pre-line">
                {item.content}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Display;
