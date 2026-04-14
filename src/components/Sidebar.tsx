import { Users, LayoutDashboard, Settings as SettingsIcon, Building2, LogOut, KeyRound, Calendar, Sparkles, ClipboardList, Banknote, Target, FolderLock } from 'lucide-react';
import { CompanySettings } from '../types';

interface SidebarProps {
  currentView: 'dashboard' | 'employees' | 'access-requests' | 'profile' | 'time-off' | 'departments' | 'ai-assistant' | 'recruitment' | 'settings' | 'payroll' | 'performance' | 'documents';
  onViewChange: (view: 'dashboard' | 'employees' | 'access-requests' | 'time-off' | 'departments' | 'ai-assistant' | 'recruitment' | 'settings' | 'payroll' | 'performance' | 'documents') => void;
  onLogout: () => void;
  isAdmin: boolean;
  settings: CompanySettings | null;
}

export default function Sidebar({ currentView, onViewChange, onLogout, isAdmin, settings }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employee Directory', icon: Users },
    { id: 'recruitment', label: 'Recruitment', icon: ClipboardList },
    { id: 'time-off', label: 'Time-Off', icon: Calendar },
    { id: 'payroll', label: 'Payroll', icon: Banknote },
    { id: 'performance', label: 'Performance', icon: Target },
    { id: 'documents', label: 'Document Vault', icon: FolderLock },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles },
    ...(isAdmin ? [{ id: 'access-requests', label: 'Access Requests', icon: KeyRound }] : []),
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ] as const;

  return (
    <div className="w-[240px] bg-[#1A2233] text-[#FFFFFF] flex flex-col h-full shrink-0 py-6">
      <div className="px-6 pb-8 mb-6 border-b border-[#2E3A59]">
        <div className="flex items-center gap-3">
          {settings?.logoUrl && (
            <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 rounded object-contain bg-white shrink-0" />
          )}
          <span className="text-[18px] font-bold tracking-[0.5px] truncate" title={settings?.companyName || 'BO-IT HR'}>
            {settings?.companyName || 'BO-IT HR'}
          </span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (currentView === 'profile' && item.id === 'employees');
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as any)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-[14px] transition-colors ${
                isActive 
                  ? 'bg-[#2D3748] text-[#FFFFFF] border-l-4 border-[#4A90E2]' 
                  : 'text-[#A0AEC0] hover:bg-[#2D3748] hover:text-[#FFFFFF] border-l-4 border-transparent'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-6 py-3 text-[14px] text-[#A0AEC0] hover:bg-[#2D3748] hover:text-[#FFFFFF] transition-colors border-l-4 border-transparent"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
