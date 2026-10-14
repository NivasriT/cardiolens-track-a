export default function EvidenceLadder({ activeGroups = [] }) {
  const steps = [
    { id: 'baseline', label: 'History & Vitals' },
    { id: 'ecg', label: 'ECG' },
    { id: 'labs', label: 'Blood Tests' },
    { id: 'echo', label: 'Echo' }
  ];

  return (
    <div style={{ display: 'flex', gap: '10px', margin: '8px 0 20px 0' }}>
      {steps.map((step) => {
        const isActive = step.id === 'baseline' || activeGroups.includes(step.id);
        return (
          <div key={step.id} style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '13px',
            background: isActive ? 'var(--dark-pill)' : 'var(--surface-muted)',
            color: isActive ? '#ffffff' : 'var(--ink-muted)',
            fontWeight: isActive ? 700 : 500,
            transition: 'var(--transition)'
          }}>
            {step.label}
          </div>
        );
      })}
    </div>
  );
}