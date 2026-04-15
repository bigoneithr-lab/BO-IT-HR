import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FolderLock, UploadCloud, FileText, Download, Trash2, X, Search, Filter, Loader2, AlertTriangle } from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { Employee, VaultDocument } from '../types';

interface DocumentVaultProps {
  employees: Employee[];
  isAdmin: boolean;
  currentUserEmail?: string | null;
}

export default function DocumentVault({ employees, isAdmin, currentUserEmail }: DocumentVaultProps) {
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    category: 'Contract' as VaultDocument['category']
  });

  useEffect(() => {
    const q = query(collection(db, 'documents'), orderBy('uploadedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: VaultDocument[] = [];
      snapshot.forEach(d => docs.push({ id: d.id, ...d.data() } as VaultDocument));
      setDocuments(docs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'documents'));
    
    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 700KB to fit within Firestore 1MB document limit
    if (file.size > 700 * 1024) {
      setUploadError('File is too large. Maximum size is 700KB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        
        try {
          await addDoc(collection(db, 'documents'), {
            employeeId: formData.employeeId,
            name: file.name,
            dataUrl,
            type: file.type,
            category: formData.category,
            uploadedAt: new Date().toISOString(),
            size: file.size
          });
          setIsModalOpen(false);
          setFormData({ employeeId: '', category: 'Contract' });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'documents');
          setUploadError('Failed to save document to database.');
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      
      reader.onerror = () => {
        setUploadError('Failed to read file.');
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadError('An unexpected error occurred.');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await deleteDoc(doc(db, 'documents', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `documents/${id}`);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter documents based on user role, search, and category
  const filteredDocuments = documents.filter(doc => {
    // If not admin, only show their own documents
    if (!isAdmin) {
      const currentUserEmp = employees.find(e => e.email === currentUserEmail);
      if (!currentUserEmp || doc.employeeId !== currentUserEmp.id) return false;
    }
    
    if (filterCategory !== 'All' && doc.category !== filterCategory) return false;
    if (searchTerm && !doc.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto h-full flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[#333]">Document Vault</h1>
          <p className="text-[14px] text-[#718096] mt-1">Secure storage for employee contracts, IDs, and tax documents.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4A90E2] hover:bg-[#3A80D2] text-white px-4 py-2 rounded-[4px] text-[14px] font-medium flex items-center gap-2 transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      <div className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#F0F2F5] flex items-center gap-4 bg-[#FAFBFC]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#A0AEC0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search documents..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] rounded-[4px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#718096]" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-[#E2E8F0] rounded-[4px] px-3 py-2 text-[14px] text-[#4A5568] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] bg-white"
            >
              <option value="All">All Categories</option>
              <option value="Contract">Contracts</option>
              <option value="ID">IDs & Passports</option>
              <option value="Tax Document">Tax Documents</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {filteredDocuments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#718096]">
              <FolderLock className="w-12 h-12 text-[#A0AEC0] mb-3" />
              <p className="text-[15px] font-medium text-[#4A5568]">No documents found</p>
              <p className="text-[13px] mt-1">Upload a document to securely store it in the vault.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map(doc => {
                const emp = employees.find(e => e.id === doc.employeeId);
                return (
                  <div key={doc.id} className="border border-[#E2E8F0] rounded-[8px] p-4 hover:border-[#CBD5E0] hover:shadow-sm transition-all bg-white group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-[6px] bg-[#EBF8FF] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-[#4A90E2]" />
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={doc.dataUrl}
                          download={doc.name}
                          className="p-1.5 text-[#718096] hover:text-[#4A90E2] hover:bg-[#EBF8FF] rounded-[4px] transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {(isAdmin || doc.employeeId === employees.find(e => e.email === currentUserEmail)?.id) && (
                          <button 
                            onClick={() => handleDelete(doc.id, doc.name)}
                            className="p-1.5 text-[#718096] hover:text-[#C53030] hover:bg-[#FFF5F5] rounded-[4px] transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-semibold text-[#333] truncate" title={doc.name}>{doc.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-medium px-2 py-0.5 bg-[#EDF2F7] text-[#4A5568] rounded-[4px]">
                          {doc.category}
                        </span>
                        <span className="text-[12px] text-[#A0AEC0]">{formatBytes(doc.size)}</span>
                      </div>
                    </div>
                    {isAdmin && emp && (
                      <div className="mt-4 pt-3 border-t border-[#F0F2F5] flex items-center gap-2">
                        <img src={emp.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover bg-[#E2E8F0]" />
                        <span className="text-[12px] text-[#718096] truncate">{emp.firstName} {emp.lastName}</span>
                      </div>
                    )}
                    <div className="mt-2 text-[11px] text-[#A0AEC0]">
                      Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                <h2 className="text-[16px] font-semibold text-[#333]">Upload Document</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-[#718096] hover:text-[#333] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {isAdmin && (
                  <div>
                    <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Employee</label>
                    <select 
                      required
                      value={formData.employeeId}
                      onChange={e => setFormData({...formData, employeeId: e.target.value})}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {!isAdmin && (
                  <div className="hidden">
                    {/* Auto-set for non-admins before upload */}
                  </div>
                )}

                <div>
                  <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Category</label>
                  <select 
                    required
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as VaultDocument['category']})}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors"
                  >
                    <option value="Contract">Contract</option>
                    <option value="ID">ID / Passport</option>
                    <option value="Tax Document">Tax Document</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="pt-2">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (!isAdmin) {
                        const currentUserEmp = employees.find(emp => emp.email === currentUserEmail);
                        if (currentUserEmp) {
                          setFormData(prev => ({ ...prev, employeeId: currentUserEmp.id }));
                        }
                      }
                      handleFileUpload(e);
                    }}
                    className="hidden"
                  />
                  
                  {uploadError && (
                    <div className="mb-3 p-3 bg-[#FFF5F5] border border-[#FED7D7] rounded-[4px] flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#C53030] shrink-0 mt-0.5" />
                      <p className="text-[13px] text-[#C53030]">{uploadError}</p>
                    </div>
                  )}

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || (isAdmin && !formData.employeeId)}
                    className="w-full border-2 border-dashed border-[#CBD5E0] hover:border-[#4A90E2] hover:bg-[#F7FAFC] disabled:opacity-50 disabled:hover:border-[#CBD5E0] disabled:hover:bg-transparent rounded-[8px] p-8 flex flex-col items-center justify-center gap-2 transition-all group"
                  >
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-[#4A90E2] animate-spin" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-[#A0AEC0] group-hover:text-[#4A90E2] transition-colors" />
                    )}
                    <div className="text-center">
                      <p className="text-[14px] font-medium text-[#4A5568]">
                        {isUploading ? 'Uploading...' : 'Click to select a file'}
                      </p>
                      <p className="text-[12px] text-[#A0AEC0] mt-1">Max size: 700KB (PDF, JPG, PNG)</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
