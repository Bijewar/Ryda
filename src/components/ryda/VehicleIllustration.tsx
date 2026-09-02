import * as React from 'react';

export type VehicleType = 'bike' | 'auto' | 'cab' | 'premium' | 'suv' | 'BIKE' | 'AUTO' | 'CAB_ECONOMY' | 'CAB_PREMIUM';

interface VehicleIllustrationProps extends React.SVGAttributes<SVGSVGElement> {
  type: VehicleType;
  color?: string;
  accent?: string;
}

/**
 * Premium flat-illustration style vehicle SVGs.
 * Each uses a soft shadow, gradient body, and accent detailing for a modern look.
 */
export function VehicleIllustration({
  type,
  color,
  accent = '#F5C542',
  className,
  ...props
}: VehicleIllustrationProps): React.ReactElement {
  const gradientId = React.useId();
  const shadowId = React.useId();
  const gid = `v-${gradientId.replace(/:/g, '')}`;
  const sid = `s-${shadowId.replace(/:/g, '')}`;

  // Map any uppercase or alternative enum types to lowercase normalized type
  let normType: 'bike' | 'auto' | 'cab' | 'premium' | 'suv' = 'cab';
  if (type === 'bike' || type === 'BIKE') normType = 'bike';
  else if (type === 'auto' || type === 'AUTO') normType = 'auto';
  else if (type === 'cab' || type === 'CAB_ECONOMY') normType = 'cab';
  else if (type === 'premium' || type === 'CAB_PREMIUM') normType = 'premium';
  else if (type === 'suv') normType = 'suv';

  const defaultColor =
    normType === 'bike' ? '#10B981' :
    normType === 'auto' ? '#F59E0B' :
    normType === 'cab' ? '#10B981' :
    normType === 'premium' ? '#1E293B' :
    '#0F172A';

  const activeColor = color ?? defaultColor;

  return (
    <svg
      viewBox="0 0 240 140"
      className={className}
      role="img"
      aria-label={`${normType} illustration`}
      {...props}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={activeColor} stopOpacity="1" />
          <stop offset="100%" stopColor={activeColor} stopOpacity="0.78" />
        </linearGradient>
        <radialGradient id={sid} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(15,23,42,0.18)" />
          <stop offset="100%" stopColor="rgba(15,23,42,0)" />
        </radialGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="120" cy="120" rx="90" ry="10" fill={`url(#${sid})`} />

      {normType === 'bike' && <Bike gid={gid} accent={accent} />}
      {normType === 'auto' && <Auto gid={gid} accent={accent} />}
      {normType === 'cab' && <Cab gid={gid} accent={accent} />}
      {normType === 'premium' && <Premium gid={gid} accent={accent} />}
      {normType === 'suv' && <Suv gid={gid} accent={accent} />}
    </svg>
  );
}

function Bike({ gid, accent }: { gid: string; accent: string }) {
  return (
    <g>
      {/* Body */}
      <path d="M50 95 Q60 70 95 70 L130 70 Q150 70 158 92 L150 95 Z" fill={`url(#${gid})`} />
      {/* Seat */}
      <path d="M100 68 Q120 62 145 68 L150 75 L100 75 Z" fill="#1F2937" />
      {/* Handle */}
      <path d="M150 70 L165 60 L170 65 L155 75 Z" fill="#1F2937" />
      {/* Headlight */}
      <circle cx="165" cy="68" r="4" fill={accent} />
      <circle cx="165" cy="68" r="2" fill="#FFFFFF" />
      {/* Wheels */}
      <circle cx="60" cy="105" r="18" fill="#1F2937" />
      <circle cx="60" cy="105" r="10" fill="#374151" />
      <circle cx="60" cy="105" r="4" fill="#9CA3AF" />
      <circle cx="170" cy="105" r="18" fill="#1F2937" />
      <circle cx="170" cy="105" r="10" fill="#374151" />
      <circle cx="170" cy="105" r="4" fill="#9CA3AF" />
      {/* Rider */}
      <circle cx="118" cy="48" r="10" fill="#1F2937" />
      <path d="M118 58 Q108 70 108 78 L128 78 Q128 70 118 58 Z" fill="#1F2937" />
      <path d="M118 58 L130 72 L138 68" stroke="#1F2937" strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Auto({ gid, accent }: { gid: string; accent: string }) {
  return (
    <g>
      {/* Body */}
      <path d="M55 100 L55 75 Q55 60 75 60 L130 60 Q160 60 170 85 L175 100 Z" fill={`url(#${gid})`} />
      {/* Roof */}
      <path d="M75 60 Q90 35 130 35 L130 60 Z" fill={`url(#${gid})`} />
      {/* Window */}
      <path d="M85 56 Q98 42 125 42 L125 56 Z" fill="#E0F2FE" opacity="0.85" />
      {/* Stripe */}
      <rect x="55" y="80" width="120" height="3" fill={accent} />
      {/* Headlight */}
      <circle cx="170" cy="80" r="4" fill={accent} />
      {/* Wheels */}
      <circle cx="70" cy="105" r="14" fill="#1F2937" />
      <circle cx="70" cy="105" r="7" fill="#374151" />
      <circle cx="165" cy="105" r="14" fill="#1F2937" />
      <circle cx="165" cy="105" r="7" fill="#374151" />
    </g>
  );
}

function Cab({ gid, accent }: { gid: string; accent: string }) {
  return (
    <g>
      {/* Body */}
      <path d="M30 100 L30 80 Q35 70 50 70 L80 70 Q90 50 130 50 L160 50 Q180 50 195 75 L210 80 L210 100 Z" fill={`url(#${gid})`} />
      {/* Windows */}
      <path d="M55 70 Q65 55 95 55 L130 55 L130 70 Z" fill="#E0F2FE" opacity="0.9" />
      <path d="M130 55 L160 55 Q175 55 188 70 L130 70 Z" fill="#E0F2FE" opacity="0.9" />
      {/* Door line */}
      <line x1="130" y1="70" x2="130" y2="100" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
      {/* Stripe */}
      <rect x="30" y="88" width="180" height="3" fill={accent} />
      {/* Headlight */}
      <rect x="205" y="78" width="6" height="10" rx="2" fill={accent} />
      {/* Wheels */}
      <circle cx="65" cy="105" r="16" fill="#1F2937" />
      <circle cx="65" cy="105" r="9" fill="#4B5563" />
      <circle cx="65" cy="105" r="3" fill="#9CA3AF" />
      <circle cx="175" cy="105" r="16" fill="#1F2937" />
      <circle cx="175" cy="105" r="9" fill="#4B5563" />
      <circle cx="175" cy="105" r="3" fill="#9CA3AF" />
    </g>
  );
}

function Premium({ gid, accent }: { gid: string; accent: string }) {
  return (
    <g>
      {/* Body — sleeker */}
      <path d="M25 100 L25 82 Q30 70 45 70 L75 70 Q85 48 130 48 L165 48 Q190 48 205 78 L215 82 L215 100 Z" fill={`url(#${gid})`} />
      {/* Glass roof */}
      <path d="M60 70 Q70 53 100 53 L130 53 L130 70 Z" fill="#0F172A" opacity="0.85" />
      <path d="M130 53 L165 53 Q183 53 198 70 L130 70 Z" fill="#0F172A" opacity="0.85" />
      {/* Highlight */}
      <path d="M62 67 Q72 56 96 56 L128 56" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" />
      {/* Door */}
      <line x1="130" y1="70" x2="130" y2="100" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />
      {/* Premium stripe */}
      <rect x="25" y="88" width="190" height="2.5" fill={accent} />
      {/* LED headlights */}
      <path d="M210 80 Q214 84 214 90 L210 90 Z" fill={accent} />
      {/* Wheels */}
      <circle cx="65" cy="105" r="17" fill="#0F172A" />
      <circle cx="65" cy="105" r="10" fill="#1F2937" />
      <circle cx="65" cy="105" r="4" fill={accent} />
      <circle cx="175" cy="105" r="17" fill="#0F172A" />
      <circle cx="175" cy="105" r="10" fill="#1F2937" />
      <circle cx="175" cy="105" r="4" fill={accent} />
    </g>
  );
}

function Suv({ gid, accent }: { gid: string; accent: string }) {
  return (
    <g>
      {/* Body — taller SUV */}
      <path d="M25 100 L25 70 Q30 60 45 60 L70 60 Q80 38 120 38 L160 38 Q190 38 200 65 L215 75 L215 100 Z" fill={`url(#${gid})`} />
      {/* Windows */}
      <path d="M50 60 Q60 44 90 44 L125 44 L125 60 Z" fill="#0F172A" opacity="0.85" />
      <path d="M125 44 L160 44 Q185 44 197 64 L125 64 Z" fill="#0F172A" opacity="0.85" />
      {/* Highlight */}
      <path d="M55 57 Q65 47 88 47 L122 47" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" />
      {/* Roof rack */}
      <rect x="70" y="42" width="80" height="3" rx="1.5" fill={accent} />
      {/* Door */}
      <line x1="125" y1="60" x2="125" y2="100" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />
      {/* Headlight */}
      <rect x="208" y="74" width="6" height="12" rx="2" fill={accent} />
      {/* Wheels — bigger */}
      <circle cx="65" cy="100" r="18" fill="#1F2937" />
      <circle cx="65" cy="100" r="11" fill="#4B5563" />
      <circle cx="65" cy="100" r="4" fill="#9CA3AF" />
      <circle cx="175" cy="100" r="18" fill="#1F2937" />
      <circle cx="175" cy="100" r="11" fill="#4B5563" />
      <circle cx="175" cy="100" r="4" fill="#9CA3AF" />
    </g>
  );
}
