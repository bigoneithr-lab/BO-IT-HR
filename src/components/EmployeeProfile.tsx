import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, UploadCloud, FileText, Download, Trash2, User, Mail, Phone, MapPin, Calendar, Briefcase, Loader2 } from 'lucide-react';
import { Employee, EmployeeDocument } from '../types';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';

interface EmployeeProfileProps {
  employee: Employee;
  onBack: () => void;
}

export default function EmployeeProfile({ employee, onBack }: EmployeeProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents'>('overview');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `employees/${employee.id}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const newDoc: EmployeeDocument = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        size: file.size
      };

      const updatedDocs = [...(employee.documents || []), newDoc];
      await updateDoc(doc(db, 'employees', employee.id), {
        documents: updatedDocs
      });
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (docToDelete: EmployeeDocument) => {
    if (!window.confirm(`Are you sure you want to delete ${docToDelete.name}?`)) return;
    
    try {
      const storageRef = ref(storage, `employees/${employee.id}/${docToDelete.name}`);
      await deleteObject(storageRef);

      const updatedDocs = (employee.documents || []).filter(d => d.id !== docToDelete.id);
      await updateDoc(doc(db, 'employees', employee.id), {
        documents: updatedDocs
      });
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-[#E6FFFA] text-[#2C7A7B]';
      case 'On Leave': return 'bg-[#FFF5F5] text-[#C53030]';
      case 'Terminated': return 'bg-[#EDF2F7] text-[#4A5568]';
      default: return 'bg-[#EDF2F7] text-[#4A5568]';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto h-full flex flex-col gap-6"
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 text-[#718096] hover:text-[#333] hover:bg-[#E2E8F0] rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[24px] font-bold text-[#333]">Employee Profile</h1>
      </div>

      <div className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="p-8 border-b border-[#F0F2F5] flex items-start gap-6">
          <img 
            src={employee.avatarUrl} 
            alt={`${employee.firstName} ${employee.lastName}`} 
            className="w-24 h-24 rounded-full object-cover border-4 border-[#F7FAFC] shadow-sm"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[24px] font-bold text-[#333]">{employee.firstName} {employee.lastName}</h2>
                <div className="text-[16px] text-[#718096] mt-1">{employee.role}</div>
              </div>
              <span className={`px-[12px] py-[6px] inline-flex text-[12px] font-semibold rounded-[12px] uppercase ${getStatusColor(employee.status)}`}>
                {employee.status}
              </span>
            </div>
            
            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-[14px] text-[#718096]">
                <Mail className="w-4 h-4" />
                {employee.email}
              </div>
              <div className="flex items-center gap-2 text-[14px] text-[#718096]">
                <Briefcase className="w-4 h-4" />
                {employee.department}
              </div>
              <div className="flex items-center gap-2 text-[14px] text-[#718096]">
                <Calendar className="w-4 h-4" />
                Joined {new Date(employee.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-b border-[#F0F2F5]">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-8 py-4 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === 'overview' 
                ? 'border-[#4A90E2] text-[#4A90E2]' 
                : 'border-transparent text-[#718096] hover:text-[#333]'
            }`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('documents')}
            className={`px-8 py-4 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === 'documents' 
                ? 'border-[#4A90E2] text-[#4A90E2]' 
                : 'border-transparent text-[#718096] hover:text-[#333]'
            }`}
          >
            Documents
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-[16px] font-semibold text-[#333] mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#A0AEC0] mt-0.5" />
                    <div>
                      <div className="text-[12px] text-[#718096] uppercase tracking-[0.5px] font-medium">Phone</div>
                      <div className="text-[14px] text-[#333] mt-1">{employee.phone || 'Not provided'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#A0AEC0] mt-0.5" />
                    <div>
                      <div className="text-[12px] text-[#718096] uppercase tracking-[0.5px] font-medium">Location</div>
                      <div className="text-[14px] text-[#333] mt-1">{employee.location || 'Not provided'}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#333] mb-4">About</h3>
                <p className="text-[14px] text-[#4A5568] leading-relaxed">
                  {employee.bio || 'No biography provided for this employee.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[16px] font-semibold text-[#333]">Employee Documents</h3>
                <div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-[#4A90E2] hover:bg-[#3A80D2] disabled:bg-[#A0AEC0] text-white px-4 py-2 rounded-[4px] text-[14px] font-medium flex items-center gap-2 transition-colors"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    {isUploading ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </div>

              {(!employee.documents || employee.documents.length === 0) ? (
                <div className="text-center py-12 bg-[#F7FAFC] rounded-[8px] border border-dashed border-[#E2E8F0]">
                  <FileText className="w-12 h-12 text-[#A0AEC0] mx-auto mb-3" />
                  <p className="text-[14px] font-medium text-[#4A5568]">No documents uploaded yet</p>
                  <p className="text-[12px] text-[#718096] mt-1">Upload resumes, contracts, or performance reviews.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-[8px] hover:border-[#CBD5E0] transition-colors bg-white">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-[4px] bg-[#EDF2F7] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-[#4A90E2]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[14px] font-medium text-[#333] truncate">{doc.name}</div>
                          <div className="text-[12px] text-[#718096] mt-0.5">
                            {formatBytes(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <a 
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-[#718096] hover:text-[#4A90E2] hover:bg-[#EBF8FF] rounded-[4px] transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => handleDeleteDocument(doc)}
                          className="p-2 text-[#718096] hover:text-[#C53030] hover:bg-[#FFF5F5] rounded-[4px] transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
