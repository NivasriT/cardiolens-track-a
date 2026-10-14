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
  const [patientData, setPatientData] = useState({
    age: 58, sex: 1, cp: 2, trestbps: 140, chol: 240, fbs: 0,
    restecg: 1, thalach: 150, exang: 0, oldpeak: 1.5, slope: 2, ca: 0, thal: 2
  });

  const handleRun = async (data = patientData, groups = activeGroups) => {
    setLoading(true);
    try {
      const res = await predict(data, groups);
      setResult(res);
    } catch (err) {
      console.error('Failed to run prediction', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGroup = (groupId) => {
    const updated = activeGroups.includes(groupId)
      ? activeGroups.filter((g) => g !== groupId)
      : [...activeGroups, groupId];
    setActiveGroups(updated);
    handleRun(patientData, updated);
  };

  useEffect(() => {
    handleRun();
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
        <h1 style={{ fontSize: '28px', color: 'var(--ink)', fontWeight: 800 }}>
          CardioLens
        </h1>

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
        <main style={{ padding: '0 32px 32px 32px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <EvidenceLadder activeGroups={activeGroups} onToggleGroup={handleToggleGroup} />

          {/* Top 3-Column Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '340px 1fr 320px',
            gap: '24px'
          }}>
            <PatientPanel onRun={handleRun} loading={loading} patientData={patientData} setPatientData={setPatientData} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <ViewerPanel vessels={result?.vessels} selected={selected} onSelect={setSelected} />
              <VitalsPanel vitals={result?.vitals} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <ResultCards result={result} selected={selected} onSelect={setSelected} />
              <NextBestTest nextBestTest={result?.next_best_test} />
            </div>
          </div>

          {/* Bottom Full-Width Panel */}
          <ExplanationPanel result={result} selected={selected} patientData={patientData} />
        </main>
      )}
    </div>
  );
}