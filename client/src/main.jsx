import React, { Component } from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          background: '#1a0505',
          color: '#ff8888',
          fontFamily: 'monospace',
          minHeight: '100vh',
          boxSizing: 'border-box',
          border: '5px solid #ff3333'
        }}>
          <h1 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>⚠️ React Rendering Crash</h1>
          <p style={{ fontWeight: 'bold', fontSize: '16px' }}>{this.state.error?.toString()}</p>
          <pre style={{
            background: '#2a0a0a',
            padding: '20px',
            borderRadius: '8px',
            overflowX: 'auto',
            border: '1px solid #ff5555'
          }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global window error handlers
window.addEventListener('error', (event) => {
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100vw';
  errorDiv.style.height = '100vh';
  errorDiv.style.background = '#2a0000';
  errorDiv.style.color = '#ff9999';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.style.padding = '40px';
  errorDiv.style.boxSizing = 'border-box';
  errorDiv.style.zIndex = '999999';
  errorDiv.innerHTML = `
    <h1>⚠️ Window Global Error Caught</h1>
    <p style="font-weight:bold; font-size:16px;">${event.message}</p>
    <p>File: ${event.filename} (Line: ${event.lineno}, Col: ${event.colno})</p>
    <pre style="background:#150000; padding:20px; border:1px solid red; overflow:auto;">${event.error?.stack || 'No stack trace'}</pre>
  `;
  document.body.appendChild(errorDiv);
});

window.addEventListener('unhandledrejection', (event) => {
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100vw';
  errorDiv.style.height = '100vh';
  errorDiv.style.background = '#2a0000';
  errorDiv.style.color = '#ff9999';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.style.padding = '40px';
  errorDiv.style.boxSizing = 'border-box';
  errorDiv.style.zIndex = '999999';
  errorDiv.innerHTML = `
    <h1>⚠️ Unhandled Promise Rejection</h1>
    <p style="font-weight:bold; font-size:16px;">Reason: ${event.reason}</p>
    <pre style="background:#150000; padding:20px; border:1px solid red; overflow:auto;">${event.reason?.stack || 'No stack trace'}</pre>
  `;
  document.body.appendChild(errorDiv);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
