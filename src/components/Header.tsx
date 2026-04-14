import { Bell, Search } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'BO';
  const displayName = user?.displayName || 'BO-IT HR Admin';
  const email = user?.email || 'bigoneithr@gmail.com';

  return (
    <header className="h-[64px] bg-[#FFFFFF] border-b border-[#E0E0E0] flex items-center justify-between px-8 shrink-0">
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[#718096]" />
          </div>
          <input
            type="text"
            placeholder="Search employees, files, or tasks..."
            className="block w-[300px] pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[#718096] placeholder-[#718096] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] text-[14px] transition-colors"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 ml-4">
        <button className="p-2 text-[#718096] hover:text-[#333] relative">
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[#C53030] ring-2 ring-white" />
          <Bell className="h-5 w-5" />
        </button>
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
