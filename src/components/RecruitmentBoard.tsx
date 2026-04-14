import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, MoreVertical, Mail, Phone, Calendar, UserPlus } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { Applicant, ApplicantStage, Department } from '../types';

interface RecruitmentBoardProps {
  applicants: Applicant[];
  departments: Department[];
}

const STAGES: ApplicantStage[] = ['Applied', 'Interviewing', 'Offered', 'Hired', 'Rejected'];

export default function RecruitmentBoard({ applicants, departments }: RecruitmentBoardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApplicant, setEditingApplicant] = useState<Applicant | undefined>();
  const [formData, setFormData] = useState<Partial<Applicant>>({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    stage: 'Applied',
    appliedDate: new Date().toISOString().split('T')[0],
    phone: '',
    notes: ''
  });

  const handleDragStart = (e: React.DragEvent, applicantId: string) => {
    e.dataTransfer.setData('applicantId', applicantId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStage: ApplicantStage) => {
    e.preventDefault();
    const applicantId = e.dataTransfer.getData('applicantId');
    if (!applicantId) return;

    const applicant = applicants.find(a => a.id === applicantId);
    if (applicant && applicant.stage !== newStage) {
      try {
        await updateDoc(doc(db, 'applicants', applicantId), { stage: newStage });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `applicants/${applicantId}`);
      }
    }
  };

  const handleAddNew = () => {
    setEditingApplicant(undefined);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      stage: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
      phone: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (applicant: Applicant) => {
    setEditingApplicant(applicant);
    setFormData(applicant);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this applicant?')) return;
    try {
      await deleteDoc(doc(db, 'applicants', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `applicants/${id}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingApplicant) {
        await updateDoc(doc(db, 'applicants', editingApplicant.id), formData);
      } else {
        await addDoc(collection(db, 'applicants'), formData);
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingApplicant ? OperationType.UPDATE : OperationType.CREATE, 'applicants');
    }
  };

  const handleConvertToEmployee = async (applicant: Applicant) => {
    if (!window.confirm(`Convert ${applicant.firstName} ${applicant.lastName} to an employee?`)) return;
    
    try {
      // Create employee
      await addDoc(collection(db, 'employees'), {
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        email: applicant.email,
        role: applicant.role,
        department: 'TBD', // Default, can be edited later
        status: 'Active',
        joinDate: new Date().toISOString().split('T')[0],
        avatarUrl: `https://i.pravatar.cc/150?u=${Math.random()}`,
        phone: applicant.phone || '',
      });

      // Update applicant stage to Hired if not already
      if (applicant.stage !== 'Hired') {
        await updateDoc(doc(db, 'applicants', applicant.id), { stage: 'Hired' });
      }

      alert('Successfully converted to employee! You can now find them in the Employee Directory.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'employees');
    }
  };

  const getStageColor = (stage: ApplicantStage) => {
    switch (stage) {
      case 'Applied': return 'border-[#4A90E2]';
      case 'Interviewing': return 'border-[#F5A623]';
      case 'Offered': return 'border-[#9013FE]';
      case 'Hired': return 'border-[#48BB78]';
      case 'Rejected': return 'border-[#E53E3E]';
      default: return 'border-[#A0AEC0]';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1400px] mx-auto h-full flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[#333]">Recruitment Board</h1>
          <p className="text-[14px] text-[#718096] mt-1">Track and manage job applicants</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-[#4A90E2] hover:bg-[#3A80D2] text-white px-4 py-2 rounded-[4px] text-[14px] font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Applicant
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 h-full min-w-max">
          {STAGES.map(stage => {
            const stageApplicants = applicants.filter(a => a.stage === stage);
            return (
              <div 
                key={stage}
                className="w-[300px] flex flex-col bg-[#F7FAFC] rounded-[8px] border border-[#E2E8F0] overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className={`p-4 border-t-4 ${getStageColor(stage)} bg-white border-b border-[#E2E8F0] flex justify-between items-center`}>
                  <h3 className="font-semibold text-[#333]">{stage}</h3>
                  <span className="bg-[#EDF2F7] text-[#4A5568] text-[12px] font-bold px-2 py-1 rounded-full">
                    {stageApplicants.length}
                  </span>
                </div>
                
                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  {stageApplicants.map(applicant => (
                    <div 
                      key={applicant.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, applicant.id)}
                      className="bg-white p-4 rounded-[6px] shadow-sm border border-[#E2E8F0] cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-[#333] text-[14px]">{applicant.firstName} {applicant.lastName}</h4>
                        <div className="relative">
                          <button 
                            onClick={() => handleEdit(applicant)}
                            className="text-[#A0AEC0] hover:text-[#4A90E2] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-[13px] text-[#4A90E2] font-medium mb-3">{applicant.role}</div>
                      
                      <div className="space-y-2 text-[12px] text-[#718096]">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">{applicant.email}</span>
                        </div>
                        {applicant.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{applicant.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Applied: {new Date(applicant.appliedDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {stage === 'Hired' && (
                        <button 
                          onClick={() => handleConvertToEmployee(applicant)}
                          className="mt-4 w-full flex items-center justify-center gap-2 bg-[#E6FFFA] text-[#2C7A7B] hover:bg-[#B2F5EA] py-1.5 rounded-[4px] text-[12px] font-medium transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Convert to Employee
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FFFFFF] rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
              <h2 className="text-[16px] font-semibold text-[#333]">
                {editingApplicant ? 'Edit Applicant' : 'Add New Applicant'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#718096] hover:text-[#333] transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">First Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Last Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Email</label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Role Applied For</label>
                  <input 
                    required
                    type="text" 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Stage</label>
                  <select 
                    required
                    value={formData.stage}
                    onChange={e => setFormData({...formData, stage: e.target.value as ApplicantStage})}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Phone (Optional)</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                />
              </div>

              <div className="pt-4 flex justify-between border-t border-[#F0F2F5] mt-6">
                {editingApplicant ? (
                  <button 
                    type="button"
                    onClick={() => { handleDelete(editingApplicant.id); setIsModalOpen(false); }}
                    className="px-4 py-2 text-[12px] font-medium text-[#E53E3E] hover:bg-[#FFF5F5] rounded-[4px] transition-colors"
                  >
                    Delete
                  </button>
                ) : <div></div>}
                <div className="flex gap-3">
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
                    {editingApplicant ? 'Save Changes' : 'Add Applicant'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
