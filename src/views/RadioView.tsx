import React, { useState } from 'react';
import { Radio, Play, Pause, Music, Send, Headphones, Heart, Mic, ListMusic, CheckCircle2, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface RadioViewProps {
  onOpenCreateMenfess?: () => void;
}

export const RadioView: React.FC<RadioViewProps> = ({ onOpenCreateMenfess }) => {
  const { currentSong, isPlaying, isLiveRadio, togglePlayPause, toggleLiveRadio, songs, playSong, radioRequests, submitRadioRequest } = useApp();

  const [reqSongTitle, setReqSongTitle] = useState('');
  const [reqArtist, setReqArtist] = useState('');
  const [reqMessage, setReqMessage] = useState('');
  const [showReqSuccess, setShowReqSuccess] = useState(false);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqSongTitle.trim() || !reqArtist.trim()) return;

    submitRadioRequest(reqSongTitle, reqArtist, reqMessage);
    setShowReqSuccess(true);
    setReqSongTitle('');
    setReqArtist('');
    setReqMessage('');
    setTimeout(() => setShowReqSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* EMKA RADIO HERO BANNER */}
      <section className="bg-[#0B0B0B] text-white rounded-3xl p-6 relative overflow-hidden border border-gray-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#35B9FF]/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-[#35B9FF]/20 border border-[#35B9FF]/40 px-3 py-1 rounded-full">
              <Radio className="w-4 h-4 text-[#35B9FF] animate-pulse" />
              <span className="font-heading font-extrabold text-xs text-[#B8FF00] uppercase tracking-wider">
                EMKA RADIO 24/7 ON AIR
              </span>
            </div>

            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              PLAY YOUR <span className="text-[#B8FF00]">HITS</span>, SHARE YOUR <span className="text-[#FF4F8B]">STORY</span>
            </h1>

            <p className="text-xs text-gray-300 font-body max-w-lg">
              Stasiun radio digital resmi SMK Multi Karya Medan. Nikmati musik non-stop, kirim request lagu favorit, dan dengarkan siaran langsung dari DJ siswa & guru!
            </p>

            <div className="flex items-center justify-center md:justify-start gap-3 pt-1">
              <button
                onClick={toggleLiveRadio}
                className="bg-[#B8FF00] text-black font-heading font-extrabold py-3 px-6 rounded-2xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2 text-sm"
              >
                {isPlaying && isLiveRadio ? (
                  <>
                    <Pause className="w-5 h-5 fill-black" />
                    <span>Jeda Siaran Radio</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-black ml-0.5" />
                    <span>Dengarkan Live Radio</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 bg-white/10 px-3 py-2 rounded-2xl border border-white/10">
                <Headphones className="w-4 h-4 text-[#35B9FF]" />
                <span>24/7 Studio Live</span>
              </div>
            </div>
          </div>

          {/* Player Vinyl Animation */}
          <div className="relative group">
            <div className={`w-44 h-44 sm:w-48 sm:h-48 rounded-full border-8 border-gray-900 shadow-2xl overflow-hidden flex items-center justify-center relative ${isPlaying ? 'animate-spin-slow' : ''}`}>
              <img 
                src={currentSong?.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=300'} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
              <div className="w-10 h-10 rounded-full bg-black border-4 border-white/20 absolute z-10" />
            </div>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#FF4F8B] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase shadow whitespace-nowrap">
              Radio Digital SMK Multi Karya
            </span>
          </div>
        </div>
      </section>

      {/* QUICK RADIO MENU TILES */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-sm text-center">
          <div className="w-10 h-10 rounded-2xl bg-[#B8FF00] text-black flex items-center justify-center mx-auto mb-2 font-bold shadow-sm">
            <Music className="w-5 h-5" />
          </div>
          <p className="font-heading font-extrabold text-xs text-gray-900">Request Lagu</p>
          <p className="text-[10px] text-gray-500">Kirim ke DJ Radio</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-sm text-center">
          <div className="w-10 h-10 rounded-2xl bg-[#FF4F8B] text-white flex items-center justify-center mx-auto mb-2 font-bold shadow-sm">
            <Heart className="w-5 h-5" />
          </div>
          <p className="font-heading font-extrabold text-xs text-gray-900">Confession</p>
          <p className="text-[10px] text-gray-500">Ungkapan Rahasia</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-sm text-center">
          <div className="w-10 h-10 rounded-2xl bg-[#35B9FF] text-white flex items-center justify-center mx-auto mb-2 font-bold shadow-sm">
            <Radio className="w-5 h-5" />
          </div>
          <p className="font-heading font-extrabold text-xs text-gray-900">Live Radio</p>
          <p className="text-[10px] text-gray-500">24 Jam Non Stop</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-sm text-center">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF000] text-black flex items-center justify-center mx-auto mb-2 font-bold shadow-sm">
            <Mic className="w-5 h-5" />
          </div>
          <p className="font-heading font-extrabold text-xs text-gray-900">DJ Studio</p>
          <p className="text-[10px] text-gray-500">Program Sendiri</p>
        </div>
      </section>

      {/* REQUEST LAGU FORM & DJ STUDIO MODE GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* REQUEST LAGU FORM */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Music className="w-5 h-5 text-[#35B9FF]" />
            <h2 className="font-heading font-extrabold text-base text-gray-900">
              Kirimkan Lagu Favoritmu ke EMKA RADIO
            </h2>
          </div>

          {showReqSuccess && (
            <div className="bg-green-50 text-green-700 text-xs font-semibold p-3 rounded-2xl mb-4 border border-green-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Request lagu berhasil dikirimkan ke antrean DJ Radio!</span>
            </div>
          )}

          <form onSubmit={handleRequestSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Judul Lagu</label>
              <input
                type="text"
                required
                placeholder="Contoh: Perfect / Dandelions"
                value={reqSongTitle}
                onChange={(e) => setReqSongTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#35B9FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Penyanyi / Artis</label>
              <input
                type="text"
                required
                placeholder="Contoh: Ed Sheeran / Ruth B."
                value={reqArtist}
                onChange={(e) => setReqArtist(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#35B9FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Pesan untuk Penyiar / Teman (Opsional)</label>
              <textarea
                rows={3}
                placeholder="Tulis salam hangat atau pesan khusus..."
                value={reqMessage}
                onChange={(e) => setReqMessage(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#35B9FF]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0B0B0B] text-[#B8FF00] hover:bg-black font-heading font-extrabold py-3 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all text-xs"
            >
              <Send className="w-4 h-4 text-[#B8FF00]" />
              <span>Kirim Request ke EMKA Radio</span>
            </button>
          </form>
        </div>

        {/* DJ STUDIO PREVIEW */}
        <div className="bg-gradient-to-br from-[#743CFF] to-purple-800 text-white rounded-3xl p-6 border border-purple-700 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[11px] font-bold text-white">
              <Mic className="w-3.5 h-3.5 text-[#B8FF00]" />
              <span>DJ STUDIO EMKA</span>
            </div>

            <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white">
              Kamu Adalah Penyiar! Buat Program Radionmu Sendiri 🎙️
            </h3>

            <p className="text-xs text-purple-100 font-body leading-relaxed">
              Daftarkan dirimu dalam ekstrakulikuler penyiaran EMKA RADIO SMK Multi Karya. Kelola playlist, wawancarai bintang tamu sekolah, dan hibur ribuan pendengar!
            </p>
          </div>

          <div className="my-4 relative z-10 bg-black/30 p-4 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Status DJ Studio:</span>
              <span className="text-[#B8FF00]">SIAP ON AIR</span>
            </div>
            <p className="text-[11px] text-purple-200">
              Jadwal Siaran Utama: Setiap Hari Senin - Jumat (12:00 - 16:00 WIB)
            </p>
          </div>

          <button
            onClick={() => alert('Fitur Pendaftaran DJ Radio EMKA telah dibuka! Silakan hubungi Pembina OSIS.')}
            className="w-full bg-[#B8FF00] text-black font-heading font-extrabold py-3 px-4 rounded-2xl shadow-lg hover:scale-[1.02] transition-transform text-xs text-center"
          >
            Mulai Siaran / Daftar DJ Radio
          </button>
        </div>

      </section>

      {/* TOP MUSIC & RECENT REQUESTS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LAGU TERPOPULER CHART */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-[#FF4F8B]" />
              <h3 className="font-heading font-extrabold text-base text-gray-900">
                Lagu Terpopuler
              </h3>
            </div>
            <span className="text-xs text-gray-400 font-semibold">Weekly Hits</span>
          </div>

          <div className="space-y-2.5">
            {songs.map((song, index) => (
              <div 
                key={song.id}
                onClick={() => playSong(song)}
                className={`flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer border ${
                  currentSong?.id === song.id 
                    ? 'bg-[#35B9FF]/10 border-[#35B9FF]' 
                    : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-heading font-extrabold text-xs text-gray-400 w-5 text-center">
                    {index + 1}
                  </span>
                  <img 
                    src={song.coverUrl} 
                    alt={song.title} 
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{song.title}</p>
                    <p className="text-[11px] text-gray-500 truncate">{song.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-xl bg-[#0B0B0B] text-[#B8FF00] flex items-center justify-center font-bold">
                    <Play className="w-4 h-4 fill-[#B8FF00] ml-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIWAYAT REQUEST PENDENGAR */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#35B9FF]" />
              <h3 className="font-heading font-extrabold text-base text-gray-900">
                Antrean Request Pendengar
              </h3>
            </div>
            <span className="text-xs text-gray-400 font-semibold">Real-time</span>
          </div>

          {radioRequests.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
              <Radio className="w-8 h-8 text-[#35B9FF] mx-auto opacity-50" />
              <p className="text-xs font-bold text-gray-700">Belum Ada Antrean Request Lagu</p>
              <p className="text-[11px] text-gray-500">Jadilah yang pertama mengirimkan request lagu favoritmu lewat formulir di atas!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {radioRequests.map((req) => (
                <div key={req.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{req.songTitle} — {req.artist}</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      req.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-gray-600 italic text-[11px]">"{req.message}"</p>
                  <p className="text-[10px] text-gray-400 font-medium">Dari: {req.senderName} • {req.createdAt}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </section>

    </div>
  );
};
