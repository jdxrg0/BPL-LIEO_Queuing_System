import React, { useState, useRef, useEffect, ReactNode, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface HoldActionBtnProps {
  onAction: () => Promise<void> | void;
  text?: string;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
  holdTime?: number;
  disabled?: boolean;
}

export default function HoldActionBtn({ onAction, text, children, style, className, holdTime = 600, disabled = false }: HoldActionBtnProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<any>(null);

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || isLoading) return;
    if (e.type === 'mousedown' && ('button' in e) && (e as React.MouseEvent).button !== 0) return;
    
    if (timerRef.current) clearTimeout(timerRef.current);
    
    setIsHolding(true);
    
    timerRef.current = setTimeout(async () => {
      setIsHolding(false);
      setIsLoading(true);
      try {
        await onAction();
      } finally {
        setIsLoading(false);
      }
    }, holdTime);
  };

  const endHold = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsHolding(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <motion.button 
      whileTap={disabled || isLoading ? {} : { scale: 0.92 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
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
        WebkitTouchCallout: 'none',
        border: 'none',
        outline: 'none',
        cursor: (disabled || isLoading) ? 'default' : 'pointer',
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      <motion.div 
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ 
          scaleX: isHolding ? 1 : (isLoading ? 1 : 0), 
          opacity: isHolding ? 1 : (isLoading ? 0.5 : 0)
        }}
        transition={{ 
          scaleX: isHolding ? { duration: holdTime / 1000, ease: "linear" } : { duration: 0.2 },
          opacity: { duration: 0.1 }
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          background: isLoading ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.15)',
          transformOrigin: 'left',
          zIndex: 1
        }}
      />
      <span style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : (children || text)}
      </span>
    </motion.button>
  );
}
