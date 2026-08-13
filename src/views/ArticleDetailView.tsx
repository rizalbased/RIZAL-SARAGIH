import React from 'react';
import { ArrowLeft, Calendar, User, Share2, FolderGit2, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ArticleDetailViewProps {
  newsId: string;
  onBack: () => void;
  onNavigateDocumentation?: () => void;
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({ 
  newsId, 
  onBack,
  onNavigateDocumentation 
}) => {
  const { news } = useApp();
  const article = news.find(n => n.id === newsId) || news[0];

  if (!article) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6 animate-fade-in pb-16">
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-heading font-extrabold text-gray-700 hover:text-black bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-2xl transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Berita</span>
      </button>

      {/* Title & Metadata */}
      <div className="space-y-3">
        <span className="inline-block bg-[#FF4F8B] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase shadow">
          {article.category}
        </span>

        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-900 leading-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium pt-1 border-b border-gray-100 pb-3">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#35B9FF]" />
            Diterbitkan: {article.publishedAt}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-[#B8FF00]" />
            Penulis: {article.authorName}
          </span>
        </div>
      </div>

      {/* Cover Image */}
      <div className="rounded-3xl overflow-hidden aspect-video border border-gray-200 shadow-md">
        <img 
          src={article.coverImage} 
          alt={article.title} 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Article Content Paragraphs */}
      <div className="prose max-w-none text-xs sm:text-sm text-gray-800 font-body leading-relaxed space-y-4">
        <p className="font-bold text-gray-900 text-sm sm:text-base leading-snug bg-gray-50 p-4 rounded-2xl border border-gray-200">
          {article.summary}
        </p>

        {article.content.split('\n\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {/* Attached Google Drive Album Banner */}
      {article.driveFolderId && (
        <div className="bg-[#35B9FF]/10 border border-[#35B9FF]/30 p-5 rounded-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FolderGit2 className="w-8 h-8 text-[#0088CC]" />
            <div>
              <h4 className="font-heading font-extrabold text-xs text-gray-900">
                Dokumentasi Foto Lengkap Google Drive
              </h4>
              <p className="text-[11px] text-gray-600">
                Lihat puluhan foto kegiatan resolusi tinggi di Google Drive Gallery
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateDocumentation}
            className="bg-[#0B0B0B] text-[#B8FF00] font-heading font-extrabold px-4 py-2.5 rounded-2xl text-xs hover:bg-black transition-all flex-shrink-0"
          >
            Buka Album Foto →
          </button>
        </div>
      )}

    </div>
  );
};
