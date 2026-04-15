import { Users, LayoutDashboard, Settings as SettingsIcon, Building2, LogOut, KeyRound, Calendar, Sparkles, ClipboardList, Banknote, Target, FolderLock, Clock } from 'lucide-react';
import { CompanySettings } from '../types';

interface SidebarProps {
  currentView: 'dashboard' | 'employees' | 'access-requests' | 'profile' | 'time-off' | 'departments' | 'ai-assistant' | 'recruitment' | 'settings' | 'payroll' | 'performance' | 'documents' | 'attendance';
  onViewChange: (view: 'dashboard' | 'employees' | 'access-requests' | 'time-off' | 'departments' | 'ai-assistant' | 'recruitment' | 'settings' | 'payroll' | 'performance' | 'documents' | 'attendance') => void;
  onLogout: () => void;
  userRole: 'admin' | 'manager' | 'employee';
  settings: CompanySettings | null;
}

export default function Sidebar({ currentView, onViewChange, onLogout, userRole, settings }: SidebarProps) {
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
    { id: 'employees', label: 'Employee Directory', icon: Users, roles: ['admin', 'manager'] },
    { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['admin', 'manager', 'employee'] },
    { id: 'recruitment', label: 'Recruitment', icon: ClipboardList, roles: ['admin', 'manager'] },
    { id: 'time-off', label: 'Time-Off', icon: Calendar, roles: ['admin', 'manager', 'employee'] },
    { id: 'payroll', label: 'Payroll', icon: Banknote, roles: ['admin', 'manager', 'employee'] },
    { id: 'performance', label: 'Performance', icon: Target, roles: ['admin', 'manager', 'employee'] },
    { id: 'documents', label: 'Document Vault', icon: FolderLock, roles: ['admin', 'manager', 'employee'] },
    { id: 'departments', label: 'Departments', icon: Building2, roles: ['admin', 'manager'] },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, roles: ['admin', 'manager', 'employee'] },
    { id: 'access-requests', label: 'Access Requests', icon: KeyRound, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, roles: ['admin'] },
  ] as const;

  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

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
