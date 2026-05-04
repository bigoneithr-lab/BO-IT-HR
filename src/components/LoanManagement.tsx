import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Plus, X, Trash2, Search, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2 } from 'lucide-react';
import { collection, onSnapshot, addDoc, doc, query, orderBy, deleteDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { Employee, Loan, Payslip } from '../types';

interface LoanManagementProps {
  employees: Employee[];
  isAdmin: boolean;
}

export default function LoanManagement({ employees, isAdmin }: LoanManagementProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    totalAmount: 0,
    monthlyInstallment: 0,
    description: ''
  });

  useEffect(() => {
    if (!isAdmin) return;
    const qLoans = query(collection(db, 'loans'), orderBy('updatedAt', 'desc'));
    const unsubscribeLoans = onSnapshot(qLoans, (snapshot) => {
      const data: Loan[] = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() } as Loan));
      setLoans(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'loans');
    });

    const qPayslips = query(collection(db, 'payslips'), orderBy('month', 'desc'));
    const unsubscribePayslips = onSnapshot(qPayslips, (snapshot) => {
      const data: Payslip[] = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() } as Payslip));
      setPayslips(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payslips');
    });

    return () => {
      unsubscribeLoans();
      unsubscribePayslips();
    };
  }, [isAdmin]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(amount);
  };

  const getEstimatedFinishDate = (loan: Loan) => {
    if (loan.status === 'Completed' || loan.monthlyInstallment <= 0) return 'Paid';
    const monthsRemaining = Math.ceil(loan.remainingBalance / loan.monthlyInstallment);
    const date = new Date();
    date.setMonth(date.getMonth() + monthsRemaining);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'loans'), {
        employeeId: formData.employeeId,
        totalAmount: formData.totalAmount,
        monthlyInstallment: formData.monthlyInstallment,
        totalRepaid: 0,
        remainingBalance: formData.totalAmount,
        status: 'Active',
        startDate: new Date().toISOString().slice(0, 10),
        description: formData.description,
        updatedAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setFormData({ employeeId: '', totalAmount: 0, monthlyInstallment: 0, description: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'loans');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this loan record?')) return;
    try {
      await deleteDoc(doc(db, 'loans', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `loans/${id}`);
    }
  };

  const filteredLoans = loans.filter(loan => {
    const emp = employees.find(e => e.id === loan.employeeId);
    const searchStr = `${emp?.firstName} ${emp?.lastName} ${loan.description}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const totalActiveLoans = loans.filter(l => l.status === 'Active').reduce((sum, l) => sum + l.remainingBalance, 0);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <X size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-600 mt-2">Only administrators can access the Loan Management section.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] md:text-[24px] font-bold text-[#333]">Loan Management</h1>
          <p className="text-[13px] md:text-[14px] text-[#718096] mt-1">Track employee loans, installments, and repayment progress.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#48BB78] hover:bg-[#38A169] text-white px-4 py-2 rounded-[4px] text-[14px] font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Issue New Loan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[12px] border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#EBF8FF] flex items-center justify-center text-[#2B6CB0]">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[14px] font-medium text-[#718096]">Active Loan Volume</span>
          </div>
          <div className="text-2xl font-bold text-[#1A2233]">{formatCurrency(totalActiveLoans)}</div>
        </div>
        <div className="bg-white p-6 rounded-[12px] border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#F0FFF4] flex items-center justify-center text-[#38A169]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[14px] font-medium text-[#718096]">Completed Loans</span>
          </div>
          <div className="text-2xl font-bold text-[#1A2233]">{loans.filter(l => l.status === 'Completed').length}</div>
        </div>
        <div className="bg-white p-6 rounded-[12px] border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#FFF5F5] flex items-center justify-center text-[#E53E3E]">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[14px] font-medium text-[#718096]">Active Borrowers</span>
          </div>
          <div className="text-2xl font-bold text-[#1A2233]">{loans.filter(l => l.status === 'Active').length}</div>
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="p-4 border-b border-[#E2E8F0]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
            <input 
              type="text"
              placeholder="Search by employee name or reason..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-[6px] text-[14px] bg-[#F7FAFC] focus:outline-none focus:ring-1 focus:ring-[#4A90E2]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="px-6 py-4 text-[12px] font-semibold text-[#718096] uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-[#718096] uppercase tracking-wider">Principal</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-[#718096] uppercase tracking-wider text-[#2B6CB0]">Monthly Cut</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-[#718096] uppercase tracking-wider text-[#38A169]">Est. Finish</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-[#718096] uppercase tracking-wider">Progress</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-[#718096] uppercase tracking-wider text-red-600">Balance</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-[#718096] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-[#718096] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredLoans.map(loan => {
                const emp = employees.find(e => e.id === loan.employeeId);
                const progress = (loan.totalRepaid / loan.totalAmount) * 100;
                const paidMonths = Math.floor(loan.totalRepaid / loan.monthlyInstallment);
                const totalMonths = Math.ceil(loan.totalAmount / loan.monthlyInstallment);
                const remainingMonths = Math.ceil(loan.remainingBalance / loan.monthlyInstallment);
                const isExpanded = expandedLoanId === loan.id;
                const loanPayments = payslips.filter(p => p.employeeId === loan.employeeId && p.deductions.loanInstallment > 0);

                return (
                  <React.Fragment key={loan.id}>
                    <tr 
                      className={`hover:bg-[#F8FAFC] transition-colors cursor-pointer ${isExpanded ? 'bg-[#F8FAFC]' : ''}`}
                      onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}
                    >
                      <td className="px-6 py-4">
                        {emp ? (
                          <div className="flex items-center gap-3">
                            <img src={emp.avatarUrl} alt="" className="w-9 h-9 rounded-full bg-[#E2E8F0] object-cover" />
                            <div>
                              <div className="font-semibold text-[14px] text-[#2D3748]">{emp.firstName} {emp.lastName}</div>
                              <div className="text-[12px] text-[#718096]">{loan.description || 'Employee Loan'}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[14px] text-[#A0AEC0]">Unknown</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[14px] font-medium text-[#2D3748]">{formatCurrency(loan.totalAmount)}</div>
                        <div className="text-[11px] text-[#A0AEC0]">Since {new Date(loan.startDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[15px] text-[#2B6CB0] font-bold">{formatCurrency(loan.monthlyInstallment)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[14px] font-bold text-[#38A169]">{getEstimatedFinishDate(loan)}</div>
                        <div className="text-[11px] text-[#A0AEC0]">{remainingMonths} months left</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 min-w-[150px]">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-[#38A169]">{paidMonths}/{totalMonths} Months</span>
                            <span className="text-[#718096]">{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full h-2 bg-[#EDF2F7] rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full bg-[#38A169]"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[15px] font-bold text-[#E53E3E]">{formatCurrency(loan.remainingBalance)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider ${
                          loan.status === 'Active' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(loan.id);
                          }}
                          className="p-2 text-[#E53E3E] hover:bg-red-50 rounded-full transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="px-6 py-0 border-b border-[#E2E8F0]">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="py-6 px-10 bg-[#FBFCFE] border-l-4 border-[#4A90E2] my-2 rounded-r-[8px]">
                                <h3 className="text-[14px] font-bold text-[#2D3748] mb-4 flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-[#4A90E2]" />
                                  Repayment History & Schedule
                                </h3>
                                
                                {loanPayments.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                      <p className="text-[12px] font-bold text-[#718096] uppercase mb-2">Paid Installments</p>
                                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                        {loanPayments.map(p => (
                                          <div key={p.id} className="flex items-center justify-between p-3 bg-white border border-[#E2E8F0] rounded-[6px]">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                                <CheckCircle2 className="w-4 h-4" />
                                              </div>
                                              <div>
                                                <div className="text-[14px] font-semibold text-[#2D3748]">{new Date(p.month + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
                                                <div className="text-[11px] text-[#718096]">Deducted from Payslip</div>
                                              </div>
                                            </div>
                                            <div className="text-[14px] font-bold text-[#38A169]">-{formatCurrency(p.deductions.loanInstallment)}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-[12px] font-bold text-[#718096] uppercase mb-2">Upcoming Schedule</p>
                                      <div className="space-y-2 opacity-60">
                                        {[...Array(Math.min(3, remainingMonths))].map((_, i) => {
                                          const nextDate = new Date();
                                          nextDate.setMonth(nextDate.getMonth() + i + 1);
                                          return (
                                            <div key={i} className="flex items-center justify-between p-3 bg-white border border-dashed border-[#CBD5E0] rounded-[6px]">
                                              <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                  <Clock className="w-4 h-4" />
                                                </div>
                                                <div>
                                                  <div className="text-[14px] font-medium text-[#4A5568]">{nextDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
                                                  <div className="text-[11px] text-[#A0AEC0]">Projected Deduction</div>
                                                </div>
                                              </div>
                                              <div className="text-[14px] font-bold text-[#A0AEC0]">{formatCurrency(loan.monthlyInstallment)}</div>
                                            </div>
                                          );
                                        })}
                                        {remainingMonths > 3 && (
                                          <p className="text-[11px] text-center text-[#A0AEC0] italic pt-2">...and {remainingMonths - 3} more months</p>
                                        )}
                                        {remainingMonths === 0 && (
                                          <div className="h-full flex flex-col items-center justify-center py-6 text-center">
                                            <CheckCircle2 className="w-8 h-8 text-[#38A169] mb-2" />
                                            <p className="text-[13px] font-medium text-[#38A169]">Loan Fully Repaid</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="py-8 text-center bg-white border border-dashed border-[#E2E8F0] rounded-[8px]">
                                    <Clock className="w-8 h-8 text-[#A0AEC0] mx-auto mb-2" />
                                    <p className="text-[14px] text-[#718096]">No payments recorded yet for this loan.</p>
                                    <p className="text-[12px] text-[#A0AEC0]">Deductions will start with the next payslip generation.</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 bg-[#F7FAFC] rounded-full flex items-center justify-center text-[#A0AEC0]">
                        <Wallet className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-[15px] font-medium text-[#4A5568]">No loans found</p>
                        <p className="text-[13px] text-[#718096]">Try adjusting your search or issue a new loan.</p>
                      </div>
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1A202C]/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[12px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#F0F2F5]">
                <h2 className="text-[18px] font-bold text-[#2D3748]">Issue New Loan</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-[#A0AEC0] hover:text-[#2D3748] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-[12px] font-bold text-[#4A5568] uppercase tracking-widest mb-1.5">Employee</label>
                  <select 
                    required
                    value={formData.employeeId}
                    onChange={e => setFormData({...formData, employeeId: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-[6px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/20 focus:border-[#4A90E2] transition-all"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-[#4A5568] uppercase tracking-widest mb-1.5">Total Amount (BDT)</label>
                    <div className="relative">
                      <input 
                        required
                        type="number"
                        min="1"
                        value={formData.totalAmount || ''}
                        onChange={e => setFormData({...formData, totalAmount: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-[6px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/20 focus:border-[#4A90E2] transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#4A5568] uppercase tracking-widest mb-1.5">Monthly Cut (BDT)</label>
                    <input 
                      required
                      type="number"
                      min="1"
                      value={formData.monthlyInstallment || ''}
                      onChange={e => setFormData({...formData, monthlyInstallment: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-[6px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/20 focus:border-[#4A90E2] transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#4A5568] uppercase tracking-widest mb-1.5">Reason / Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-[6px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/20 focus:border-[#4A90E2] transition-all h-24 resize-none"
                    placeholder="Briefly explain the purpose of this loan..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 text-[14px] font-bold text-[#4A5568] bg-[#EDF2F7] rounded-[6px] hover:bg-[#E2E8F0] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2.5 text-[14px] font-bold text-white bg-[#48BB78] rounded-[6px] hover:bg-[#38A169] transition-all shadow-md active:scale-95"
                  >
                    Issue Loan
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
