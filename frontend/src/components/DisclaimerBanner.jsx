export default function DisclaimerBanner() {
  return (
    <div style={{
      background: 'var(--dark-pill)',
      color: '#ffffff',
      padding: '8px 16px',
      fontSize: '12px',
      textAlign: 'center',
      fontWeight: 500,
      letterSpacing: '0.01em'
    }}>
      ⚠️ Decision support and educational use only. Not a substitute for formal diagnostic imaging or clinical judgement.
    </div>
  );
}