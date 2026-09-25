import React from 'react';
import ModalWrapper from '../Modals/ModalWrapper';

export default function GlobalPopup({ popupMessage, onClose }) {
  return (
    <ModalWrapper isOpen={!!popupMessage} zIndex={9999} bg="rgba(0,0,0,0.6)">
      {() => {
        const isError = popupMessage.type === 'error';
        return (
          <div className="card w-[400px] bg-surface border border-border rounded-xl shadow-xl flex flex-col overflow-hidden animate-slide-up text-center p-8">
            <div className={`mx-auto w-16 h-16 mb-4 rounded-full flex items-center justify-center border-4 ${isError ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
              {isError ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
              )}
            </div>
            <h3 className={`m-0 mb-2 text-2xl font-extrabold tracking-tight ${isError ? 'text-red-600' : 'text-emerald-600'}`}>
              {popupMessage.title}
            </h3>
            <p className="m-0 mb-6 text-text-main text-sm font-medium">
              {popupMessage.message}
            </p>
            <button
              onClick={onClose}
              className={`w-full py-3.5 font-bold rounded-lg border-none cursor-pointer transition-colors text-white shadow-sm hover:-translate-y-0.5 active:translate-y-0 ${isError ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              Okay, got it
            </button>
          </div>
        );
      }}
    </ModalWrapper>
  );
}