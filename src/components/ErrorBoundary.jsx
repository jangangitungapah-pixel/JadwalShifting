import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '300px', padding: '2rem', textAlign: 'center', gap: '1rem'
        }}>
          <div style={{
            padding: '1rem', borderRadius: '50%',
            background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)'
          }}>
            <AlertTriangle size={32} style={{ color: '#F87171' }} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Terjadi Kesalahan
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.5 }}>
            Komponen ini mengalami error. Data Anda tetap aman. Coba muat ulang komponen ini atau refresh halaman.
          </p>
          {this.state.error && (
            <details style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: '500px', textAlign: 'left', background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '0.5rem' }}>Detail Teknis</summary>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button onClick={this.handleReload} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <RefreshCw size={15} /> Coba Lagi
            </button>
            <button onClick={() => window.location.reload()} className="btn btn-outline">
              Refresh Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
