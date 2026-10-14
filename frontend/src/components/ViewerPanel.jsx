import HeartViewer from './HeartViewer/HeartViewer';

export default function ViewerPanel({ vessels, selected, onSelect }) {
  return (
    <div style={{
      background: '#121820',
      borderRadius: 'var(--radius-card)',
      height: '420px',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }}>
      <HeartViewer vessels={vessels} selected={selected} onSelect={onSelect} />
    </div>
  );
}