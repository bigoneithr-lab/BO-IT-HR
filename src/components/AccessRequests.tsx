import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Mail } from 'lucide-react';
import { motion } from 'motion/react';

export default function AccessRequests() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs: any[] = [];
      snapshot.forEach(doc => reqs.push({ id: doc.id, ...doc.data() }));
      setRequests(reqs);
    });
    return () => unsubscribe();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto h-full flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-[20px] md:text-[24px] font-bold text-[#333]">Access Requests</h1>
      </div>

      <div className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] flex-1 overflow-hidden">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#FAFBFC] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">User</th>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Status</th>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Access Code</th>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-[#FAFBFC] transition-colors">
                  <td className="px-6 py-4 border-b border-[#F0F2F5]">
                    <div className="font-medium text-[14px] text-[#333]">{req.displayName || 'Unknown User'}</div>
                    <div className="text-[12px] text-[#718096]">{req.email}</div>
                  </td>
                  <td className="px-6 py-4 border-b border-[#F0F2F5]">
                    <span className="px-[10px] py-[4px] inline-flex text-[11px] font-semibold rounded-[12px] uppercase bg-[#FFF5F5] text-[#C53030]">
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-[#F0F2F5]">
                    <code className="bg-[#EDF2F7] px-3 py-1.5 rounded-[4px] text-[14px] font-mono text-[#4A5568] tracking-widest font-bold">
                      {req.accessCode}
                    </code>
                  </td>
                  <td className="px-6 py-4 border-b border-[#F0F2F5] text-right">
                    <a 
                      href={`mailto:${req.email}?subject=Your BO-IT HR Access Code&body=Hello ${req.displayName || ''},%0D%0A%0D%0AYour access code for the BO-IT HR CRM is: ${req.accessCode}%0D%0A%0D%0APlease enter this code to view the CRM.`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A90E2] text-white rounded-[4px] text-[12px] font-medium hover:bg-[#3A80D2] transition-colors"
                    >
                      <Mail className="w-4 h-4" /> Email Code
                    </a>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-[#718096]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Mail className="w-8 h-8 text-[#A0AEC0] mb-2" />
                      <p className="text-[14px]">No pending access requests.</p>
                      <p className="text-[12px] text-[#A0AEC0]">When a new user signs in, their access code will appear here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
