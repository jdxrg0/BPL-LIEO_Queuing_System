import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ColorMap {
  bg: string;
  main: string;
}

interface HoldButtonProps {
  onClick: () => Promise<void> | void;
  icon: ReactNode;
  colorMap: ColorMap;
  tooltip?: string;
  holdTime?: number;
}

export default function HoldButton({ onClick, icon, colorMap, tooltip, holdTime = 500 }: HoldButtonProps) {
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    if ('button' in e && e.button !== 0) return;
    if (e.cancelable) e.preventDefault(); 
    if (isSuccess || isLoading) return; 
    
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

  useEffect(() => {
    return () => cancelHold();
  }, []);

  const size = 28;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <motion.div 
      title={tooltip}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      whileTap={(isSuccess || isLoading) ? {} : { scale: 0.85 }}
      animate={{ scale: isSuccess ? 1.15 : (isLoading ? 0.95 : 1) }}
      transition={{ type: "spring", stiffness: 450, damping: 20 }}
      style={{ 
        position: 'relative', width: size, height: size, cursor: (isSuccess || isLoading) ? 'default' : 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        borderRadius: '50%',
        opacity: isLoading ? 0.7 : 1
      }}
    >
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <motion.circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          animate={{
            fill: isSuccess ? colorMap.main : colorMap.bg,
            stroke: isSuccess ? colorMap.main : colorMap.bg
          }}
          strokeWidth={strokeWidth} 
        />
        {/* Animated Progress Border */}
        <motion.circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          fill="transparent" 
          stroke={colorMap.main} 
          strokeWidth={strokeWidth} 
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ 
            strokeDashoffset: isHolding ? 0 : (isLoading ? 0 : circumference),
            opacity: isSuccess ? 0 : (isLoading ? 0.5 : 1) 
          }}
          transition={{ 
            strokeDashoffset: isHolding ? { duration: holdTime / 1000, ease: "linear" } : { duration: 0.25, ease: "easeOut" },
            opacity: { duration: 0.2 }
          }}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Icon Container */}
      <motion.div 
        animate={{ color: (isSuccess || isLoading) ? 'white' : colorMap.main }}
        style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1,
        }}>
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : (isSuccess ? <Check size={14} strokeWidth={3} /> : icon)}
      </motion.div>
    </motion.div>
  );
}
