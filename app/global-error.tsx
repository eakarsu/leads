'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('Global error:', error);

  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            fontFamily: 'Arial, sans-serif',
            background: '#f5f5f5',
          }}
        >
          <div
            style={{
              maxWidth: 500,
              background: '#fff',
              borderRadius: 8,
              padding: 40,
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>&#9888;</div>
            <h2 style={{ margin: '0 0 8px' }}>Application Error</h2>
            <p style={{ color: '#666', marginBottom: 24 }}>
              A critical error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '12px 32px',
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 16,
                marginRight: 8,
              }}
            >
              Try Again
            </button>
            <a
              href="/dashboard"
              style={{
                padding: '12px 32px',
                background: '#fff',
                color: '#1976d2',
                border: '1px solid #1976d2',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: 16,
                display: 'inline-block',
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
