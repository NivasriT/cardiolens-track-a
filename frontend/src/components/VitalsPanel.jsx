export default function VitalsPanel({ vitals }) {
  if (!vitals) return null;

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-card)',
      padding: '20px',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
    }}>
      <div>
        <span style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 600 }}>Blood Pressure</span>
        <p className="number" style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>{vitals.BP || '--'} <span style={{ fontSize: '11px', fontWeight: 500 }}>mmHg</span></p>
      </div>
      <div>
        <span style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 600 }}>Pulse Rate</span>
        <p className="number" style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>{vitals.PR || '--'} <span style={{ fontSize: '11px', fontWeight: 500 }}>bpm</span></p>
      </div>
      <div>
        <span style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 600 }}>Body Mass Index</span>
        <p className="number" style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>{vitals.BMI || '--'} <span style={{ fontSize: '11px', fontWeight: 500 }}>kg/m²</span></p>
      </div>
    </div>
  );
}