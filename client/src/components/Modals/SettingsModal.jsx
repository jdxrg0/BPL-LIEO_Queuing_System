import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, Shield, AlertTriangle, Image as ImageIcon, Check, X, Plus } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
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
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('lastSettingsTab') || (user?.role === 'ADMIN' ? 'general' : 'account'));
  
  useEffect(() => {
    localStorage.setItem('lastSettingsTab', activeTab);
  }, [activeTab]);

  // General Settings State
  const [settingsForm, setSettingsForm] = useState({
    websiteName: '', logoBase64: '', autoBalanceThreshold: 15, slaThreshold: 15, 
    zipperRatio: 3, agingRate: 0.1, skipLimit: 5, autoAdaptive: false
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

  // Sync initial props
  useEffect(() => {
    if (initialSettings) {
      setSettingsForm({
        websiteName: initialSettings.websiteName || '',
        logoBase64: initialSettings.logoBase64 || '',
        autoBalanceThreshold: initialSettings.autoBalanceThreshold || 15,
        slaThreshold: initialSettings.slaThreshold || 15,
        zipperRatio: initialSettings.zipperRatio || 3,
        agingRate: initialSettings.agingRate || 0.1,
        skipLimit: initialSettings.skipLimit || 5,
        autoAdaptive: initialSettings.autoAdaptive || false
      });
    }
  }, [initialSettings]);

  useEffect(() => {
    if (user) {
      setAccountForm({ name: user.name || '', profilePictureBase64: user.profilePictureBase64 || '' });
    }
  }, [user]);

  useEffect(() => {
    setLocalPriorityGroups(priorityGroups || []);
  }, [priorityGroups]);

  const handleSaveSettings = async () => {
    try {
      await api.updateSettings(settingsForm);
      onClose();
    } catch (err) { alert('Failed to save settings'); }
  };

  const handleSaveProfile = async () => {
    try {
      await api.updateUserProfile(user.id, accountForm);
      onClose();
    } catch (err) { alert('Failed to save profile'); }
  };

  const handleSavePriorityGroup = async (id) => {
    try {
      await api.updatePriorityGroup(id, editGroupForm);
      setEditingGroupId(null);
    } catch (e) { console.error(e); }
  };

  const handleDeletePriorityGroup = async (id) => {
    try {
      await api.deletePriorityGroup(id);
    } catch (e) { console.error(e); }
  };

  const handleAddPriorityGroup = async () => {
    try {
      if (!newGroupForm.name || !newGroupForm.label) return alert("Name and Label required");
      await api.createPriorityGroup(newGroupForm);
      setShowAddGroup(false);
      setNewGroupForm({ name: '', label: '', shortLabel: '', weight: 1, slaThreshold: '' });
    } catch (e) { console.error(e); }
  };

  // Reusable Classes
  const inputClass = "w-full p-3.5 rounded-xl border border-border bg-surface text-text-main text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm";
  const btnPrimary = "px-6 py-2.5 bg-primary text-white rounded-xl font-bold border-none cursor-pointer hover:bg-primary-hover shadow-md hover:-translate-y-0.5 transition-all text-sm";
  const btnSecondary = "px-6 py-2.5 bg-surface text-text-main border border-border rounded-xl font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm shadow-sm";

  return (
    <ModalWrapper isOpen={isOpen} zIndex={1000}>
      <div className="bg-surface rounded-3xl w-[950px] h-[700px] flex overflow-hidden shadow-float border border-border relative">
        
        {/* Left Nav */}
        <div className="w-[280px] bg-bg-color border-r border-border p-8 flex flex-col z-10 shrink-0">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
              <Settings className="text-white" size={24} />
            </div>
            <h2 className="m-0 text-2xl font-black text-text-main tracking-tight">Settings</h2>
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
                  icon={<Settings size={20} />} 
                  label="General & App" 
                  isActive={activeTab === 'general'} 
                  onClick={() => setActiveTab('general')} 
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
        <div className="flex-1 p-10 flex flex-col overflow-y-auto bg-surface z-10 relative">
          
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent dark:from-indigo-900/10 pointer-events-none"></div>
          
          <div className="relative z-10 flex-1 flex flex-col">
            {/* ACCOUNT PROFILE */}
            {activeTab === 'account' && (
              <div className="animate-slide-up h-full flex flex-col">
                <Header title="Account Profile" description="Manage your personal information and profile picture." />
                
                <div className="mb-8">
                  <label className="block mb-4 font-bold text-sm text-text-main uppercase tracking-wider">Profile Picture</label>
                  <div className="flex items-center gap-6 bg-bg-color p-6 rounded-3xl border border-border shadow-sm">
                    <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center overflow-hidden shadow-inner border-2 border-border shrink-0">
                      {accountForm.profilePictureBase64 ? (
                        <img src={accountForm.profilePictureBase64} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={40} className="text-text-muted" />
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <input 
                        type="file" accept="image/*" ref={profilePicInputRef} className="hidden" 
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setAccountForm(prev => ({ ...prev, profilePictureBase64: reader.result }));
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => profilePicInputRef.current?.click()} className={btnPrimary}>Upload Photo</button>
                        <button onClick={() => setAccountForm(prev => ({ ...prev, profilePictureBase64: '' }))} className="px-5 py-2.5 bg-surface text-danger border border-rose-200 rounded-xl cursor-pointer font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-sm">Remove</button>
                      </div>
                      <span className="text-xs text-text-muted font-medium">Recommended: Square image, max 2MB.</span>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block mb-3 font-bold text-sm text-text-main uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" value={accountForm.name} onChange={e => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                    className={inputClass} placeholder="e.g. John Doe"
                  />
                </div>

                <div className="mb-8 p-6 rounded-3xl border border-border bg-bg-color shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="m-0 text-text-main font-bold text-lg">Password & Security</h4>
                    <p className="text-sm text-text-muted mt-1 mb-0 font-medium">Update your account password</p>
                  </div>
                  <button onClick={onChangePassword} className={btnSecondary}>Change Password</button>
                </div>

                <div className="mt-auto flex justify-end gap-3 pt-6 border-t border-border">
                  <button onClick={onClose} className={btnSecondary}>Cancel</button>
                  <button onClick={handleSaveProfile} className={btnPrimary}>Save Profile</button>
                </div>
              </div>
            )}

            {/* GENERAL SETTINGS */}
            {activeTab === 'general' && (
              <div className="animate-slide-up h-full flex flex-col">
                <Header title="General & Appearance" description="Configure global application aesthetics and automated behaviors." />
                
                <div className="mb-8">
                  <label className="block mb-3 font-bold text-sm text-text-main uppercase tracking-wider">System Branding</label>
                  <div className="flex gap-6 bg-bg-color p-6 rounded-3xl border border-border shadow-sm">
                    <div className="w-[100px] h-[100px] shrink-0 rounded-2xl bg-surface border-2 border-dashed border-border flex items-center justify-center overflow-hidden relative group">
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
                            reader.onloadend = () => setSettingsForm(prev => ({ ...prev, logoBase64: reader.result }));
                            reader.readAsDataURL(file);
                          }
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

                <div className="mb-8">
                  <label className="block mb-3 font-bold text-sm text-text-main uppercase tracking-wider">Smart Engine Parameters</label>
                  <div className="grid grid-cols-2 gap-5 bg-bg-color p-6 rounded-3xl border border-border shadow-sm">
                    
                    <div className="col-span-2 flex items-center justify-between pb-5 border-b border-border">
                      <div className="pr-4">
                        <span className="font-extrabold text-text-main text-base block mb-1">Auto-Adaptive Allocation</span>
                        <span className="text-text-muted text-xs font-semibold leading-relaxed block">Automatically rebalance counter queues on the fly based on incoming workload and bottlenecks.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" className="sr-only peer" checked={settingsForm.autoAdaptive} onChange={e => setSettingsForm(prev => ({ ...prev, autoAdaptive: e.target.checked }))} />
                        <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <RangeSlider label="Reallocation Threshold (Mins)" value={settingsForm.autoBalanceThreshold} min={5} max={60} step={5} onChange={val => setSettingsForm(prev => ({...prev, autoBalanceThreshold: val}))} />
                    <RangeSlider label="SLA Panic Threshold (Mins)" value={settingsForm.slaThreshold} min={5} max={60} step={5} onChange={val => setSettingsForm(prev => ({...prev, slaThreshold: val}))} />
                    
                    <div className="col-span-2 grid grid-cols-3 gap-4 pt-2">
                      <InputGroup label="Zipper Ratio" type="number" min={1} max={10} value={settingsForm.zipperRatio} onChange={val => setSettingsForm(prev => ({...prev, zipperRatio: parseInt(val)||1}))} inputClass={inputClass} />
                      <InputGroup label="Aging Rate" type="number" min={0} max={1} step={0.1} value={settingsForm.agingRate} onChange={val => setSettingsForm(prev => ({...prev, agingRate: parseFloat(val)||0}))} inputClass={inputClass} />
                      <InputGroup label="Skip Limit" type="number" min={1} max={20} value={settingsForm.skipLimit} onChange={val => setSettingsForm(prev => ({...prev, skipLimit: parseInt(val)||1}))} inputClass={inputClass} />
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex justify-end gap-3 pt-6 border-t border-border">
                  <button onClick={onClose} className={btnSecondary}>Cancel</button>
                  <button onClick={handleSaveSettings} className={btnPrimary}>Save Changes</button>
                </div>
              </div>
            )}

            {/* PRIORITY GROUPS */}
            {activeTab === 'priority' && (
              <div className="animate-slide-up h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <Header title="Priority Groups" description="Manage queue priority weights and custom SLA rules." noMargin />
                  <button onClick={() => setShowAddGroup(true)} className={btnPrimary + " flex items-center gap-2"}>
                    <Plus size={18} strokeWidth={3} /> Add Group
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 pb-6 space-y-4">
                  {showAddGroup && (
                    <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-200 dark:border-indigo-800 animate-slide-up shadow-sm">
                      <h4 className="m-0 mb-5 text-base font-extrabold text-primary">Create New Priority Group</h4>
                      <div className="grid grid-cols-3 gap-4 mb-5">
                        <InputGroup label="Internal Name" value={newGroupForm.name} onChange={val => setNewGroupForm(prev => ({...prev, name: val.toUpperCase().replace(/\\s+/g, '_')}))} placeholder="e.g. SENIOR" inputClass={inputClass} />
                        <InputGroup label="Display Label" value={newGroupForm.label} onChange={val => setNewGroupForm(prev => ({...prev, label: val}))} placeholder="e.g. Senior Citizen" inputClass={inputClass} />
                        <InputGroup label="Short Label" value={newGroupForm.shortLabel} onChange={val => setNewGroupForm(prev => ({...prev, shortLabel: val.toUpperCase()}))} placeholder="e.g. SR" inputClass={inputClass} />
                        <InputGroup label="Weight Multiplier" type="number" min={1} value={newGroupForm.weight} onChange={val => setNewGroupForm(prev => ({...prev, weight: parseInt(val)||1}))} inputClass={inputClass} />
                        <div className="col-span-2">
                          <InputGroup label="Custom SLA Threshold (Mins)" type="number" min={1} value={newGroupForm.slaThreshold} onChange={val => setNewGroupForm(prev => ({...prev, slaThreshold: val ? parseInt(val) : ''}))} placeholder="Leave empty for global SLA" inputClass={inputClass} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setShowAddGroup(false)} className={btnSecondary}>Cancel</button>
                        <button onClick={handleAddPriorityGroup} className={btnPrimary}>Create Group</button>
                      </div>
                    </div>
                  )}

                  {localPriorityGroups.map(group => (
                    <div key={group.id} className="p-5 bg-bg-color rounded-3xl border border-border shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                      {editingGroupId === group.id ? (
                        <div className="animate-slide-up">
                          <div className="grid grid-cols-3 gap-4 mb-5">
                            <InputGroup label="Display Label" value={editGroupForm.label} onChange={val => setEditGroupForm(prev => ({...prev, label: val}))} inputClass={inputClass} />
                            <InputGroup label="Short Label" value={editGroupForm.shortLabel} onChange={val => setEditGroupForm(prev => ({...prev, shortLabel: val.toUpperCase()}))} inputClass={inputClass} />
                            <InputGroup label="Weight" type="number" min={1} value={editGroupForm.weight} onChange={val => setEditGroupForm(prev => ({...prev, weight: parseInt(val)||1}))} inputClass={inputClass} />
                            <div className="col-span-3">
                              <InputGroup label="Custom SLA Threshold (Mins)" type="number" min={1} value={editGroupForm.slaThreshold} onChange={val => setEditGroupForm(prev => ({...prev, slaThreshold: val ? parseInt(val) : ''}))} placeholder="Leave empty for global SLA" inputClass={inputClass} />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3">
                            <button onClick={() => setEditingGroupId(null)} className={btnSecondary}>Cancel</button>
                            <button onClick={() => handleSavePriorityGroup(group.id)} className={btnPrimary}>Save Changes</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-primary font-black text-xl border border-indigo-100 dark:border-indigo-800 shrink-0">
                              {group.weight}x
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <h4 className="m-0 text-text-main font-extrabold text-lg">{group.label}</h4>
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-text-muted">{group.name}</span>
                                {group.shortLabel && <span className="text-text-muted text-xs font-bold">({group.shortLabel})</span>}
                              </div>
                              <div className="text-xs text-text-muted font-semibold bg-surface inline-block px-2 py-1 rounded border border-border">
                                SLA: <span className="text-text-main">{group.slaThreshold ? `${group.slaThreshold} mins` : 'Global Default'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEditingGroupId(group.id); setEditGroupForm({ label: group.label, shortLabel: group.shortLabel || '', weight: group.weight, slaThreshold: group.slaThreshold || '', isActive: group.isActive }); }} className="p-3 rounded-xl bg-surface border border-border text-text-muted cursor-pointer hover:text-primary hover:border-primary transition-colors">✎</button>
                            <button onClick={() => handleDeletePriorityGroup(group.id)} className="p-3 rounded-xl bg-surface border border-border text-text-muted cursor-pointer hover:text-danger hover:border-danger transition-colors">×</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DANGER ZONE */}
            {activeTab === 'danger' && (
              <div className="animate-slide-up h-full flex flex-col">
                <Header title="Danger Zone" description="Irreversible, destructive actions." />
                
                <div className="mt-4 p-8 border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-900/10 rounded-3xl relative overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 p-6 opacity-5 pointer-events-none">
                    <AlertTriangle size={240} className="text-rose-600" />
                  </div>
                  <h4 className="text-rose-700 dark:text-rose-400 font-extrabold text-xl mb-3 m-0 relative z-10">Factory Reset / Clear All Data</h4>
                  <p className="text-rose-600/80 dark:text-rose-300/80 text-sm font-semibold mb-8 mt-0 max-w-lg relative z-10 leading-relaxed">
                    This will permanently delete all tickets and reset all queue statistics to zero. This action cannot be undone. User accounts and settings will remain intact.
                  </p>
                  <button onClick={() => { onClose(); onResetDataRequest(); }} className="px-8 py-4 bg-danger text-white border-none rounded-2xl cursor-pointer font-black text-sm tracking-wider uppercase hover:bg-rose-700 transition-all shadow-xl shadow-danger/20 hover:-translate-y-1 relative z-10">
                    Reset All Data
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ----------------- Helper Subcomponents -----------------

function NavItem({ icon, label, isActive, onClick, isDanger }) {
  const activeClass = isDanger 
    ? "bg-danger text-white shadow-lg shadow-danger/20 border-danger"
    : "bg-surface text-primary shadow-sm border-border";
    
  const inactiveClass = isDanger
    ? "bg-transparent text-danger hover:bg-rose-50 dark:hover:bg-rose-900/20 border-transparent"
    : "bg-transparent text-text-muted hover:bg-surface border-transparent";

  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-4 border rounded-2xl text-left font-bold cursor-pointer transition-all ${isActive ? activeClass : inactiveClass}`}
    >
      <div className={isActive ? "opacity-100" : "opacity-70"}>{icon}</div>
      <span className="text-[15px]">{label}</span>
    </button>
  );
}

function Header({ title, description, noMargin }) {
  return (
    <div className={noMargin ? '' : 'mb-10'}>
      <h3 className="m-0 mb-3 text-3xl font-black text-text-main tracking-tight">{title}</h3>
      <p className="text-text-muted text-[15px] font-medium m-0">{description}</p>
    </div>
  );
}

function InputGroup({ label, value, onChange, type = "text", placeholder, inputClass, ...props }) {
  return (
    <div className="flex flex-col">
      <label className="text-[11px] font-black text-text-muted uppercase tracking-wider mb-2 pl-1">{label}</label>
      <input 
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={inputClass} {...props}
      />
    </div>
  );
}

function RangeSlider({ label, value, min, max, step, onChange }) {
  return (
    <div className="flex flex-col mb-5">
      <div className="flex items-center justify-between mb-3 pl-1">
        <label className="text-[11px] font-black text-text-muted uppercase tracking-wider">{label}</label>
        <span className="font-black text-primary bg-primary/10 px-3 py-1 rounded-lg text-sm">{value}m</span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
}
