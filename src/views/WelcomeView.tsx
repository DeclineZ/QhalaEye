import React, { useState } from 'react';
import { useSessionStore } from '../store/sessionStore';

const WelcomeView: React.FC = () => {
  const [name, setName] = useState('');
  const { setUserName, setView } = useSessionStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setUserName(name.trim());
      setView('calibration');
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'var(--bg-base)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        padding: '3rem',
        borderRadius: '24px',
        boxShadow: 'var(--shadow-lg)',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Welcome to QhalaEye
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Please enter your name to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            required
            style={{
              padding: '1rem 1.5rem',
              fontSize: '1.1rem',
              borderRadius: '12px',
              border: '2px solid var(--border)',
              outline: 'none',
              width: '100%',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--blue-500)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '1rem', fontSize: '1.1rem' }}
            disabled={!name.trim()}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default WelcomeView;
