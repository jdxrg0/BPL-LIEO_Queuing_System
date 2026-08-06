import React, { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

export default function HoldTextButton({ onClick, text, colorMap, tooltip, holdTime = 800, disabled = false, style = {} }) {
  const [isHolding, setIsHolding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const timerRef = useRef(null);

  const startHold = (e) => {
    if (disabled) return;
    if (e.button !== undefined && e.button !== 0) return; // Only allow left click
    e.preventDefault(); 
    if (isSuccess) return; 
    
    setIsHolding(true);
    timerRef.current = setTimeout(async () => {
      setIsHolding(false);
      try {
        await onClick();
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 1200);
      } catch (err) {
        console.error("HoldTextButton error:", err);
      }
    }, holdTime);
  };

  const cancelHold = () => {
    setIsHolding(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => cancelHold();
  }, []);

  return (
    <div 
      style={{ 
        position: 'relative', 
        overflow: 'hidden',
        cursor: (disabled || isSuccess) ? 'default' : 'pointer',
        transform: isHolding ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        borderRadius: '6px',
        opacity: disabled ? 0.5 : 1,
        border: `1px solid ${colorMap.main}`,
        ...style
      }}
      title={tooltip}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
    >
      {/* Background container */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: isSuccess ? colorMap.successBg || '#16a34a' : colorMap.bg || 'transparent',
        transition: 'background 0.3s ease'
      }}></div>

      {/* Progress Fill */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: isHolding ? '100%' : '0%',
        background: colorMap.main,
        transition: isHolding ? `width ${holdTime}ms linear` : 'width 0.2s ease-out',
        opacity: isSuccess ? 0 : 1
      }}></div>

      {/* Text Container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: style.padding || '0.25rem 0.6rem',
        color: isHolding || isSuccess ? 'white' : colorMap.text || colorMap.main,
        fontWeight: 600,
        fontSize: style.fontSize || '0.8rem',
        transition: 'color 0.2s ease',
        minWidth: '40px'
      }}>
        {isSuccess ? <Check size={16} strokeWidth={3} /> : text}
      </div>
    </div>
  );
}
