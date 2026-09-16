import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await api.login(username, password);
      onLogin(data);
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans">
      {/* Left Branding Panel (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-blue-900 to-blue-800 p-12 relative overflow-hidden text-center">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-36 h-36 bg-white p-4 rounded-full shadow-2xl mb-8 flex items-center justify-center overflow-hidden">
            {settings?.logoBase64 ? (
              <img src={settings.logoBase64} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <svg className="w-16 h-16 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )}
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight leading-tight whitespace-pre-line">
            {settings?.websiteName || "Business Permit \n & Licensing Office"}
          </h1>
          <div className="w-16 h-1.5 bg-yellow-500 rounded-full my-4"></div>
          <p className="text-blue-100 text-lg font-medium tracking-wide max-w-sm">
            Official Queuing Management System
          </p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">
          
          <div className="mb-8 lg:hidden flex flex-col items-center text-center">
             <div className="w-24 h-24 bg-white p-3 rounded-full shadow-lg mb-4 flex items-center justify-center overflow-hidden border border-slate-100">
              {settings?.logoBase64 ? (
                <img src={settings.logoBase64} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <svg className="w-12 h-12 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{settings?.websiteName || "BPLO Queue"}</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
          </div>

          <div className="hidden lg:block mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 font-medium mt-2 text-sm">Please sign in to your official account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Enter your username"
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input 
                  type="password" 
                  placeholder="Enter your password"
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className={`mt-4 w-full py-4 px-4 rounded-xl text-white font-bold text-base tracking-wide transition-all shadow-md ${isLoading ? 'bg-blue-400 cursor-wait' : 'bg-blue-700 hover:bg-blue-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'}`}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          
        </div>
      </div>
    </div>
  );
}
