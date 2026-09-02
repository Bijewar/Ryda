'use client';

import { cn } from '@/lib/utils';

/* ============================================================ *
 *  Vehicles.tsx — 5 illustrated SVG vehicles (Car, Bike, SUV,  *
 *  Auto, Hatchback). Friendly side-profile illustrations in     *
 *  brand colors. Each has a separate wheel `<g>` for spinning.  *
 *  ViewBox 0 0 200 100.                                         *
 * ============================================================ */

export interface VehicleProps {
  className?: string;
  /** When true, wheels spin (slow rotation). */
  spin?: boolean;
  /** Title for screen readers / tooltips. */
  title?: string;
}

/* ---------- shared wheel helper ---------- */
// Each wheel is a `<g>` whose transformOrigin is the wheel center.
// Setting transformBox: fill-box lets `transform-origin: center` refer to
// the wheel's own bounding box — works inside any parent SVG transform.

function Wheel({
  cx,
  cy,
  r = 11,
  spin = false,
}: {
  cx: number;
  cy: number;
  r?: number;
  spin?: boolean;
}) {
  return (
    <g
      className={spin ? 'animate-[ryda-wheel-spin_3s_linear_infinite]' : ''}
      style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: 'fill-box' }}
    >
      {/* tire */}
      <circle cx={cx} cy={cy} r={r} fill="#1F2937" />
      <circle cx={cx} cy={cy} r={r - 1} fill="#0F172A" />
      {/* rim */}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="#F3F4F6" />
      {/* hub */}
      <circle cx={cx} cy={cy} r={r * 0.18} fill="#475569" />
      {/* spokes */}
      <g stroke="#9CA3AF" strokeWidth={1.4} strokeLinecap="round">
        <line x1={cx} y1={cy - r * 0.55} x2={cx} y2={cy + r * 0.55} />
        <line x1={cx - r * 0.55} y1={cy} x2={cx + r * 0.55} y2={cy} />
        <line x1={cx - r * 0.39} y1={cy - r * 0.39} x2={cx + r * 0.39} y2={cy + r * 0.39} />
        <line x1={cx - r * 0.39} y1={cy + r * 0.39} x2={cx + r * 0.39} y2={cy - r * 0.39} />
      </g>
    </g>
  );
}

function Shadow() {
  return <ellipse cx={100} cy={92} rx={72} ry={5.5} fill="#0F0F17" opacity={0.1} />;
}

/* ---------- 1. Car (sedan) ---------- */
export function Car({ className, spin = false, title = 'Sedan car' }: VehicleProps) {
  return (
    <svg viewBox="0 0 200 100" className={cn('block', className)} role="img" aria-label={title}>
      <title>{title}</title>
      <Shadow />
      {/* lower body */}
      <path
        d="M22 72 Q22 60 32 58 L52 56 Q60 44 76 44 L128 44 Q142 44 150 56 L172 60 Q180 62 180 72 L180 80 Q180 82 178 82 L24 82 Q22 82 22 80 Z"
        fill="#C13B11"
      />
      {/* main body */}
      <path
        d="M22 72 Q22 60 32 58 L52 56 Q60 44 76 44 L128 44 Q142 44 150 56 L172 60 Q180 62 180 70 L22 70 Z"
        fill="#FF5722"
      />
      {/* windows */}
      <path d="M58 56 Q64 47 76 47 L100 47 L100 64 L52 64 Z" fill="#7DD3FC" opacity={0.85} />
      <path d="M104 47 L128 47 Q138 47 144 56 L148 64 L104 64 Z" fill="#7DD3FC" opacity={0.85} />
      {/* window pillar */}
      <rect x={100} y={47} width={4} height={17} fill="#C13B11" />
      {/* roof highlight */}
      <path
        d="M68 47 Q70 45 76 45 L128 45 Q134 45 136 47"
        fill="none"
        stroke="#FFB088"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      {/* headlight */}
      <circle cx={172} cy={64} r={3.2} fill="#FFE066" />
      <circle cx={172} cy={64} r={1.6} fill="#FFFBE6" />
      {/* taillight */}
      <rect x={24} y={62} width={5} height={4} rx={1.2} fill="#DC2626" />
      {/* door handle */}
      <rect x={88} y={62} width={6} height={1.6} rx={0.8} fill="#C13B11" />
      {/* wheels */}
      <Wheel cx={56} cy={82} r={11} spin={spin} />
      <Wheel cx={148} cy={82} r={11} spin={spin} />
    </svg>
  );
}

/* ---------- 2. Bike (motorcycle) ---------- */
export function Bike({ className, spin = false, title = 'Motorcycle' }: VehicleProps) {
  return (
    <svg viewBox="0 0 200 100" className={cn('block', className)} role="img" aria-label={title}>
      <title>{title}</title>
      <Shadow />
      {/* rider silhouette — leaning forward, sporty */}
      <g>
        {/* head + helmet */}
        <circle cx={104} cy={32} r={7} fill="#FF5722" />
        <path d="M97 32 Q97 26 104 25 Q111 26 111 32 Z" fill="#FF5722" />
        <path d="M97 32 Q98 30 104 30 Q110 30 111 32 Z" fill="#0F172A" opacity={0.4} />
        {/* body — leaning forward */}
        <path
          d="M104 39 Q108 44 116 50 L130 56 Q134 58 134 62 L130 64 Q124 64 116 58 Q108 52 100 50 Q96 46 100 40 Z"
          fill="#FF5722"
        />
        {/* arm reaching to handlebar */}
        <path d="M116 50 Q124 50 132 48 L138 50 L138 52 Q130 54 122 56 L116 54 Z" fill="#0F0F17" />
        {/* leg reaching to footpeg */}
        <path
          d="M112 56 Q118 64 124 70 L130 72 L130 74 Q122 74 116 68 Q110 62 108 58 Z"
          fill="#0F0F17"
        />
      </g>
      {/* bike frame — teal */}
      <path
        d="M40 70 L70 70 L78 56 L120 56 L138 70 L160 70"
        fill="none"
        stroke="#14B8A6"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* fuel tank */}
      <path d="M88 56 Q100 50 116 52 L120 56 Z" fill="#2DD4BF" />
      {/* seat */}
      <path d="M68 56 L82 56 L78 64 L66 62 Z" fill="#0F172A" />
      {/* handlebar stem */}
      <line
        x1={138}
        y1={48}
        x2={138}
        y2={60}
        stroke="#0F172A"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <line
        x1={130}
        y1={48}
        x2={146}
        y2={48}
        stroke="#0F172A"
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* headlight */}
      <circle cx={140} cy={48} r={3.5} fill="#FFE066" />
      {/* exhaust */}
      <path d="M36 70 L46 72 L46 76 L36 76 Z" fill="#9CA3AF" />
      {/* wheels */}
      <Wheel cx={44} cy={74} r={14} spin={spin} />
      <Wheel cx={156} cy={74} r={14} spin={spin} />
    </svg>
  );
}

/* ---------- 3. SUV ---------- */
export function SUV({ className, spin = false, title = 'SUV' }: VehicleProps) {
  return (
    <svg viewBox="0 0 200 100" className={cn('block', className)} role="img" aria-label={title}>
      <title>{title}</title>
      <Shadow />
      {/* lower body */}
      <path
        d="M20 78 L20 64 Q22 56 32 56 L40 56 L48 38 Q52 32 64 32 L140 32 Q152 32 158 40 L168 56 L172 56 Q182 58 182 70 L182 78 Q182 80 180 80 L22 80 Q20 80 20 78 Z"
        fill="#B58800"
      />
      {/* main body — yellow */}
      <path
        d="M20 70 L20 64 Q22 56 32 56 L40 56 L48 38 Q52 32 64 32 L140 32 Q152 32 158 40 L168 56 L172 56 Q182 58 182 66 L20 66 Z"
        fill="#FFD300"
      />
      {/* roof rack */}
      <g stroke="#0F172A" strokeWidth={1.4} strokeLinecap="round">
        <line x1={62} y1={36} x2={140} y2={36} />
        <line x1={68} y1={34} x2={68} y2={38} />
        <line x1={86} y1={34} x2={86} y2={38} />
        <line x1={104} y1={34} x2={104} y2={38} />
        <line x1={122} y1={34} x2={122} y2={38} />
        <line x1={138} y1={34} x2={138} y2={38} />
      </g>
      {/* windshield + side windows */}
      <path d="M52 38 Q54 36 60 36 L98 36 L98 54 L48 54 Z" fill="#7DD3FC" opacity={0.85} />
      <path d="M102 36 L138 36 Q144 36 148 40 L156 54 L102 54 Z" fill="#7DD3FC" opacity={0.85} />
      <rect x={100} y={36} width={4} height={18} fill="#B58800" />
      <rect x={98} y={36} width={6} height={2} fill="#0F172A" opacity={0.3} />
      {/* headlight */}
      <rect x={174} y={58} width={6} height={4} rx={1.5} fill="#FFE066" />
      <rect x={174} y={58} width={6} height={2} rx={1} fill="#FFFBE6" />
      {/* taillight */}
      <rect x={22} y={58} width={5} height={4} rx={1.2} fill="#DC2626" />
      {/* door line */}
      <line x1={100} y1={56} x2={100} y2={66} stroke="#B58800" strokeWidth={1.5} />
      {/* door handle */}
      <rect x={86} y={58} width={6} height={1.6} rx={0.8} fill="#B58800" />
      <rect x={110} y={58} width={6} height={1.6} rx={0.8} fill="#B58800" />
      {/* wheels — bigger */}
      <Wheel cx={52} cy={80} r={13} spin={spin} />
      <Wheel cx={150} cy={80} r={13} spin={spin} />
    </svg>
  );
}

/* ---------- 4. Auto (3-wheeler rickshaw) — iconic Indian ---------- */
export function Auto({ className, spin = false, title = 'Auto-rickshaw' }: VehicleProps) {
  return (
    <svg viewBox="0 0 200 100" className={cn('block', className)} role="img" aria-label={title}>
      <title>{title}</title>
      <Shadow />
      {/* canopy — black */}
      <path d="M58 30 Q60 22 80 22 L128 22 Q146 22 148 32 L148 42 L58 42 Z" fill="#0F172A" />
      {/* canopy roof highlight */}
      <path
        d="M64 26 Q66 24 80 24 L128 24 Q142 24 144 28"
        fill="none"
        stroke="#FF4081"
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.7}
      />
      {/* passenger window */}
      <path
        d="M66 30 Q68 26 78 26 L126 26 Q138 26 140 32 L140 40 L66 40 Z"
        fill="#7DD3FC"
        opacity={0.85}
      />
      {/* divider */}
      <line x1={103} y1={26} x2={103} y2={40} stroke="#0F172A" strokeWidth={2} />
      {/* main body — pink */}
      <path
        d="M48 80 L48 56 Q50 44 64 42 L150 42 Q164 44 168 56 L168 70 L182 70 Q184 70 184 72 L184 78 Q184 80 182 80 L52 80 Q48 80 48 80 Z"
        fill="#FF4081"
      />
      {/* lower body darker */}
      <path d="M48 80 L48 72 L184 72 L184 78 Q184 80 182 80 L52 80 Q48 80 48 80 Z" fill="#C2185B" />
      {/* driver cabin (front) */}
      <path d="M48 56 Q48 48 56 48 L66 48 L66 70 L48 70 Z" fill="#E91E63" />
      {/* headlight */}
      <circle cx={50} cy={62} r={3} fill="#FFE066" />
      {/* front fender */}
      <path d="M40 70 L48 70 L48 76 L40 76 Z" fill="#C2185B" />
      {/* headlight bar */}
      <line x1={40} y1={62} x2={48} y2={62} stroke="#0F172A" strokeWidth={1.5} />
      {/* side stripe */}
      <rect x={66} y={50} width={84} height={2} fill="#0F172A" opacity={0.4} />
      {/* door */}
      <rect x={100} y={46} width={2} height={26} fill="#0F172A" opacity={0.3} />
      {/* wheels — 3 (1 front + 2 back) */}
      <Wheel cx={36} cy={80} r={10} spin={spin} />
      <Wheel cx={110} cy={82} r={11} spin={spin} />
      <Wheel cx={150} cy={82} r={11} spin={spin} />
    </svg>
  );
}

/* ---------- 5. Hatchback ---------- */
export function Hatchback({ className, spin = false, title = 'Hatchback' }: VehicleProps) {
  return (
    <svg viewBox="0 0 200 100" className={cn('block', className)} role="img" aria-label={title}>
      <title>{title}</title>
      <Shadow />
      {/* lower body */}
      <path
        d="M28 76 Q28 62 38 60 L52 58 Q58 48 70 48 L128 48 Q142 48 150 58 L168 60 Q176 62 176 72 L176 78 Q176 80 174 80 L30 80 Q28 80 28 78 Z"
        fill="#5B21B6"
      />
      {/* main body — purple */}
      <path
        d="M28 70 Q28 62 38 60 L52 58 Q58 48 70 48 L128 48 Q142 48 150 58 L168 60 Q176 62 176 68 L28 68 Z"
        fill="#7C3AED"
      />
      {/* windows — short roof = hatchback */}
      <path d="M62 58 Q66 50 74 50 L98 50 L98 64 L56 64 Z" fill="#7DD3FC" opacity={0.85} />
      <path d="M102 50 L126 50 Q134 50 138 58 L142 64 L102 64 Z" fill="#7DD3FC" opacity={0.85} />
      <rect x={100} y={50} width={4} height={14} fill="#5B21B6" />
      {/* roof highlight */}
      <path
        d="M70 50 Q72 48 76 48 L126 48 Q130 48 132 50"
        fill="none"
        stroke="#C4B5FD"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      {/* headlight */}
      <circle cx={168} cy={62} r={3} fill="#FFE066" />
      <circle cx={168} cy={62} r={1.4} fill="#FFFBE6" />
      {/* taillight */}
      <rect x={30} y={60} width={5} height={4} rx={1.2} fill="#DC2626" />
      {/* door handle */}
      <rect x={88} y={60} width={6} height={1.6} rx={0.8} fill="#5B21B6" />
      {/* wheels */}
      <Wheel cx={56} cy={80} r={10.5} spin={spin} />
      <Wheel cx={146} cy={80} r={10.5} spin={spin} />
    </svg>
  );
}

/* ---------- Registry ---------- */
export const VEHICLES = [
  {
    id: 'car',
    name: 'Car',
    description: 'For daily commutes',
    price: '₹50 base',
    accent: '#FF5722',
    accentSoft: '#FFE5DC',
    Component: Car,
  },
  {
    id: 'bike',
    name: 'Bike',
    description: 'Beat the traffic',
    price: '₹30 base',
    accent: '#2DD4BF',
    accentSoft: '#CCFBF1',
    Component: Bike,
  },
  {
    id: 'suv',
    name: 'SUV',
    description: 'Group rides',
    price: '₹80 base',
    accent: '#FFD300',
    accentSoft: '#FEF9C3',
    Component: SUV,
  },
  {
    id: 'auto',
    name: 'Auto',
    description: 'Iconic Bhopal rides',
    price: '₹25 base',
    accent: '#FF4081',
    accentSoft: '#FCE7F3',
    Component: Auto,
  },
  {
    id: 'hatchback',
    name: 'Hatchback',
    description: 'Easy on the wallet',
    price: '₹40 base',
    accent: '#7C3AED',
    accentSoft: '#EDE9FE',
    Component: Hatchback,
  },
] as const;

export type VehicleId = (typeof VEHICLES)[number]['id'];
