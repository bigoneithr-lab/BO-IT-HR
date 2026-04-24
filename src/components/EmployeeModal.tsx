import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, EmployeeStatus, Department } from '../types';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee;
  departments: Department[];
  onSave: (employee: Employee) => void;
}

export default function EmployeeModal({ isOpen, onClose, employee, departments, onSave }: EmployeeModalProps) {
  const [formData, setFormData] = useState<Partial<Employee>>({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    department: '',
    status: 'Active',
    joinDate: new Date().toISOString().split('T')[0],
    avatarUrl: `https://ui-avatars.com/api/?name=New+Employee&background=E2E8F0&color=4A5568`
  });

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    }
  }, [employee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate avatar with actual name instead of "New Employee"
    const finalAvatarUrl = employee?.avatarUrl || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent((formData.firstName || '') + ' ' + (formData.lastName || ''))}&background=E2E8F0&color=4A5568`;
    
    onSave({
      ...formData,
      avatarUrl: finalAvatarUrl,
      id: employee?.id || Math.random().toString(36).substr(2, 9),
    } as Employee);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#FFFFFF] rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
            <h2 className="text-[16px] font-semibold text-[#333]">
              {employee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <button 
              onClick={onClose}
              className="text-[#718096] hover:text-[#333] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">First Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Last Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Employee ID</label>
                <input 
                  type="text" 
                  value={formData.employeeId || ''}
                  onChange={e => setFormData({...formData, employeeId: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors"
                  placeholder="EMP-001"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Email</label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Role</label>
                <input 
                  required
                  type="text" 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Department</label>
                <select 
                  required
                  value={formData.department}
                  onChange={e => setFormData({...formData, department: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors"
                >
                  <option value="">Select Dept</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                  {/* Fallback for existing employees with departments not in the list */}
                  {formData.department && !departments.find(d => d.name === formData.department) && (
                    <option value={formData.department}>{formData.department}</option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Status</label>
                <select 
                  required
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as EmployeeStatus})}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Join Date</label>
                <input 
                  required
                  type="date" 
                  value={formData.joinDate}
                  onChange={e => setFormData({...formData, joinDate: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-[#F0F2F5] mt-6">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[12px] font-medium text-[#4A5568] bg-[#EDF2F7] rounded-[4px] hover:bg-[#E2E8F0] transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 text-[12px] font-medium text-white bg-[#4A90E2] rounded-[4px] hover:bg-[#3A80D2] transition-colors"
              >
                {employee ? 'Save Changes' : 'Add Employee'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
