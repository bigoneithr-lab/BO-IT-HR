import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, CheckCircle2, Clock, AlertCircle, Menu } from 'lucide-react';
import { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  user: User | null;
  onMenuClick: () => void;
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'BO';
  const displayName = user?.displayName || 'BO-IT HR Admin';
  const email = user?.email || 'bigoneithr@gmail.com';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mockNotifications = [
    { id: 1, title: 'Leave Request Approved', message: 'Your casual leave request for next week has been approved.', time: '10m ago', unread: true, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { id: 2, title: 'Pending Approval', message: 'You have 3 new access requests waiting for approval.', time: '2h ago', unread: true, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 3, title: 'System Update', message: 'The HR system will undergo maintenance tonight at 12:00 AM.', time: '1d ago', unread: false, icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <header className="h-[64px] bg-[#FFFFFF] border-b border-[#E0E0E0] flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-[#718096] hover:text-[#333] hover:bg-[#F0F2F5] rounded-full transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex-1 max-w-lg hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#718096]" />
            </div>
            <input
              type="text"
              placeholder="Search employees, files, or tasks..."
              className="block w-full max-w-[300px] pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[#718096] placeholder-[#718096] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] text-[14px] transition-colors"
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-3 ml-4">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-full relative transition-colors ${showNotifications ? 'bg-[#F0F2F5] text-[#333]' : 'text-[#718096] hover:text-[#333] hover:bg-[#F0F2F5]'}`} 
            title="Notifications"
          >
            <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-[#E53E3E] ring-2 ring-white" />
            <Bell className="h-5 w-5" />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-[#E2E8F0] overflow-hidden z-50"
              >
                <div className="p-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#FAFBFC]">
                  <h3 className="font-semibold text-[#333] text-[14px]">Notifications</h3>
                  <button className="text-[12px] text-[#4A90E2] hover:text-[#3A80D2] font-medium">Mark all read</button>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {mockNotifications.map(notif => {
                    const Icon = notif.icon;
                    return (
                      <div key={notif.id} className={`p-4 border-b border-[#F0F2F5] hover:bg-[#FAFBFC] transition-colors cursor-pointer flex gap-3 ${notif.unread ? 'bg-[#EBF8FF]/30' : ''}`}>
                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.bg}`}>
                          <Icon className={`w-4 h-4 ${notif.color}`} />
                        </div>
                        <div>
                          <div className="flex justify-between items-start mb-0.5 gap-2">
                            <h4 className={`text-[13px] font-medium ${notif.unread ? 'text-[#333]' : 'text-[#4A5568]'}`}>{notif.title}</h4>
                            <span className="text-[11px] text-[#A0AEC0] whitespace-nowrap">{notif.time}</span>
                          </div>
                          <p className="text-[12px] text-[#718096] leading-snug">{notif.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-3 text-center border-t border-[#E2E8F0] bg-[#FAFBFC]">
                  <button className="text-[13px] text-[#4A90E2] hover:text-[#3A80D2] font-medium">View all notifications</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 ml-2">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="h-8 w-8 rounded-full border border-[#E2E8F0]" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-[#4A90E2] flex items-center justify-center text-white font-bold text-[12px]">
              {initials}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-[14px] font-medium text-[#333] leading-tight">{displayName}</span>
            <span className="text-[11px] text-[#718096]">{email}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
