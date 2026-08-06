import React, { useState, useEffect } from 'react';

export default function ModalWrapper({ isOpen, zIndex = 100, children, bg = 'rgba(0,0,0,0.5)' }) {
  const [render, setRender] = useState(isOpen);
  const [cachedChildren, setCachedChildren] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setRender(true);
    } else if (render) {
      const timer = setTimeout(() => {
        setRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, render]);

  useEffect(() => {
    if (isOpen) {
      setCachedChildren(typeof children === 'function' ? children() : children);
    }
  }, [isOpen, children]);

  if (!render) return null;
  const isClosing = !isOpen && render;
  
  const contentToRender = isClosing ? cachedChildren : (typeof children === 'function' ? children() : children);

  return (
    <div 
      className={`modal-overlay ${isClosing ? 'modal-overlay-close' : ''}`}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: bg, zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      {React.Children.map(contentToRender, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            className: `${child.props.className || ''} ${isClosing ? 'modal-card-close' : 'modal-card'}`.replace('modal-card modal-card', 'modal-card').trim()
          });
        }
        return child;
      })}
    </div>
  );
}
