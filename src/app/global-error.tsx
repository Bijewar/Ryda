'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0A0A0B', color: '#F4F4F6', fontFamily: 'system-ui' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: 32, marginBottom: 12 }}>Application error</h1>
          <p style={{ color: '#8A8A95', marginBottom: 24 }}>
            A critical error occurred while rendering this page.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#00FF87',
              color: '#0A0A0B',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
