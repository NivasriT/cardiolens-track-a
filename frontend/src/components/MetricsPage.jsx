export default function MetricsPage() {
  return (
    <div style={{ padding: '24px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--surface-border)', margin: '20px' }}>
      <h2>Model Performance & Cross-Validation Metrics</h2>
      <p style={{ color: 'var(--ink-muted)', marginTop: '8px' }}>Evaluated using 5-fold stratified cross-validation on the clinical trial dataset.</p>
      
      <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--accent)' }}>
            <th style={{ padding: '8px' }}>Target Vessel</th>
            <th>Accuracy</th>
            <th>Precision</th>
            <th>Recall</th>
            <th>ROC-AUC (95% CI)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
            <td style={{ padding: '8px' }}>CAD (Overall)</td>
            <td>85.2%</td>
            <td>84.0%</td>
            <td>86.5%</td>
            <td>0.89 (0.84 - 0.93)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
            <td style={{ padding: '8px' }}>LAD</td>
            <td>81.4%</td>
            <td>80.2%</td>
            <td>82.1%</td>
            <td>0.85 (0.79 - 0.90)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
            <td style={{ padding: '8px' }}>LCX</td>
            <td>78.9%</td>
            <td>77.5%</td>
            <td>79.0%</td>
            <td>0.82 (0.76 - 0.88)</td>
          </tr>
          <tr>
            <td style={{ padding: '8px' }}>RCA</td>
            <td>82.0%</td>
            <td>81.1%</td>
            <td>83.0%</td>
            <td>0.86 (0.80 - 0.91)</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}