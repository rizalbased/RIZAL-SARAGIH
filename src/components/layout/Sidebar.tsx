import React from 'react';
import { 
  Home, 
  Compass, 
  Newspaper, 
  FolderGit2, 
  Radio, 
  HeartHandshake, 
  MessageSquare, 
  Bell, 
  User, 
  ShieldCheck, 
  PlusCircle, 
  LogOut,
  LogIn
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenCreate: () => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onNavigate, 
  onOpenCreate,
  onOpenAuth 
}) => {
  const { currentUser, logout } = useApp();

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const NAV_ITEMS = [
    { id: 'home', label: 'Home Feed', icon: Home, badge: null },
    { id: 'explore', label: 'Explore', icon: Compass, badge: null },
    { id: 'news', label: 'Berita Sekolah', icon: Newspaper, badge: 'Baru' },
    { id: 'documentation', label: 'Dokumentasi', icon: FolderGit2, badge: 'Drive' },
    { id: 'confession', label: 'Confession', icon: HeartHandshake, badge: null },
    { id: 'messages', label: 'Pesan Chat', icon: MessageSquare, badge: null },
    { id: 'notifications', label: 'Notifikasi', icon: Bell, badge: null },
    { id: 'profile', label: 'Profil Saya', icon: User, badge: null },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-2.5 border-black p-4 sticky top-[75px] h-[calc(100vh-85px)] overflow-y-auto no-scrollbar shadow-[4px_4px_0px_0px_#000] rounded-3xl my-2">
      {/* Create Button */}
      <button
        onClick={() => {
          if (!currentUser) {
            onOpenAuth();
          } else {
            onOpenCreate();
          }
        }}
        className="neo-btn w-full py-3 px-4 flex items-center justify-center gap-2 mb-6 text-sm"
      >
        <PlusCircle className="w-5 h-5 text-black stroke-[2.5]" />
        <span>Buat Post / Story</span>
      </button>

      {/* Navigation List */}
      <nav className="space-y-1.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if ((item.id === 'profile' || item.id === 'messages') && !currentUser) {
                  onOpenAuth();
                } else {
                  onNavigate(item.id);
                }
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-heading font-black text-xs transition-all border-2 ${
                isActive
                  ? 'bg-[#0B0B0B] text-[#B8FF00] border-black shadow-[3px_3px_0px_0px_#000]'
                  : 'bg-white text-black border-transparent hover:border-black hover:bg-[#FFE600] hover:shadow-[3px_3px_0px_0px_#000]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 stroke-[2.5] ${isActive ? 'text-[#B8FF00]' : 'text-black'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border border-black shadow-[1px_1px_0px_0px_#000] ${
                  item.badge === 'LIVE' 
                    ? 'bg-[#FF4F8B] text-white animate-pulse' 
                    : item.badge === 'Drive'
                    ? 'bg-[#35B9FF] text-black'
                    : 'bg-[#B8FF00] text-black'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* ADMIN DASHBOARD */}
        {isAdmin && (
          <div className="pt-4 border-t-2 border-black mt-4">
            <p className="px-3 text-[10px] font-black text-gray-700 uppercase tracking-wider mb-2">
              Pengurus Sekolah
            </p>
            <button
              onClick={() => onNavigate('admin')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-heading font-black text-xs transition-all border-2 ${
                currentView === 'admin'
                  ? 'bg-[#0B0B0B] text-[#B8FF00] border-black shadow-[3px_3px_0px_0px_#000]'
                  : 'bg-[#D8B4FE] text-black border-black shadow-[2px_2px_0px_0px_#000] hover:bg-[#c084fc] hover:shadow-[4px_4px_0px_0px_#000]'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>Admin Dashboard</span>
              </div>
              <span className="text-[9px] bg-black text-[#B8FF00] font-black px-1.5 py-0.5 rounded-md">
                PANEL
              </span>
            </button>
          </div>
        )}
      </nav>

      {/* User Session Footer / Login Options */}
      <div className="mt-6 pt-4 border-t-2 border-black">
        {currentUser ? (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border-2 border-black shadow-[2.5px_2.5px_0px_0px_#000] hover:shadow-[3.5px_3.5px_0px_0px_#000] transition-all">
            <div 
              onClick={() => onNavigate('profile')} 
              className="flex items-center gap-2.5 overflow-hidden cursor-pointer flex-1 min-w-0"
            >
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-9 h-9 rounded-lg object-cover border-2 border-black flex-shrink-0"
              />
              <div className="truncate">
                <p className="text-xs font-black text-black truncate">{currentUser.name}</p>
                <p className="text-[10px] text-gray-700 font-bold truncate">@{currentUser.username}</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
                onNavigate('home');
              }}
              className="p-2 text-black hover:bg-[#FF4F8B] hover:text-white rounded-lg border-2 border-black transition-colors cursor-pointer flex-shrink-0 ml-1 shadow-[1px_1px_0px_0px_#000]"
              title="Keluar dari akun"
              type="button"
            >
              <LogOut className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={onOpenAuth}
              className="neo-btn w-full py-2.5 text-xs flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              <span>MASUK / DAFTAR</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
