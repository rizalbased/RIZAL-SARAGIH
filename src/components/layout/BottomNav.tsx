import React from 'react';
import { Home, Compass, PlusCircle, Newspaper, User } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenCreate: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  currentView, 
  onNavigate, 
  onOpenCreate 
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-3 border-black py-2 px-3 flex items-center justify-around shadow-[0_-4px_0px_0px_#000]">
      <button
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all ${
          currentView === 'home' ? 'text-black font-black' : 'text-gray-700 font-bold hover:text-black'
        }`}
      >
        <div className={`p-1.5 rounded-xl border-2 ${currentView === 'home' ? 'bg-[#B8FF00] border-black shadow-[2px_2px_0px_0px_#000]' : 'border-transparent'}`}>
          <Home className="w-5 h-5 stroke-[2.5]" />
        </div>
        <span className="text-[10px] font-black">Home</span>
      </button>

      <button
        onClick={() => onNavigate('explore')}
        className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all ${
          currentView === 'explore' ? 'text-black font-black' : 'text-gray-700 font-bold hover:text-black'
        }`}
      >
        <div className={`p-1.5 rounded-xl border-2 ${currentView === 'explore' ? 'bg-[#35B9FF] border-black shadow-[2px_2px_0px_0px_#000]' : 'border-transparent'}`}>
          <Compass className="w-5 h-5 stroke-[2.5]" />
        </div>
        <span className="text-[10px] font-black">Explore</span>
      </button>

      {/* Floating Create (+) Button */}
      <button
        onClick={onOpenCreate}
        className="-mt-6 bg-[#0B0B0B] text-[#B8FF00] p-3 rounded-2xl border-2.5 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all"
        title="Buat Konten"
      >
        <PlusCircle className="w-6 h-6 stroke-[2.5]" />
      </button>

      <button
        onClick={() => onNavigate('news')}
        className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all ${
          currentView === 'news' ? 'text-black font-black' : 'text-gray-700 font-bold hover:text-black'
        }`}
      >
        <div className={`p-1.5 rounded-xl border-2 ${currentView === 'news' ? 'bg-[#FFE600] border-black shadow-[2px_2px_0px_0px_#000]' : 'border-transparent'}`}>
          <Newspaper className="w-5 h-5 stroke-[2.5]" />
        </div>
        <span className="text-[10px] font-black">Berita</span>
      </button>

      <button
        onClick={() => onNavigate('profile')}
        className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all ${
          currentView === 'profile' ? 'text-black font-black' : 'text-gray-700 font-bold hover:text-black'
        }`}
      >
        <div className={`p-1.5 rounded-xl border-2 ${currentView === 'profile' ? 'bg-[#FF4F8B] text-white border-black shadow-[2px_2px_0px_0px_#000]' : 'border-transparent'}`}>
          <User className="w-5 h-5 stroke-[2.5]" />
        </div>
        <span className="text-[10px] font-black">Profil</span>
      </button>
    </nav>
  );
};
