export default function ResultCards({ result, selected, onSelect }) {
  if (!result) return null;

  const cadProb = (result.cad?.probability * 100).toFixed(1);
  const cadLow = (result.cad?.ci_low * 100 || cadProb - 5).toFixed(0);
  const cadHigh = (result.cad?.ci_high * 100 || Number(cadProb) + 5).toFixed(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Overall CAD Risk Card */}
      <div
        onClick={() => onSelect('CAD')}
        style={{
          background: 'var(--pastel-pink)',
          borderRadius: 'var(--radius-card)',
          padding: '20px',
          cursor: 'pointer'
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
          Overall CAD Risk
        </span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px' }}>
          <div>
            <h2 className="number" style={{ fontSize: '36px', color: 'var(--ink)', fontWeight: 800 }}>
              {cadProb}%
            </h2>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)' }}>
              Interval: {cadLow}% – {cadHigh}%
            </span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dark-pill)', background: 'rgba(255,255,255,0.7)', padding: '4px 12px', borderRadius: 'var(--radius-pill)' }}>
            {result.cad?.label}
          </span>
        </div>
      </div>

      {/* Vessel Risk List */}
      <div style={{ display: 'grid', gap: '10px' }}>
        {Object.entries(result.vessels || {}).map(([vessel, data]) => {
          const prob = (data.probability * 100).toFixed(1);
          const lo = (data.ci_low * 100 || prob - 6).toFixed(0);
          const hi = (data.ci_high * 100 || Number(prob) + 6).toFixed(0);
          const active = selected === vessel;

          return (
            <div
              key={vessel}
              onClick={() => onSelect(vessel)}
              style={{
                background: active ? 'var(--pastel-blue)' : 'var(--surface)',
                borderRadius: '16px',
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              <div>
                <strong style={{ fontSize: '15px', display: 'block', fontWeight: 700 }}>{vessel}</strong>
                <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                  {prob}% ({lo}–{hi}%) • {data.confidence}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}