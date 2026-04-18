import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Star, Plus, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { Employee, Goal, PerformanceReview } from '../types';

interface PerformanceProps {
  employees: Employee[];
  isAdmin: boolean;
  currentUserEmail?: string | null;
}

export default function Performance({ employees, isAdmin, currentUserEmail }: PerformanceProps) {
  const [activeTab, setActiveTab] = useState<'goals' | 'reviews'>('goals');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const [goalForm, setGoalForm] = useState<Partial<Goal>>({
    employeeId: '',
    title: '',
    description: '',
    dueDate: '',
    status: 'Not Started'
  });

  const [reviewForm, setReviewForm] = useState<Partial<PerformanceReview>>({
    employeeId: '',
    period: 'Q1',
    year: new Date().getFullYear(),
    rating: 3,
    feedback: ''
  });

  useEffect(() => {
    const qGoals = query(collection(db, 'goals'), orderBy('dueDate', 'asc'));
    const unsubGoals = onSnapshot(qGoals, (snapshot) => {
      const g: Goal[] = [];
      snapshot.forEach(doc => g.push({ id: doc.id, ...doc.data() } as Goal));
      setGoals(g);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'goals'));

    const qReviews = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubReviews = onSnapshot(qReviews, (snapshot) => {
      const r: PerformanceReview[] = [];
      snapshot.forEach(doc => r.push({ id: doc.id, ...doc.data() } as PerformanceReview));
      setReviews(r);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reviews'));

    return () => {
      unsubGoals();
      unsubReviews();
    };
  }, []);

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'goals'), {
        ...goalForm,
        createdAt: new Date().toISOString()
      });
      setIsGoalModalOpen(false);
      setGoalForm({ employeeId: '', title: '', description: '', dueDate: '', status: 'Not Started' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'goals');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'reviews'), {
        ...reviewForm,
        reviewerId: auth.currentUser?.uid || 'Admin',
        status: 'Published',
        createdAt: new Date().toISOString()
      });
      setIsReviewModalOpen(false);
      setReviewForm({ employeeId: '', period: 'Q1', year: new Date().getFullYear(), rating: 3, feedback: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    }
  };

  const updateGoalStatus = async (id: string, status: Goal['status']) => {
    try {
      await updateDoc(doc(db, 'goals', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `goals/${id}`);
    }
  };

  const getGoalStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <span className="px-[10px] py-[4px] inline-flex text-[11px] font-semibold rounded-[12px] uppercase bg-[#E6FFFA] text-[#2C7A7B]"><CheckCircle2 className="w-3 h-3 mr-1"/> Completed</span>;
      case 'In Progress': return <span className="px-[10px] py-[4px] inline-flex text-[11px] font-semibold rounded-[12px] uppercase bg-[#EBF4FF] text-[#2B6CB0]"><Clock className="w-3 h-3 mr-1"/> In Progress</span>;
      case 'Missed': return <span className="px-[10px] py-[4px] inline-flex text-[11px] font-semibold rounded-[12px] uppercase bg-[#FFF5F5] text-[#C53030]"><AlertCircle className="w-3 h-3 mr-1"/> Missed</span>;
      default: return <span className="px-[10px] py-[4px] inline-flex text-[11px] font-semibold rounded-[12px] uppercase bg-[#EDF2F7] text-[#4A5568]">Not Started</span>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star key={star} className={`w-4 h-4 ${star <= rating ? 'fill-[#ECC94B] text-[#ECC94B]' : 'text-[#E2E8F0]'}`} />
        ))}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto h-full flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] md:text-[24px] font-bold text-[#333]">Performance & Goals</h1>
          <p className="text-[13px] md:text-[14px] text-[#718096] mt-1">Track KPIs, set objectives, and conduct reviews.</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setIsGoalModalOpen(true)}
              className="flex-1 sm:flex-none justify-center bg-white border border-[#E2E8F0] hover:bg-[#F7FAFC] text-[#4A5568] px-4 py-2 rounded-[4px] text-[14px] font-medium flex items-center gap-2 transition-colors"
            >
              <Target className="w-4 h-4 ml-auto sm:ml-0" />
              <span className="mr-auto sm:mr-0">Set Goal</span>
            </button>
            <button 
              onClick={() => setIsReviewModalOpen(true)}
              className="flex-1 sm:flex-none justify-center bg-[#4A90E2] hover:bg-[#3A80D2] text-white px-4 py-2 rounded-[4px] text-[14px] font-medium flex items-center gap-2 transition-colors"
            >
              <Star className="w-4 h-4 ml-auto sm:ml-0" />
              <span className="mr-auto sm:mr-0">New Review</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 border-b border-[#E2E8F0]">
        <button
          onClick={() => setActiveTab('goals')}
          className={`pb-3 text-[14px] font-medium transition-colors relative ${activeTab === 'goals' ? 'text-[#4A90E2]' : 'text-[#718096] hover:text-[#333]'}`}
        >
          Goals & KPIs
          {activeTab === 'goals' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4A90E2]" />}
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 text-[14px] font-medium transition-colors relative ${activeTab === 'reviews' ? 'text-[#4A90E2]' : 'text-[#718096] hover:text-[#333]'}`}
        >
          Performance Reviews
          {activeTab === 'reviews' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4A90E2]" />}
        </button>
      </div>

      <div className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] flex-1 overflow-hidden">
        <div className="overflow-x-auto h-full">
          {activeTab === 'goals' ? (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-[#FAFBFC] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Employee</th>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Goal / KPI</th>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Due Date</th>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Status</th>
                  {isAdmin && <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5] text-right">Update</th>}
                </tr>
              </thead>
              <tbody className="bg-white">
                {(isAdmin ? goals : goals.filter(goal => {
                  const emp = employees.find(e => e.id === goal.employeeId);
                  return emp?.email === currentUserEmail;
                })).map(goal => {
                  const emp = employees.find(e => e.id === goal.employeeId);
                  return (
                    <tr key={goal.id} className="hover:bg-[#FAFBFC] transition-colors">
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
                        <div className="text-[14px] text-[#333] font-medium">{goal.title}</div>
                        {goal.description && <div className="text-[12px] text-[#718096] mt-0.5 max-w-[300px] truncate">{goal.description}</div>}
                      </td>
                      <td className="px-6 py-4 border-b border-[#F0F2F5]">
                        <div className="text-[14px] text-[#333]">{new Date(goal.dueDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-[#F0F2F5]">
                        {getGoalStatusBadge(goal.status)}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 border-b border-[#F0F2F5] text-right">
                          <select 
                            value={goal.status}
                            onChange={(e) => updateGoalStatus(goal.id, e.target.value as Goal['status'])}
                            className="text-[12px] border border-[#E2E8F0] rounded-[4px] px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#4A90E2]"
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Missed">Missed</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {goals.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-6 py-16 text-center text-[#718096]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Target className="w-8 h-8 text-[#A0AEC0] mb-2" />
                        <p className="text-[14px]">No goals or KPIs set yet.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-[#FAFBFC] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Employee</th>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Period</th>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Rating</th>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Feedback</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {(isAdmin ? reviews : reviews.filter(review => {
                  const emp = employees.find(e => e.id === review.employeeId);
                  return emp?.email === currentUserEmail;
                })).map(review => {
                  const emp = employees.find(e => e.id === review.employeeId);
                  return (
                    <tr key={review.id} className="hover:bg-[#FAFBFC] transition-colors">
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
                        <div className="text-[14px] text-[#333] font-medium">{review.period} {review.year}</div>
                        <div className="text-[11px] text-[#A0AEC0] mt-0.5">Reviewed: {new Date(review.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-[#F0F2F5]">
                        {renderStars(review.rating)}
                      </td>
                      <td className="px-6 py-4 border-b border-[#F0F2F5]">
                        <div className="text-[13px] text-[#4A5568] max-w-[400px] line-clamp-2" title={review.feedback}>
                          {review.feedback}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-[#718096]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Star className="w-8 h-8 text-[#A0AEC0] mb-2" />
                        <p className="text-[14px]">No performance reviews conducted yet.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Goal Modal */}
      <AnimatePresence>
        {isGoalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FFFFFF] rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
                <h2 className="text-[16px] font-semibold text-[#333]">Set Goal / KPI</h2>
                <button onClick={() => setIsGoalModalOpen(false)} className="text-[#718096] hover:text-[#333] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleGoalSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Employee</label>
                  <select 
                    required
                    value={goalForm.employeeId}
                    onChange={e => setGoalForm({...goalForm, employeeId: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Goal Title</label>
                  <input 
                    required
                    type="text" 
                    value={goalForm.title}
                    onChange={e => setGoalForm({...goalForm, title: e.target.value})}
                    placeholder="e.g., Increase sales by 15%"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Due Date</label>
                  <input 
                    required
                    type="date" 
                    value={goalForm.dueDate}
                    onChange={e => setGoalForm({...goalForm, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Description (Optional)</label>
                  <textarea 
                    value={goalForm.description}
                    onChange={e => setGoalForm({...goalForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors resize-none"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-[#F0F2F5] mt-6">
                  <button type="button" onClick={() => setIsGoalModalOpen(false)} className="px-4 py-2 text-[12px] font-medium text-[#4A5568] bg-[#EDF2F7] rounded-[4px] hover:bg-[#E2E8F0] transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-[12px] font-medium text-white bg-[#4A90E2] rounded-[4px] hover:bg-[#3A80D2] transition-colors">Save Goal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FFFFFF] rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
                <h2 className="text-[16px] font-semibold text-[#333]">Conduct Performance Review</h2>
                <button onClick={() => setIsReviewModalOpen(false)} className="text-[#718096] hover:text-[#333] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleReviewSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Employee</label>
                  <select 
                    required
                    value={reviewForm.employeeId}
                    onChange={e => setReviewForm({...reviewForm, employeeId: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Period</label>
                    <select 
                      required
                      value={reviewForm.period}
                      onChange={e => setReviewForm({...reviewForm, period: e.target.value as PerformanceReview['period']})}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                    >
                      <option value="Q1">Q1</option>
                      <option value="Q2">Q2</option>
                      <option value="Q3">Q3</option>
                      <option value="Q4">Q4</option>
                      <option value="Annual">Annual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Year</label>
                    <input 
                      required
                      type="number" 
                      value={reviewForm.year}
                      onChange={e => setReviewForm({...reviewForm, year: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Rating (1-5)</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({...reviewForm, rating: star})}
                        className="focus:outline-none"
                      >
                        <Star className={`w-8 h-8 transition-colors ${star <= (reviewForm.rating || 0) ? 'fill-[#ECC94B] text-[#ECC94B]' : 'text-[#E2E8F0] hover:text-[#CBD5E0]'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Feedback</label>
                  <textarea 
                    required
                    value={reviewForm.feedback}
                    onChange={e => setReviewForm({...reviewForm, feedback: e.target.value})}
                    rows={4}
                    placeholder="Provide constructive feedback..."
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors resize-none"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-[#F0F2F5] mt-6">
                  <button type="button" onClick={() => setIsReviewModalOpen(false)} className="px-4 py-2 text-[12px] font-medium text-[#4A5568] bg-[#EDF2F7] rounded-[4px] hover:bg-[#E2E8F0] transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-[12px] font-medium text-white bg-[#4A90E2] rounded-[4px] hover:bg-[#3A80D2] transition-colors">Publish Review</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
