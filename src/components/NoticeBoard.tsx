import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Calendar, 
  AlertTriangle, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  X,
  Pin,
  Clock
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'General' | 'Holiday' | 'Urgent';
  createdAt: any;
  createdBy: string;
  creatorName: string;
  isPinned: boolean;
}

interface NoticeBoardProps {
  isAdmin: boolean;
  currentUserEmail: string;
  currentUserName: string;
}

export default function NoticeBoard({ isAdmin, currentUserEmail, currentUserName }: NoticeBoardProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'General' as 'General' | 'Holiday' | 'Urgent',
    isPinned: false
  });

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const noticesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notice[];
      setNotices(noticesData);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNotice) {
        await updateDoc(doc(db, 'notices', editingNotice.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'notices'), {
          ...formData,
          createdAt: serverTimestamp(),
          createdBy: currentUserEmail,
          creatorName: currentUserName
        });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving notice:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await deleteDoc(doc(db, 'notices', id));
    } catch (error) {
      console.error('Error deleting notice:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'General',
      isPinned: false
    });
    setEditingNotice(null);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Holiday': return <Calendar className="w-5 h-5 text-[#4A90E2]" />;
      case 'Urgent': return <AlertTriangle className="w-5 h-5 text-[#E53E3E]" />;
      default: return <Megaphone className="w-5 h-5 text-[#38A169]" />;
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'Holiday': return 'bg-[#EBF8FF] text-[#2B6CB0] border-[#BEE3F8]';
      case 'Urgent': return 'bg-[#FFF5F5] text-[#C53030] border-[#FED7D7]';
      default: return 'bg-[#F0FFF4] text-[#2F855A] border-[#C6F6D5]';
    }
  };

  const sortedNotices = [...notices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full bg-[#F7FAFC]">
      <div className="p-6 md:p-8 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1A202C]">Notice Board</h1>
          <p className="text-[#718096] text-[14px] mt-1">Stay updated with important announcements and holidays</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#4A90E2] text-white rounded-[4px] text-[14px] font-medium hover:bg-[#357ABD] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Notice
          </button>
        )}
      </div>

      <div className="px-6 md:px-8 pb-8 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {sortedNotices.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-[8px] p-12 text-center border border-[#E2E8F0] shadow-sm"
              >
                <Megaphone className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                <h3 className="text-[#4A5568] font-medium">No notices yet</h3>
                <p className="text-[#A0AEC0] text-[14px]">Important announcements will appear here</p>
              </motion.div>
            ) : (
              sortedNotices.map((notice) => (
                <motion.div
                  key={notice.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-white rounded-[8px] p-5 border border-[#E2E8F0] shadow-sm relative group hover:border-[#CBD5E0] transition-colors ${notice.isPinned ? 'ring-2 ring-[#4A90E2] ring-opacity-10' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2.5 rounded-[8px] border transition-colors ${getTypeStyles(notice.type)}`}>
                        {getIcon(notice.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-[16px] font-semibold text-[#2D3748]">{notice.title}</h3>
                          {notice.isPinned && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#EBF8FF] text-[#2B6CB0] rounded-full text-[10px] font-bold uppercase tracking-wider">
                              <Pin className="w-3 h-3 fill-current" />
                              Pinned
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getTypeStyles(notice.type)}`}>
                            {notice.type}
                          </span>
                        </div>
                        <p className="text-[#4A5568] text-[14px] mt-2 whitespace-pre-wrap leading-relaxed">
                          {notice.content}
                        </p>
                        <div className="flex items-center gap-4 mt-4 text-[12px] text-[#A0AEC0]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {notice.createdAt?.toDate().toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="w-1 h-1 bg-[#E2E8F0] rounded-full" />
                          <div className="font-medium">By {notice.creatorName}</div>
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingNotice(notice);
                            setFormData({
                              title: notice.title,
                              content: notice.content,
                              type: notice.type,
                              isPinned: notice.isPinned
                            });
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-[#718096] hover:bg-[#F7FAFC] hover:text-[#4A90E2] rounded-[4px] transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(notice.id)}
                          className="p-1.5 text-[#718096] hover:bg-[#FFF5F5] hover:text-[#E53E3E] rounded-[4px] transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[12px] shadow-xl w-full max-w-[500px] overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[#F0F2F5] flex items-center justify-between bg-[#FAFBFC]">
                <h2 className="text-[18px] font-semibold text-[#2D3748]">
                  {editingNotice ? 'Edit Notice' : 'Add New Notice'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-[#A0AEC0] hover:text-[#4A5568] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-[12px] font-semibold text-[#4A5568] uppercase tracking-wider mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-[6px] text-[14px] focus:ring-2 focus:ring-[#4A90E2]/20 focus:border-[#4A90E2] transition-colors placeholder-[#A0AEC0]"
                    placeholder="e.g., Eid-ul-Fitr Holiday"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#4A5568] uppercase tracking-wider mb-2">
                      Category
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-[6px] text-[14px] focus:ring-2 focus:ring-[#4A90E2]/20 focus:border-[#4A90E2] transition-colors bg-white"
                    >
                      <option value="General">General</option>
                      <option value="Holiday">Holiday</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 p-2.5 w-full border border-[#E2E8F0] rounded-[6px] hover:bg-[#F7FAFC] cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.isPinned}
                        onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                        className="w-4 h-4 text-[#4A90E2] rounded focus:ring-[#4A90E2]"
                      />
                      <span className="text-[14px] text-[#4A5568]">Pin to Top</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#4A5568] uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-[6px] text-[14px] focus:ring-2 focus:ring-[#4A90E2]/20 focus:border-[#4A90E2] transition-colors placeholder-[#A0AEC0] resize-none"
                    placeholder="Write detailed information here..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-[#718096] text-[14px] font-medium hover:bg-[#F7FAFC] rounded-[6px] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#4A90E2] text-white text-[14px] font-medium rounded-[6px] hover:bg-[#357ABD] transition-colors shadow-md"
                  >
                    {editingNotice ? 'Save Changes' : 'Post Notice'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
