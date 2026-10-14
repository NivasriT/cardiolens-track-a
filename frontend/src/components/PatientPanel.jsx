import { useState } from 'react';

export default function PatientPanel({ onRun, loading, patientData, setPatientData }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onRun(patientData);
  };

  return (
    <div style={{
      background: 'var(--pastel-yellow)',
      borderRadius: 'var(--radius-card)',
      padding: '24px',
      height: '100%',
      color: 'var(--ink)'
    }}>
      <h3 style={{ fontSize: '20px', marginBottom: '16px', fontWeight: 800 }}>Patient Parameters</h3>

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
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Resting BP (mmHg)</label>
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