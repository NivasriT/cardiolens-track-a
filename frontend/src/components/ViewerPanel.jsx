export default function ViewerPanel({ vessels, selected, onSelect }) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-card)',
      minHeight: '350px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--ink-muted)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
    }}>
      <p style={{ fontWeight: 600 }}>3D Heart Viewer Placeholder</p>
    </div>
  );
}