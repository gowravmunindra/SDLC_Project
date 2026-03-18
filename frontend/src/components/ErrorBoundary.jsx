import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
                    <h2 style={{ marginBottom: '10px' }}>Something went wrong.</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', maxWidth: '600px' }}>
                        The application encountered an unexpected error. We've logged the details and are working to fix it.
                    </p>
                    <div style={{ 
                        background: 'rgba(255, 69, 58, 0.1)', 
                        border: '1px solid rgba(255, 69, 58, 0.3)', 
                        padding: '15px', 
                        borderRadius: '8px',
                        textAlign: 'left',
                        marginBottom: '30px',
                        width: '100%',
                        maxWidth: '800px',
                        overflow: 'auto',
                        fontSize: '13px',
                        fontFamily: 'monospace'
                    }}>
                        <p style={{ color: '#ff453a', fontWeight: 'bold' }}>{this.state.error && this.state.error.toString()}</p>
                    </div>
                    <button 
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            background: 'var(--primary-600)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '16px'
                        }}
                    >
                        Reload Application
                    </button>
                    <button 
                         onClick={() => {
                             localStorage.clear();
                             window.location.href = '/';
                         }}
                        style={{
                            marginTop: '15px',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Clear cache and return to home
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
