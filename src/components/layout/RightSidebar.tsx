import React from 'react';
import { Radio, Newspaper, TrendingUp, Users, Play, Pause, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface RightSidebarProps {
  onNavigate: (view: string) => void;
  onSelectNews?: (newsId: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ onNavigate, onSelectNews }) => {
  const { news, users } = useApp();

  const latestNews = news.length > 0 ? news[0] : null;

  // Prioritize Admin account as recommended user to follow
  const adminMember = users.find(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') || users[0];
  const suggestedMembers = adminMember ? [adminMember] : [];

  return (
    <aside className="hidden lg:block w-80 p-4 space-y-5 sticky top-[75px] h-[calc(100vh-85px)] overflow-y-auto no-scrollbar border-2.5 border-black bg-white shadow-[4px_4px_0px_0px_#000] rounded-3xl my-2">
      
      {/* BERITA SEKOLAH PREVIEW CARD */}
      <div className="neo-card-sm p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-black stroke-[2.5]" />
            <h3 className="font-heading font-black text-xs text-black uppercase tracking-wider">
              Berita Sekolah
            </h3>
          </div>
          <button 
            onClick={() => onNavigate('news')}
            className="text-[11px] font-black text-black bg-[#FFE600] px-2 py-0.5 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px]"
          >
            Lihat Semua
          </button>
        </div>

        {latestNews ? (
          <div 
            onClick={() => onSelectNews ? onSelectNews(latestNews.id) : onNavigate('news')} 
            className="group cursor-pointer"
          >
            <div className="relative rounded-xl overflow-hidden mb-2.5 aspect-video border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              <img 
                src={latestNews.coverImage} 
                alt={latestNews.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-2 left-2 bg-[#FF4F8B] text-white text-[9px] font-black px-2 py-0.5 rounded-md border-2 border-black shadow-[1px_1px_0px_0px_#000] uppercase">
                {latestNews.category}
              </span>
            </div>
            <h4 className="font-heading font-black text-xs text-black group-hover:text-[#35B9FF] line-clamp-2 transition-colors">
              {latestNews.title}
            </h4>
            <p className="text-[11px] text-gray-800 font-medium line-clamp-2 mt-1">
              {latestNews.summary}
            </p>
          </div>
        ) : (
          <div className="text-center py-6 px-2 bg-gray-50 rounded-xl border-2 border-dashed border-black">
            <p className="text-xs font-bold text-black">Belum ada berita resmi sekolah.</p>
          </div>
        )}
      </div>

      {/* TRENDING COMMUNITY TAGS */}
      <div className="neo-card-sm p-4 bg-[#FFE600]">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-black stroke-[2.5]" />
          <h3 className="font-heading font-black text-xs text-black uppercase tracking-wider">
            Trending SMK Multi Karya
          </h3>
        </div>
        <div className="space-y-2 text-xs font-black">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all">
            <span className="text-black">#MKVERSE_Medan</span>
            <span className="text-[10px] bg-[#B8FF00] text-black px-2 py-0.5 rounded-md border border-black font-black">Official</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all">
            <span className="text-black">#SMK_Multi_Karya</span>
            <span className="text-[10px] bg-[#35B9FF] text-black px-2 py-0.5 rounded-md border border-black font-black">Komunitas</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer transition-all">
            <span className="text-black">#Prestasi_SMK</span>
            <span className="text-[10px] bg-[#FF4F8B] text-white px-2 py-0.5 rounded-md border border-black font-black">Prestasi</span>
          </div>
        </div>
      </div>

      {/* COMMUNITY DIRECTORY PREVIEW */}
      <div className="neo-card-sm p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-black stroke-[2.5]" />
            <h3 className="font-heading font-black text-xs text-black uppercase tracking-wider">
              Warga Sekolah
            </h3>
          </div>
          <button 
            onClick={() => onNavigate('explore')}
            className="text-[11px] font-black text-black bg-[#B8FF00] px-2 py-0.5 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px]"
          >
            Direktori
          </button>
        </div>

        {suggestedMembers.length > 0 ? (
          <div className="space-y-2.5">
            {suggestedMembers.map((member) => (
              <div key={member.id} className="p-2.5 bg-[#F7F7F0] rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-9 h-9 rounded-lg object-cover border-2 border-black"
                    />
                    <div className="truncate">
                      <p className="text-xs font-black text-black truncate">{member.name}</p>
                      <p className="text-[10px] text-gray-700 font-bold truncate">@{member.username}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-[#B8FF00] text-black border border-black">
                    ADMIN
                  </span>
                </div>

                <button
                  onClick={() => onNavigate('explore')}
                  className="neo-btn w-full text-[11px] py-1.5 px-3 flex items-center justify-center gap-1"
                >
                  + Ikuti Admin Sekolah
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 px-2 bg-gray-50 rounded-xl border-2 border-dashed border-black">
            <p className="text-xs text-black font-bold">Belum ada warga terdaftar.</p>
          </div>
        )}
      </div>

    </aside>
  );
};
