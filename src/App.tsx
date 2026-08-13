import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { RightSidebar } from './components/layout/RightSidebar';
import { AuthModal } from './components/auth/AuthModal';
import { CompleteProfileModal } from './components/auth/CompleteProfileModal';
import { CreatePostModal } from './components/post/CreatePostModal';
import { ReportModal } from './components/modals/ReportModal';
import { SearchModal } from './components/modals/SearchModal';

// Views
import { HomeView } from './views/HomeView';
import { ExploreView } from './views/ExploreView';
import { NewsView } from './views/NewsView';
import { DocumentationView } from './views/DocumentationView';
import { MessagesView } from './views/MessagesView';
import { ProfileView } from './views/ProfileView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { ArticleDetailView } from './views/ArticleDetailView';

const MainApp: React.FC = () => {
  const { currentUser, needsUsernameSetup, authLoading } = useApp();

  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Global shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Report Modal
  const [reportState, setReportState] = useState<{
    isOpen: boolean;
    postId: string;
    preview: string;
  }>({
    isOpen: false,
    postId: '',
    preview: ''
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-4 font-body">
        <div className="w-16 h-16 rounded-2xl bg-[#0B0B0B] text-[#B8FF00] font-display font-extrabold text-3xl flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_#000] animate-bounce mb-4">
          MK
        </div>
        <h3 className="font-heading font-black text-xl text-black">MKVERSE</h3>
        <p className="text-xs font-bold text-gray-600 mt-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#B8FF00] border border-black animate-ping"></span>
          Memuat sesi MKVERSE...
        </p>
      </div>
    );
  }

  const handleNavigate = (view: string) => {
    // Access control check for admin view
    if (view === 'admin') {
      if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
        setCurrentView('admin'); // Will render UnauthorizedView
        return;
      }
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectNews = (newsId: string) => {
    setSelectedNewsId(newsId);
    setCurrentView('article_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenReport = (postId: string, preview: string) => {
    setReportState({
      isOpen: true,
      postId,
      preview
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#0B0B0B] flex flex-col font-body selection:bg-[#B8FF00] selection:text-black relative overflow-x-hidden">
      
      {/* Background Ambient Glowing Blobs for Frosted Glass Effect */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#B8FF00]/25 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-[#35B9FF]/20 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#FF4F8B]/15 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <Header 
          currentView={currentView}
          onNavigate={handleNavigate}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        {/* Main Content Area Layout Grid */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-28 md:pb-12 flex gap-6">
          
          {/* Left Navigation Sidebar */}
          <Sidebar 
            currentView={currentView}
            onNavigate={handleNavigate}
            onOpenCreate={() => setIsCreatePostOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
          />

          {/* Center Primary View Container */}
          <main className="flex-1 min-w-0">
            {currentView === 'home' && (
              <HomeView 
                onNavigate={handleNavigate}
                onOpenCreate={() => setIsCreatePostOpen(true)}
                onOpenReport={handleOpenReport}
                onSelectNews={handleSelectNews}
              />
            )}

            {currentView === 'explore' && (
              <ExploreView onNavigate={handleNavigate} />
            )}

            {currentView === 'news' && (
              <NewsView 
                onSelectNews={handleSelectNews}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'documentation' && (
              <DocumentationView />
            )}

            {currentView === 'messages' && (
              <MessagesView />
            )}

            {currentView === 'profile' && (
              <ProfileView 
                onOpenReport={handleOpenReport}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'admin' && (
              <AdminDashboardView onNavigateHome={() => handleNavigate('home')} />
            )}

            {currentView === 'article_detail' && selectedNewsId && (
              <ArticleDetailView 
                newsId={selectedNewsId}
                onBack={() => handleNavigate('news')}
                onNavigateDocumentation={() => handleNavigate('documentation')}
              />
            )}
          </main>

          {/* Right Widget Sidebar */}
          <RightSidebar 
            onNavigate={handleNavigate}
            onSelectNews={handleSelectNews}
          />

        </div>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav 
          currentView={currentView}
          onNavigate={handleNavigate}
          onOpenCreate={() => setIsCreatePostOpen(true)}
        />

      {/* Global Modals */}
      {needsUsernameSetup && <CompleteProfileModal />}

      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onNavigate={handleNavigate}
      />

      <CreatePostModal 
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
      />

      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
        onSelectNews={handleSelectNews}
      />

      <ReportModal 
        isOpen={reportState.isOpen}
        onClose={() => setReportState(prev => ({ ...prev, isOpen: false }))}
        targetId={reportState.postId}
        previewText={reportState.preview}
      />

      </div>
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;
