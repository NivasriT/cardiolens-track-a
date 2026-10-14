import { useState } from 'react';

export default function PatientPanel({ onRun, loading }) {
  const [selectedGroup, setSelectedGroup] = useState(['ecg']);
  const [patientData, setPatientData] = useState({
    age: 58, sex: 1, cp: 2, trestbps: 140, chol: 240, fbs: 0,
    restecg: 1, thalach: 150, exang: 0, oldpeak: 1.5, slope: 2, ca: 0, thal: 2
  });

  const toggleGroup = (group) => {
    if (selectedGroup.includes(group)) {
      setSelectedGroup(selectedGroup.filter((g) => g !== group));
    } else {
      setSelectedGroup([...selectedGroup, group]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRun(patientData, selectedGroup);
  };

  return (
    <div style={{
      background: 'var(--pastel-yellow)',
      borderRadius: 'var(--radius-card)',
      padding: '24px',
      height: '100%',
      color: 'var(--ink)'
    }}>
      <h3 style={{ fontSize: '20px', marginBottom: '16px', fontWeight: 800 }}>Patient Inputs:</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '8px' }}>
          AVAILABLE GROUPS
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ecg', 'labs', 'echo'].map((group) => {
            const active = selectedGroup.includes(group);
            return (
              <button
                key={group}
                type="button"
                onClick={() => toggleGroup(group)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '12px',
                  border: 'none',
                  background: active ? 'var(--dark-pill)' : 'rgba(255,255,255,0.6)',
                  color: active ? '#ffffff' : 'var(--ink)',
                  fontWeight: 700
                }}
              >
                {group.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Age (yrs)</label>
            <input
              type="number"
              value={patientData.age}
              onChange={(e) => setPatientData({ ...patientData, age: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '10px',
                background: '#ffffff',
                border: 'none',
                color: 'var(--ink)',
                marginTop: '4px',
                fontWeight: 600
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Resting BP</label>
            <input
              type="number"
              value={patientData.trestbps}
              onChange={(e) => setPatientData({ ...patientData, trestbps: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '10px',
                background: '#ffffff',
                border: 'none',
                color: 'var(--ink)',
                marginTop: '4px',
                fontWeight: 600
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '12px',
            padding: '12px',
            background: 'var(--dark-pill)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-pill)',
            fontWeight: '700',
            fontSize: '14px'
          }}
        >
          {loading ? 'Evaluating...' : 'Run Assessment'}
        </button>
      </form>
    </div>
  );
}