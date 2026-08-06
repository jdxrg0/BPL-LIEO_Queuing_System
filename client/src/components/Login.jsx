import React, { useState } from 'react';
import { api } from '../api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const loggedInUser = await api.login(username, password);
      onLogin(loggedInUser);
    } catch (err) {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '15vh' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center', color: 'var(--primary)' }}>BPLO Queue System</h2>
        <p style={{ marginBottom: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Sign in to continue</p>
        
        {error && (
          <div style={{ background: '#fef2f2', color: 'var(--danger)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #fca5a5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }} 
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', marginTop: '0.5rem', fontSize: '1rem' }}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
