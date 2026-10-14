import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ExplanationPanel({ result, selected }) {
  if (!result || !result.explanations) return null;

  const expData = result.explanations[selected] || result.explanations['CAD'];
  if (!expData) return null;

  const chartData = (expData.top_factors || []).map((f) => ({
    name: f.feature,
    value: f.shap,
    sentence: f.sentence,
    direction: f.direction
  }));

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--surface-border)',
      borderRadius: '8px',
      padding: '20px',
      marginTop: '20px'
    }}>
      <h3 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--ink)' }}>
        Clinical Interpretation — {selected}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginBottom: '16px' }}>
        {expData.summary}
      </p>

      <div style={{ height: '220px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={chartData} margin={{ left: 40, right: 20, top: 10, bottom: 10 }}>
            <XAxis type="number" stroke="var(--ink-muted)" fontSize={12} />
            <YAxis type="category" dataKey="name" stroke="var(--ink-muted)" fontSize={12} width={80} />
            <Tooltip
              contentStyle={{ background: 'var(--bg)', borderColor: 'var(--surface-border)', color: 'var(--ink)' }}
            />
            <Bar dataKey="value">
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

      <div style={{ marginTop: '16px', display: 'grid', gap: '8px' }}>
        {chartData.map((item, idx) => (
          <div key={idx} style={{ fontSize: '12px', color: 'var(--ink-muted)', borderLeft: '2px solid var(--surface-border)', paddingLeft: '8px' }}>
            {item.sentence}
          </div>
        ))}
      </div>
    </div>
  );
}