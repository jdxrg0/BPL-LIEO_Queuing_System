import React, { useState, useEffect } from 'react';
import { api, socket } from '../api';
import { Trash2 } from 'lucide-react';
import HoldActionBtn from './HoldActionBtn';
import HoldButton from './HoldButton';
import HoldTextButton from './HoldTextButton';

export default function StaffDashboard({ user }) {
  const [services, setServices] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentServingList, setCurrentServingList] = useState([]);
  const [postponedTickets, setPostponedTickets] = useState([]);
  const [showReturnsModal, setShowReturnsModal] = useState(false);

  const activeCounterId = user?.counterId;
  const activeCounterName = user?.counter?.name || 'Unknown Window';

  const fetchInitialData = async () => {
    try {
      const [servicesData, queueData, servingData, postponedData] = await Promise.all([
        api.getServices(),
        api.getWaitingQueue(),
        api.getMyServing(user.id),
        api.getPostponedTickets()
      ]);
      setServices(servicesData);
      setQueue(queueData);
      setCurrentServingList(servingData);
      setPostponedTickets(postponedData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInitialData();
    
    socket.on('queueUpdated', fetchInitialData);
    socket.on('ticketCreated', fetchInitialData);
    socket.on('ticketDeleted', fetchInitialData);

    return () => {
      socket.off('queueUpdated');
      socket.off('ticketCreated');
      socket.off('ticketDeleted');
    };
  }, []);


  const handleDeleteTicket = async (id) => {
    try {
      await api.deleteTicket(id);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleCallNext = async (ticketId) => {
    if (!activeCounterId) return alert('You are not assigned to a window. Contact an Admin.');
    try {
      await api.callTicket(ticketId, activeCounterId, user.id);
      fetchInitialData(); // Re-fetch all data to get updated queue and serving list
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecall = (ticketId) => {
    if (activeCounterId) {
      api.callTicket(ticketId, activeCounterId, user.id);
    }
  };

  const handleStatusUpdate = async (ticketId, status) => {
    try {
      await api.updateStatus(ticketId, status);
      setCurrentServingList(prev => prev.filter(t => t.id !== ticketId));
      fetchInitialData(); // Ensure queue and everything else is synced
    } catch (err) {
      console.error(err);
    }
  };

  const renderQueueList = (serviceName, title, mainColor, bgColor, borderColor) => {
    const filteredQueue = queue.filter(t => t.service.name === serviceName);
    
    // Check if the user caters this service (even if admin)
    let isCatered = false;
    if (user) {
      const lower = title.toLowerCase();
      if (lower.includes('renew') && user.caterRenewal) isCatered = true;
      if (lower.includes('new') && !lower.includes('renew') && user.caterNew) isCatered = true;
      if (lower.includes('retire') && user.caterRetirement) isCatered = true;
    }
    
    return (
      <div className="card" style={{ 
        flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '0.75rem', 
        background: bgColor, border: `1px solid ${borderColor}`,
        opacity: isCatered ? 1 : 0.5,
        filter: isCatered ? 'none' : 'grayscale(100%)',
        transition: 'all 0.3s ease',
        borderRadius: '6px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 style={{ color: mainColor, margin: 0, fontSize: '0.95rem' }}>{title}</h4>
          <span style={{ background: 'var(--surface)', color: mainColor, padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${borderColor}` }}>
            {filteredQueue.length}
          </span>
        </div>

        {filteredQueue.length === 0 ? (
          <p style={{ color: mainColor, opacity: 0.7, textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', margin: 0 }}>No tickets</p>
        ) : (
          <div style={{ 
            flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
            borderTop: `1px solid ${borderColor}`,
            borderBottom: `1px solid ${borderColor}`,
            marginTop: '0.25rem'
          }}>
            <div style={{ flex: 1, overflowY: 'auto', scrollbarGutter: 'stable', padding: '0.25rem 0.1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {filteredQueue.map(ticket => (
                <div key={ticket.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.6rem', background: 'var(--surface)', borderRadius: '4px', border: `1px solid ${borderColor}`, flexShrink: 0, flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: mainColor }}>{ticket.number}</span>
                      {new Date(ticket.createdAt) < new Date(new Date().setHours(0,0,0,0)) && (
                        <span title="Returning Client" style={{ background: 'var(--danger)', color: 'white', fontSize: '0.6rem', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '0.05em' }}>PRIORITY</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    {(ticket.createdByUserId === user.id || user?.role === 'ADMIN') && (
                      <HoldButton
                        onClick={() => handleDeleteTicket(ticket.id)}
                        icon={<Trash2 size={12} />}
                        colorMap={{ bg: 'var(--bg-color)', main: 'var(--danger)' }}
                        tooltip="Hold to delete"
                        holdTime={800}
                      />
                    )}
                    <HoldTextButton 
                      onClick={() => handleCallNext(ticket.id)} 
                      text="Call"
                      disabled={!activeCounterId || !isCatered}
                      colorMap={{ bg: 'var(--surface)', main: mainColor }}
                      tooltip="Hold to call ticket"
                      holdTime={600}
                      style={{ fontSize: '0.75rem' }}
                    />
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
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1rem', paddingBottom: '1rem', height: 'calc(100vh - 90px)', overflow: 'hidden' }}>
      
      {/* Top Section: Currently Serving (1/3 space) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', padding: '1rem', paddingBottom: '0.2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, fontSize: '1.05rem', color: 'var(--text)' }}>
            Currently Serving
            {currentServingList.length > 0 && (
              <span style={{ background: 'var(--primary)', color: '#ffffff', padding: '0.1rem 0.4rem', borderRadius: '1rem', fontSize: '0.75rem' }}>
                {currentServingList.length}
              </span>
            )}
          </h3>
          <button onClick={() => setShowReturnsModal(true)} style={{ background: 'var(--warning)', color: '#ffffff', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
            Returns {postponedTickets.length > 0 && `(${postponedTickets.length})`}
          </button>
        </div>
        
        <div style={{ 
          flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          marginTop: '0.5rem', marginBottom: '0.5rem'
        }}>
          <div style={{ flex: 1, overflowY: 'auto', scrollbarGutter: 'stable', padding: '0.25rem 0.1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {currentServingList.length === 0 ? (
             <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.75rem' }}>
               <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>No ticket currently serving. Call the next from the queue.</p>
             </div>
          ) : (
            currentServingList.map(ticket => {
              const colors = (() => {
                switch(ticket.service.prefix) {
                  case 'NW': return { bg: 'var(--surface)', border: 'var(--success)', text: 'var(--success)', badgeBg: 'var(--bg-color)' };
                  case 'RNW': return { bg: 'var(--surface)', border: 'var(--primary)', text: 'var(--primary)', badgeBg: 'var(--bg-color)' };
                  case 'R': return { bg: 'var(--surface)', border: 'var(--danger)', text: 'var(--danger)', badgeBg: 'var(--bg-color)' };
                  default: return { bg: 'var(--bg-color)', border: 'var(--border)', text: 'var(--text-main)', badgeBg: 'var(--bg-color)' };
                }
              })();
              
              return (
              <div key={ticket.id} className="card" style={{ background: colors.bg, border: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.6rem', borderRadius: '4px', flexShrink: 0, flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1rem', color: colors.text, margin: 0, lineHeight: 1, fontWeight: 800 }}>{ticket.number}</h2>
                  <span style={{ color: colors.text, fontSize: '0.75rem', fontWeight: 600, background: colors.badgeBg, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{ticket.service.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  <HoldActionBtn onAction={() => handleRecall(ticket.id)} text="Recall" className="btn" style={{ background: 'var(--primary)', color: '#ffffff', padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }} />
                  <HoldActionBtn onAction={() => handleStatusUpdate(ticket.id, 'COMPLETED')} text="Done" className="btn" style={{ background: 'var(--success)', color: '#ffffff', padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }} />
                  <HoldActionBtn onAction={() => handleStatusUpdate(ticket.id, 'NO_SHOW')} text="Skip" className="btn" style={{ background: 'var(--danger)', color: '#ffffff', padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }} />
                  <HoldActionBtn onAction={() => handleStatusUpdate(ticket.id, 'POSTPONED')} text="Tomorrow" className="btn" style={{ background: 'var(--warning)', color: '#ffffff', padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }} />
                </div>
              </div>
            )})
          )}
        </div>
        </div>
      </div>

      {/* Bottom Section: Waiting Queues Grid (2/3 space) */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 2, minHeight: 0, overflow: 'hidden' }}>
        <h3 style={{ marginBottom: '0.5rem', flexShrink: 0, fontSize: '1rem' }}>Waiting Queue Table</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gridTemplateRows: 'minmax(0, 1fr)', gap: '0.75rem', flex: 1, minHeight: 0 }}>
          {renderQueueList('New Application', 'New', 'var(--success)', 'var(--surface)', 'var(--border)')}
          {renderQueueList('Renewal', 'Renewal', 'var(--primary)', 'var(--surface)', 'var(--border)')}
          {renderQueueList('Retirement', 'Retirement', 'var(--danger)', 'var(--surface)', 'var(--border)')}
        </div>
      </div>

      {/* Returns Modal */}
      {showReturnsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '8px', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem' }}>Postponed Tickets</h3>
              <button onClick={() => setShowReturnsModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {postponedTickets.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', margin: '2rem 0' }}>No tickets are currently postponed.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {postponedTickets.map(ticket => (
                    <div key={ticket.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--surface)', border: '1px solid var(--warning)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--warning)' }}>{ticket.number}</span>
                        <span style={{ color: 'var(--warning)', fontSize: '0.85rem', fontWeight: 600, background: 'var(--bg-color)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>{ticket.service.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                      <button 
                        onClick={() => {
                          handleStatusUpdate(ticket.id, 'WAITING');
                          setShowReturnsModal(false);
                        }} 
                        className="btn" 
                        style={{ background: 'var(--success)', color: '#ffffff', border: 'none', padding: '0.4rem 1rem', fontSize: '0.9rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Arrived!
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
