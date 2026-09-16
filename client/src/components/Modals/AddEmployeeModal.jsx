import React, { useState } from 'react';
import { api } from '../../api';
import ModalWrapper from './ModalWrapper';

export default function AddEmployeeModal({ isOpen, onClose, onSuccess, showPopup }) {
  const [newUser, setNewUser] = useState({
    name: '', username: '', password: '', role: 'STAFF', windowNumber: 1,
    caterNew: true, caterRenewal: true, caterRetirement: true
  });

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.username || !newUser.password || !newUser.windowNumber) return;
    try {
      await api.createUser(newUser);
      setNewUser({ name: '', username: '', password: '', role: 'STAFF', windowNumber: 1, caterNew: true, caterRenewal: true, caterRetirement: true });
      showPopup("Success", "Account created successfully!", "success");
      onSuccess();
    } catch (err) {
      showPopup("Error", "Failed to create user.", "error");
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} zIndex={100}>
      <div className="card w-[600px] max-h-[90vh] overflow-y-auto p-8 relative bg-surface border border-border shadow-xl rounded-xl">
        <button onClick={onClose} className="absolute top-4 right-4 bg-transparent border-none text-2xl cursor-pointer text-text-muted hover:text-text-main transition-colors">×</button>
        <h3 className="mb-6 m-0 text-xl font-bold text-text-main">Create New Account</h3>
        
        <form onSubmit={handleAddUser} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm mb-1 font-medium text-text-main">Full Name</label>
              <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:border-primary outline-none transition-colors" required />
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium text-text-main">Username</label>
              <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:border-primary outline-none transition-colors" required />
            </div>
            <div>
              <label className="block text-sm mb-2 font-medium text-text-main">Role</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setNewUser({...newUser, role: 'STAFF'})} className={`flex-1 p-2 rounded border font-semibold cursor-pointer transition-colors ${newUser.role === 'STAFF' ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-text-main hover:bg-slate-50'}`}>Staff</button>
                <button type="button" onClick={() => setNewUser({...newUser, role: 'ADMIN'})} className={`flex-1 p-2 rounded border font-semibold cursor-pointer transition-colors ${newUser.role === 'ADMIN' ? 'bg-warning border-warning text-white' : 'bg-surface border-border text-text-main hover:bg-slate-50'}`}>Admin</button>
                <button type="button" onClick={() => setNewUser({...newUser, role: 'RECEPTIONIST'})} className={`flex-1 p-2 rounded border font-semibold cursor-pointer transition-colors ${newUser.role === 'RECEPTIONIST' ? 'bg-success border-success text-white' : 'bg-surface border-border text-text-main hover:bg-slate-50'}`}>Receptionist</button>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2 font-semibold text-text-main">Assign to Window Number</label>
              <div className="flex items-center bg-bg-color border border-border rounded overflow-hidden h-[38px]">
                <button type="button" onClick={() => setNewUser({...newUser, windowNumber: Math.max(1, newUser.windowNumber - 1)})} className="px-4 bg-transparent border-none cursor-pointer text-xl text-text-muted hover:bg-slate-200 transition-colors">−</button>
                <div className="flex-1 text-center text-xl font-bold text-text-main">{newUser.windowNumber}</div>
                <button type="button" onClick={() => setNewUser({...newUser, windowNumber: newUser.windowNumber + 1})} className="px-4 bg-transparent border-none cursor-pointer text-xl text-text-muted hover:bg-slate-200 transition-colors">+</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm mb-2 font-medium text-text-main">Transactions Catered</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setNewUser({...newUser, caterNew: !newUser.caterNew})} className={`flex-1 p-2 rounded border font-semibold text-sm cursor-pointer transition-colors ${newUser.caterNew ? 'bg-success border-success text-white' : 'bg-surface border-border text-text-main hover:bg-slate-50'}`}>New</button>
                <button type="button" onClick={() => setNewUser({...newUser, caterRenewal: !newUser.caterRenewal})} className={`flex-1 p-2 rounded border font-semibold text-sm cursor-pointer transition-colors ${newUser.caterRenewal ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-text-main hover:bg-slate-50'}`}>Renewal</button>
                <button type="button" onClick={() => setNewUser({...newUser, caterRetirement: !newUser.caterRetirement})} className={`flex-1 p-2 rounded border font-semibold text-sm cursor-pointer transition-colors ${newUser.caterRetirement ? 'bg-danger border-danger text-white' : 'bg-surface border-border text-text-main hover:bg-slate-50'}`}>Retirement</button>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium text-text-main">Password</label>
              <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:border-primary outline-none transition-colors" required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary mt-4 p-4 text-lg font-bold bg-primary text-white border-none rounded-lg hover:bg-primary-hover cursor-pointer transition-colors">Create Account</button>
        </form>
      </div>
    </ModalWrapper>
  );
}
