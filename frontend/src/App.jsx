import { useState, useEffect } from 'react';
import DisclaimerBanner from './components/DisclaimerBanner';
import EvidenceLadder from './components/EvidenceLadder';
import ViewerPanel from './components/ViewerPanel';
import PatientPanel from './components/PatientPanel';
import ResultCards from './components/ResultCards';
import ExplanationPanel from './components/ExplanationPanel';
import NextBestTest from './components/NextBestTest';
import VitalsPanel from './components/VitalsPanel';
import MetricsPage from './components/MetricsPage';
import AboutPage from './components/AboutPage';
import { predict } from './lib/api';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState('CAD');
  const [activeGroups, setActiveGroups] = useState(['ecg']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRun = async (patientData, groups) => {
    setLoading(true);
    setError('');
    setActiveGroups(groups);
    try {
      const res = await predict(patientData, groups);
      setResult(res);
    } catch (err) {
      console.error('Failed to run prediction:', err);
      setError(err.message || 'The server is waking up or unavailable. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRun({}, ['ecg']);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <DisclaimerBanner />

      <header style={{
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--ink)', fontWeight: 800, margin: 0 }}>
            CardioLens
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--ink-muted)', fontWeight: 600, marginTop: '2px' }}>
            3D Cardiac Risk & Uncertainty-Aware Assessment
          </p>
        </div>

        <nav style={{ display: 'flex', gap: '8px', background: 'var(--surface-muted)', padding: '6px', borderRadius: 'var(--radius-pill)' }}>
          {['dashboard', 'metrics', 'about'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? 'var(--dark-pill)' : 'transparent',
                color: tab === t ? '#ffffff' : 'var(--ink)',
                border: 'none',
                padding: '8px 20px',
                borderRadius: 'var(--radius-pill)',
                textTransform: 'capitalize',
                fontWeight: 700,
                fontSize: '13px'
              }}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'metrics' && <MetricsPage />}
      {tab === 'about' && <AboutPage />}

      {tab === 'dashboard' && (
        <main style={{ padding: '0 32px 32px 32px', flex: 1 }}>
          <EvidenceLadder activeGroups={activeGroups} />

          {error && (
            <div style={{
              background: '#f8d7da',
              border: '1px solid #f5c6cb',
              color: '#721c24',
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '16px',
              fontSize: '13px',
              fontWeight: 600
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: '340px 1fr 320px',
            gap: '24px',
            marginTop: '20px'
          }}>
            <PatientPanel onRun={handleRun} loading={loading} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <ViewerPanel vessels={result?.vessels} selected={selected} onSelect={setSelected} />
              <VitalsPanel vitals={result?.vitals} />
              <ExplanationPanel result={result} selected={selected} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <ResultCards result={result} selected={selected} onSelect={setSelected} />
              <NextBestTest nextBestTest={result?.next_best_test} />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
