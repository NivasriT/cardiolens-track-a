export default function AboutPage() {
  return (
    <div style={{ padding: '24px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--surface-border)', margin: '20px' }}>
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
      <p style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
        <strong>License & Data Source:</strong> Built for Multimodal AI Hackathon 2026 (Track A) under MIT License. Uses Cleveland Heart Disease Dataset.
      </p>
    </div>
  );
}