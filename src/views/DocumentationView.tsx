import React, { useState } from 'react';
import { FolderGit2, Image as ImageIcon, ExternalLink, X, Plus, Calendar, ShieldCheck, Folder } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DocCategory, DocumentationItem } from '../types';

export const DocumentationView: React.FC = () => {
  const { documentations, folders, files, currentUser, addDocumentation, deleteDocumentation } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeDocViewer, setActiveDocViewer] = useState<DocumentationItem | null>(null);
  
  // Add Doc Modal state (Admin only)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocCategory>('Kegiatan Sekolah');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [driveUrl, setDriveUrl] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const filteredDocs = documentations.filter(d => {
    if (selectedCategory === 'ALL') return true;
    return d.category === selectedCategory;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !driveUrl) return;

    addDocumentation({
      title,
      category,
      eventDate: eventDate || new Date().toISOString().split('T')[0],
      description,
      thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800',
      driveUrl
    });

    setTitle('');
    setEventDate('');
    setDescription('');
    setThumbnailUrl('');
    setDriveUrl('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* HEADER BANNER */}
      <section className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderGit2 className="w-6 h-6 text-[#35B9FF]" />
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900">
              DOKUMENTASI FOTO & MEDIA SEKOLAH
            </h1>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Arsip resmi dokumentasi kegiatan SMK Multi Karya Medan terhubung Google Drive
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#743CFF] text-white font-heading font-extrabold px-4 py-2.5 rounded-2xl text-xs hover:bg-[#622cd9] transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dokumentasi (Admin)</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-[#35B9FF]/10 text-[#0088CC] px-3.5 py-2 rounded-2xl border border-[#35B9FF]/30 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-[#35B9FF]" />
            <span>Akses Dokumentasi Resmi</span>
          </div>
        )}
      </section>

      {/* CATEGORY FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {['ALL', 'MPLS', 'PORSENIK', 'Sabtu Kreatif', 'Event Sekolah', 'Dokumentasi Kelas', 'Dokumentasi Guru', 'Kegiatan Siswa', 'Kegiatan Sekolah'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-2 rounded-2xl font-heading font-bold text-xs transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-[#0B0B0B] text-[#B8FF00] shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat === 'ALL' ? 'Semua Kategori' : cat}
          </button>
        ))}
      </div>

      {/* DOCUMENTATIONS GRID */}
      <section className="space-y-4">
        {filteredDocs.length === 0 && folders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 text-center border border-gray-200/80 shadow-sm space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#35B9FF]/20 text-[#0088CC] flex items-center justify-center mx-auto border border-[#35B9FF]">
              <FolderGit2 className="w-7 h-7 text-[#35B9FF]" />
            </div>
            <h3 className="font-heading font-extrabold text-lg text-gray-900">
              Belum Ada Dokumentasi Sekolah
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto font-medium">
              Dokumentasi kegiatan resmi sekolah akan diunggah oleh Pengurus Sekolah / Admin melalui Google Drive.
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 inline-flex items-center gap-2 bg-[#743CFF] text-white font-heading font-extrabold px-5 py-2.5 rounded-2xl text-xs hover:bg-[#622cd9] transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Unggah Dokumentasi Pertama</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-3xl overflow-hidden border border-gray-200/80 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    <img
                      src={doc.thumbnailUrl}
                      alt={doc.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-[#35B9FF] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase shadow">
                      {doc.category}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => deleteDocumentation(doc.id)}
                        className="absolute top-3 right-3 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors"
                        title="Hapus Dokumentasi"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{doc.eventDate}</span>
                    </div>

                    <h3 className="font-heading font-extrabold text-sm text-gray-900 group-hover:text-[#35B9FF] transition-colors leading-snug">
                      {doc.title}
                    </h3>

                    {doc.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <a
                    href={doc.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#0B0B0B] text-[#B8FF00] hover:bg-black font-heading font-extrabold py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4 text-[#B8FF00]" />
                    <span>Buka Google Drive Dokumentasi</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ADMIN ADD DOCUMENTATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white text-[#0B0B0B] w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-gray-200 overflow-hidden">
            
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h2 className="font-heading font-extrabold text-xl text-gray-900">
                Tambah Dokumentasi Kegiatan (Admin)
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Masukkan tautan Google Drive dan detail foto kegiatan SMK Multi Karya
              </p>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Judul Dokumentasi / Event</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dokumentasi PORSENIK SMK Multi Karya 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DocCategory)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  >
                    <option value="Kegiatan Sekolah">Kegiatan Sekolah</option>
                    <option value="MPLS">MPLS</option>
                    <option value="PORSENIK">PORSENIK</option>
                    <option value="Sabtu Kreatif">Sabtu Kreatif</option>
                    <option value="Event Sekolah">Event Sekolah</option>
                    <option value="Dokumentasi Kelas">Dokumentasi Kelas</option>
                    <option value="Dokumentasi Guru">Dokumentasi Guru</option>
                    <option value="Kegiatan Siswa">Kegiatan Siswa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Kegiatan</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat seputar foto atau video kegiatan..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tautan Foto Cover / Sampul (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tautan Folder / File Google Drive *</label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#743CFF] text-white font-heading font-extrabold py-3 px-4 rounded-2xl shadow-lg hover:bg-[#622cd9] transition-all text-xs"
              >
                Simpan & Publikasikan Dokumentasi
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
