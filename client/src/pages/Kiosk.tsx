import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function Kiosk() {
  const [services, setServices] = useState<any[]>([]);
  const [latestTicket, setLatestTicket] = useState<any>(null);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<any>(null);
  const [priorityGroups, setPriorityGroups] = useState<any[]>([]);

  useEffect(() => {
    api.getServices().then(setServices).catch(console.error);
    api.getPriorityGroups().then(setPriorityGroups).catch(console.error);
  }, []);

  const handleSelectService = (serviceId) => {
    setSelectedServiceId(serviceId);
    setShowPriorityModal(true);
  };

  const handleGenerateTicket = async (priorityType) => {
    try {
      setShowPriorityModal(false);
      // null for createdByUserId because it's self-service kiosk
      const ticket = await api.generateTicket(selectedServiceId, null, priorityType);
      setLatestTicket(ticket);
      setTimeout(() => setLatestTicket(null), 10000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to generate ticket');
    }
  };

  return (
    <div className="min-h-screen bg-bg-color flex flex-col items-center justify-center p-8">
      {latestTicket ? (
        <div className="card p-12 bg-surface text-center shadow-2xl rounded-2xl max-w-2xl w-full border border-success animate-scale-up">
          <h2 className="text-3xl font-bold text-success mb-2">You're all set!</h2>
          <p className="text-text-muted mb-8 text-xl">Please take a picture of this screen or wait for your number to be called.</p>
          
          <div className="bg-bg-color p-8 rounded-xl border border-border inline-block">
            <h1 className="text-8xl font-black text-text-main m-0 mb-4 tracking-tighter">{latestTicket.number}</h1>
            <p className="text-2xl font-bold text-primary m-0 uppercase tracking-widest">{latestTicket.priorityType}</p>
          </div>
          
          {latestTicket.estimatedWaitMins > 0 && (
            <p className="text-xl mt-8 text-warning font-semibold bg-warning/10 p-4 rounded-lg inline-block">
              Estimated Wait: ~{latestTicket.estimatedWaitMins} mins
            </p>
          )}

          <div className="mt-12">
            <button 
              onClick={() => setLatestTicket(null)}
              className="btn btn-primary px-8 py-4 text-xl rounded-xl font-bold"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold text-text-main mb-4 tracking-tight">Welcome</h1>
            <p className="text-2xl text-text-muted">Please tap the service you need</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(s => (
              <button
                key={s.id}
                onClick={() => handleSelectService(s.id)}
                className="btn flex flex-col items-center justify-center p-12 bg-surface border-2 border-border rounded-2xl cursor-pointer transition-all duration-300 hover:border-primary hover:shadow-xl hover:-translate-y-2 group"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-4xl font-extrabold text-primary">{s.prefix}</span>
                </div>
                <h3 className="m-0 text-text-main text-2xl font-bold text-center">{s.name}</h3>
                {s.description && <p className="text-text-muted mt-3 text-center text-sm">{s.description}</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      {showPriorityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-scale-up border border-border">
            <div className="px-8 py-6 border-b border-border bg-bg-color">
              <h3 className="m-0 text-2xl font-bold text-text-main">Select Priority</h3>
              <p className="text-text-muted mt-2 text-lg">Are you part of any special priority group?</p>
            </div>
            
            <div className="p-8 grid gap-4 grid-cols-2">
              <button
                onClick={() => handleGenerateTicket('REGULAR')}
                className="btn p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left flex flex-col gap-2"
              >
                <span className="text-xl font-bold text-text-main">Regular</span>
                <span className="text-text-muted text-sm">Standard queuing</span>
              </button>
              
              {priorityGroups.filter(g => g.isActive).map(group => (
                <button
                  key={group.id}
                  onClick={() => handleGenerateTicket(group.name)}
                  className="btn p-6 rounded-xl border-2 border-border hover:border-warning hover:bg-warning/5 transition-all text-left flex flex-col gap-2"
                >
                  <span className="text-xl font-bold text-warning">{group.name}</span>
                  {group.description && <span className="text-text-muted text-sm">{group.description}</span>}
                </button>
              ))}
            </div>
            
            <div className="px-8 py-6 border-t border-border bg-bg-color flex justify-end">
              <button 
                className="btn px-6 py-3 rounded-lg font-bold text-text-muted hover:bg-black/5"
                onClick={() => setShowPriorityModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
