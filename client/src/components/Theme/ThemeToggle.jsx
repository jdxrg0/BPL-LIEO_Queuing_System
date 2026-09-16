import React, { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Spring-like transition configurations
  const springConfig = 'cubic-bezier(0.4, 0.0, 0.2, 1)';

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      style={{
        background: 'transparent',
        border: 'none',
        padding: '0.5rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        borderRadius: '8px',
        transition: 'all 0.2s',
      }}
      onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-color)'; e.currentTarget.style.color = 'var(--text-main)'; }}
      onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      title="Toggle Dark Mode"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{
          transform: isDark ? "rotate(40deg)" : "rotate(90deg)",
          transition: `transform 0.5s ${springConfig}`
        }}
      >
        <mask id="moon-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <circle 
            cx={isDark ? "15" : "30"} 
            cy={isDark ? "9" : "0"} 
            r={isDark ? "8" : "5"} 
            fill="black" 
            style={{ transition: `all 0.5s ${springConfig}` }} 
          />
        </mask>
        <circle 
          cx="12" 
          cy="12" 
          r={isDark ? "9" : "5"} 
          mask="url(#moon-mask)" 
          fill={isDark ? "currentColor" : "none"}
          style={{ transition: `all 0.5s ${springConfig}` }}
        />
        <g 
          stroke="currentColor" 
          style={{
            transition: `all 0.5s ${springConfig}`,
            opacity: isDark ? 0 : 1,
            transform: isDark ? "rotate(-45deg)" : "rotate(0deg)",
            transformOrigin: "center"
          }}
        >
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </g>
      </svg>
    </button>
  );
};

export default ThemeToggle;
