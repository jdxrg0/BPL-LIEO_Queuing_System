import React, { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

export default function HoldButton({ onClick, icon, colorMap, tooltip, holdTime = 500 }) {
  const [isHolding, setIsHolding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const timerRef = useRef(null);

  const startHold = (e) => {
    if (e.button !== undefined && e.button !== 0) return; // Only allow left click
    e.preventDefault(); 
    if (isSuccess) return; // Block interactions while showing success
    
    setIsHolding(true);
    timerRef.current = setTimeout(async () => {
      setIsHolding(false);
      try {
        await onClick();
        // Show success animation
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 1200);
      } catch (err) {
        console.error("HoldButton error:", err);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelHold();
  }, []);

  const size = 28;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isHolding ? 0 : circumference;

  return (
    <div 
      style={{ 
        position: 'relative', width: size, height: size, cursor: isSuccess ? 'default' : 'pointer',
        transform: isHolding ? 'scale(0.92)' : (isSuccess ? 'scale(1.1)' : 'scale(1)'),
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        borderRadius: '50%'
      }}
      title={tooltip}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
    >
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          fill={isSuccess ? colorMap.main : colorMap.bg}
          stroke={isSuccess ? colorMap.main : colorMap.bg} 
          strokeWidth={strokeWidth} 
          style={{ transition: 'fill 0.3s ease, stroke 0.3s ease' }}
        />
        {/* Animated Progress Border */}
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          fill="transparent" 
          stroke={colorMap.main} 
          strokeWidth={strokeWidth} 
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ 
            transition: isHolding ? `stroke-dashoffset ${holdTime}ms linear` : 'stroke-dashoffset 0.3s ease-out',
            opacity: isSuccess ? 0 : 1
          }}
        />
      </svg>
      
      {/* Icon Container */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isSuccess ? 'white' : colorMap.main,
        zIndex: 1,
        transition: 'color 0.3s ease'
      }}>
        {isSuccess ? <Check size={14} strokeWidth={3} /> : icon}
      </div>
    </div>
  );
}
