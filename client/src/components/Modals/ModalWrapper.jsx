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
      className={`modal-overlay fixed inset-0 flex items-center justify-center p-4 ${isClosing ? 'modal-overlay-close' : ''}`}
      style={{ background: bg, zIndex }}
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
