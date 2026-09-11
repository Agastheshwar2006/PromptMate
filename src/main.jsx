import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

// Guard against accidental identifier lookups
if (typeof window !== 'undefined') {
  window.pm = window.pm || {};
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#09090b',
          color: '#f4f4f5',
          fontFamily: 'Inter, system-ui, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '500px',
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ef4444', margin: 0 }}>
              Application Render Notice
            </h2>
            <p style={{ fontSize: '14px', color: '#a1a1aa', margin: 0, lineHeight: 1.5 }}>
              {this.state.error?.message || 'An unexpected rendering issue occurred. Please refresh or clear your browser cache.'}
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              Reset & Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
