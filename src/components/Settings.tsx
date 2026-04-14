import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, Loader2, Save, Building, Calendar, Image as ImageIcon } from 'lucide-react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { CompanySettings } from '../types';

interface SettingsProps {
  settings: CompanySettings | null;
  isAdmin: boolean;
}

export default function Settings({ settings, isAdmin }: SettingsProps) {
  const [formData, setFormData] = useState<CompanySettings>({
    companyName: 'BO-IT HR',
    defaultCasualDays: 14,
    defaultSickDays: 10,
    logoUrl: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setSaveMessage('');
    
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/png');
            setFormData(prev => ({ ...prev, logoUrl: dataUrl }));
            setSaveMessage('Logo processed successfully. Click Save Settings to apply.');
          } else {
            setSaveMessage('Failed to process image.');
          }
          
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        };
        img.onerror = () => {
          setSaveMessage('Invalid image file.');
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        setSaveMessage('Failed to read file.');
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Upload failed", error);
      setSaveMessage(`Upload failed: ${error.message || 'Unknown error'}`);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsSaving(true);
    setSaveMessage('');
    try {
      await setDoc(doc(db, 'settings', 'company'), formData, { merge: true });
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/company');
      setSaveMessage('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto h-full flex flex-col gap-6"
    >
      <div>
        <h1 className="text-[24px] font-bold text-[#333]">Company Settings</h1>
        <p className="text-[14px] text-[#718096] mt-1">Manage your company profile and default preferences.</p>
      </div>

      <div className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] overflow-hidden">
        <form onSubmit={handleSave} className="p-8 space-y-8">
          
          {/* Company Profile Section */}
          <section>
            <div className="flex items-center gap-2 mb-4 border-b border-[#F0F2F5] pb-2">
              <Building className="w-5 h-5 text-[#4A90E2]" />
              <h2 className="text-[16px] font-semibold text-[#333]">Company Profile</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-2">Company Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                  disabled={!isAdmin}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-2">Company Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[6px] border border-[#E2E8F0] bg-[#F7FAFC] flex items-center justify-center overflow-hidden shrink-0">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain bg-white" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-[#A0AEC0]" />
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex-1">
                      <input 
                        type="file" 
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-white border border-[#E2E8F0] hover:bg-[#F7FAFC] text-[#4A5568] px-4 py-2 rounded-[4px] text-[13px] font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        {isUploading ? 'Uploading...' : 'Upload Logo'}
                      </button>
                      <p className="text-[11px] text-[#A0AEC0] mt-1.5">Recommended: Square image, max 2MB.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Time-Off Defaults Section */}
          <section>
            <div className="flex items-center gap-2 mb-4 border-b border-[#F0F2F5] pb-2">
              <Calendar className="w-5 h-5 text-[#4A90E2]" />
              <h2 className="text-[16px] font-semibold text-[#333]">Time-Off Defaults</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-2">Default Casual Leave (Annual)</label>
                <input 
                  required
                  type="number" 
                  min="0"
                  value={formData.defaultCasualDays}
                  onChange={e => setFormData({...formData, defaultCasualDays: parseInt(e.target.value) || 0})}
                  disabled={!isAdmin}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-2">Default Sick Leave (Annual)</label>
                <input 
                  required
                  type="number" 
                  min="0"
                  value={formData.defaultSickDays}
                  onChange={e => setFormData({...formData, defaultSickDays: parseInt(e.target.value) || 0})}
                  disabled={!isAdmin}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] transition-colors disabled:opacity-60"
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          {isAdmin && (
            <div className="pt-4 flex items-center justify-between border-t border-[#F0F2F5]">
              <div className="text-[13px] font-medium text-[#48BB78]">
                {saveMessage}
              </div>
              <button 
                type="submit"
                disabled={isSaving || isUploading}
                className="bg-[#4A90E2] hover:bg-[#3A80D2] disabled:bg-[#A0AEC0] text-white px-6 py-2.5 rounded-[4px] text-[14px] font-medium flex items-center gap-2 transition-colors"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}
          
          {!isAdmin && (
            <div className="pt-4 border-t border-[#F0F2F5]">
              <p className="text-[13px] text-[#718096] italic">Only administrators can modify company settings.</p>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
}
