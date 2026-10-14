import React from 'react';
import HeartViewer from './HeartViewer/HeartViewer';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("3D Heart Viewer crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          color: '#e06c75',
          background: '#121820',
          borderRadius: 'var(--radius-card)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h4>3D Heart Viewer Loading Issue</h4>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
            {this.state.error?.toString()}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ViewerPanel({ vessels, selected, onSelect }) {
  return (
    <div style={{
      background: '#121820',
      borderRadius: 'var(--radius-card)',
      height: '560px',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }}>
      <ErrorBoundary>
        <HeartViewer vessels={vessels} selected={selected} onSelect={onSelect} />
      </ErrorBoundary>
    </div>
  );
}