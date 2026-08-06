import React, { useState, useRef, useEffect } from 'react';

export default function HoldActionBtn({ onAction, text, style, className, holdTime = 600 }) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const startHold = (e) => {
    // Only left clicks or touches
    if (e.type === 'mousedown' && e.button !== 0) return;
    
    // Clear any existing timer
    if (timerRef.current) clearInterval(timerRef.current);
    
    setProgress(0);
    let p = 0;
    const intervalTime = 50;
    const ticks = holdTime / intervalTime;
    
    timerRef.current = setInterval(() => {
      p += (100 / ticks);
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(timerRef.current);
        onAction();
        setTimeout(() => setProgress(0), 150);
      }
    }, intervalTime);
  };

  const endHold = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <button 
      className={className}
      onMouseDown={startHold}
      onMouseUp={endHold}
      onMouseLeave={endHold}
      onTouchStart={startHold}
      onTouchEnd={endHold}
      onTouchCancel={endHold}
      style={{
        ...style,
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: `${progress}%`,
        background: 'rgba(0, 0, 0, 0.2)',
        transition: progress === 0 ? 'none' : 'width 0.05s linear',
        zIndex: 1
      }}></div>
      <span style={{ position: 'relative', zIndex: 2 }}>
        {text}
      </span>
    </button>
  );
}
