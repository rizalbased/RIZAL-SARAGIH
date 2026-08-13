import React from 'react';
import { Search, Bell, MessageSquare, Shield, LogIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onNavigate: (view: string) => void;
  currentView: string;
  onOpenAuth: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onNavigate, 
  currentView, 
  onOpenAuth,
  onOpenSearch
}) => {
  const { currentUser, notifications, conversations } = useApp();
  
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const unreadMsgs = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-[#F7F7F0] border-b-3 border-black px-4 py-3 transition-all shadow-[0_4px_0px_0px_#000]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('home')} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#0B0B0B] text-[#B8FF00] font-display font-black flex items-center justify-center text-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] group-hover:shadow-[4px_4px_0px_0px_#000] transition-all">
            MK
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-xl tracking-tight text-[#0B0B0B]">
                MK<span className="text-[#35B9FF]">VERSE</span>
              </span>
              <span className="text-[10px] bg-[#B8FF00] text-black font-black px-2 py-0.5 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000] uppercase tracking-wider">
                Official
              </span>
            </div>
            <p className="text-[10px] text-gray-700 font-bold hidden sm:block">
              Sekolah • Komunitas • Media Sosial Digital
            </p>
          </div>
        </div>

        {/* Search Bar - Center Desktop */}
        <div 
          onClick={onOpenSearch} 
          className="hidden md:flex items-center gap-2 bg-white border-2.5 border-black px-3.5 py-2 rounded-2xl cursor-pointer text-gray-700 text-sm w-72 lg:w-96 transition-all shadow-[3px_3px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000]"
        >
          <Search className="w-4 h-4 text-black stroke-[2.5]" />
          <span className="text-xs text-gray-800 font-bold">Cari warga sekolah, berita, postingan...</span>
          <span className="ml-auto text-[10px] bg-[#FFE600] text-black border-2 border-black px-1.5 py-0.5 rounded-md font-mono font-black shadow-[1px_1px_0px_0px_#000]">
            ⌘K
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Icon */}
          <button 
            onClick={onOpenSearch} 
            className="md:hidden p-2.5 rounded-xl bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]"
            title="Cari"
          >
            <Search className="w-5 h-5 text-black stroke-[2.5]" />
          </button>

          {currentUser ? (
            <>
              {/* Notification Button */}
              <button
                onClick={() => onNavigate('notifications')}
                className={`relative p-2.5 rounded-xl border-2 border-black transition-all shadow-[2.5px_2.5px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0px_0px_#000] ${
                  currentView === 'notifications' 
                    ? 'bg-[#0B0B0B] text-[#B8FF00]' 
                    : 'bg-white text-black hover:bg-[#FFE600]'
                }`}
                title="Notifikasi"
              >
                <Bell className="w-5 h-5 stroke-[2.5]" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#FF4F8B] text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-black shadow-[1px_1px_0px_0px_#000]">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              {/* Messages Button */}
              <button
                onClick={() => onNavigate('messages')}
                className={`relative p-2.5 rounded-xl border-2 border-black transition-all shadow-[2.5px_2.5px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0px_0px_#000] ${
                  currentView === 'messages' 
                    ? 'bg-[#0B0B0B] text-[#B8FF00]' 
                    : 'bg-white text-black hover:bg-[#35B9FF]'
                }`}
                title="Pesan Chat"
              >
                <MessageSquare className="w-5 h-5 stroke-[2.5]" />
                {unreadMsgs > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#35B9FF] text-black font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-black shadow-[1px_1px_0px_0px_#000]">
                    {unreadMsgs}
                  </span>
                )}
              </button>

              {/* Admin Dashboard Badge */}
              {isAdmin && (
                <button
                  onClick={() => onNavigate('admin')}
                  className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-black border-2 border-black transition-all shadow-[2.5px_2.5px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0px_0px_#000] ${
                    currentView === 'admin'
                      ? 'bg-[#0B0B0B] text-[#B8FF00]'
                      : 'bg-[#D8B4FE] text-black hover:bg-[#c084fc]'
                  }`}
                  title="Panel Admin"
                >
                  <Shield className="w-4 h-4 stroke-[2.5]" />
                  <span>ADMIN</span>
                </button>
              )}

              {/* Profile Avatar Button */}
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-white border-2 border-black shadow-[2.5px_2.5px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0px_0px_#000] transition-all ml-1"
              >
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-8 h-8 rounded-lg object-cover border-2 border-black"
                />
                <span className="text-xs font-extrabold text-black hidden lg:inline max-w-[100px] truncate">
                  {currentUser.name}
                </span>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="neo-btn px-4 py-2 text-xs flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              <span>Masuk / Daftar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
