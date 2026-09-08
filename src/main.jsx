import React, { Component } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Lakshya 2.0 Uncaught Runtime Exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0c0a09',
          color: '#fef3c7',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'monospace',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '500px',
            backgroundColor: '#1c1917',
            border: '2px solid #b45309',
            borderRadius: '4px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ color: '#ef4444', margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold' }}>
              ⚠️ SYSTEM RUNTIME RECOVERY
            </h2>
            <p style={{ fontSize: '13px', color: '#a8a29e', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              An unexpected interface exception occurred. Your local data and reservations remain secure in the database.
            </p>
            {this.state.error && (
              <pre style={{
                backgroundColor: '#0c0a09',
                padding: '12px',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#f87171',
                overflowX: 'auto',
                textAlign: 'left',
                margin: '0 0 20px 0',
                border: '1px solid #44403c'
              }}>
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#b45309',
                color: '#ffffff',
                border: '1px solid #f59e0b',
                padding: '10px 20px',
                borderRadius: '2px',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '1px',
                fontSize: '12px'
              }}
            >
              RELOAD LAKSHYA 2.0
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)