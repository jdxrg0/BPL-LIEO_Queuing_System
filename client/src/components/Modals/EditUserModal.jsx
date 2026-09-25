import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import ModalWrapper from './ModalWrapper';

export default function EditUserModal({ isOpen, user, originalUser, onClose, onSuccess, showPopup }) {
  const [editingUser, setEditingUser] = useState(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [passwordChange, setPasswordChange] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [resetPasswordForm, setResetPasswordForm] = useState({ resetKey: '', newPassword: '', confirmPassword: '' });
  const [deleteForm, setDeleteForm] = useState({ username: '', password: '' });
  const [deleteProgress, setDeleteProgress] = useState(0);
  const deleteTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen && user) {
      let wNum = 1;
      if (user.counter && user.counter.name) {
        const parsed = parseInt(user.counter.name.replace('Window ', ''));
        if (!isNaN(parsed)) wNum = parsed;
      }
      setEditingUser({ ...user, autoAssign: user.autoAssign !== false, currentPassword: '', windowNumber: wNum });
    }
  }, [isOpen, user]);

  if (!isOpen || !editingUser) return null;

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser.currentPassword) return showPopup("Required", "Current password is required to save changes.", "error");
    
    try {
      await api.updateUser(editingUser.id, editingUser);
      showPopup("Success", "Account details updated successfully!", "success");
      onSuccess();
    } catch (err) {
      showPopup("Error", err.message || 'Failed to update user.', "error");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      return showPopup("Error", "New passwords do not match.", "error");
    }
    try {
      await api.changePassword(editingUser.id, { 
        currentPassword: passwordChange.currentPassword, 
        newPassword: passwordChange.newPassword 
      });
      setIsChangePasswordModalOpen(false);
      setPasswordChange({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showPopup("Success", "Password changed successfully!", "success");
    } catch(err) {
      showPopup("Error", err.message || "Failed to change password.", "error");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      return showPopup("Error", "New passwords do not match.", "error");
    }
    try {
      await api.resetPassword(editingUser.id, { 
        resetKey: resetPasswordForm.resetKey, 
        newPassword: resetPasswordForm.newPassword 
      });
      setIsResetPasswordModalOpen(false);
      setResetPasswordForm({ resetKey: '', newPassword: '', confirmPassword: '' });
      showPopup("Success", "Password reset successfully!", "success");
    } catch(err) {
      showPopup("Error", err.message || "Failed to reset password.", "error");
    }
  };

  const handleMouseDownDelete = () => {
    if (!deleteForm.username || !deleteForm.password) return showPopup("Required", "Enter credentials to delete.", "error");
    setDeleteProgress(0);
    let progress = 0;
    deleteTimerRef.current = setInterval(() => {
      progress += (100 / 30); 
      setDeleteProgress(progress);
      if (progress >= 100) {
        clearInterval(deleteTimerRef.current);
        executeDelete();
      }
    }, 100);
  };

  const handleMouseUpOrLeaveDelete = () => {
    clearInterval(deleteTimerRef.current);
    if (deleteProgress < 100) {
      setDeleteProgress(0);
    }
  };

  const executeDelete = async () => {
    try {
      await api.deleteUser(editingUser.id, deleteForm);
      setIsDeleteModalOpen(false);
      setDeleteProgress(0);
      setDeleteForm({ username: '', password: '' });
      showPopup("Success", "Account deleted successfully.", "success");
      onSuccess();
    } catch(err) {
      showPopup("Error", err.message || "Failed to delete user.", "error");
      setDeleteProgress(0);
    }
  };

  const originalWindowNum = originalUser?.counter ? parseInt(originalUser.counter.name.replace('Window ', '')) : 1;
  const hasChanges = editingUser && originalUser && (
    editingUser.name !== originalUser.name ||
    editingUser.username !== originalUser.username ||
    editingUser.role !== originalUser.role ||
    editingUser.windowNumber !== originalWindowNum ||
    editingUser.caterNew !== originalUser.caterNew ||
    editingUser.caterRenewal !== originalUser.caterRenewal ||
    editingUser.caterRetirement !== originalUser.caterRetirement ||
    editingUser.autoAssign !== (originalUser.autoAssign !== false)
  );

  return (
    <>
      <ModalWrapper isOpen={isOpen} zIndex={100}>
        <div className="card w-[600px] max-h-[90vh] overflow-y-auto p-8 relative bg-surface border border-border rounded-xl shadow-xl">
          <button onClick={onClose} className="absolute top-4 right-4 bg-transparent border-none text-2xl cursor-pointer text-text-muted hover:text-text-main transition-colors">×</button>
          <h3 className="mb-6 m-0 text-xl font-bold text-text-main">Edit Account</h3>
          
          <form onSubmit={handleEditUserSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm mb-1 font-medium text-text-main">Full Name</label>
                <input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:border-primary outline-none transition-colors" required />
              </div>
              <div>
                <label className="block text-sm mb-1 font-medium text-text-main">Username</label>
                <input type="text" value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:border-primary outline-none transition-colors" required />
              </div>
              
              <div>
                <label className="block text-sm mb-2 font-medium text-text-main">Role</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingUser({...editingUser, role: 'STAFF'})} className={`flex-1 p-2 rounded border font-semibold cursor-pointer transition-colors ${editingUser.role === 'STAFF' ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-text-main hover:bg-slate-50'}`}>Staff</button>
                  <button type="button" onClick={() => setEditingUser({...editingUser, role: 'ADMIN'})} className={`flex-1 p-2 rounded border font-semibold cursor-pointer transition-colors ${editingUser.role === 'ADMIN' ? 'bg-warning border-warning text-white' : 'bg-surface border-border text-text-main hover:bg-slate-50'}`}>Admin</button>
                  <button type="button" onClick={() => setEditingUser({...editingUser, role: 'RECEPTIONIST'})} className={`flex-1 p-2 rounded border font-semibold cursor-pointer transition-colors ${editingUser.role === 'RECEPTIONIST' ? 'bg-success border-success text-white' : 'bg-surface border-border text-text-main hover:bg-slate-50'}`}>Receptionist</button>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2 font-semibold text-text-main">Assign to Window Number</label>
                <div className="flex items-center bg-bg-color border border-border rounded overflow-hidden h-[38px]">
                  <button type="button" onClick={() => setEditingUser({...editingUser, windowNumber: Math.max(1, editingUser.windowNumber - 1)})} className="px-4 bg-transparent border-none cursor-pointer text-xl text-text-muted hover:bg-slate-200 transition-colors">−</button>
                  <div className="flex-1 text-center text-xl font-bold text-text-main">{editingUser.windowNumber}</div>
                  <button type="button" onClick={() => setEditingUser({...editingUser, windowNumber: editingUser.windowNumber + 1})} className="px-4 bg-transparent border-none cursor-pointer text-xl text-text-muted hover:bg-slate-200 transition-colors">+</button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm mb-2 font-medium text-text-main">Transactions Catered</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingUser({...editingUser, caterNew: !editingUser.caterNew})} className={`flex-1 p-2 rounded border font-semibold text-sm cursor-pointer transition-colors ${editingUser.caterNew ? 'bg-success border-success text-white' : 'bg-surface border-border text-text-main hover:bg-slate-50'}`}>New</button>
                  <button type="button" onClick={() => setEditingUser({...editingUser, caterRenewal: !editingUser.caterRenewal})} className={`flex-1 p-2 rounded border font-semibold text-sm cursor-pointer transition-colors ${editingUser.caterRenewal ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-text-main hover:bg-slate-50'}`}>Renewal</button>
                  <button type="button" onClick={() => setEditingUser({...editingUser, caterRetirement: !editingUser.caterRetirement})} className={`flex-1 p-2 rounded border font-semibold text-sm cursor-pointer transition-colors ${editingUser.caterRetirement ? 'bg-danger border-danger text-white' : 'bg-surface border-border text-text-main hover:bg-slate-50'}`}>Retirement</button>
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-between gap-4 p-4 rounded-lg border border-border bg-bg-color">
                <div>
                  <label className="block text-sm font-semibold text-text-main">Allow Auto-Reallocation</label>
                  <p className="text-xs text-text-muted mb-0 mt-0.5 leading-relaxed">When ON, the auto-balancer may reassign this employee's transactions. Turn OFF to keep their manual assignments untouched.</p>
                </div>
                <button type="button" onClick={() => setEditingUser({...editingUser, autoAssign: !editingUser.autoAssign})} className={`shrink-0 px-5 py-2 rounded border font-bold text-sm cursor-pointer transition-colors ${editingUser.autoAssign ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-surface border-border text-text-muted'}`}>
                  {editingUser.autoAssign ? 'Auto-Reallocate: ON' : 'Auto-Reallocate: OFF'}
                </button>
              </div>
            </div>

            <div className="mt-2 border-t border-border pt-5">
              <label className="block text-sm mb-1 font-medium text-text-main">Confirm Current Password to Save</label>
              <input type="password" placeholder="••••••••" value={editingUser.currentPassword} onChange={e => setEditingUser({...editingUser, currentPassword: e.target.value})} className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:border-primary outline-none transition-colors mb-2" required />
              <div className="flex gap-4 justify-end">
                <button type="button" onClick={() => setIsChangePasswordModalOpen(true)} className="bg-transparent border-none text-primary cursor-pointer p-0 text-sm font-semibold hover:underline">
                  Change Password
                </button>
                <button type="button" onClick={() => setIsResetPasswordModalOpen(true)} className="bg-transparent border-none text-primary cursor-pointer p-0 text-sm font-semibold hover:underline">
                  Forgot Password
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setIsDeleteModalOpen(true)} className="btn p-4 flex-1 bg-red-100 text-red-600 border border-red-200 rounded-lg font-bold hover:bg-red-200 transition-colors">Delete Account</button>
              <button 
                type="submit" 
                className={`btn btn-primary p-4 flex-[2] bg-primary text-white border-none rounded-lg font-bold transition-colors ${hasChanges ? 'cursor-pointer hover:bg-primary-hover' : 'opacity-50 cursor-not-allowed'}`}
                disabled={!hasChanges}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </ModalWrapper>

      {/* Change Password Modal */}
      <ModalWrapper isOpen={isChangePasswordModalOpen} zIndex={110}>
        <div className="card w-[400px] max-h-[90vh] overflow-y-auto p-8 relative bg-surface border border-border rounded-xl shadow-xl">
          <button onClick={() => setIsChangePasswordModalOpen(false)} className="absolute top-4 right-4 bg-transparent border-none text-2xl cursor-pointer text-text-muted hover:text-text-main transition-colors">×</button>
          <h3 className="mb-6 m-0 text-xl font-bold text-text-main">Change Password</h3>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm mb-1 font-medium text-text-main">Current Password</label>
              <input type="password" value={passwordChange.currentPassword} onChange={e => setPasswordChange({...passwordChange, currentPassword: e.target.value})} className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:border-primary outline-none transition-colors" required />
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium text-text-main">New Password</label>
              <input type="password" value={passwordChange.newPassword} onChange={e => setPasswordChange({...passwordChange, newPassword: e.target.value})} className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:border-primary outline-none transition-colors" required />
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium text-text-main">Confirm New Password</label>
              <input type="password" value={passwordChange.confirmPassword} onChange={e => setPasswordChange({...passwordChange, confirmPassword: e.target.value})} className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:border-primary outline-none transition-colors" required />
            </div>
            <button type="submit" className="btn btn-primary mt-4 p-4 text-base font-bold bg-primary text-white border-none rounded-lg hover:bg-primary-hover cursor-pointer transition-colors">Update Password</button>
          </form>
        </div>
      </ModalWrapper>

      {/* Forgot Password Modal */}
      <ModalWrapper isOpen={isResetPasswordModalOpen} zIndex={110}>
        <div className="card w-[400px] max-h-[90vh] overflow-y-auto p-8 relative bg-surface border border-border rounded-xl shadow-xl">
          <button onClick={() => setIsResetPasswordModalOpen(false)} className="absolute top-4 right-4 bg-transparent border-none text-2xl cursor-pointer text-text-muted hover:text-text-main transition-colors">×</button>
          <h3 className="mb-6 m-0 text-xl font-bold text-text-main">Forgot Password</h3>
          <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm mb-1 font-medium text-text-main">Reset Key</label>
              <input type="text" value={resetPasswordForm.resetKey} onChange={e => setResetPasswordForm({...resetPasswordForm, resetKey: e.target.value})} className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:border-primary outline-none transition-colors" required />
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium text-text-main">New Password</label>
              <input type="password" value={resetPasswordForm.newPassword} onChange={e => setResetPasswordForm({...resetPasswordForm, newPassword: e.target.value})} className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:border-primary outline-none transition-colors" required />
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium text-text-main">Confirm New Password</label>
              <input type="password" value={resetPasswordForm.confirmPassword} onChange={e => setResetPasswordForm({...resetPasswordForm, confirmPassword: e.target.value})} className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:border-primary outline-none transition-colors" required />
            </div>
            <button type="submit" className="btn btn-warning mt-4 p-4 text-base font-bold bg-warning text-white border-none rounded-lg hover:bg-yellow-600 cursor-pointer transition-colors">Reset Password</button>
          </form>
        </div>
      </ModalWrapper>

      {/* Delete Account Modal */}
      <ModalWrapper isOpen={isDeleteModalOpen} zIndex={110}>
        <div className="card w-[400px] max-h-[90vh] overflow-y-auto p-8 relative bg-surface border border-border rounded-xl shadow-xl">
          <button onClick={() => setIsDeleteModalOpen(false)} className="absolute top-4 right-4 bg-transparent border-none text-2xl cursor-pointer text-text-muted hover:text-text-main transition-colors">×</button>
          <h3 className="mb-6 m-0 text-xl font-bold text-danger">Danger Zone: Delete Account</h3>
          <p className="text-sm text-text-muted mb-6">
            Confirm the credentials of <strong>{editingUser.name}</strong> to delete this account permanently.
          </p>
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-sm mb-1 font-medium text-text-main">Username</label>
              <input type="text" value={deleteForm.username} onChange={e => setDeleteForm({...deleteForm, username: e.target.value})} className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:border-primary outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium text-text-main">Password</label>
              <input type="password" value={deleteForm.password} onChange={e => setDeleteForm({...deleteForm, password: e.target.value})} className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:border-primary outline-none transition-colors" />
            </div>
            
            <button 
              onMouseDown={handleMouseDownDelete}
              onMouseUp={handleMouseUpOrLeaveDelete}
              onMouseLeave={handleMouseUpOrLeaveDelete}
              className={`btn p-4 mt-4 rounded-lg relative overflow-hidden transition-colors border ${deleteProgress > 0 ? 'bg-danger text-white border-danger' : 'bg-red-100 text-danger border-red-200 hover:bg-red-200'} ${(deleteForm.username && deleteForm.password) ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
            >
              <div className="absolute top-0 left-0 bottom-0 bg-red-800 z-0 transition-all duration-100 ease-linear" style={{ width: `${deleteProgress}%`, opacity: deleteProgress > 0 ? 1 : 0 }} />
              <span className="relative z-10 font-bold tracking-widest">
                {deleteProgress > 0 ? 'KEEP HOLDING...' : 'HOLD TO DELETE'}
              </span>
            </button>
          </div>
        </div>
      </ModalWrapper>
    </>
  );
}
