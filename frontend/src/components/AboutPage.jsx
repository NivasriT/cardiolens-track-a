export default function AboutPage() {
  return (
    <div style={{ padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-card)', margin: '20px', border: '1px solid var(--surface-border)' }}>
      <h2>About CardioLens & Clinical Limitations</h2>
      <p style={{ color: 'var(--ink-muted)', margin: '12px 0' }}>
        CardioLens integrates machine learning predictions with interactive 3D coronary anatomy visualization to highlight uncertainty alongside risk scores.
      </p>
      <h3>Team Solvex</h3>
      <ul style={{ margin: '12px 0 20px 20px', color: 'var(--ink-muted)' }}>
        <li>Nivasri Thirumeni (Integration & Dashboard Lead)</li>
        <li>Nivedha (Machine Learning Lead)</li>
        <li>Neha (Backend Lead)</li>
        <li>Navithanjali (3D Visualization Lead)</li>
      </ul>
      <p style={{ fontSize: '13px', color: 'var(--ink)' }}>
        <strong>License & Data Source:</strong> Built for Multimodal AI Hackathon 2026 (Track A) under MIT License.
        Trained and evaluated on the <strong>Z-Alizadeh Sani (extended) dataset</strong> (UCI, CC BY 4.0, DOI 10.24432/C5461K).
      </p>
    </div>
  );
}