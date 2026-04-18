import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Plus, Trash2, Edit2, X, UserCircle } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { Employee, Department } from '../types';

interface DepartmentsProps {
  employees: Employee[];
  departments: Department[];
  isAdmin: boolean;
}

export default function Departments({ employees, departments, isAdmin }: DepartmentsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleOpenModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({ name: dept.name, description: dept.description || '' });
    } else {
      setEditingDept(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await updateDoc(doc(db, 'departments', editingDept.id), formData);
      } else {
        await addDoc(collection(db, 'departments'), formData);
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingDept ? OperationType.UPDATE : OperationType.CREATE, 'departments');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await deleteDoc(doc(db, 'departments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `departments/${id}`);
    }
  };

  const handleAssignManager = async (deptId: string, managerId: string) => {
    try {
      await updateDoc(doc(db, 'departments', deptId), { managerId: managerId || null });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `departments/${deptId}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto h-full flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-[20px] md:text-[24px] font-bold text-[#333]">Departments & Org Chart</h1>
        {isAdmin && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#4A90E2] hover:bg-[#3A80D2] text-white px-4 py-2 rounded-[4px] text-[14px] font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-8">
        {departments.map(dept => {
          const deptEmployees = employees.filter(e => e.department === dept.name);
          const manager = employees.find(e => e.id === dept.managerId);
          const teamMembers = deptEmployees.filter(e => e.id !== dept.managerId);

          return (
            <div key={dept.id} className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] flex flex-col border border-[#E2E8F0] overflow-hidden">
              <div className="p-5 border-b border-[#F0F2F5] bg-[#FAFBFC] flex items-start justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-[#333] flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#4A90E2]" />
                    {dept.name}
                  </h2>
                  {dept.description && (
                    <p className="text-[13px] text-[#718096] mt-1 line-clamp-2">{dept.description}</p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenModal(dept)} className="p-1.5 text-[#A0AEC0] hover:text-[#4A90E2] transition-colors rounded-[4px] hover:bg-[#EBF8FF]">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(dept.id)} className="p-1.5 text-[#A0AEC0] hover:text-[#C53030] transition-colors rounded-[4px] hover:bg-[#FFF5F5]">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col">
                {/* Manager Section */}
                <div className="mb-6 relative">
                  <div className="text-[11px] font-bold text-[#A0AEC0] uppercase tracking-[1px] mb-3 flex items-center justify-between">
                    <span>Department Manager</span>
                    <span className="bg-[#EBF8FF] text-[#2B6CB0] px-2 py-0.5 rounded-full text-[10px]">Lead</span>
                  </div>
                  
                  {manager ? (
                    <div className="flex items-center gap-3 p-3 bg-[#F7FAFC] rounded-[6px] border border-[#E2E8F0]">
                      <img src={manager.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-white" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[14px] text-[#333] truncate">{manager.firstName} {manager.lastName}</div>
                        <div className="text-[12px] text-[#718096] truncate">{manager.role}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-[#F7FAFC] rounded-[6px] border border-dashed border-[#CBD5E0]">
                      <div className="w-12 h-12 rounded-full bg-[#EDF2F7] flex items-center justify-center">
                        <UserCircle className="w-6 h-6 text-[#A0AEC0]" />
                      </div>
                      <div className="text-[13px] text-[#718096] italic">No manager assigned</div>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="mt-2">
                      <select 
                        value={dept.managerId || ''}
                        onChange={(e) => handleAssignManager(dept.id, e.target.value)}
                        className="w-full text-[12px] px-2 py-1.5 border border-[#E2E8F0] rounded-[4px] bg-white text-[#4A5568] focus:outline-none focus:border-[#4A90E2]"
                      >
                        <option value="">-- Assign Manager --</option>
                        {deptEmployees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Connecting Line for Org Chart feel */}
                  <div className="absolute left-9 -bottom-6 w-[2px] h-6 bg-[#E2E8F0]"></div>
                </div>

                {/* Team Members Section */}
                <div className="relative">
                  <div className="text-[11px] font-bold text-[#A0AEC0] uppercase tracking-[1px] mb-3 ml-12">
                    Team Members ({teamMembers.length})
                  </div>
                  
                  <div className="space-y-2 pl-4 border-l-2 border-[#E2E8F0] ml-8">
                    {teamMembers.map(member => (
                      <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-[#F7FAFC] rounded-[6px] transition-colors relative group">
                        {/* Horizontal connecting line */}
                        <div className="absolute -left-4 top-1/2 w-4 h-[2px] bg-[#E2E8F0]"></div>
                        
                        <img src={member.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-[#E2E8F0]" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[13px] text-[#333] truncate">{member.firstName} {member.lastName}</div>
                          <div className="text-[11px] text-[#718096] truncate">{member.role}</div>
                        </div>
                      </div>
                    ))}
                    {teamMembers.length === 0 && (
                      <div className="text-[12px] text-[#A0AEC0] italic pl-2 py-2 relative">
                        <div className="absolute -left-4 top-1/2 w-4 h-[2px] bg-[#E2E8F0]"></div>
                        No other team members
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}

        {departments.length === 0 && (
          <div className="col-span-full text-center py-16 bg-[#FFFFFF] rounded-[8px] border border-dashed border-[#CBD5E0]">
            <Building2 className="w-12 h-12 text-[#A0AEC0] mx-auto mb-3" />
            <h3 className="text-[16px] font-semibold text-[#333]">No Departments Yet</h3>
            <p className="text-[14px] text-[#718096] mt-1">Add departments to build your organization chart.</p>
          </div>
        )}
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
                <h2 className="text-[16px] font-semibold text-[#333]">
                  {editingDept ? 'Edit Department' : 'Add Department'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#718096] hover:text-[#333] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Department Name</label>
                  <input 
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Engineering"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Description (Optional)</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    placeholder="Brief description of the department's function..."
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
                    {editingDept ? 'Save Changes' : 'Create Department'}
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
