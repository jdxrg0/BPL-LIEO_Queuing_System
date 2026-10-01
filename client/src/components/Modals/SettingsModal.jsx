import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, Shield, AlertTriangle, Image as ImageIcon, Check, X, Plus, Monitor, Cpu, Volume2, Ticket, Download } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import ImageCropperModal from './ImageCropperModal';
import { api } from '../../api';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  user, 
  settings: initialSettings,
  priorityGroups,
  onChangePassword,
  onResetDataRequest
}) {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('lastSettingsTab');
    if (saved === 'general') return 'branding';
    return saved || (user?.role === 'ADMIN' ? 'branding' : 'account');
  });
  
  useEffect(() => {
    localStorage.setItem('lastSettingsTab', activeTab);
  }, [activeTab]);

  const [pendingCropImage, setPendingCropImage] = useState(null);
  const [cropTarget, setCropTarget] = useState(null);

  // General Settings State
  const [settingsForm, setSettingsForm] = useState({
    websiteName: '', logoBase64: '', autoBalanceThreshold: 15, slaThreshold: 15, 
    zipperRatio: 3, agingRate: 0.1, skipLimit: 5, autoAdaptive: false,
    ticketHeaderText: "Scan to track your ticket", ticketFooterText: "Please wait for your number."
  });
  const logoInputRef = useRef(null);

  // Account State
  const [accountForm, setAccountForm] = useState({ name: '', profilePictureBase64: '' });
  const profilePicInputRef = useRef(null);

  // Priority Groups State
  const [localPriorityGroups, setLocalPriorityGroups] = useState(priorityGroups || []);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editGroupForm, setEditGroupForm] = useState({});
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({ name: '', label: '', shortLabel: '', weight: 1, slaThreshold: '' });

  // UX Improvement States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dangerConfirmText, setDangerConfirmText] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  // Sync initial props
  useEffect(() => {
    if (isOpen) setErrorMessage('');
    if (isOpen && initialSettings) {
      setSettingsForm({
        websiteName: initialSettings.websiteName || '',
        logoBase64: initialSettings.logoBase64 || '',
        autoBalanceThreshold: initialSettings.autoBalanceThreshold || 15,
        slaThreshold: initialSettings.slaThreshold || 15,
        zipperRatio: initialSettings.zipperRatio || 3,
        agingRate: initialSettings.agingRate || 0.1,
        skipLimit: initialSettings.skipLimit || 5,
        autoAdaptive: initialSettings.autoAdaptive || false,
        ticketHeaderText: initialSettings.ticketHeaderText || "Scan to track your ticket",
        ticketFooterText: initialSettings.ticketFooterText || "Please wait for your number."
      });
    }
  }, [initialSettings, isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      setAccountForm({ name: user.name || '', profilePictureBase64: user.profilePictureBase64 || '' });
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setLocalPriorityGroups(priorityGroups || []);
    }
  }, [priorityGroups, isOpen]);

  const triggerSuccessAndClose = () => {
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setErrorMessage('');
      await api.updateSettings(settingsForm);
      triggerSuccessAndClose();
    } catch (err) { setErrorMessage('Failed to save settings. Please try again.'); } finally { setIsSaving(false); }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setErrorMessage('');
      await api.updateUserProfile(user.id, accountForm);
      triggerSuccessAndClose();
    } catch (err) { setErrorMessage('Failed to save profile. Please try again.'); } finally { setIsSaving(false); }
  };

  const handleSavePriorityGroup = async (id) => {
    try {
      setIsSaving(true);
      setErrorMessage('');
      await api.updatePriorityGroup(id, editGroupForm);
      setEditingGroupId(null);
    } catch (e) { setErrorMessage('Failed to save group.'); console.error(e); } finally { setIsSaving(false); }
  };

  const handleDeletePriorityGroup = async (id) => {
    try {
      setErrorMessage('');
      await api.deletePriorityGroup(id);
    } catch (e) { setErrorMessage('Failed to delete group.'); console.error(e); }
  };

  const handleAddPriorityGroup = async () => {
    try {
      setErrorMessage('');
      if (!newGroupForm.name || !newGroupForm.label) {
        setErrorMessage("Name and Label are required.");
        return;
      }
      setIsSaving(true);
      await api.createPriorityGroup(newGroupForm);
      setShowAddGroup(false);
      setNewGroupForm({ name: '', label: '', shortLabel: '', weight: 1, slaThreshold: '' });
    } catch (e) { setErrorMessage('Failed to add group.'); console.error(e); } finally { setIsSaving(false); }
  };

  // Reusable Classes
  const inputClass = "w-full p-2.5 rounded-lg border border-border/60 bg-surface/50 dark:bg-black/20 text-text-main text-[13px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-inner";
  const btnPrimary = "px-5 py-2 bg-primary text-white rounded-lg font-semibold border-none cursor-pointer hover:bg-primary-hover shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all text-[13px] flex items-center justify-center min-w-[120px]";
  const btnSecondary = "px-5 py-2 bg-surface text-text-main border border-border/60 rounded-lg font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-[13px] shadow-sm hover:shadow active:scale-95";
  const btnSuccess = "px-5 py-2 bg-emerald-500 text-white rounded-lg font-semibold border-none shadow-lg shadow-emerald-500/25 transition-all text-[13px] flex items-center justify-center gap-2 min-w-[120px]";

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [dirtyFields, setDirtyFields] = useState([]);

  const handleClose = () => {
    const dirty = [];
    if (accountForm.name !== (user?.name || '')) dirty.push('Profile Name');
    if (accountForm.profilePictureBase64 !== (user?.profilePictureBase64 || '')) dirty.push('Profile Picture');
    
    if (settingsForm.websiteName !== (initialSettings?.websiteName || '')) dirty.push('Website Name');
    if (settingsForm.logoBase64 !== (initialSettings?.logoBase64 || '')) dirty.push('System Logo');
    if (settingsForm.autoBalanceThreshold !== (initialSettings?.autoBalanceThreshold || 15)) dirty.push('Auto-Balance Threshold');
    if (settingsForm.slaThreshold !== (initialSettings?.slaThreshold || 15)) dirty.push('Global SLA Threshold');
    if (settingsForm.zipperRatio !== (initialSettings?.zipperRatio || 3)) dirty.push('Zipper Ratio');
    if (settingsForm.agingRate !== (initialSettings?.agingRate || 0.1)) dirty.push('Aging Rate');
    if (settingsForm.skipLimit !== (initialSettings?.skipLimit || 5)) dirty.push('Skip Limit');
    if (settingsForm.autoAdaptive !== (initialSettings?.autoAdaptive || false)) dirty.push('Auto-Adaptive Routing');
    if (settingsForm.ticketHeaderText !== (initialSettings?.ticketHeaderText || "Scan to track your ticket")) dirty.push('Ticket Header Text');
    if (settingsForm.ticketFooterText !== (initialSettings?.ticketFooterText || "Please wait for your number.")) dirty.push('Ticket Footer Text');

    if (dirty.length > 0) {
      setDirtyFields(dirty);
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <ModalWrapper isOpen={isOpen} zIndex={1000} onBackgroundClick={handleClose}>
        <div className="bg-surface/95 dark:bg-surface/90 backdrop-blur-xl rounded-2xl w-[90vw] max-w-4xl h-[85vh] max-h-[650px] flex overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/40 border border-border/50 relative ring-1 ring-black/5 dark:ring-white/5">

          {/* Close Button — lives on the card, never inside a scrollable tab */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted hover:text-text-main transition-colors border border-border shadow-sm z-[100] cursor-pointer"
            aria-label="Close Settings"
          >
            <X size={18} />
          </button>


        {/* Left Nav */}
        <div className="w-[220px] md:w-[260px] bg-bg-color/50 dark:bg-bg-color/30 border-r border-border/40 p-5 md:p-6 flex flex-col z-10 shrink-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
              <Settings className="text-white drop-shadow-sm" size={20} />
            </div>
            <h2 className="m-0 text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-text-main to-text-muted tracking-tight">Settings</h2>
          </div>
          
          <nav className="flex flex-col gap-2 relative z-10">
            <NavItem 
              icon={<User size={20} />} 
              label="Account Profile" 
              isActive={activeTab === 'account'} 
              onClick={() => setActiveTab('account')} 
            />
            {user?.role === 'ADMIN' && (
              <>
                <NavItem 
                  icon={<Ticket size={20} />} 
                  label="Branding & Tickets" 
                  isActive={activeTab === 'branding'} 
                  onClick={() => setActiveTab('branding')} 
                />
                <NavItem 
                  icon={<Volume2 size={20} />} 
                  label="Displays & Audio" 
                  isActive={activeTab === 'displays'} 
                  onClick={() => setActiveTab('displays')} 
                />
                <NavItem 
                  icon={<Cpu size={20} />} 
                  label="Smart Engine Rules" 
                  isActive={activeTab === 'engine'} 
                  onClick={() => setActiveTab('engine')} 
                />
                <NavItem 
                  icon={<Shield size={20} />} 
                  label="Priority Groups" 
                  isActive={activeTab === 'priority'} 
                  onClick={() => setActiveTab('priority')} 
                />
                <NavItem 
                  icon={<AlertTriangle size={20} />} 
                  label="Danger Zone" 
                  isActive={activeTab === 'danger'} 
                  onClick={() => setActiveTab('danger')} 
                  isDanger 
                />
              </>
            )}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-surface z-10 relative overflow-hidden">
          
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent dark:from-indigo-900/10 pointer-events-none"></div>

          <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
            {/* ACCOUNT PROFILE */}
            {activeTab === 'account' && (
              <div className="animate-slide-up h-full flex flex-col">
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-5 md:p-8 pr-14 pb-0 block">
                  <Header title="Account Profile" description="Manage your personal information and profile picture." error={errorMessage} />

                  {/* === AVATAR — primary focal point === */}
                  <div className="flex flex-col items-center gap-3 mb-8">
                    <div className="relative group cursor-pointer" onClick={() => profilePicInputRef.current?.click()}>
                      <div className="w-24 h-24 rounded-full bg-surface border-4 border-border flex items-center justify-center overflow-hidden shadow-lg transition-all group-hover:border-primary">
                        {accountForm.profilePictureBase64 ? (
                          <img src={accountForm.profilePictureBase64} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User size={36} className="text-text-muted" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary border-2 border-surface flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon size={13} className="text-white" />
                      </div>
                    </div>
                    <input
                      type="file" accept="image/*" ref={profilePicInputRef} className="hidden"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => { setPendingCropImage(reader.result); setCropTarget('profile'); };
                          reader.readAsDataURL(file);
                        }
                        e.target.value = '';
                      }}
                    />
                    <div className="text-center">
                      <p className="text-base font-bold text-text-main m-0">{accountForm.name || user?.name || 'Your Name'}</p>
                      <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        user?.role === 'ADMIN'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}>
                        <Shield size={9} strokeWidth={3} /> {user?.role || 'STAFF'}
                      </span>
                    </div>
                    {accountForm.profilePictureBase64 && (
                      <button
                        onClick={() => setAccountForm(prev => ({ ...prev, profilePictureBase64: '' }))}
                        className="text-xs font-semibold text-text-muted hover:text-rose-500 transition-colors bg-transparent border-none cursor-pointer p-0 -mt-1"
                      >
                        Remove photo
                      </button>
                    )}
                  </div>

                  {/* === FORM FIELDS — secondary === */}
                  <div className="flex flex-col gap-5 mb-6">
                    <div>
                      <label className="block mb-1.5 font-bold text-[11px] text-text-muted uppercase tracking-widest">Full Name</label>
                      <input
                        type="text" value={accountForm.name}
                        onChange={e => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                        className={inputClass} placeholder="e.g. Juan dela Cruz"
                      />
                    </div>
                    {user?.email && (
                      <div>
                        <label className="block mb-1.5 font-bold text-[11px] text-text-muted uppercase tracking-widest">Email Address</label>
                        <div className={`${inputClass} flex items-center gap-2 opacity-60 cursor-default select-none`}>
                          <span className="flex-1 truncate">{user.email}</span>
                          <span className="text-[10px] font-bold text-text-muted bg-border/50 px-2 py-0.5 rounded-full shrink-0">Read-only</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* === SECURITY — tertiary, at the bottom === */}
                  <div className="mt-auto mb-8 flex items-center justify-between p-4 rounded-2xl border border-border/40 bg-bg-color/50 dark:bg-black/10">
                    <div>
                      <p className="m-0 text-sm font-bold text-text-main">Password & Security</p>
                      <p className="m-0 mt-0.5 text-xs text-text-muted">Last changed: never</p>
                    </div>
                    <button onClick={onChangePassword} className={btnSecondary}>Change</button>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-surface/90 backdrop-blur-md px-5 md:px-8 py-5 border-t border-border flex justify-end gap-2 shrink-0">
                  <button onClick={handleClose} className={btnSecondary} disabled={isSaving || saveSuccess}>Close</button>
                  <button onClick={handleSaveProfile} className={saveSuccess ? btnSuccess : btnPrimary} disabled={isSaving || saveSuccess}>
                    {saveSuccess ? <><Check size={16} strokeWidth={3} /> Saved!</> : isSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            )}



            {/* BRANDING SETTINGS */}
            {activeTab === 'branding' && (
              <div className="animate-slide-up h-full flex flex-col">
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-5 md:p-8 pr-14 pb-0 block">
                  <Header title="Branding & Display" description="Configure global application aesthetics and system logo." error={errorMessage} />
                
                <div className="mb-6">
                  <label className="block mb-2 font-bold text-[12px] text-text-muted uppercase tracking-widest">System Branding</label>
                  <div className="flex gap-5 bg-bg-color/50 dark:bg-black/10 p-5 rounded-2xl border border-border/40 shadow-sm backdrop-blur-sm">
                    <div className="w-[80px] h-[80px] shrink-0 rounded-xl bg-surface border-2 border-dashed border-border flex items-center justify-center overflow-hidden relative group">
                      {settingsForm.logoBase64 ? (
                        <>
                          <img src={settingsForm.logoBase64} alt="Logo" className="w-full h-full object-contain p-2" />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => setSettingsForm(prev => ({...prev, logoBase64: ''}))} className="text-white hover:text-rose-400 p-2 cursor-pointer bg-transparent border-none">
                               <X size={24} strokeWidth={3} />
                             </button>
                          </div>
                        </>
                      ) : (
                        <ImageIcon className="text-border" size={32} />
                      )}
                      <input 
                        type="file" accept="image/*" ref={logoInputRef} className="hidden"
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setPendingCropImage(reader.result);
                              setCropTarget('logo');
                            };
                            reader.readAsDataURL(file);
                          }
                          e.target.value = ''; // Reset input to allow selecting same file again
                        }}
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-3">
                      <input 
                        type="text" value={settingsForm.websiteName} onChange={e => setSettingsForm(prev => ({ ...prev, websiteName: e.target.value }))}
                        className={inputClass} placeholder="e.g. BPLO System"
                      />
                      <button onClick={() => logoInputRef.current?.click()} className="text-xs font-bold text-primary self-start hover:underline bg-transparent border-none cursor-pointer p-0">
                        Upload Custom Logo
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block mb-2 font-bold text-[12px] text-text-muted uppercase tracking-widest">Printed Ticket Instructions</label>
                  <div className="flex flex-col gap-4 bg-bg-color/50 dark:bg-black/10 p-5 rounded-2xl border border-border/40 shadow-sm backdrop-blur-sm">
                    <InputGroup 
                      label="Top Instruction Text" 
                      description="Appears directly above the QR code."
                      value={settingsForm.ticketHeaderText} 
                      onChange={val => setSettingsForm(prev => ({ ...prev, ticketHeaderText: val }))}
                      placeholder="e.g. Scan to track your ticket"
                      inputClass={inputClass}
                    />
                    <InputGroup 
                      label="Bottom Footer Text" 
                      description="Appears at the very bottom of the ticket."
                      value={settingsForm.ticketFooterText} 
                      onChange={val => setSettingsForm(prev => ({ ...prev, ticketFooterText: val }))}
                      placeholder="e.g. Please wait for your number."
                      inputClass={inputClass}
                    />
                    
                    <label className="flex items-center justify-between pt-2 border-t border-border/40 cursor-pointer group mt-2">
                      <div className="pr-4">
                        <span className="font-extrabold text-text-main text-sm block mb-0.5 group-hover:text-primary transition-colors">Show Estimated Wait Time (ETA)</span>
                        <span className="text-text-muted text-xs font-semibold leading-relaxed block">Print the AI-predicted wait time directly on the physical ticket.</span>
                      </div>
                      <div className="relative inline-flex items-center shrink-0">
                        <input type="checkbox" className="sr-only peer" checked={settingsForm.showWaitTimeOnTicket ?? true} onChange={e => setSettingsForm(prev => ({ ...prev, showWaitTimeOnTicket: e.target.checked }))} />
                        <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                      </div>
                    </label>
                  </div>
                </div>
                </div>
                <div className="bg-surface/90 backdrop-blur-md px-5 md:px-8 py-5 border-t border-border flex justify-end gap-2 shrink-0">
                  <button onClick={handleClose} className={btnSecondary} disabled={isSaving || saveSuccess}>Close</button>
                  <button onClick={handleSaveSettings} className={saveSuccess ? btnSuccess : btnPrimary} disabled={isSaving || saveSuccess}>
                    {saveSuccess ? (
                      <><Check size={16} strokeWidth={3} /> Saved!</>
                    ) : isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* DISPLAYS & AUDIO */}
            {activeTab === 'displays' && (
              <div className="animate-slide-up h-full flex flex-col">
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-5 md:p-8 pr-14 pb-0 block">
                  <Header title="Displays & Audio" description="Configure the public TV monitors and audio announcements." error={errorMessage} />
                  
                  <div className="mb-6">
                    <label className="block mb-2 font-bold text-[12px] text-text-muted uppercase tracking-widest">Voice & Audio Alerts</label>
                    <div className="flex flex-col gap-0 bg-bg-color/50 dark:bg-black/10 p-2 rounded-2xl border border-border/40 shadow-sm backdrop-blur-sm">
                      
                      <label className="flex items-center justify-between p-4 cursor-pointer group rounded-xl hover:bg-surface/50 transition-colors">
                        <div className="pr-4">
                          <span className="font-extrabold text-text-main text-sm block mb-0.5 group-hover:text-primary transition-colors">Text-to-Speech Voice Calls</span>
                          <span className="text-text-muted text-xs font-semibold leading-relaxed block">Automatically announce tickets when called (e.g. "Ticket P-01, please proceed to Window 2").</span>
                        </div>
                        <div className="relative inline-flex items-center shrink-0">
                          <input type="checkbox" className="sr-only peer" checked={settingsForm.enableVoiceCall ?? true} onChange={e => setSettingsForm(prev => ({ ...prev, enableVoiceCall: e.target.checked }))} />
                          <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </div>
                      </label>

                      <div className="h-[1px] bg-border/40 mx-4" />

                      <label className="flex items-center justify-between p-4 cursor-pointer group rounded-xl hover:bg-surface/50 transition-colors">
                        <div className="pr-4">
                          <span className="font-extrabold text-text-main text-sm block mb-0.5 group-hover:text-primary transition-colors">Notification Chimes</span>
                          <span className="text-text-muted text-xs font-semibold leading-relaxed block">Play a short chime sound before announcing a ticket or when a new ticket is generated.</span>
                        </div>
                        <div className="relative inline-flex items-center shrink-0">
                          <input type="checkbox" className="sr-only peer" checked={settingsForm.enableChime ?? true} onChange={e => setSettingsForm(prev => ({ ...prev, enableChime: e.target.checked }))} />
                          <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </div>
                      </label>

                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block mb-2 font-bold text-[12px] text-text-muted uppercase tracking-widest">Public Screen Content</label>
                    <div className="flex flex-col gap-4 bg-bg-color/50 dark:bg-black/10 p-5 rounded-2xl border border-border/40 shadow-sm backdrop-blur-sm">
                      <InputGroup 
                        label="Scrolling Ticker Text" 
                        description="Announcements that scroll infinitely at the bottom of the public TV screen."
                        value={settingsForm.displayTickerText ?? ''} 
                        onChange={val => setSettingsForm(prev => ({ ...prev, displayTickerText: val }))}
                        placeholder="e.g. Please prepare your valid ID and documents..."
                        inputClass={inputClass}
                      />
                    </div>
                  </div>

                </div>
                <div className="bg-surface/90 backdrop-blur-md px-5 md:px-8 py-5 border-t border-border flex justify-end gap-2 shrink-0">
                  <button onClick={handleClose} className={btnSecondary} disabled={isSaving || saveSuccess}>Close</button>
                  <button onClick={handleSaveSettings} className={saveSuccess ? btnSuccess : btnPrimary} disabled={isSaving || saveSuccess}>
                    {saveSuccess ? (
                      <><Check size={16} strokeWidth={3} /> Saved!</>
                    ) : isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* ENGINE RULES */}
            {activeTab === 'engine' && (
              <div className="animate-slide-up h-full flex flex-col">
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-5 md:p-8 pr-14 pb-0 block">
                  <Header title="Smart Engine Rules" description="Fine-tune how the queue routing algorithm operates." error={errorMessage} />
                  
                  <div className="mb-4">
                    <label className="block mb-2 font-bold text-[11px] text-text-muted uppercase tracking-widest">Smart Engine Parameters</label>
                    <div className="grid grid-cols-2 gap-4 bg-bg-color/50 dark:bg-black/10 p-4 rounded-xl border border-border/40 shadow-sm backdrop-blur-sm">
                      
                      <label className="col-span-2 flex items-center justify-between pb-4 border-b border-border/40 cursor-pointer group">
                        <div className="pr-4">
                          <span className="font-extrabold text-text-main text-sm block mb-0.5 group-hover:text-primary transition-colors">Auto-Assign Staff to Busy Windows</span>
                          <span className="text-text-muted text-xs font-semibold leading-relaxed block">Automatically shift staff focus to the windows with the longest wait times.</span>
                        </div>
                        <div className="relative inline-flex items-center shrink-0">
                          <input type="checkbox" className="sr-only peer" checked={settingsForm.autoAdaptive} onChange={e => setSettingsForm(prev => ({ ...prev, autoAdaptive: e.target.checked }))} />
                          <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </div>
                      </label>

                      <div className="col-span-2">
                        <RangeSlider label="Workload Panic Threshold (Mins)" description="If predicted wait times exceed this limit, the system enters 'crunch mode' to assist busy windows." value={settingsForm.autoBalanceThreshold} min={5} max={60} step={5} onChange={val => setSettingsForm(prev => ({...prev, autoBalanceThreshold: val}))} suffix=" min" />
                        <RangeSlider label="Maximum Wait Time Limit (Mins)" description="If a person waits longer than this limit, the system automatically forces them to the front." value={settingsForm.slaThreshold} min={5} max={60} step={5} onChange={val => setSettingsForm(prev => ({...prev, slaThreshold: val}))} suffix=" min" />
                      </div>
                      
                      <div className="col-span-2 grid grid-cols-3 gap-4 pt-2 border-t border-border/40">
                        <InputGroup label="Priority to Regular Ratio" description="Force 1 Regular ticket after this many Priority tickets in a row." type="number" min={1} max={10} value={settingsForm.zipperRatio} onChange={val => setSettingsForm(prev => ({...prev, zipperRatio: parseInt(val)||1}))} inputClass={inputClass} />
                        <InputGroup label="Wait Time Bonus Rate" description="How fast people gain priority points for waiting." type="number" min={0} max={1} step={0.1} value={settingsForm.agingRate} onChange={val => setSettingsForm(prev => ({...prev, agingRate: parseFloat(val)||0}))} inputClass={inputClass} />
                        <InputGroup label="Max Skips Allowed" description="Max times a Regular ticket can be skipped by Priority before locking them to the front." type="number" min={1} max={20} value={settingsForm.skipLimit} onChange={val => setSettingsForm(prev => ({...prev, skipLimit: parseInt(val)||1}))} inputClass={inputClass} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface/90 backdrop-blur-md px-5 md:px-8 py-5 border-t border-border flex justify-end gap-2 shrink-0">
                  <button onClick={handleClose} className={btnSecondary} disabled={isSaving || saveSuccess}>Close</button>
                  <button onClick={handleSaveSettings} className={saveSuccess ? btnSuccess : btnPrimary} disabled={isSaving || saveSuccess}>
                    {saveSuccess ? (
                      <><Check size={16} strokeWidth={3} /> Saved!</>
                    ) : isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* PRIORITY GROUPS */}
            {activeTab === 'priority' && (
              <div className="animate-slide-up h-full flex flex-col">
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-5 md:p-8 pr-14 pb-0 block">
                  <Header title="Priority Groups" description="Manage queue priority weights and custom SLA rules." error={errorMessage} />
                  <button onClick={() => setShowAddGroup(true)} className={btnPrimary + " flex items-center gap-1.5 self-start mb-4 !text-xs !px-3.5 !py-1.5 !min-w-0"}>
                    <Plus size={14} strokeWidth={3} /> Add Group
                  </button>

                  <div className="flex-1 pb-8 space-y-2.5">
                    {showAddGroup && (
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 animate-slide-up shadow-sm">
                      <h4 className="m-0 mb-3 text-sm font-extrabold text-primary">Create New Priority Group</h4>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <InputGroup label="Internal Name" value={newGroupForm.name} onChange={val => setNewGroupForm(prev => ({...prev, name: val.toUpperCase().replace(/\\s+/g, '_')}))} placeholder="e.g. SENIOR" inputClass={inputClass} />
                        <InputGroup label="Display Label" value={newGroupForm.label} onChange={val => setNewGroupForm(prev => ({...prev, label: val}))} placeholder="e.g. Senior Citizen" inputClass={inputClass} />
                        <InputGroup label="Short Label" value={newGroupForm.shortLabel} onChange={val => setNewGroupForm(prev => ({...prev, shortLabel: val.toUpperCase()}))} placeholder="e.g. SR" inputClass={inputClass} />
                        <InputGroup label="Weight Multiplier" type="number" min={1} value={newGroupForm.weight} onChange={val => setNewGroupForm(prev => ({...prev, weight: parseInt(val)||1}))} inputClass={inputClass} />
                        <div className="col-span-2">
                          <InputGroup label="Custom SLA Threshold (Mins)" type="number" min={1} value={newGroupForm.slaThreshold} onChange={val => setNewGroupForm(prev => ({...prev, slaThreshold: val ? parseInt(val) : ''}))} placeholder="Leave empty for global SLA" inputClass={inputClass} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowAddGroup(false)} className={btnSecondary} disabled={isSaving}>Cancel</button>
                        <button onClick={handleAddPriorityGroup} className={btnPrimary} disabled={isSaving}>
                          {isSaving ? 'Creating...' : 'Create Group'}
                        </button>
                      </div>
                    </div>
                  )}

                  {localPriorityGroups.map(group => (
                    <div key={group.id} className="p-3 bg-bg-color/50 dark:bg-black/10 rounded-xl border border-border/40 shadow-sm transition-all hover:border-primary/30 backdrop-blur-sm">
                      {editingGroupId === group.id ? (
                        <div className="animate-slide-up">
                          <div className="grid grid-cols-4 gap-3 mb-3">
                            <InputGroup label="Internal Name" value={editGroupForm.name} onChange={val => setEditGroupForm(prev => ({...prev, name: val.toUpperCase().replace(/\s+/g, '_')}))} inputClass={inputClass} />
                            <InputGroup label="Display Label" value={editGroupForm.label} onChange={val => setEditGroupForm(prev => ({...prev, label: val}))} inputClass={inputClass} />
                            <InputGroup label="Short Label" value={editGroupForm.shortLabel} onChange={val => setEditGroupForm(prev => ({...prev, shortLabel: val.toUpperCase()}))} inputClass={inputClass} />
                            <InputGroup label="Weight" type="number" min={1} value={editGroupForm.weight} onChange={val => setEditGroupForm(prev => ({...prev, weight: parseInt(val)||1}))} inputClass={inputClass} />
                            <div className="col-span-4">
                              <InputGroup label="Custom SLA Threshold (Mins)" type="number" min={1} value={editGroupForm.slaThreshold} onChange={val => setEditGroupForm(prev => ({...prev, slaThreshold: val ? parseInt(val) : ''}))} placeholder="Leave empty for global SLA" inputClass={inputClass} />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingGroupId(null)} className={btnSecondary} disabled={isSaving}>Cancel</button>
                            <button onClick={() => handleSavePriorityGroup(group.id)} className={btnPrimary} disabled={isSaving}>
                              {isSaving ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-primary font-black text-sm border border-indigo-100 dark:border-indigo-800 shrink-0">
                              {group.weight}x
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <h4 className="m-0 text-text-main font-bold text-sm">{group.label}</h4>
                                <span className="px-1.5 py-px rounded text-[9px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-text-muted">{group.name}</span>
                                {group.shortLabel && <span className="text-text-muted text-[11px] font-semibold">({group.shortLabel})</span>}
                              </div>
                              <span className="text-[11px] text-text-muted font-medium">
                                SLA: <span className="font-bold text-text-main">{group.slaThreshold ? `${group.slaThreshold} mins` : 'Global Default'}</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => { setEditingGroupId(group.id); setEditGroupForm({ name: group.name, label: group.label, shortLabel: group.shortLabel || '', weight: group.weight, slaThreshold: group.slaThreshold || '', isActive: group.isActive }); }} className="p-2 rounded-lg bg-surface border border-border text-text-muted cursor-pointer hover:text-primary hover:border-primary transition-colors text-xs">✎</button>
                            <button onClick={() => handleDeletePriorityGroup(group.id)} className="p-2 rounded-lg bg-surface border border-border text-text-muted cursor-pointer hover:text-danger hover:border-danger transition-colors text-xs">×</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            )}

            {/* DANGER ZONE */}
            {activeTab === 'danger' && (
              <div className="animate-slide-up h-full flex flex-col">
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-5 md:p-8 pr-14 block">
                  <Header title="Danger Zone & Data" description="Manage database backups and irreversible destructive actions." />
                  
                  <div className="mt-2 mb-6 p-6 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl relative overflow-hidden backdrop-blur-md shadow-sm">
                    <div className="absolute -bottom-10 -right-10 p-6 opacity-5 pointer-events-none">
                      <Download size={240} className="text-emerald-600" />
                    </div>
                    <h4 className="text-emerald-700 dark:text-emerald-400 font-extrabold text-xl mb-3 m-0 relative z-10">Export Data Logs</h4>
                    <p className="text-emerald-600/80 dark:text-emerald-300/80 text-sm font-semibold mb-6 mt-0 max-w-lg relative z-10 leading-relaxed">
                      Download a complete backup of all historical queue tickets, wait times, and performance metrics as a CSV file before clearing your database.
                    </p>
                    <button 
                      onClick={() => {
                        api.exportData().catch(err => setErrorMessage(err.message));
                      }} 
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl font-bold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer relative z-10"
                    >
                      <Download size={18} strokeWidth={2.5} /> Download CSV Backup
                    </button>
                  </div>

                  <div className="p-6 border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-900/20 rounded-2xl relative overflow-hidden backdrop-blur-md shadow-inner">
                    <div className="absolute -bottom-10 -right-10 p-6 opacity-5 pointer-events-none">
                      <AlertTriangle size={240} className="text-rose-600" />
                    </div>
                    <h4 className="text-rose-700 dark:text-rose-400 font-extrabold text-xl mb-3 m-0 relative z-10">Factory Reset / Clear All Data</h4>
                    <p className="text-rose-600/80 dark:text-rose-300/80 text-sm font-semibold mb-6 mt-0 max-w-lg relative z-10 leading-relaxed">
                      This will permanently delete all tickets and reset all queue statistics to zero. This action cannot be undone. User accounts and settings will remain intact.
                    </p>
                  
                  <div className="relative z-10 mb-6 max-w-md">
                    <label className="block text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-2">Type "RESET" to confirm</label>
                    <input 
                      type="text" 
                      value={dangerConfirmText} 
                      onChange={e => setDangerConfirmText(e.target.value)}
                      placeholder="RESET"
                      className="w-full p-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-black/20 text-rose-900 dark:text-rose-200 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-rose-300 dark:placeholder:text-rose-800"
                    />
                  </div>

                  <button 
                    disabled={dangerConfirmText !== 'RESET'}
                    onClick={() => { 
                      setDangerConfirmText('');
                      onClose(); 
                      onResetDataRequest(); 
                    }} 
                    className={`px-8 py-4 bg-danger text-white border-none rounded-2xl font-black text-sm tracking-wider uppercase transition-all shadow-xl shadow-danger/20 relative z-10 ${dangerConfirmText === 'RESET' ? 'cursor-pointer hover:bg-rose-700 hover:-translate-y-1' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    Reset All Data
                  </button>
                </div>
                </div>
                <div className="bg-surface/90 backdrop-blur-md px-5 md:px-8 py-5 border-t border-border flex justify-end gap-2 shrink-0">
                  <button onClick={handleClose} className={btnSecondary}>Close</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </ModalWrapper>
    <ModalWrapper isOpen={showDiscardConfirm} zIndex={1050} onBackgroundClick={() => setShowDiscardConfirm(false)}>
      <div className="bg-surface p-8 rounded-3xl w-[90vw] max-w-[400px] shadow-float border border-white/20 animate-slide-up text-center">
        <AlertTriangle size={48} className="text-warning mx-auto mb-4" />
        <h3 className="m-0 mb-3 text-xl font-extrabold text-text-main">Unsaved Changes</h3>
        <p className="text-text-muted text-sm font-medium mb-4 mt-0 leading-relaxed">You have unsaved changes in the following areas:</p>
        <ul className="text-left text-sm text-text-main font-bold mb-8 bg-black/5 dark:bg-white/5 p-4 rounded-xl max-h-[120px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] list-none m-0">
          {dirtyFields.map((field, i) => (
            <li key={i} className="mb-2 flex items-center gap-2 last:mb-0">
              <div className="w-1.5 h-1.5 rounded-full bg-warning shrink-0"></div>
              {field}
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <button onClick={() => setShowDiscardConfirm(false)} className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 text-text-muted font-bold border-none rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Keep Editing</button>
          <button onClick={() => { setShowDiscardConfirm(false); onClose(); }} className="flex-1 p-3 bg-rose-500 text-white font-bold border-none rounded-xl cursor-pointer hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20">Discard</button>
        </div>
      </div>
    </ModalWrapper>
    {pendingCropImage && (
      <ImageCropperModal
        isOpen={true}
        imageSrc={pendingCropImage}
        aspectRatio={1}
        onClose={() => setPendingCropImage(null)}
        onCropComplete={(croppedBase64) => {
          if (cropTarget === 'profile') {
            setAccountForm(prev => ({ ...prev, profilePictureBase64: croppedBase64 }));
          } else if (cropTarget === 'logo') {
            setSettingsForm(prev => ({ ...prev, logoBase64: croppedBase64 }));
          }
          setPendingCropImage(null);
        }}
      />
    )}
    </>
  );
}

// ----------------- Helper Subcomponents -----------------

function NavItem({ icon, label, isActive, onClick, isDanger }) {
  const activeClass = isDanger 
    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25 border-transparent font-semibold"
    : "bg-surface dark:bg-slate-800 text-primary shadow-md shadow-black/5 border-transparent font-semibold scale-[1.02] ring-1 ring-black/5 dark:ring-white/10";
    
  const inactiveClass = isDanger
    ? "bg-transparent text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-transparent hover:scale-[1.01]"
    : "bg-transparent text-text-muted hover:bg-surface/50 dark:hover:bg-slate-800/50 border-transparent hover:scale-[1.01]";

  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 border rounded-xl text-left cursor-pointer transition-all duration-300 ease-out group ${isActive ? activeClass : inactiveClass}`}
    >
      <div className={`transition-transform duration-300 ${isActive ? "scale-110 opacity-100" : "group-hover:scale-110 opacity-70"}`}>{icon}</div>
      <span className="text-[13px] tracking-wide">{label}</span>
    </button>
  );
}

function Header({ title, description, noMargin, error }) {
  return (
    <div className={noMargin ? '' : 'mb-6'}>
      <h3 className="m-0 mb-1.5 text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-text-main to-text-muted tracking-tight">{title}</h3>
      <p className="text-text-muted text-[13px] font-medium m-0 opacity-80">{description}</p>
      {error && (
        <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold animate-slide-up">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}
    </div>
  );
}

function InputGroup({ label, description, value, onChange, type = "text", placeholder, inputClass, ...props }) {
  const id = `input-${label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
  return (
    <div className="flex flex-col">
      <div className="flex flex-col mb-2 pl-1">
        <label htmlFor={id} className="text-[11px] font-black text-text-muted uppercase tracking-wider cursor-pointer hover:text-primary transition-colors">{label}</label>
        {description && <span className="text-[10px] text-text-muted font-medium mt-0.5 leading-relaxed pr-1">{description}</span>}
      </div>
      <input 
        id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={inputClass} {...props}
      />
    </div>
  );
}

function RangeSlider({ label, description, value, min, max, step, onChange, suffix = '' }) {
  const id = `range-${label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
  return (
    <div className="flex flex-col mb-4">
      <div className="flex items-start justify-between mb-3 pl-1">
        <div className="flex flex-col pr-4">
          <label htmlFor={id} className="text-[11px] font-black text-text-muted uppercase tracking-wider cursor-pointer hover:text-primary transition-colors">{label}</label>
          {description && <span className="text-xs text-text-muted font-medium mt-1 leading-relaxed">{description}</span>}
        </div>
        <span className="font-black text-primary bg-primary/10 px-3 py-1 rounded-lg text-sm shrink-0 mt-1">{value}{suffix}</span>
      </div>
      <input 
        id={id} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
}

