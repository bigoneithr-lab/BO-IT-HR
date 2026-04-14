import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Banknote, Plus, Check, X, FileText, AlertTriangle, Download } from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { Employee, Payslip } from '../types';

interface PayrollProps {
  employees: Employee[];
  isAdmin: boolean;
}

export default function Payroll({ employees, isAdmin }: PayrollProps) {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    month: new Date().toISOString().slice(0, 7),
    absentDays: 0,
    hasAttendanceBonus: true,
    hasDressCodeBonus: true,
    teamSales: 0,
    ownSales: 0,
  });

  useEffect(() => {
    const q = query(collection(db, 'payslips'), orderBy('month', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const slips: Payslip[] = [];
      snapshot.forEach(doc => slips.push({ id: doc.id, ...doc.data() } as Payslip));
      setPayslips(slips);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payslips');
    });
    return () => unsubscribe();
  }, []);

  const selectedEmployee = employees.find(e => e.id === formData.employeeId);
  const isManager = selectedEmployee?.role.toLowerCase().includes('manager') || false;
  
  let isProbation = false;
  if (selectedEmployee) {
    const joinDate = new Date(selectedEmployee.joinDate);
    const probationEndDate = new Date(joinDate.setMonth(joinDate.getMonth() + 6));
    isProbation = new Date() < probationEndDate;
  }

  const calculateSalary = () => {
    if (!selectedEmployee) return null;

    const baseSalary = isManager ? 25000 : 17000;
    const allowances = {
      attendance: 0,
      dressCode: 0,
      dinner: 0,
      teamSales: 0,
      ownSales: 0
    };
    const deductions = {
      absences: 0,
      absenceDays: formData.absentDays || 0
    };

    if (isManager) {
      allowances.teamSales = (formData.teamSales || 0) * 5;
      allowances.ownSales = (formData.ownSales || 0) * 100;
    } else {
      if (formData.hasAttendanceBonus) allowances.attendance = 1000;
      if (formData.hasDressCodeBonus) allowances.dressCode = 1000;
      if (!isProbation) allowances.dinner = 2000;
    }

    if (isProbation && formData.absentDays > 0) {
      const deductionPerDay = baseSalary / 30;
      deductions.absences = Math.round(formData.absentDays * deductionPerDay);
    }

    const totalAllowances = Object.values(allowances).reduce((a, b) => a + b, 0);
    const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0) - deductions.absenceDays; // don't sum the days
    const netSalary = Math.max(0, baseSalary + totalAllowances - deductions.absences);

    return { baseSalary, allowances, deductions, netSalary };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !isAdmin) return;

    const calculation = calculateSalary();
    if (!calculation) return;

    try {
      await addDoc(collection(db, 'payslips'), {
        employeeId: selectedEmployee.id,
        month: formData.month,
        baseSalary: calculation.baseSalary,
        allowances: calculation.allowances,
        deductions: calculation.deductions,
        netSalary: calculation.netSalary,
        status: 'Draft',
        generatedAt: new Date().toISOString(),
        generatedBy: auth.currentUser?.email || 'System'
      });
      setIsModalOpen(false);
      setFormData({
        employeeId: '',
        month: new Date().toISOString().slice(0, 7),
        absentDays: 0,
        hasAttendanceBonus: true,
        hasDressCodeBonus: true,
        teamSales: 0,
        ownSales: 0,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payslips');
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: 'Paid') => {
    try {
      await updateDoc(doc(db, 'payslips', id), {
        status: newStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `payslips/${id}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(amount);
  };

  const currentCalc = calculateSalary();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto h-full flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[#333]">Payroll & Salary</h1>
          <p className="text-[14px] text-[#718096] mt-1">Manage employee payslips and salary calculations.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#4A90E2] hover:bg-[#3A80D2] text-white px-4 py-2 rounded-[4px] text-[14px] font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Generate Payslip
          </button>
        )}
      </div>

      <div className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#FAFBFC] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Month</th>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Employee</th>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Base Salary</th>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Net Salary</th>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Status</th>
                {isAdmin && <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5] text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white">
              {payslips.map(slip => {
                const emp = employees.find(e => e.id === slip.employeeId);
                return (
                  <tr key={slip.id} className="hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-6 py-4 border-b border-[#F0F2F5]">
                      <div className="text-[14px] text-[#333] font-medium">
                        {new Date(slip.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b border-[#F0F2F5]">
                      {emp ? (
                        <div className="flex items-center gap-3">
                          <img src={emp.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-[#E2E8F0] object-cover" />
                          <div>
                            <div className="font-medium text-[14px] text-[#333]">{emp.firstName} {emp.lastName}</div>
                            <div className="text-[12px] text-[#718096]">{emp.role}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[14px] text-[#718096]">Unknown Employee</span>
                      )}
                    </td>
                    <td className="px-6 py-4 border-b border-[#F0F2F5]">
                      <div className="text-[14px] text-[#718096]">{formatCurrency(slip.baseSalary)}</div>
                    </td>
                    <td className="px-6 py-4 border-b border-[#F0F2F5]">
                      <div className="text-[14px] text-[#333] font-bold">{formatCurrency(slip.netSalary)}</div>
                    </td>
                    <td className="px-6 py-4 border-b border-[#F0F2F5]">
                      {slip.status === 'Paid' ? (
                        <span className="px-[10px] py-[4px] inline-flex text-[11px] font-semibold rounded-[12px] uppercase bg-[#E6FFFA] text-[#2C7A7B]">Paid</span>
                      ) : (
                        <span className="px-[10px] py-[4px] inline-flex text-[11px] font-semibold rounded-[12px] uppercase bg-[#EDF2F7] text-[#4A5568]">Draft</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 border-b border-[#F0F2F5] text-right">
                        {slip.status === 'Draft' && (
                          <button 
                            onClick={() => handleStatusUpdate(slip.id, 'Paid')}
                            className="text-[13px] text-[#4A90E2] hover:text-[#3A80D2] font-medium transition-colors"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {payslips.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-16 text-center text-[#718096]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Banknote className="w-8 h-8 text-[#A0AEC0] mb-2" />
                      <p className="text-[14px]">No payslips generated yet.</p>
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
              className="bg-[#FFFFFF] rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5] shrink-0">
                <h2 className="text-[16px] font-semibold text-[#333]">Generate Payslip</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#718096] hover:text-[#333] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="payslip-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Employee</label>
                      <select 
                        required
                        value={formData.employeeId}
                        onChange={e => setFormData({...formData, employeeId: e.target.value})}
                        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors"
                      >
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.role})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Month</label>
                      <input 
                        required
                        type="month" 
                        value={formData.month}
                        onChange={e => setFormData({...formData, month: e.target.value})}
                        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors"
                      />
                    </div>
                  </div>

                  {selectedEmployee && (
                    <div className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-[8px] p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                        <span className="text-[14px] font-medium text-[#333]">Base Salary ({isManager ? 'Manager' : 'Employee'})</span>
                        <span className="text-[14px] font-bold text-[#333]">{formatCurrency(isManager ? 25000 : 17000)}</span>
                      </div>

                      {isManager ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Total Team Sales</label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  min="0"
                                  value={formData.teamSales}
                                  onChange={e => setFormData({...formData, teamSales: parseInt(e.target.value) || 0})}
                                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-white text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                                />
                                <span className="absolute right-3 top-2 text-[12px] text-[#A0AEC0]">× ৳5</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Own Sales</label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  min="0"
                                  value={formData.ownSales}
                                  onChange={e => setFormData({...formData, ownSales: parseInt(e.target.value) || 0})}
                                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-white text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                                />
                                <span className="absolute right-3 top-2 text-[12px] text-[#A0AEC0]">× ৳100</span>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={formData.hasAttendanceBonus}
                                onChange={e => setFormData({...formData, hasAttendanceBonus: e.target.checked})}
                                className="w-4 h-4 text-[#4A90E2] rounded border-[#E2E8F0] focus:ring-[#4A90E2]"
                              />
                              <span className="text-[14px] text-[#333] flex-1">Attendance Bonus</span>
                              <span className="text-[14px] font-medium text-[#48BB78]">+ {formatCurrency(1000)}</span>
                            </label>
                            
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={formData.hasDressCodeBonus}
                                onChange={e => setFormData({...formData, hasDressCodeBonus: e.target.checked})}
                                className="w-4 h-4 text-[#4A90E2] rounded border-[#E2E8F0] focus:ring-[#4A90E2]"
                              />
                              <span className="text-[14px] text-[#333] flex-1">Dress Code & Behaviour Bonus</span>
                              <span className="text-[14px] font-medium text-[#48BB78]">+ {formatCurrency(1000)}</span>
                            </label>

                            {!isProbation && (
                              <div className="flex items-center gap-3 pt-2">
                                <Check className="w-4 h-4 text-[#48BB78]" />
                                <span className="text-[14px] text-[#333] flex-1">Dinner Allowance (Post-Probation)</span>
                                <span className="text-[14px] font-medium text-[#48BB78]">+ {formatCurrency(2000)}</span>
                              </div>
                            )}

                            {isProbation && (
                              <div className="pt-3 border-t border-[#E2E8F0]">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle className="w-4 h-4 text-[#C53030]" />
                                  <span className="text-[13px] font-medium text-[#C53030]">Probation Period Active</span>
                                </div>
                                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Unpaid Absences (Days)</label>
                                <div className="flex items-center gap-3">
                                  <input 
                                    type="number" 
                                    min="0"
                                    max="31"
                                    value={formData.absentDays}
                                    onChange={e => setFormData({...formData, absentDays: parseInt(e.target.value) || 0})}
                                    className="w-32 px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-white text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                                  />
                                  <span className="text-[13px] text-[#718096]">
                                    Deduction: {formatCurrency((17000 / 30) * formData.absentDays)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {currentCalc && (
                        <div className="mt-6 pt-4 border-t-2 border-[#E2E8F0] flex items-center justify-between">
                          <span className="text-[16px] font-bold text-[#333]">Net Salary</span>
                          <span className="text-[20px] font-bold text-[#4A90E2]">{formatCurrency(currentCalc.netSalary)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </div>

              <div className="p-6 border-t border-[#F0F2F5] shrink-0 flex justify-end gap-3 bg-[#FAFBFC]">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[13px] font-medium text-[#4A5568] bg-white border border-[#E2E8F0] rounded-[4px] hover:bg-[#F7FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  form="payslip-form"
                  disabled={!selectedEmployee}
                  className="px-4 py-2 text-[13px] font-medium text-white bg-[#4A90E2] rounded-[4px] hover:bg-[#3A80D2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save Payslip
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
