import { Users, LayoutDashboard, Settings, Building2, LogOut, KeyRound, Calendar } from 'lucide-react';

interface SidebarProps {
  currentView: 'dashboard' | 'employees' | 'access-requests' | 'profile' | 'time-off' | 'departments';
  onViewChange: (view: 'dashboard' | 'employees' | 'access-requests' | 'time-off' | 'departments') => void;
  onLogout: () => void;
  isAdmin: boolean;
}

export default function Sidebar({ currentView, onViewChange, onLogout, isAdmin }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employee Directory', icon: Users },
    { id: 'time-off', label: 'Time-Off', icon: Calendar },
    { id: 'departments', label: 'Departments', icon: Building2 },
    ...(isAdmin ? [{ id: 'access-requests', label: 'Access Requests', icon: KeyRound }] : []),
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="w-[240px] bg-[#1A2233] text-[#FFFFFF] flex flex-col h-full shrink-0 py-6">
      <div className="px-6 pb-8 mb-6 border-b border-[#2E3A59]">
        <div className="flex items-center gap-2">
          <span className="text-[20px] font-bold tracking-[1px]">BO-IT HR</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (currentView === 'profile' && item.id === 'employees');
          return (
            <button
              key={item.id}
              onClick={() => (item.id === 'dashboard' || item.id === 'employees' || item.id === 'access-requests' || item.id === 'time-off' || item.id === 'departments') ? onViewChange(item.id as any) : null}
              className={`w-full flex items-center gap-3 px-6 py-3 text-[14px] transition-colors ${
                isActive 
                  ? 'bg-[#2D3748] text-[#FFFFFF] border-l-4 border-[#4A90E2]' 
                  : 'text-[#A0AEC0] hover:bg-[#2D3748] hover:text-[#FFFFFF] border-l-4 border-transparent'
              }`}
            >
              <Icon className="w-5 h-5" />
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
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
