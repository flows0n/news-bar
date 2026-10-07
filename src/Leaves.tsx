import type { CSSProperties } from 'react';

const LEAF_PATH = 'M5.5 18.5C4 10.5 9 4.2 20.5 3.5c.6 11.3-5.6 16.6-15 15Z';
const STEM_PATH = 'M2.5 21.5 15 9';

const MAPLE_PATH =
  'M12 1 13.4 4.2 15.2 3.4 14.6 8 16.6 6.4 17.2 7.6 21.2 6.6 20 10 21.6 10.8 17.6 14 18.2 15.6 14 15 14.4 17.2 12.5 16.6 12.5 21.5 11.5 21.5 11.5 16.6 9.6 17.2 10 15 5.8 15.6 6.4 14 2.4 10.8 4 10 2.8 6.6 6.8 7.6 7.4 6.4 9.4 8 8.8 3.4 10.6 4.2Z';
// Veins from the base of the blade to the tips of the three main lobes.
const MAPLE_VEINS = 'M12 15.5V4.5M12 15.5l7-7.5M12 15.5 5 8';

const AlmondLeaf = () => (
  <>
    <path fill="currentColor" d={LEAF_PATH} />
    <path
      d={STEM_PATH}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
    />
  </>
);

const MapleLeaf = ({ veins = false }: { veins?: boolean }) => (
  <>
    <path fill="currentColor" d={MAPLE_PATH} />
    {veins && (
      <path
        d={MAPLE_VEINS}
        fill="none"
        stroke="var(--color-paper)"
        strokeOpacity={0.55}
        strokeWidth={0.8}
        strokeLinecap="round"
      />
    )}
  </>
);

export const Leaf = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <MapleLeaf veins />
  </svg>
);

// Fixed layout so the leaves look scattered but render the same every time.
// `rest` is where a leaf sits (in vh) when the system asks for reduced motion.
const LEAVES = [
  {
    left: 4,
    rest: 70,
    size: 3.2,
    fall: 19,
    sway: 5,
    delay: -2,
    color: 'text-pumpkin',
  },
  {
    left: 15,
    rest: 88,
    size: 2.2,
    fall: 24,
    sway: 6,
    delay: -14,
    color: 'text-mustard',
  },
  {
    left: 27,
    rest: 78,
    size: 2.8,
    fall: 21,
    sway: 4.5,
    delay: -7,
    color: 'text-rust',
  },
  {
    left: 41,
    rest: 92,
    size: 2,
    fall: 26,
    sway: 6.5,
    delay: -19,
    color: 'text-olive',
  },
  {
    left: 53,
    rest: 4,
    size: 3,
    fall: 22,
    sway: 5.5,
    delay: -4,
    color: 'text-mustard',
  },
  {
    left: 66,
    rest: 84,
    size: 2.4,
    fall: 25,
    sway: 5,
    delay: -11,
    color: 'text-pumpkin',
  },
  {
    left: 78,
    rest: 74,
    size: 3.4,
    fall: 20,
    sway: 6,
    delay: -16,
    color: 'text-rust',
  },
  {
    left: 90,
    rest: 90,
    size: 2.2,
    fall: 23,
    sway: 4.5,
    delay: -9,
    color: 'text-olive',
  },
];

export const FallingLeaves = () => (
  <div
    className="pointer-events-none fixed inset-0 overflow-hidden"
    aria-hidden
  >
    {LEAVES.map((leaf, i) => {
      // Every other leaf is a maple; it reads smaller, so it gets a bit more size.
      const maple = i % 2 === 0;
      const size = leaf.size * (maple ? 1.25 : 1);
      return (
        <div
          key={i}
          className={`leaf absolute top-0 opacity-35 ${leaf.color}`}
          style={
            {
              left: `${leaf.left}vw`,
              '--rest-top': `${leaf.rest}vh`,
              animationDuration: `${leaf.fall}s`,
              animationDelay: `${leaf.delay}s`,
            } as CSSProperties
          }
        >
          <svg
            viewBox="0 0 24 24"
            style={{
              width: `${size}vw`,
              height: `${size}vw`,
              rotate: `${i * 47}deg`,
              animationDuration: `${leaf.sway}s`,
              animationDelay: `${leaf.delay}s`,
            }}
          >
            {maple ? <MapleLeaf /> : <AlmondLeaf />}
          </svg>
        </div>
      );
    })}
  </div>
);
