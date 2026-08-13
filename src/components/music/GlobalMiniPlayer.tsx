import React, { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Heart, Radio, Maximize2, X, Music } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GlobalMiniPlayer: React.FC = () => {
  const { currentSong, isPlaying, isLiveRadio, togglePlayPause, toggleLiveRadio, songs, playSong } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  if (!currentSong) return null;

  const handleNext = () => {
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    playSong(songs[nextIndex]);
  };

  const handlePrev = () => {
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    playSong(songs[prevIndex]);
  };

  return (
    <>
      {/* FLOATING MINI PLAYER BAR */}
      <div className="fixed bottom-14 md:bottom-3 right-3 left-3 md:left-auto md:w-96 z-40 bg-[#0B0B0B] text-white p-2.5 rounded-2xl shadow-2xl border border-gray-800 flex items-center justify-between gap-3 transition-all">
        {/* Track Info */}
        <div 
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
        >
          <div className="relative">
            <img 
              src={currentSong.coverUrl} 
              alt={currentSong.title} 
              className={`w-11 h-11 rounded-xl object-cover border border-[#B8FF00]/40 ${isPlaying ? 'animate-spin-slow' : ''}`}
            />
            {isLiveRadio && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FF4F8B] border-2 border-black rounded-full animate-ping" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">{currentSong.title}</span>
              {isLiveRadio && (
                <span className="text-[9px] bg-[#35B9FF] text-black font-extrabold px-1.5 py-0.2 rounded uppercase">
                  RADIO
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 truncate">{currentSong.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={handlePrev} 
            className="p-1.5 text-gray-400 hover:text-white transition-colors hidden sm:block"
            title="Sebelumnya"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={isLiveRadio ? toggleLiveRadio : togglePlayPause}
            className="w-9 h-9 rounded-xl bg-[#B8FF00] text-black hover:scale-105 flex items-center justify-center font-bold transition-transform shadow-md"
            title={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
          </button>

          <button 
            onClick={handleNext} 
            className="p-1.5 text-gray-400 hover:text-white transition-colors hidden sm:block"
            title="Berikutnya"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsExpanded(true)}
            className="p-1.5 text-gray-400 hover:text-white transition-colors ml-1"
            title="Perbesar Player"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FULL EXPANDED NOW PLAYING MODAL */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0B0B0B] text-white w-full max-w-md rounded-3xl p-6 border border-gray-800 shadow-2xl relative flex flex-col items-center">
            
            {/* Close Button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Badge */}
            <div className="flex items-center gap-2 mb-6">
              <Radio className="w-5 h-5 text-[#35B9FF] animate-pulse" />
              <span className="font-heading font-extrabold text-sm text-[#B8FF00] uppercase tracking-wider">
                {isLiveRadio ? 'EMKA RADIO — NOW PLAYING LIVE' : 'MKVERSE MUSIC PLAYER'}
              </span>
            </div>

            {/* Album Cover Vinyl */}
            <div className="relative my-4 group">
              <div className={`w-64 h-64 rounded-full border-8 border-gray-900 shadow-2xl overflow-hidden flex items-center justify-center relative ${isPlaying ? 'animate-spin-slow' : ''}`}>
                <img 
                  src={currentSong.coverUrl} 
                  alt={currentSong.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="w-12 h-12 rounded-full bg-black border-4 border-white/20 absolute z-10" />
              </div>
              <div className="absolute -bottom-2 right-4 bg-[#35B9FF] text-black font-extrabold text-xs px-3 py-1 rounded-full shadow-lg">
                128 kbps HD
              </div>
            </div>

            {/* Song Info */}
            <div className="text-center my-4 w-full">
              <h3 className="font-heading font-extrabold text-xl text-white truncate">
                {currentSong.title}
              </h3>
              <p className="text-sm font-medium text-gray-400 mt-1">
                {currentSong.artist} • {currentSong.album}
              </p>
            </div>

            {/* Progress Bar Simulation */}
            <div className="w-full my-3 space-y-1">
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden cursor-pointer">
                <div className="bg-[#B8FF00] h-full w-2/3 rounded-full transition-all" />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                <span>01:42</span>
                <span>03:45</span>
              </div>
            </div>

            {/* Main Audio Controls */}
            <div className="flex items-center justify-center gap-6 my-4 w-full">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-3 rounded-2xl transition-all ${isLiked ? 'text-[#FF4F8B] bg-[#FF4F8B]/10' : 'text-gray-400 hover:text-white bg-white/5'}`}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-[#FF4F8B]' : ''}`} />
              </button>

              <button 
                onClick={handlePrev}
                className="p-3 text-white hover:text-[#B8FF00] bg-white/10 rounded-2xl transition-colors"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <button
                onClick={isLiveRadio ? toggleLiveRadio : togglePlayPause}
                className="w-16 h-16 rounded-2xl bg-[#B8FF00] text-black hover:scale-105 flex items-center justify-center font-bold transition-transform shadow-xl"
              >
                {isPlaying ? <Pause className="w-8 h-8 fill-black" /> : <Play className="w-8 h-8 fill-black ml-1" />}
              </button>

              <button 
                onClick={handleNext}
                className="p-3 text-white hover:text-[#B8FF00] bg-white/10 rounded-2xl transition-colors"
              >
                <SkipForward className="w-6 h-6" />
              </button>

              <button 
                onClick={toggleLiveRadio}
                className={`p-3 rounded-2xl transition-all ${isLiveRadio ? 'bg-[#35B9FF] text-black font-bold' : 'text-gray-400 hover:text-white bg-white/5'}`}
                title="Toggle Live Radio"
              >
                <Radio className="w-6 h-6" />
              </button>
            </div>

            {/* Lyrics Preview */}
            <div className="w-full bg-white/5 border border-white/10 p-3 rounded-2xl text-center text-xs text-gray-300 font-medium mt-2">
              <p className="italic text-gray-400 mb-1">"Cause all of me loves all of you..."</p>
              <span className="text-[10px] text-[#35B9FF] font-bold">LIRIK EMKA MUSIC</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
