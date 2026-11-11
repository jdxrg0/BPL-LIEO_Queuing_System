import React, { useState, useRef, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HoldTextButton({ onClick, text, colorMap, tooltip, holdTime = 800, disabled = false, style = {} }) {
  const [isHolding, setIsHolding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef(null);

  const startHold = (e) => {
    if (disabled || isLoading || isSuccess) return;
    if (e.button !== undefined && e.button !== 0) return; // Only allow left click
    e.preventDefault(); 
    
    setIsHolding(true);
    timerRef.current = setTimeout(async () => {
      setIsHolding(false);
      setIsLoading(true);
      try {
        await onClick();
        setIsLoading(false);
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 1200);
      } catch (err) {
        setIsLoading(false);
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
    <motion.div 
      title={tooltip}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      whileTap={(!disabled && !isSuccess && !isLoading) ? { scale: 0.94 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{ 
        position: 'relative', 
        overflow: 'hidden',
        cursor: (disabled || isSuccess || isLoading) ? 'default' : 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        borderRadius: '6px',
        opacity: disabled ? 0.5 : (isLoading ? 0.8 : 1),
        border: `1px solid ${colorMap.main}`,
        ...style
      }}
    >
      {/* Background container */}
      <motion.div 
        animate={{ backgroundColor: isSuccess ? (colorMap.successBg || '#16a34a') : (colorMap.bg || 'transparent') }}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
        }}
      />

      {/* Progress Fill */}
      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ 
          scaleX: isHolding ? 1 : (isLoading ? 1 : 0), 
          opacity: isSuccess ? 0 : (isLoading ? 0.5 : 1) 
        }}
        transition={{ 
          scaleX: isHolding ? { duration: holdTime / 1000, ease: "linear" } : { duration: 0.2 },
          opacity: { duration: 0.3 }
        }}
        style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0, width: '100%',
          background: colorMap.main,
          transformOrigin: 'left'
        }}
      />

      {/* Text Container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: style.padding || '0.25rem 0.6rem',
        color: isHolding || isSuccess || isLoading ? 'white' : colorMap.text || colorMap.main,
        fontWeight: 600,
        fontSize: style.fontSize || '0.8rem',
        transition: 'color 0.2s ease',
        minWidth: '40px'
      }}>
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : (isSuccess ? <Check size={16} strokeWidth={3} /> : text)}
      </div>
    </motion.div>
  );
}
