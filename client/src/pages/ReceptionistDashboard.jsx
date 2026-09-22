import React, { useState, useEffect, useMemo } from 'react';
import { api, socket } from '../api';

export default function ReceptionistDashboard({ user }) {
  const [services, setServices] = useState([]);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [latestTicket, setLatestTicket] = useState(null);
  const [queue, setQueue] = useState([]);
  const [priorityGroups, setPriorityGroups] = useState([]);
  
  const fetchData = async () => {
    try {
      const [servicesData, queueData, priorityGroupsData] = await Promise.all([
        api.getServices(),
        api.getWaitingQueue(),
        api.getPriorityGroups()
      ]);
      setServices(servicesData);
      setQueue(queueData);
      setPriorityGroups(priorityGroupsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    socket.on('queueUpdated', fetchData);
    socket.on('ticketCreated', fetchData);
    socket.on('ticketDeleted', fetchData);
    socket.on('priorityGroupsUpdated', fetchData);
    return () => {
      socket.off('queueUpdated', fetchData);
      socket.off('ticketCreated', fetchData);
      socket.off('ticketDeleted', fetchData);
      socket.off('priorityGroupsUpdated', fetchData);
    };
  }, []);

  const handleSelectService = (serviceId) => {
    setSelectedServiceId(serviceId);
    setShowPriorityModal(true);
  };

  const handleGenerateTicket = async (priorityType) => {
    try {
      setShowPriorityModal(false);
      // createdByUserId is the receptionist
      const ticket = await api.generateTicket(selectedServiceId, user.id, priorityType);
      setLatestTicket(ticket);
      
      setTimeout(() => {
        setLatestTicket(null);
      }, 8000);
    } catch (err) {
      console.error(err);
    }
  };

  const newAppQueue = useMemo(() => queue.filter(t => t.service.name === 'New Application'), [queue]);
  const renewalQueue = useMemo(() => queue.filter(t => t.service.name === 'Renewal'), [queue]);
  const retirementQueue = useMemo(() => queue.filter(t => t.service.name === 'Retirement'), [queue]);

  const renderQueueList = (title, filteredQueue, textColorClass, borderColorClass) => {
    return (
      <div className={`card flex-1 min-h-0 flex flex-col p-3 bg-surface border ${borderColorClass} rounded-md`}>
        <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
          <h4 className={`${textColorClass} m-0 text-base font-semibold`}>{title}</h4>
          <span className={`bg-surface ${textColorClass} px-2 py-0.5 rounded text-xs font-bold border ${borderColorClass}`}>
            {filteredQueue.length}
          </span>
        </div>

        {filteredQueue.length === 0 ? (
          <p className={`${textColorClass} opacity-70 text-center mt-2 text-xs m-0`}>No tickets</p>
        ) : (
          <div className={`flex-1 min-h-0 flex flex-col border-t border-b ${borderColorClass} mt-1`}>
            <div className="flex-1 overflow-y-auto px-0.5 py-1 flex flex-col gap-1">
              {filteredQueue.map(ticket => (
                <div key={ticket.id} className={`flex justify-between items-center px-2.5 py-1.5 bg-surface rounded border ${borderColorClass} shrink-0 flex-wrap gap-2`}>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-base font-extrabold ${textColorClass}`}>{ticket.number}</span>
                      {ticket.priorityType && ticket.priorityType !== 'REGULAR' && (
                        <span title={`Priority: ${ticket.priorityType}`} className="bg-danger text-white text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider">
                          {priorityGroups.find(g => g.name === ticket.priorityType)?.shortLabel || ticket.priorityType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container flex flex-col gap-4 py-4 overflow-hidden" style={{ height: 'calc(100vh - 90px)' }}>
      
      {/* Top Section: Issue Ticket (1/3 space) */}
      <div className="card flex flex-col min-h-0 overflow-hidden p-6 bg-surface border border-border rounded-lg">
        <h2 className="m-0 mb-6 flex items-center gap-2 shrink-0 text-xl text-text-main font-semibold">
          Issue New Ticket
        </h2>
        
        {latestTicket ? (
          <div className="text-center p-6 border-2 border-dashed border-success rounded-xl bg-bg-color">
            <h3 className="text-text-muted m-0">Successfully Issued:</h3>
            <h1 className="text-5xl text-success my-4 font-extrabold">{latestTicket.number}</h1>
            <p className="text-base m-0">Priority: <strong>{latestTicket.priorityType}</strong></p>
            {latestTicket.estimatedWaitMins > 0 && (
              <p className="text-sm mt-2 text-warning m-0 font-medium">
                Estimated Wait: ~{latestTicket.estimatedWaitMins} mins
              </p>
            )}
            <button 
              onClick={() => setLatestTicket(null)}
              className="btn btn-primary mt-6 px-6 py-2.5 rounded-md font-bold text-base"
            >
              Issue Another Ticket
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 flex-1">
            {services.map(s => (
              <button
                key={s.id}
                onClick={() => handleSelectService(s.id)}
                className="btn flex flex-col items-center justify-center p-6 bg-bg-color border border-border rounded-lg cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-md hover:-translate-y-1"
              >
                <span className="text-3xl font-extrabold text-primary mb-3">{s.prefix}</span>
                <h3 className="m-0 text-text-main text-base font-semibold">{s.name}</h3>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section: Waiting Queues Grid (2/3 space) */}
      <div className="flex flex-col flex-[2] min-h-0 overflow-hidden">
        <h3 className="mb-2 shrink-0 text-base font-semibold">Current Waiting Queue</h3>
        
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] grid-rows-[minmax(0,1fr)] gap-3 flex-1 min-h-0">
          {renderQueueList('New', newAppQueue, 'text-success', 'border-success')}
          {renderQueueList('Renewal', renewalQueue, 'text-primary', 'border-primary')}
          {renderQueueList('Retirement', retirementQueue, 'text-danger', 'border-danger')}
        </div>
      </div>

      {/* Priority Modal */}
      {showPriorityModal && (
        <div className="modal-overlay fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4">
          <div className="modal-card bg-surface rounded-xl w-full max-w-[500px] flex flex-col overflow-hidden shadow-2xl p-8 text-center">
            <h2 className="mb-6 text-text-main font-bold text-2xl">Select Priority Group</h2>
            
            <div className="flex flex-col gap-4">
              {priorityGroups.filter(g => g.isActive).map(group => (
                <button 
                  key={group.id} 
                  onClick={() => handleGenerateTicket(group.name)} 
                  className="btn bg-primary text-white p-4 text-lg rounded-lg font-semibold hover:bg-primary-hover shadow-sm"
                >
                  {group.label}
                </button>
              ))}
              
              <div className="my-2 border-t border-border"></div>
              
              <button onClick={() => handleGenerateTicket('REGULAR')} className="btn bg-surface border-2 border-border text-text-main p-4 text-lg rounded-lg font-semibold hover:bg-bg-color shadow-sm">None / Regular</button>
            </div>
            
            <button onClick={() => setShowPriorityModal(false)} className="btn mt-6 bg-transparent text-text-muted border-none cursor-pointer hover:text-text-main text-base font-medium">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
