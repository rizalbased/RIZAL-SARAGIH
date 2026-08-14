import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi, setAuthToken, removeAuthToken } from '../lib/api';

import { 
  UserProfile, UserRole, Post, Story, NewsArticle, DocumentationItem,
  Song, RadioRequest, DriveFolder, DriveFile, Conversation, ChatMessage,
  NotificationItem, ReportItem
} from '../types';
import { 
  INITIAL_USERS, INITIAL_POSTS, INITIAL_STORIES, INITIAL_NEWS, INITIAL_SONGS, 
  INITIAL_RADIO_REQUESTS, INITIAL_CONVERSATIONS, INITIAL_MESSAGES, 
  INITIAL_NOTIFICATIONS, INITIAL_REPORTS, INITIAL_DOC_FOLDERS, INITIAL_DOC_FILES 
} from '../data/mockData';



import { requestGoogleCredential } from '../lib/googleAuth';

export interface RegisterData {
  name: string;
  email: string;
  username: string;
  pass?: string;
  password?: string;
  confirmPass?: string;
  confirmPassword?: string;
  userType: string;
  role?: string;
  gender?: string;
  phone?: string;
  kelas?: string;
  jurusan?: string;
  mataPelajaran?: string;
  divisi?: string;
}

export interface AppContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  posts: Post[];
  stories: Story[];
  news: NewsArticle[];
  documentations: DocumentationItem[];
  folders: DriveFolder[];
  files: DriveFile[];
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  isLiveRadio: boolean;
  radioRequests: RadioRequest[];
  conversations: Conversation[];
  messages: ChatMessage[];
  notifications: NotificationItem[];
  reports: ReportItem[];
  moderationReports: ReportItem[];
  
  selectedProfileId: string | null;
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
  viewProfile: (userId: string | null, onNavigate?: (view: string) => void) => void;
  toggleFollowUser: (userId: string) => Promise<void>;
  acceptFollowRequest: (targetUid: string, followerUid: string) => Promise<boolean>;
  rejectFollowRequest: (targetUid: string, followerUid: string) => Promise<boolean>;
  startChatWithUser: (userId: string, onNavigate?: (view: string) => void) => string;

  // Auth State & Actions
  authLoading: boolean;
  authNeedsVerification: boolean;
  authIsSuspended: boolean;
  needsUsernameSetup: boolean;
  mustChangeAdminPassword: boolean;
  login: (emailOrUsername: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string; needsVerification?: boolean; isSuspended?: boolean }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<UserProfile>) => Promise<{ success: boolean; message?: string }>;
  resendVerification: () => Promise<{ success: boolean; message: string }>;
  verifyEmailStatus: () => Promise<boolean>;
  sendResetPasswordEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  loginGoogle: (rememberMe?: boolean) => Promise<{ success: boolean; message?: string; needsUsernameSetup?: boolean }>;
  loginGoogleWithCredential: (credential: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string; needsUsernameSetup?: boolean }>;
  submitGoogleUsername: (username: string) => Promise<{ success: boolean; message?: string }>;
  submitAdminNewPassword: (newPassword: string) => Promise<{ success: boolean; message?: string }>;

  // Social & Posts
  addPost: (content: string, mediaUrl?: string, moodTag?: string, isAnonymous?: boolean, mediaType?: 'image' | 'video') => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  toggleLikePost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  addComment: (postId: string, commentText: string) => void;
  
  addStory: (text: string, mediaUrl?: string, bgGradient?: string) => void;
  deleteStory: (storyId: string) => void;
  
  addConfession: (content: string, isAnonymous: boolean) => Promise<void>;
  addMenfessLagu: (song: { title: string; artist: string; cover: string }, message: string, dedicatedTo?: string, isAnonymous?: boolean) => Promise<void>;

  // Music & Radio
  playSong: (song: Song) => void;
  togglePlayPause: () => void;
  toggleLiveRadio: () => void;
  submitRadioRequest: (songTitle: string, artist: string, message: string) => void;
  approveRadioRequest: (id: string) => void;

  // News & Documentation
  addNews: (newsData: Omit<NewsArticle, 'id' | 'publishedAt'>) => void;
  updateNews: (id: string, newsData: Partial<NewsArticle>) => void;
  deleteNews: (id: string) => void;

  addDocumentation: (doc: Omit<DocumentationItem, 'id' | 'createdAt'>) => void;
  updateDocumentation: (id: string, docData: Partial<DocumentationItem>) => void;
  deleteDocumentation: (id: string) => void;
  
  refreshDriveMedia: () => Promise<void>;

  // Chat & Messaging
  sendChatMessage: (conversationId: string, text: string) => void;
  sendDirectShareMessage: (recipientUserId: string, messageText: string) => void;
  markNotificationsAsRead: () => void;

  // Moderation & Admin
  reportContent: (targetType: 'post' | 'confession' | 'user' | 'comment', targetId: string, contentPreview: string, reason: string) => void;
  resolveReport: (reportId: string, status: 'Resolved' | 'Dismissed') => void;
  updateReportStatus: (reportId: string, status: 'Pending' | 'Reviewed' | 'Resolved' | 'Rejected') => void;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  updateUserStatus: (userId: string, newStatus: 'Active' | 'Suspended') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  exportUsersCSV: () => void;
  exportUsersJSON: () => void;
  refreshUsers: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('mkverse_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authNeedsVerification, setAuthNeedsVerification] = useState<boolean>(false);
  const [authIsSuspended, setAuthIsSuspended] = useState<boolean>(false);
  const [needsUsernameSetup, setNeedsUsernameSetup] = useState<boolean>(false);
  const [mustChangeAdminPassword, setMustChangeAdminPassword] = useState<boolean>(false);

  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('mkverse_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [stories, setStories] = useState<Story[]>(() => {
    const saved = localStorage.getItem('mkverse_stories');
    return saved ? JSON.parse(saved) : INITIAL_STORIES;
  });

  const [news, setNews] = useState<NewsArticle[]>(() => {
    const saved = localStorage.getItem('mkverse_news');
    return saved ? JSON.parse(saved) : INITIAL_NEWS;
  });

  const [documentations, setDocumentations] = useState<DocumentationItem[]>(() => {
    const saved = localStorage.getItem('mkverse_documentations');
    return saved ? JSON.parse(saved) : [];
  });

  const [songs] = useState<Song[]>(INITIAL_SONGS);
  const [currentSong, setCurrentSong] = useState<Song | null>(INITIAL_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLiveRadio, setIsLiveRadio] = useState<boolean>(false);
  
  const [radioRequests, setRadioRequests] = useState<RadioRequest[]>(() => {
    const saved = localStorage.getItem('mkverse_radio_requests');
    return saved ? JSON.parse(saved) : INITIAL_RADIO_REQUESTS;
  });

  const [folders, setFolders] = useState<DriveFolder[]>(INITIAL_DOC_FOLDERS);
  const [files, setFiles] = useState<DriveFile[]>(INITIAL_DOC_FILES);

  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [reports, setReports] = useState<ReportItem[]>(() => {
    const saved = localStorage.getItem('mkverse_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // -------------------------------------------------------------
  
  // FETCH USERS FROM API / MYSQL
  const fetchUsers = async () => {
    try {
      const data = await fetchApi('/api/users/index.php');
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Fetch users failed', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

// API AUTH SESSION MONITORING
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await fetchApi('/api/auth/me.php');
        if (data.success) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Session check failed', err);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // REALTIME FIRESTORE LISTENER FOR POSTS
  // -------------------------------------------------------------
  // Sync state to local storage for local components fallback
  useEffect(() => {
    if (users && users.length > 0) {
      localStorage.setItem('mkverse_users', JSON.stringify(users));
    }
  }, [users]);

  useEffect(() => {
    localStorage.setItem('mkverse_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('mkverse_stories', JSON.stringify(stories));
  }, [stories]);

  useEffect(() => {
    localStorage.setItem('mkverse_news', JSON.stringify(news));
  }, [news]);

  useEffect(() => {
    localStorage.setItem('mkverse_documentations', JSON.stringify(documentations));
  }, [documentations]);

  useEffect(() => {
    localStorage.setItem('mkverse_radio_requests', JSON.stringify(radioRequests));
  }, [radioRequests]);

  useEffect(() => {
    localStorage.setItem('mkverse_reports', JSON.stringify(reports));
  }, [reports]);

  // Drive Media refresh
  const refreshDriveMedia = async () => {
    try {
      const flds = [] as any[];
      const fls = [] as any[];
      if (flds.length > 0) setFolders(flds);
      if (fls.length > 0) setFiles(fls);
    } catch {
      // Keep local state
    }
  };

  useEffect(() => {
    refreshDriveMedia();
  }, []);

  // View Profile Handler
  const viewProfile = (userId: string | null, onNavigate?: (view: string) => void) => {
    setSelectedProfileId(userId);
    if (onNavigate) {
      onNavigate('profile');
    }
  };

  // Follow Toggle Handler
  const toggleFollowUser = async (targetUserId: string) => {
    if (!currentUser) return;
    const target = users.find(u => u.id === targetUserId);
    const res = {success: true} as any; // await toggleFollowApi(currentUser.id, targetUserId, (target as any)?.isPrivate || false);
    
    if (res.success) {
      // Firestore snapshot will auto-update state
    }
  };

  const acceptFollowRequest = async (targetUid: string, followerUid: string): Promise<boolean> => {
    return true;
  };

  const rejectFollowRequest = async (targetUid: string, followerUid: string): Promise<boolean> => {
    return true;
  };

  const startChatWithUser = (targetUserId: string, onNavigate?: (view: string) => void): string => {
    if (!targetUserId) return '';
    const target = users.find(u => u.id === targetUserId || u.username === targetUserId);
    if (!target) return '';

    let existing = conversations.find(c => c.participant?.id === target.id);
    let convId = existing?.id;

    if (!existing) {
      convId = `conv_${Date.now()}`;
      const newConv: Conversation = {
        id: convId,
        participant: {
          id: target.id,
          name: target.name,
          username: target.username,
          avatar: target.avatar,
          userType: target.userType
        },
        lastMessage: 'Halo! Mari mengobrol di MKVERSE.',
        lastMessageTime: 'Baru saja',
        unreadCount: 0
      };
      setConversations(prev => [newConv, ...prev]);
    }

    setSelectedConversationId(convId!);
    if (onNavigate) {
      onNavigate('messages');
    }
    return convId!;
  };

  // AUTH HANDLERS
  const login = async (emailOrUsername: string, pass: string, rememberMe: boolean = true) => {
    const res = await fetchApi('/api/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, pass, rememberMe })
    });

    if (res.success && res.token && res.user) {
      setAuthToken(res.token);
      setCurrentUser(res.user);
      setAuthNeedsVerification(false);
      setAuthIsSuspended(false);
      setMustChangeAdminPassword(false);
      setNeedsUsernameSetup(res.needsUsernameSetup || false);
      fetchUsers();
    } else if (res.needsVerification) {
      if (res.user) setCurrentUser(res.user);
      setAuthNeedsVerification(true);
      fetchUsers();
    } else if (res.isSuspended) {
      setAuthIsSuspended(true);
    }
    return res;
  };

  const register = async (userData: RegisterData) => {
    const res = await fetchApi('/api/auth/register.php', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (res.success && res.user) {
      setCurrentUser(res.user);
      setAuthNeedsVerification(true);
      fetchUsers();
    }
    return res;
  };

  const logout = async () => {
    try {
      await fetchApi("/api/auth/logout.php", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      removeAuthToken();
      setCurrentUser(null);
      setAuthNeedsVerification(false);
      setAuthIsSuspended(false);
      setNeedsUsernameSetup(false);
      setMustChangeAdminPassword(false);
      fetchUsers();
    }
  };

  const updateProfile = async (updatedData: Partial<UserProfile>) => {
    if (!currentUser) return { success: false, message: 'Belum login.' };

    try {
      const res = await fetchApi('/api/auth/complete-profile.php', {
        method: 'POST',
        body: JSON.stringify(updatedData)
      });

      if (res.success && res.user) {
        setCurrentUser(res.user);
        fetchUsers();
        return { success: true, message: res.message };
      }

      // Fallback local update
      setCurrentUser(prev => prev ? { ...prev, ...updatedData } : null);
      fetchUsers();
      return { success: true };
    } catch (err: any) {
      console.error('Update profile error:', err);
      return { success: false, message: err?.message || 'Gagal memperbarui profil.' };
    }
  };

  const resendVerification = async (email?: string) => {
    const targetEmail = email || currentUser?.email;
    if (!targetEmail) {
      return { success: false, message: 'Alamat email tidak ditemukan.' };
    }

    const res = await fetchApi('/api/auth/resend-verification.php', {
      method: 'POST',
      body: JSON.stringify({ email: targetEmail })
    });

    return {
      success: res.success,
      message: res.message || (res.success ? 'Email verifikasi telah dikirim.' : 'Gagal mengirim ulang email verifikasi.')
    };
  };

  const verifyEmailStatus = async () => {
    try {
      const res = await fetchApi('/api/auth/me.php');
      if (res.success && res.user && res.user.emailVerified) {
        setCurrentUser(res.user);
        setAuthNeedsVerification(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const sendResetPasswordEmail = async (email: string) => {
    const res = await fetchApi('/api/auth/forgot-password.php', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    return {
      success: res.success,
      message: res.message || 'Jika email terdaftar, instruksi reset password telah dikirim.'
    };
  };

  const loginGoogleWithCredential = async (credential: string, rememberMe: boolean = true) => {
    try {
      console.log('[MKVERSE Google Auth] Mengirim kredensial Google ke backend PHP...');
      const res = await fetchApi('/api/auth/google.php', {
        method: 'POST',
        body: JSON.stringify({ credential, rememberMe })
      });

      console.log('[MKVERSE Google Auth] Respon API Backend:', res.success ? 'BERHASIL' : 'GAGAL', res.message);

      if (res.success && res.token && res.user) {
        setAuthToken(res.token);
        setCurrentUser(res.user);
        setAuthNeedsVerification(false);
        setAuthIsSuspended(false);
        if (res.needsUsernameSetup) {
          setNeedsUsernameSetup(true);
        } else {
          setNeedsUsernameSetup(false);
        }
        fetchUsers();
      }
      return res;
    } catch (err: any) {
      console.error('[MKVERSE Google Auth API Error]:', err?.message || err);
      return {
        success: false,
        message: err?.message || 'Gagal menghubungi server autentikasi API.'
      };
    }
  };

  const loginGoogle = async (rememberMe: boolean = true) => {
    try {
      console.log('[MKVERSE Google Auth] Memulai otentikasi Google Identity Services...');
      const credential = await requestGoogleCredential();
      return await loginGoogleWithCredential(credential, rememberMe);
    } catch (err: any) {
      const isCancelled =
        err?.isCancelled ||
        err?.name === 'GoogleAuthCancelledError' ||
        (typeof err?.message === 'string' && (
          err.message.toLowerCase().includes('membatalkan') ||
          err.message.toLowerCase().includes('closed') ||
          err.message.toLowerCase().includes('cancel')
        ));

      if (isCancelled) {
        console.log('[MKVERSE Google Auth Info] Login dibatalkan oleh pengguna.');
        return {
          success: false,
          cancelled: true,
          message: 'Login Google dibatalkan.'
        };
      }

      console.error('[MKVERSE Google Auth Error]:', err?.message || err);
      return {
        success: false,
        message: err?.message || 'Gagal masuk dengan Google.'
      };
    }
  };

  const submitGoogleUsername = async (username: string) => {
    if (!currentUser) return { success: false, message: 'User tidak aktif.' };
    
    const cleanU = username.toLowerCase().replace(/[^a-z0-9_.]/g, '').trim();
    const res = await fetchApi('/api/auth/complete-profile.php', {
      method: 'POST',
      body: JSON.stringify({
        username: cleanU,
        userType: currentUser.userType || 'Siswa',
        kelas: currentUser.kelas,
        jurusan: currentUser.jurusan
      })
    });

    if (res.success) {
      if (res.token) setAuthToken(res.token);
      if (res.user) {
        setCurrentUser(res.user);
      } else {
        setCurrentUser(prev => prev ? { ...prev, username: cleanU, hasCompletedUsername: true } : null);
      }
      setNeedsUsernameSetup(false);
      fetchUsers();
    }
    return res;
  };

  const submitAdminNewPassword = async (newPassword: string) => {
    const res = { success: true };
    if (res.success) {
      setMustChangeAdminPassword(false);
      setCurrentUser(prev => prev ? { ...prev, mustChangePassword: false } : null);
    }
    return res;
  };

  // POST HANDLERS
  const addPost = async (
    content: string, 
    mediaUrl?: string, 
    moodTag?: string, 
    isAnonymous = false, 
    mediaType?: 'image' | 'video'
  ) => {
    if (!currentUser) return;
    const postId = `pst_${Date.now()}`;
    const newPost: Post = {
      id: postId,
      authorId: currentUser.id,
      authorName: isAnonymous ? 'Siswa Multi Karya (Anonim)' : currentUser.name,
      authorUsername: isAnonymous ? 'anonymous' : currentUser.username,
      authorAvatar: isAnonymous 
        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250' 
        : currentUser.avatar,
      authorType: currentUser.userType,
      type: 'post',
      content,
      mediaUrl,
      mediaType,
      moodTag,
      isAnonymous,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isSaved: false,
      createdAt: 'Baru saja'
    };

    try {
      
      setPosts(prev => [newPost, ...prev]);
    } catch (err) {
      console.error('Add post error:', err);
      setPosts(prev => [newPost, ...prev]);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Delete post error:', err);
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const toggleLikePost = (postId: string) => {
    if (!currentUser) return;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = !p.isLiked;
        return {
          ...p,
          isLiked,
          likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1)
        };
      }
      return p;
    }));
  };

  const toggleSavePost = (postId: string) => {
    if (!currentUser) return;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, isSaved: !p.isSaved };
      }
      return p;
    }));
  };

  const addComment = (postId: string, commentText: string) => {
    if (!currentUser || !commentText.trim()) return;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, commentsCount: p.commentsCount + 1 };
      }
      return p;
    }));
  };

  const addStory = (text: string, mediaUrl?: string, bgGradient = 'from-purple-500 to-pink-500') => {
    if (!currentUser) return;
    const newStory: Story = {
      id: `str_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      text,
      mediaUrl,
      bgGradient,
      createdAt: 'Baru saja',
      expiresAt: '24 jam lagi',
      viewsCount: 1
    };

    setStories(prev => [newStory, ...prev]);
  };

  const deleteStory = (storyId: string) => {
    setStories(prev => prev.filter(s => s.id !== storyId));
  };

  const addConfession = async (content: string, isAnonymous: boolean) => {
    if (!currentUser) return;
    const postId = `cnf_${Date.now()}`;
    const newPost: Post = {
      id: postId,
      authorId: currentUser.id,
      authorName: isAnonymous ? 'Warga Multi Karya' : currentUser.name,
      authorUsername: isAnonymous ? 'anonymous' : currentUser.username,
      authorAvatar: isAnonymous 
        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250' 
        : currentUser.avatar,
      authorType: currentUser.userType,
      type: 'confession',
      isAnonymous,
      content,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      createdAt: 'Baru saja'
    };

    try {
      
      setPosts(prev => [newPost, ...prev]);
    } catch {
      setPosts(prev => [newPost, ...prev]);
    }
  };

  const addMenfessLagu = async (
    song: { title: string; artist: string; cover: string }, 
    message: string, 
    dedicatedTo?: string, 
    isAnonymous = false
  ) => {
    if (!currentUser) return;
    const postId = `mnf_${Date.now()}`;
    const newPost: Post = {
      id: postId,
      authorId: currentUser.id,
      authorName: isAnonymous ? 'Secret Admirer' : currentUser.name,
      authorUsername: isAnonymous ? 'anonymous' : currentUser.username,
      authorAvatar: isAnonymous 
        ? 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=250' 
        : currentUser.avatar,
      authorType: currentUser.userType,
      type: 'menfess_lagu',
      isAnonymous,
      content: message,
      songData: {
        title: song.title,
        artist: song.artist,
        cover: song.cover,
        dedicatedTo
      },
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      createdAt: 'Baru saja'
    };

    try {
      
      setPosts(prev => [newPost, ...prev]);
    } catch {
      setPosts(prev => [newPost, ...prev]);
    }
  };

  // MUSIC & RADIO
  const playSong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    setIsLiveRadio(false);
  };

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const toggleLiveRadio = () => {
    setIsLiveRadio(prev => {
      const nextState = !prev;
      if (nextState) {
        setIsPlaying(true);
      }
      return nextState;
    });
  };

  const submitRadioRequest = (songTitle: string, artist: string, message: string) => {
    if (!currentUser) return;
    const newReq: RadioRequest = {
      id: `req_${Date.now()}`,
      senderName: `${currentUser.name} (${currentUser.kelas || currentUser.userType})`,
      senderUsername: currentUser.username,
      songTitle,
      artist,
      message,
      status: 'Pending',
      createdAt: 'Baru saja'
    };

    setRadioRequests(prev => [newReq, ...prev]);
  };

  const approveRadioRequest = (id: string) => {
    setRadioRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
  };

  // NEWS HANDLERS
  const addNews = (newsData: Omit<NewsArticle, 'id' | 'publishedAt'>) => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      alert('Hanya Admin yang dapat menerbitkan berita sekolah.');
      return;
    }

    const newArticle: NewsArticle = {
      ...newsData,
      id: `news_${Date.now()}`,
      publishedAt: new Date().toISOString().split('T')[0]
    };

    setNews(prev => [newArticle, ...prev]);
  };

  const updateNews = (id: string, newsData: Partial<NewsArticle>) => {
    setNews(prev => prev.map(n => n.id === id ? { ...n, ...newsData } : n));
  };

  const deleteNews = (id: string) => {
    setNews(prev => prev.filter(n => n.id !== id));
  };

  // DOCUMENTATION HANDLERS
  const addDocumentation = (docData: Omit<DocumentationItem, 'id' | 'createdAt'>) => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      alert('Hanya Admin yang dapat menambahkan dokumentasi sekolah.');
      return;
    }

    const newDoc: DocumentationItem = {
      ...docData,
      id: `doc_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setDocumentations(prev => [newDoc, ...prev]);
  };

  const updateDocumentation = (id: string, docData: Partial<DocumentationItem>) => {
    setDocumentations(prev => prev.map(d => d.id === id ? { ...d, ...docData } : d));
  };

  const deleteDocumentation = (id: string) => {
    setDocumentations(prev => prev.filter(d => d.id !== id));
  };

  // CHAT HANDLERS
  const sendChatMessage = (conversationId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      text,
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);

    setConversations(prev => prev.map(c => {
      if (c.id === conversationId) {
        return {
          ...c,
          lastMessage: text,
          lastMessageTime: 'Baru saja'
        };
      }
      return c;
    }));
  };

  const sendDirectShareMessage = (recipientUserId: string, messageText: string) => {
    if (!currentUser || !recipientUserId) return;

    const recipient = users.find(u => u.id === recipientUserId);
    if (!recipient) return;

    let existingConv = conversations.find(c => c.participant.id === recipientUserId);
    let convId = existingConv?.id;

    if (!existingConv) {
      convId = `conv_${Date.now()}`;
      const newConv: Conversation = {
        id: convId,
        participant: {
          id: recipient.id,
          name: recipient.name,
          username: recipient.username,
          avatar: recipient.avatar,
          userType: recipient.userType
        },
        lastMessage: messageText,
        lastMessageTime: 'Baru saja',
        unreadCount: 0
      };
      setConversations(prev => [newConv, ...prev]);
    }

    sendChatMessage(convId!, messageText);
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // MODERATION & ADMIN
  const reportContent = (
    targetType: 'post' | 'confession' | 'user' | 'comment', 
    targetId: string, 
    contentPreview: string, 
    reason: string
  ) => {
    if (!currentUser) return;
    const newReport: ReportItem = {
      id: `rep_${Date.now()}`,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      targetType,
      targetId,
      contentPreview,
      reason,
      status: 'Pending',
      createdAt: new Date().toLocaleString('id-ID')
    };

    setReports(prev => [newReport, ...prev]);
  };

  const resolveReport = (reportId: string, status: 'Resolved' | 'Dismissed') => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: status === 'Resolved' ? 'Resolved' : 'Rejected' } : r));
  };

  const updateReportStatus = (reportId: string, status: 'Pending' | 'Reviewed' | 'Resolved' | 'Rejected') => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Update user role error:', err);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: 'Active' | 'Suspended') => {
    const success = true; // await adminUpdateUserStatusApi(userId, newStatus === 'Suspended' ? 'suspended' : 'active');
    if (success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    }
  };

  const deleteUser = async (userId: string) => {
    const success = true; // await adminDeleteUserApi(userId);
    if (success) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setPosts(prev => prev.filter(p => p.authorId !== userId));
      setStories(prev => prev.filter(s => s.authorId !== userId));
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(null);
      }
    }
  };

  const exportUsersCSV = () => {
    const headers = ['User ID', 'Nama Lengkap', 'Username', 'Email', 'Tipe User', 'Role', 'Kelas/Mata Pelajaran', 'Status', 'Tanggal Daftar'];
    const rows = users.map(u => [
      u.id,
      `"${u.name}"`,
      u.username,
      u.email,
      u.userType,
      u.role,
      `"${u.kelas || u.mataPelajaran || u.divisi || '-'}"`,
      u.status,
      u.createdAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MKVERSE_Users_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUsersJSON = () => {
    const nonSensitiveUsers = users.map(({ id, name, username, email, userType, role, kelas, jurusan, mataPelajaran, divisi, status, createdAt }) => ({
      id, name, username, email, userType, role, kelas, jurusan, mataPelajaran, divisi, status, createdAt
    }));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(nonSensitiveUsers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `MKVERSE_Users_Export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        posts,
        stories,
        news,
        documentations,
        folders,
        files,
        songs,
        currentSong,
        isPlaying,
        isLiveRadio,
        radioRequests,
        conversations,
        messages,
        notifications,
        reports,
        moderationReports: reports,
        selectedProfileId,
        selectedConversationId,
        setSelectedConversationId,
        viewProfile,
        toggleFollowUser,
        acceptFollowRequest,
        rejectFollowRequest,
        startChatWithUser,
        
        authLoading,
        authNeedsVerification,
        authIsSuspended,
        needsUsernameSetup,
        mustChangeAdminPassword,
        login,
        register,
        logout,
        updateProfile,
        resendVerification,
        verifyEmailStatus,
        sendResetPasswordEmail,
        loginGoogle,
        loginGoogleWithCredential,
        submitGoogleUsername,
        submitAdminNewPassword,

        addPost,
        deletePost,
        toggleLikePost,
        toggleSavePost,
        addComment,
        addStory,
        deleteStory,
        addConfession,
        addMenfessLagu,

        playSong,
        togglePlayPause,
        toggleLiveRadio,
        submitRadioRequest,
        approveRadioRequest,

        addNews,
        updateNews,
        deleteNews,

        addDocumentation,
        updateDocumentation,
        deleteDocumentation,

        refreshDriveMedia,

        sendChatMessage,
        sendDirectShareMessage,
        markNotificationsAsRead,

        reportContent,
        resolveReport,
        updateReportStatus,
        updateUserRole,
        updateUserStatus,
        deleteUser,
        exportUsersCSV,
        exportUsersJSON,
        refreshUsers: fetchUsers
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
