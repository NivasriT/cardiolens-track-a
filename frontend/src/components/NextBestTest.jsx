export default function NextBestTest({ nextBestTest }) {
  if (!nextBestTest || !nextBestTest.recommended_group) return null;

  return (
    <div style={{
      background: 'var(--pastel-green)',
      borderRadius: 'var(--radius-card)',
      padding: '20px'
    }}>
      <span style={{ fontSize: '11px', color: 'var(--dark-pill)', textTransform: 'uppercase', fontWeight: 700 }}>
        Recommended Next Diagnostic Test
      </span>
      <h4 style={{ fontSize: '18px', color: 'var(--ink)', margin: '4px 0 12px 0', fontWeight: 800 }}>
        Order {nextBestTest.recommended_group.toUpperCase()} Panel
      </h4>

      <div style={{ display: 'grid', gap: '8px' }}>
        {nextBestTest.ranking?.map((item, idx) => {
          const pct = (item.expected_uncertainty_reduction * 100).toFixed(0);
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', fontWeight: 600 }}>
              <span style={{ width: '60px', color: 'var(--ink-muted)' }}>{item.group.toUpperCase()}</span>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.6)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, background: 'var(--dark-pill)', height: '100%' }} />
              </div>
              <span className="number" style={{ width: '45px', color: 'var(--ink)' }}>-{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}