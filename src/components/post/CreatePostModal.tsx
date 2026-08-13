import React, { useState } from 'react';
import { X, Image as ImageIcon, Sparkles, Send, Radio, HeartHandshake, Music, Upload, Smile, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOOD_OPTIONS = [
  { id: 'curhat', label: '💭 Curhat Siswa', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'galau', label: '😔 Sedang Galau', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'bahagia', label: '😊 Bahagia & Syukur', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'cinta', label: '💖 Jatuh Cinta', bg: 'bg-rose-100 text-rose-800 border-rose-200' },
  { id: 'semangat', label: '⚡ Semangat Belajar', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'sekolah', label: '🎓 Momen Sekolah', bg: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose }) => {
  const { addPost, addStory, addConfession, addMenfessLagu, songs } = useApp();

  const [activeTab, setActiveTab] = useState<'post' | 'confession' | 'menfess' | 'story'>('post');

  // General Post State
  const [postText, setPostText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedMood, setSelectedMood] = useState<string>('💭 Curhat Siswa');
  const [isAnonymousPost, setIsAnonymousPost] = useState<boolean>(false);

  // Confession State
  const [confessionText, setConfessionText] = useState('');

  // Menfess Lagu State
  const [selectedSongId, setSelectedSongId] = useState<string>(songs[0]?.id || '');
  const [menfessMessage, setMenfessMessage] = useState('');
  const [dedicatedTo, setDedicatedTo] = useState('');
  const [isMenfessAnon, setIsMenfessAnon] = useState(true);

  // Story State
  const [storyText, setStoryText] = useState('');
  const [storyBg, setStoryBg] = useState('from-purple-600 to-pink-500');

  if (!isOpen) return null;

  // Image / Video File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      setMediaType('video');
    } else {
      setMediaType('image');
    }

    try {
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setMediaUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'post') {
      if (!postText.trim()) {
        alert('Tuliskan isi postingan atau curhatanmu terlebih dahulu!');
        return;
      }
      addPost(postText, mediaUrl || undefined, selectedMood, isAnonymousPost, mediaType);
    } else if (activeTab === 'confession') {
      if (!confessionText.trim()) {
        alert('Tuliskan rahasia / confession kamu terlebih dahulu!');
        return;
      }
      addConfession(confessionText, true);
    } else if (activeTab === 'menfess') {
      if (!menfessMessage.trim()) {
        alert('Tuliskan pesan menfess lagu kamu!');
        return;
      }
      const song = songs.find(s => s.id === selectedSongId) || songs[0];
      if (song) {
        addMenfessLagu(
          { title: song.title, artist: song.artist, cover: song.coverUrl },
          menfessMessage,
          dedicatedTo || undefined,
          isMenfessAnon
        );
      }
    } else if (activeTab === 'story') {
      if (!storyText.trim() && !mediaUrl) {
        alert('Tuliskan teks atau pilih media untuk story!');
        return;
      }
      addStory(storyText, mediaUrl || undefined, storyBg);
    }

    // Reset state and close
    setPostText('');
    setMediaUrl('');
    setConfessionText('');
    setMenfessMessage('');
    setDedicatedTo('');
    setStoryText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white text-black w-full max-w-lg rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000] relative border-3 border-black overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-black hover:bg-[#FF4F8B] hover:text-white rounded-xl border-2 border-black transition-all cursor-pointer z-10"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        <h3 className="font-heading font-black text-base mb-3 text-black flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-black fill-[#FFE600] stroke-[2.5]" />
          Curahkan Isi Hatimu di MKVERSE
        </h3>

        {/* Tab Switcher */}
        <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-[#F7F7F0] rounded-2xl mb-5 border-2 border-black shadow-[2px_2px_0px_0px_#000] text-[11px] font-black">
          <button
            type="button"
            onClick={() => setActiveTab('post')}
            className={`py-2 px-1 rounded-xl transition-all border-2 flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'post' ? 'bg-[#B8FF00] text-black border-black shadow-[2px_2px_0px_0px_#000]' : 'border-transparent text-gray-700 hover:text-black'
            }`}
          >
            <Smile className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Curhat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('confession')}
            className={`py-2 px-1 rounded-xl transition-all border-2 flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'confession' ? 'bg-[#FF4F8B] text-white border-black shadow-[2px_2px_0px_0px_#000]' : 'border-transparent text-gray-700 hover:text-black'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Confess</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('menfess')}
            className={`py-2 px-1 rounded-xl transition-all border-2 flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'menfess' ? 'bg-[#35B9FF] text-black border-black shadow-[2px_2px_0px_0px_#000]' : 'border-transparent text-gray-700 hover:text-black'
            }`}
          >
            <Music className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Menfess</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('story')}
            className={`py-2 px-1 rounded-xl transition-all border-2 flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'story' ? 'bg-[#D8B4FE] text-black border-black shadow-[2px_2px_0px_0px_#000]' : 'border-transparent text-gray-700 hover:text-black'
            }`}
          >
            <Radio className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Story</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* FEED POST & CURHAT TAB */}
          {activeTab === 'post' && (
            <div className="space-y-3">
              {/* Mood Badge Selector */}
              <div>
                <label className="block text-[11px] font-black text-black mb-1.5">Pilih Suasana Hati / Mood:</label>
                <div className="flex flex-wrap gap-1.5">
                  {MOOD_OPTIONS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMood(m.label)}
                      className={`text-[11px] font-black px-2.5 py-1 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedMood === m.label
                          ? 'bg-[#0B0B0B] text-[#B8FF00] border-black shadow-[2px_2px_0px_0px_#000]'
                          : 'bg-white text-black border-black hover:bg-[#FFE600]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                required
                rows={4}
                placeholder="Tuliskan curhatan, pikiran, atau cerita sekolahmu hari ini..."
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                className="neo-input w-full p-3.5 text-xs font-medium"
              />

              {/* Anonymous Post Toggle */}
              <div className="flex items-center justify-between p-3 bg-[#FFE600] rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-black stroke-[2.5]" />
                  <div>
                    <p className="text-xs font-black text-black">Post Secara Anonim?</p>
                    <p className="text-[10px] text-gray-900 font-bold">Namamu tidak akan ditampilkan di feed</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isAnonymousPost}
                  onChange={(e) => setIsAnonymousPost(e.target.checked)}
                  className="w-5 h-5 accent-black border-2 border-black cursor-pointer"
                />
              </div>

              {/* Upload Gambar / Video */}
              <div className="space-y-2 bg-[#F7F7F0] p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                <label className="block text-[11px] font-black text-black flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                  Lampirkan Foto atau Video
                </label>
                
                <div className="flex items-center gap-2">
                  <label className="flex-1 bg-white hover:bg-[#B8FF00] border-2 border-dashed border-black rounded-xl px-3 py-2.5 text-center cursor-pointer transition-colors text-xs font-black text-black flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_#000]">
                    <Upload className="w-4 h-4 text-black stroke-[2.5]" />
                    <span>Pilih Foto/Video dari Perangkat</span>
                    <input 
                      type="file" 
                      accept="image/*, video/*" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {mediaUrl && (
                  <div className="relative mt-2 h-36 rounded-xl overflow-hidden border-2 border-black bg-black">
                    {mediaType === 'video' ? (
                      <video src={mediaUrl} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => setMediaUrl('')}
                      className="absolute top-1 right-1 bg-red-600 text-white border border-black p-1 rounded-md text-xs font-black"
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CONFESSION TAB */}
          {activeTab === 'confession' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#FF4F8B] text-white border-2 border-black rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#000]">
                🔒 <b>Confession Rahasia</b>: Tuliskan pesan rahasia atau rasa yang terpendam secara 100% anonim.
              </div>

              <textarea
                required
                rows={4}
                placeholder="Tulis rahasia atau ungkapan perasaamu..."
                value={confessionText}
                onChange={(e) => setConfessionText(e.target.value)}
                className="neo-input w-full p-3.5 text-xs font-medium"
              />
            </div>
          )}

          {/* MENFESS LAGU TAB */}
          {activeTab === 'menfess' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#35B9FF] text-black border-2 border-black rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#000]">
                🎵 <b>Menfess Lagu</b>: Kirimkan lagu khusus beserta pesan manismu untuk seseorang!
              </div>

              <div>
                <label className="block text-[11px] font-black text-black mb-1">Pilih Lagu:</label>
                <select
                  value={selectedSongId}
                  onChange={(e) => setSelectedSongId(e.target.value)}
                  className="neo-input w-full p-2.5 text-xs font-black"
                >
                  {songs.map(song => (
                    <option key={song.id} value={song.id}>
                      {song.title} - {song.artist}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-black mb-1">Pesan / Lirik Khusus:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Dengarkan lagu ini ya..."
                  value={menfessMessage}
                  onChange={(e) => setMenfessMessage(e.target.value)}
                  className="neo-input w-full p-3 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-black mb-1">Untuk Siapa (Opsional):</label>
                <input
                  type="text"
                  placeholder="misal: Anak XI TKJ 2 / @seseorang"
                  value={dedicatedTo}
                  onChange={(e) => setDedicatedTo(e.target.value)}
                  className="neo-input w-full px-3 py-2 text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#FFE600] rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                <span className="text-xs font-black text-black">Kirim Secara Anonim</span>
                <input
                  type="checkbox"
                  checked={isMenfessAnon}
                  onChange={(e) => setIsMenfessAnon(e.target.checked)}
                  className="w-5 h-5 accent-black border-2 border-black cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* STORY TAB */}
          {activeTab === 'story' && (
            <div className="space-y-3">
              <div className={`p-6 rounded-2xl bg-gradient-to-br ${storyBg} text-white text-center border-2 border-black shadow-[3px_3px_0px_0px_#000] min-h-[120px] flex items-center justify-center`}>
                <p className="font-heading font-black text-base drop-shadow-[1px_1px_0px_#000]">
                  {storyText || 'Pratinjau Story Kamu ✨'}
                </p>
              </div>

              <textarea
                rows={2}
                placeholder="Tulis teks story kamu..."
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                className="neo-input w-full p-3 text-xs font-medium"
              />

              <div>
                <label className="block text-[11px] font-black text-black mb-1">Pilih Warna Background</label>
                <div className="flex gap-2">
                  {[
                    'from-purple-600 to-pink-500',
                    'from-blue-500 to-cyan-400',
                    'from-emerald-500 to-lime-400',
                    'from-rose-500 to-orange-400'
                  ].map((grad) => (
                    <button
                      key={grad}
                      type="button"
                      onClick={() => setStoryBg(grad)}
                      className={`w-8 h-8 rounded-lg bg-gradient-to-r ${grad} border-2 border-black cursor-pointer transition-all ${
                        storyBg === grad ? 'scale-110 shadow-[2px_2px_0px_0px_#000]' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="neo-btn w-full py-3 px-4 flex items-center justify-center gap-2 text-xs"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
            <span>Publikasikan Sekarang</span>
          </button>
        </form>

      </div>
    </div>
  );
};
