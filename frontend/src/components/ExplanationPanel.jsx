import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ExplanationPanel({ result, selected, patientData }) {
  if (!result || !result.explanations) return null;

  const expData = result.explanations[selected] || result.explanations['CAD'];
  if (!expData) return null;

  const chartData = (expData.top_factors || []).map((f) => ({
    name: f.feature,
    value: f.shap,
    sentence: f.feature === 'Age' ? `Age ${patientData.age} raises the predicted risk.` : f.sentence,
    direction: f.direction
  }));

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-card)',
      padding: '24px 32px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
      width: '100%',
      marginTop: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', color: 'var(--ink)', fontWeight: 800 }}>
          Clinical Interpretation — {selected}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--ink-muted)', fontWeight: 600 }}>
          {expData.summary}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center' }}>
        {/* Full-Width Horizontal Chart */}
        <div style={{ height: '220px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chartData} margin={{ left: 60, right: 30, top: 10, bottom: 10 }}>
              <XAxis type="number" stroke="var(--ink-muted)" fontSize={12} domain={['auto', 'auto']} />
              <YAxis type="category" dataKey="name" stroke="var(--ink-muted)" fontSize={12} width={100} />
              <Tooltip
                cursor={false}
                contentStyle={{ background: '#ffffff', borderColor: 'var(--surface-border)', color: 'var(--ink)', borderRadius: '8px' }}
              />
              <Bar dataKey="value" barSize={24}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.value > 0 ? 'var(--risk-high)' : 'var(--risk-low)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Side-by-Side Explanation Sentences */}
        <div style={{ display: 'grid', gap: '12px' }}>
          {chartData.map((item, idx) => (
            <div key={idx} style={{
              fontSize: '13px',
              color: 'var(--ink)',
              fontWeight: 500,
              background: 'var(--surface-muted)',
              padding: '10px 16px',
              borderRadius: '12px',
              borderLeft: `4px solid ${item.value > 0 ? 'var(--risk-high)' : 'var(--risk-low)'}`
            }}>
              {item.sentence}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}