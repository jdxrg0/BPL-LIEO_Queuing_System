import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api, socket } from '../api';
import { getServiceSlots } from '../utils/serviceSlots';

export default function Kiosk() {
  const [services, setServices] = useState<any[]>([]);
  const [priorityGroups, setPriorityGroups] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<any>(null);
  const [latestTicket, setLatestTicket] = useState<any>(null);
  
  const fetchData = async () => {
    try {
      const [servicesData, priorityGroupsData, settingsData] = await Promise.all([
        api.getServices(),
        api.getPriorityGroups(),
        api.getSettings()
      ]);
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setPriorityGroups(Array.isArray(priorityGroupsData) ? priorityGroupsData : []);
      setSettings(settingsData);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const handleUpdate = () => fetchData();
    socket.on('priorityGroupsUpdated', handleUpdate);
    socket.on('settingsUpdated', handleUpdate);
    return () => {
      socket.off('priorityGroupsUpdated', handleUpdate);
      socket.off('settingsUpdated', handleUpdate);
    };
  }, []);

  const handleSelectService = (serviceId) => {
    setSelectedServiceId(serviceId);
    setShowPriorityModal(true);
  };

  const handleGenerateTicket = async (priorityType) => {
    try {
      setShowPriorityModal(false);
      // null user id for kiosk
      const ticket = await api.generateTicket(selectedServiceId, null, priorityType);
      setLatestTicket(ticket);
      
      setTimeout(() => {
        setLatestTicket(null);
      }, 10000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const activePriorityGroups = useMemo(() => {
    return priorityGroups.filter(g => g.isActive && g.name !== 'REGULAR');
  }, [priorityGroups]);

  // Global full-screen layout
  if (latestTicket) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-surface text-center p-8 animate-slide-up">
        <h1 className="text-5xl font-black text-primary mb-2">Please take your ticket</h1>
        <p className="text-2xl text-text-muted mb-8">{settings?.ticketHeaderText || "Scan to track your ticket"}</p>
        
        <div className="bg-white p-8 rounded-2xl shadow-2xl border-4 border-primary mb-8 inline-block">
          <div className="text-8xl font-black text-primary mb-4 leading-none">{latestTicket.number}</div>
          <div className="text-3xl font-bold text-slate-800 uppercase tracking-widest mb-6">
            {latestTicket.service?.name || latestTicket.serviceType}
          </div>
          <div className="bg-slate-100 p-4 rounded-xl flex items-center justify-center mb-4">
            <QRCodeSVG value={`${window.location.origin}/tracker?ticket=${latestTicket.number}`} size={160} level="H" />
          </div>
          <div className="text-lg font-bold text-slate-500 uppercase">{latestTicket.priorityType !== 'REGULAR' ? latestTicket.priorityType + ' PRIORITY' : 'REGULAR PRIORITY'}</div>
        </div>
        
        <p className="text-xl text-text-muted">{settings?.ticketFooterText || "Please wait for your number."}</p>
        
        <button 
          onClick={() => setLatestTicket(null)}
          className="mt-12 px-8 py-4 bg-slate-200 text-slate-600 rounded-xl font-bold text-xl active:bg-slate-300"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg-color overflow-hidden">
      {/* Header */}
      <div className="bg-primary text-white p-8 shadow-md shrink-0 text-center">
        {settings?.logoBase64 && (
          <img src={settings.logoBase64} alt="Logo" className="h-24 object-contain mx-auto mb-4" />
        )}
        <h1 className="text-4xl font-black m-0 tracking-widest uppercase">
          Welcome to {settings?.websiteName || 'BPLO'}
        </h1>
        <p className="text-xl text-indigo-100 mt-2">Please select a service to get your queue number</p>
      </div>
      
      {/* Services Grid */}
      <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
          {services.map(service => (
            <button
              key={service.id}
              onClick={() => handleSelectService(service.id)}
              className="bg-surface rounded-2xl p-8 border-4 border-border hover:border-primary hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group active:scale-95"
            >
              <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="text-5xl font-black">{service.prefix}</span>
              </div>
              <h2 className="text-3xl font-bold text-text-main text-center leading-tight">
                {service.name}
              </h2>
            </button>
          ))}
        </div>
      </div>

      {/* Priority Modal */}
      {showPriorityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 animate-slide-up">
            <h2 className="text-4xl font-black text-center mb-8 text-text-main">Select Priority Group</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => handleGenerateTicket('REGULAR')}
                className="bg-slate-100 hover:bg-slate-200 border-4 border-slate-300 rounded-2xl p-8 text-left transition-all active:scale-95"
              >
                <div className="text-3xl font-black text-slate-800 mb-2">REGULAR</div>
                <div className="text-xl font-semibold text-slate-600">Standard Service</div>
              </button>
              
              {activePriorityGroups.map(group => (
                <button
                  key={group.id}
                  onClick={() => handleGenerateTicket(group.name)}
                  className="bg-indigo-50 hover:bg-indigo-100 border-4 border-primary rounded-2xl p-8 text-left transition-all active:scale-95"
                >
                  <div className="text-3xl font-black text-primary mb-2">{group.label}</div>
                  <div className="text-xl font-semibold text-indigo-700">{group.shortLabel || group.name}</div>
                </button>
              ))}
            </div>
            
            <div className="mt-8 text-center">
              <button 
                onClick={() => setShowPriorityModal(false)}
                className="px-8 py-4 bg-white border-2 border-slate-300 text-slate-600 rounded-xl font-bold text-xl hover:bg-slate-50 transition-colors"
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

