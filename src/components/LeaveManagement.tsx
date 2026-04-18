import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Plus, Check, X, Clock, AlertTriangle } from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { Employee, LeaveRequest, LeaveType } from '../types';

interface LeaveManagementProps {
  employees: Employee[];
  isAdmin: boolean;
  currentUserEmail?: string | null;
}

export default function LeaveManagement({ employees, isAdmin, currentUserEmail }: LeaveManagementProps) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<LeaveRequest>>({
    employeeId: '',
    type: 'Casual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    if (!isAdmin && currentUserEmail) {
      const emp = employees.find(e => e.email === currentUserEmail);
      if (emp) {
        setFormData(prev => ({ ...prev, employeeId: emp.id }));
      }
    }
  }, [isAdmin, currentUserEmail, employees]);

  useEffect(() => {
    const q = query(collection(db, 'leaveRequests'), orderBy('appliedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs: LeaveRequest[] = [];
      snapshot.forEach(doc => reqs.push({ id: doc.id, ...doc.data() } as LeaveRequest));
      setRequests(reqs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leaveRequests');
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'leaveRequests'), {
        ...formData,
        status: 'Pending',
        appliedAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setFormData({ employeeId: !isAdmin && currentUserEmail ? employees.find(e => e.email === currentUserEmail)?.id || '' : '', type: 'Casual', startDate: '', endDate: '', reason: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'leaveRequests');
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: 'Approved' | 'Denied') => {
    try {
      await updateDoc(doc(db, 'leaveRequests', id), {
        status: newStatus,
        reviewedBy: auth.currentUser?.email
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leaveRequests/${id}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <span className="px-[10px] py-[4px] inline-flex text-[11px] font-semibold rounded-[12px] uppercase bg-[#E6FFFA] text-[#2C7A7B]">Approved</span>;
      case 'Denied': return <span className="px-[10px] py-[4px] inline-flex text-[11px] font-semibold rounded-[12px] uppercase bg-[#FFF5F5] text-[#C53030]">Denied</span>;
      default: return <span className="px-[10px] py-[4px] inline-flex text-[11px] font-semibold rounded-[12px] uppercase bg-[#FEFCBF] text-[#B7791F] flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>;
    }
  };

  const selectedEmployee = employees.find(e => e.id === formData.employeeId);
  let isProbation = false;
  if (selectedEmployee) {
    const joinDate = new Date(selectedEmployee.joinDate);
    const probationEndDate = new Date(joinDate.setMonth(joinDate.getMonth() + 6));
    isProbation = new Date() < probationEndDate;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto h-full flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-[20px] md:text-[24px] font-bold text-[#333]">Time-Off & Leave</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4A90E2] hover:bg-[#3A80D2] text-white px-4 py-2 rounded-[4px] text-[14px] font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Request Time Off
        </button>
      </div>

      <div className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] flex-1 overflow-hidden">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#FAFBFC] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Employee</th>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Type</th>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Duration</th>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Status</th>
                {isAdmin && <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5] text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white">
              {(isAdmin ? requests : requests.filter(req => {
                const emp = employees.find(e => e.id === req.employeeId);
                return emp?.email === currentUserEmail;
              })).map(req => {
                const emp = employees.find(e => e.id === req.employeeId);
                let reqIsProbation = false;
                if (emp) {
                  const joinDate = new Date(emp.joinDate);
                  const probationEndDate = new Date(joinDate.setMonth(joinDate.getMonth() + 6));
                  reqIsProbation = new Date(req.appliedAt) < probationEndDate;
                }
                
                return (
                  <tr key={req.id} className="hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-6 py-4 border-b border-[#F0F2F5]">
                      {emp ? (
                        <div className="flex items-center gap-3">
                          <img src={emp.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-[#E2E8F0] object-cover" />
                          <div>
                            <div className="font-medium text-[14px] text-[#333]">{emp.firstName} {emp.lastName}</div>
                            <div className="text-[12px] text-[#718096]">{emp.department}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[14px] text-[#718096]">Unknown Employee</span>
                      )}
                    </td>
                    <td className="px-6 py-4 border-b border-[#F0F2F5]">
                      <div className="text-[14px] text-[#333] font-medium flex items-center gap-2">
                        {req.type}
                        {reqIsProbation && (
                          <span className="text-[10px] bg-[#FFF5F5] text-[#C53030] px-1.5 py-0.5 rounded border border-[#FED7D7]" title="Requested during probation (Unpaid)">
                            Probation
                          </span>
                        )}
                      </div>
                      {req.reason && <div className="text-[12px] text-[#718096] mt-0.5 truncate max-w-[200px]">{req.reason}</div>}
                    </td>
                    <td className="px-6 py-4 border-b border-[#F0F2F5]">
                      <div className="text-[14px] text-[#333]">
                        {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                      </div>
                      <div className="text-[12px] text-[#718096] mt-0.5">
                        Applied: {new Date(req.appliedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b border-[#F0F2F5]">
                      {getStatusBadge(req.status)}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 border-b border-[#F0F2F5] text-right">
                        {req.status === 'Pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleStatusUpdate(req.id, 'Approved')}
                              className="p-1.5 bg-[#E6FFFA] text-[#2C7A7B] hover:bg-[#B2F5EA] rounded-[4px] transition-colors"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(req.id, 'Denied')}
                              className="p-1.5 bg-[#FFF5F5] text-[#C53030] hover:bg-[#FED7D7] rounded-[4px] transition-colors"
                              title="Deny"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-16 text-center text-[#718096]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar className="w-8 h-8 text-[#A0AEC0] mb-2" />
                      <p className="text-[14px]">No time-off requests found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FFFFFF] rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
                <h2 className="text-[16px] font-semibold text-[#333]">Request Time Off</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#718096] hover:text-[#333] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Employee</label>
                  <select 
                    required
                    value={formData.employeeId}
                    onChange={e => setFormData({...formData, employeeId: e.target.value})}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors disabled:opacity-60"
                  >
                    <option value="">Select Employee</option>
                    {(isAdmin ? employees : employees.filter(e => e.email === currentUserEmail)).map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>

                {isProbation && (
                  <div className="bg-[#FFF5F5] border border-[#FED7D7] rounded-[4px] p-3 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-[#C53030] shrink-0 mt-0.5" />
                    <div className="text-[13px] text-[#C53030]">
                      <strong>Probation Period Active</strong>
                      <p className="mt-1">This employee is within their 6-month probation period. Any absence will be deducted from their salary (1 day absent = 1 day salary cut).</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Leave Type</label>
                  <select 
                    required
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as LeaveType})}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors"
                  >
                    <option value="Casual">Casual Leave</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Personal">Personal Leave</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Start Date</label>
                    <input 
                      required
                      type="date" 
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">End Date</label>
                    <input 
                      required
                      type="date" 
                      value={formData.endDate}
                      onChange={e => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Reason (Optional)</label>
                  <textarea 
                    value={formData.reason}
                    onChange={e => setFormData({...formData, reason: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors resize-none"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-[#F0F2F5] mt-6">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-[12px] font-medium text-[#4A5568] bg-[#EDF2F7] rounded-[4px] hover:bg-[#E2E8F0] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 text-[12px] font-medium text-white bg-[#4A90E2] rounded-[4px] hover:bg-[#3A80D2] transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
