export default function EvidenceLadder({ activeGroups = [], onToggleGroup }) {
  const steps = [
    { id: 'ecg', label: 'ECG' },
    { id: 'labs', label: 'Blood Tests' },
    { id: 'echo', label: 'Echo' }
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0 20px 0' }}>
      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
        Available Diagnostics:
      </span>
      <div style={{
        padding: '6px 16px',
        borderRadius: 'var(--radius-pill)',
        fontSize: '13px',
        background: 'var(--dark-pill)',
        color: '#ffffff',
        fontWeight: 700
      }}>
        History & Vitals (Baseline)
      </div>

      {steps.map((step) => {
        const isActive = activeGroups.includes(step.id);
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onToggleGroup(step.id)}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '13px',
              background: isActive ? 'var(--dark-pill)' : 'var(--surface-muted)',
              color: isActive ? '#ffffff' : 'var(--ink-muted)',
              border: 'none',
              fontWeight: isActive ? 700 : 500
            }}
          >
            {isActive ? `✓ ${step.label}` : `+ ${step.label}`}
          </button>
        );
      })}
    </div>
  );
}