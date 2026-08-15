import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  UserProfile, UserRole, UserType, Post, Story, NewsArticle, DocumentationItem,
  Song, RadioRequest, DriveFolder, DriveFile, Conversation, ChatMessage,
  NotificationItem, ReportItem 
} from '../types';
import { 
  INITIAL_USERS, INITIAL_POSTS, INITIAL_STORIES, INITIAL_NEWS, INITIAL_SONGS, 
  INITIAL_RADIO_REQUESTS, INITIAL_CONVERSATIONS, INITIAL_MESSAGES, 
  INITIAL_NOTIFICATIONS, INITIAL_REPORTS, INITIAL_DOC_FOLDERS, INITIAL_DOC_FILES 
} from '../data/mockData';
import { 
  supabase, 
  mapProfileRow, 
  mapPostRow, 
  signUpWithSupabase, 
  signInWithSupabase, 
  signOutSupabase, 
  resetPasswordSupabase, 
  updatePasswordSupabase 
} from '../lib/supabase';

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
  mustChangeAdminPassword: boolean;
  login: (emailOrUsername: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string; needsVerification?: boolean; isSuspended?: boolean }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<UserProfile>) => Promise<{ success: boolean; message?: string }>;
  resendVerification: (email?: string) => Promise<{ success: boolean; message: string }>;
  verifyEmailStatus: () => Promise<boolean>;
  sendResetPasswordEmail: (email: string) => Promise<{ success: boolean; message: string }>;
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
      const saved = localStorage.getItem('mkverse_users_cache');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authNeedsVerification, setAuthNeedsVerification] = useState<boolean>(false);
  const [authIsSuspended, setAuthIsSuspended] = useState<boolean>(false);
  const [mustChangeAdminPassword, setMustChangeAdminPassword] = useState<boolean>(false);

  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('mkverse_posts_cache');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [stories, setStories] = useState<Story[]>(() => {
    const saved = localStorage.getItem('mkverse_stories_cache');
    return saved ? JSON.parse(saved) : INITIAL_STORIES;
  });

  const [news, setNews] = useState<NewsArticle[]>(() => {
    const saved = localStorage.getItem('mkverse_news_cache');
    return saved ? JSON.parse(saved) : INITIAL_NEWS;
  });

  const [documentations, setDocumentations] = useState<DocumentationItem[]>(() => {
    const saved = localStorage.getItem('mkverse_documentations_cache');
    return saved ? JSON.parse(saved) : [];
  });

  const [songs] = useState<Song[]>(INITIAL_SONGS);
  const [currentSong, setCurrentSong] = useState<Song | null>(INITIAL_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLiveRadio, setIsLiveRadio] = useState<boolean>(false);
  
  const [radioRequests, setRadioRequests] = useState<RadioRequest[]>(() => {
    const saved = localStorage.getItem('mkverse_radio_requests_cache');
    return saved ? JSON.parse(saved) : INITIAL_RADIO_REQUESTS;
  });

  const [folders, setFolders] = useState<DriveFolder[]>(INITIAL_DOC_FOLDERS);
  const [files, setFiles] = useState<DriveFile[]>(INITIAL_DOC_FILES);

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('mkverse_conversations_cache');
    return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('mkverse_messages_cache');
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('mkverse_notifications_cache');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [reports, setReports] = useState<ReportItem[]>(() => {
    const saved = localStorage.getItem('mkverse_reports_cache');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // -------------------------------------------------------------
  // 1. FETCH USERS FROM SUPABASE
  // -------------------------------------------------------------
  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch users notice:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const mappedUsers = data.map(mapProfileRow);
        setUsers(mappedUsers);
        localStorage.setItem('mkverse_users_cache', JSON.stringify(mappedUsers));
      }
    } catch (err) {
      console.warn('Fetch users fallback:', err);
    }
  }, []);

  // -------------------------------------------------------------
  // 2. FETCH POSTS FROM SUPABASE
  // -------------------------------------------------------------
  const fetchPosts = useCallback(async (currentUserId?: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (*),
          likes (user_id),
          comments (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch posts notice:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const mappedPosts = data.map(row => mapPostRow(row, currentUserId));
        setPosts(mappedPosts);
        localStorage.setItem('mkverse_posts_cache', JSON.stringify(mappedPosts));
      }
    } catch (err) {
      console.warn('Fetch posts fallback:', err);
    }
  }, []);

  // -------------------------------------------------------------
  // 3. FETCH STORIES FROM SUPABASE
  // -------------------------------------------------------------
  const fetchStories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch stories notice:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const mappedStories: Story[] = data.map(row => {
          const author = row.profiles || {};
          return {
            id: row.id,
            authorId: row.author_id,
            authorName: author.full_name || 'Warga MKVERSE',
            authorAvatar: author.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
            text: row.text || '',
            mediaUrl: row.media_url,
            bgGradient: row.bg_gradient || 'from-purple-500 to-pink-500',
            createdAt: row.created_at ? new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru saja',
            expiresAt: '24 jam lagi',
            viewsCount: row.views_count || 0,
          };
        });
        setStories(mappedStories);
      }
    } catch (err) {
      console.warn('Fetch stories fallback:', err);
    }
  }, []);

  // -------------------------------------------------------------
  // 4. SUPABASE AUTH SESSION INITIALIZATION & LISTENER
  // -------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      setAuthLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('Get session error:', error.message);
        }

        if (session?.user && isMounted) {
          // Fetch profile for user
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const mapped = mapProfileRow(profile);
            if (mapped.status === 'Suspended') {
              setAuthIsSuspended(true);
              setCurrentUser(null);
            } else {
              setCurrentUser(mapped);
              setAuthNeedsVerification(!session.user.email_confirmed_at && !profile.email_verified);
            }
          } else {
            // Profile row may not be created yet; build provisional profile from auth metadata
            const meta = session.user.user_metadata || {};
            const provisional: UserProfile = {
              id: session.user.id,
              name: meta.full_name || meta.name || session.user.email?.split('@')[0] || 'User',
              username: meta.username || session.user.email?.split('@')[0] || 'user',
              email: session.user.email || '',
              avatar: meta.avatar_url || meta.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
              bio: 'Warga SMK Multi Karya Medan',
              userType: (meta.user_type as UserType) || 'Siswa',
              role: 'USER',
              status: 'Active',
              createdAt: session.user.created_at || new Date().toISOString(),
              emailVerified: Boolean(session.user.email_confirmed_at),
              followersCount: 0,
              followingCount: 0,
              postsCount: 0,
              storiesCount: 0,
              musicRequestsCount: 0,
            };
            setCurrentUser(provisional);
          }
        }
      } catch (err) {
        console.warn('Session init fallback:', err);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }

    initSession();
    fetchUsers();
    fetchPosts();
    fetchStories();

    // Listen to Supabase auth state changes
    const { data: authSubscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const mapped = mapProfileRow(profile);
            if (mapped.status === 'Suspended') {
              setAuthIsSuspended(true);
              setCurrentUser(null);
            } else {
              setCurrentUser(mapped);
              setAuthNeedsVerification(!session.user.email_confirmed_at && !profile.email_verified);
            }
          }
          fetchPosts(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setAuthNeedsVerification(false);
        setAuthIsSuspended(false);
      }
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, [fetchUsers, fetchPosts, fetchStories]);

  // -------------------------------------------------------------
  // 5. AUTH HANDLERS
  // -------------------------------------------------------------
  const login = async (emailOrUsername: string, pass: string) => {
    setAuthLoading(true);
    const res = await signInWithSupabase(emailOrUsername, pass);
    setAuthLoading(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      setAuthNeedsVerification(false);
      setAuthIsSuspended(false);
      fetchUsers();
      fetchPosts(res.user.id);
    } else if (res.needsVerification) {
      setAuthNeedsVerification(true);
    } else if (res.isSuspended) {
      setAuthIsSuspended(true);
    }

    return res;
  };

  const register = async (userData: RegisterData) => {
    setAuthLoading(true);
    try {
      const res = await signUpWithSupabase({
        email: userData.email,
        password: userData.password || userData.pass,
        username: userData.username,
        fullName: userData.name,
        userType: (userData.userType as UserType) || 'Siswa',
        className: userData.kelas,
        major: userData.jurusan,
        mataPelajaran: userData.mataPelajaran,
        divisi: userData.divisi,
      });

      if (res.success) {
        if (res.user && res.session) {
          // If auto-logged in (session available), fetch created profile
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', res.user.id)
              .maybeSingle();

            if (profile) {
              setCurrentUser(mapProfileRow(profile));
            } else {
              // Temporary metadata profile representation until trigger finishes
              const meta = res.user.user_metadata || {};
              setCurrentUser({
                id: res.user.id,
                name: meta.full_name || userData.name,
                username: meta.username || userData.username,
                email: res.user.email || userData.email,
                avatar: meta.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
                bio: 'Warga SMK Multi Karya Medan',
                userType: (meta.user_type as UserType) || 'Siswa',
                role: 'USER',
                status: 'Active',
                createdAt: new Date().toISOString(),
                emailVerified: Boolean(res.user.email_confirmed_at),
                followersCount: 0,
                followingCount: 0,
                postsCount: 0,
                storiesCount: 0,
                musicRequestsCount: 0,
              });
            }
          } catch (profileErr) {
            console.warn('Profile fetch after register warning:', profileErr);
          }
        }

        if (res.needsVerification) {
          setAuthNeedsVerification(true);
        }

        fetchUsers();
      }

      return res;
    } catch (err: any) {
      console.error('Registration error in AppContext:', err);
      return {
        success: false,
        message: err?.message || 'Gagal memproses pendaftaran akun.',
      };
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await signOutSupabase();
    setCurrentUser(null);
    setAuthNeedsVerification(false);
    setAuthIsSuspended(false);
  };

  const updateProfile = async (updatedData: Partial<UserProfile>) => {
    if (!currentUser) return { success: false, message: 'Tidak ada sesi login.' };

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updatedData.name) updates.full_name = updatedData.name;
    if (updatedData.username) updates.username = updatedData.username.toLowerCase().trim();
    if (updatedData.bio !== undefined) updates.bio = updatedData.bio;
    if (updatedData.avatar) updates.avatar_url = updatedData.avatar;
    if (updatedData.coverImage) updates.cover_image = updatedData.coverImage;
    if (updatedData.kelas) updates.class_name = updatedData.kelas;
    if (updatedData.jurusan) updates.major = updatedData.jurusan;
    if (updatedData.mataPelajaran) updates.mata_pelajaran = updatedData.mataPelajaran;
    if (updatedData.divisi) updates.divisi = updatedData.divisi;
    if (updatedData.socialLinks) updates.social_links = updatedData.socialLinks;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id);

      if (error) {
        console.warn('Update profile warning:', error.message);
      }

      setCurrentUser(prev => prev ? { ...prev, ...updatedData } : null);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...updatedData } : u));
      return { success: true, message: 'Profil berhasil diperbarui.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal memperbarui profil.' };
    }
  };

  const resendVerification = async (email?: string) => {
    const targetEmail = email || currentUser?.email;
    if (!targetEmail) return { success: false, message: 'Email tidak ditemukan.' };

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
      });

      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Email verifikasi baru berhasil dikirimkan.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal mengirim email verifikasi.' };
    }
  };

  const verifyEmailStatus = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email_confirmed_at) {
        setAuthNeedsVerification(false);
        if (currentUser) {
          setCurrentUser(prev => prev ? { ...prev, emailVerified: true } : null);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const sendResetPasswordEmail = async (email: string) => {
    return await resetPasswordSupabase(email);
  };

  const submitAdminNewPassword = async (newPassword: string) => {
    const res = await updatePasswordSupabase(newPassword);
    if (res.success) {
      setMustChangeAdminPassword(false);
    }
    return res;
  };

  // -------------------------------------------------------------
  // 6. SOCIAL, POSTS, & STORIES HANDLERS
  // -------------------------------------------------------------
  const addPost = async (
    content: string, 
    mediaUrl?: string, 
    moodTag?: string, 
    isAnonymous = false, 
    mediaType?: 'image' | 'video'
  ) => {
    if (!currentUser) return;
    const tempId = `pst_${Date.now()}`;
    const newPost: Post = {
      id: tempId,
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

    // Optimistic UI update
    setPosts(prev => [newPost, ...prev]);

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: currentUser.id,
          type: 'post',
          content,
          media_url: mediaUrl || null,
          media_type: mediaType || null,
          mood_tag: moodTag || null,
          is_anonymous: isAnonymous,
        })
        .select(`*, profiles(*), likes(user_id), comments(*)`)
        .single();

      if (!error && data) {
        const savedPost = mapPostRow(data, currentUser.id);
        setPosts(prev => prev.map(p => p.id === tempId ? savedPost : p));
      }
    } catch (err) {
      console.warn('Insert post fallback:', err);
    }
  };

  const deletePost = async (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      await supabase.from('posts').delete().eq('id', postId);
    } catch (err) {
      console.warn('Delete post fallback:', err);
    }
  };

  const toggleLikePost = async (postId: string) => {
    if (!currentUser) return;

    let nextLiked = false;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        nextLiked = !p.isLiked;
        return {
          ...p,
          isLiked: nextLiked,
          likesCount: nextLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1)
        };
      }
      return p;
    }));

    try {
      if (nextLiked) {
        await supabase.from('likes').insert({ post_id: postId, user_id: currentUser.id });
      } else {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
      }
    } catch (err) {
      console.warn('Toggle like fallback:', err);
    }
  };

  const toggleSavePost = (postId: string) => {
    if (!currentUser) return;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: !p.isSaved } : p));
  };

  const addComment = async (postId: string, commentText: string) => {
    if (!currentUser || !commentText.trim()) return;

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));

    try {
      await supabase.from('comments').insert({
        post_id: postId,
        author_id: currentUser.id,
        content: commentText.trim(),
      });
    } catch (err) {
      console.warn('Add comment fallback:', err);
    }
  };

  const addStory = async (text: string, mediaUrl?: string, bgGradient = 'from-purple-500 to-pink-500') => {
    if (!currentUser) return;
    const tempId = `str_${Date.now()}`;
    const newStory: Story = {
      id: tempId,
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

    try {
      const { data, error } = await supabase
        .from('stories')
        .insert({
          author_id: currentUser.id,
          text,
          media_url: mediaUrl || null,
          bg_gradient: bgGradient,
        })
        .select(`*, profiles(*)`)
        .single();

      if (!error && data) {
        const author = data.profiles || {};
        setStories(prev => prev.map(s => s.id === tempId ? {
          ...s,
          id: data.id,
          authorName: author.full_name || currentUser.name,
          authorAvatar: author.avatar_url || currentUser.avatar,
        } : s));
      }
    } catch (err) {
      console.warn('Insert story fallback:', err);
    }
  };

  const deleteStory = async (storyId: string) => {
    setStories(prev => prev.filter(s => s.id !== storyId));
    try {
      await supabase.from('stories').delete().eq('id', storyId);
    } catch (err) {
      console.warn('Delete story fallback:', err);
    }
  };

  const addConfession = async (content: string, isAnonymous: boolean) => {
    if (!currentUser) return;
    const tempId = `cnf_${Date.now()}`;
    const newPost: Post = {
      id: tempId,
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

    setPosts(prev => [newPost, ...prev]);

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: currentUser.id,
          type: 'confession',
          content,
          is_anonymous: isAnonymous,
        })
        .select(`*, profiles(*)`)
        .single();

      if (!error && data) {
        setPosts(prev => prev.map(p => p.id === tempId ? mapPostRow(data, currentUser.id) : p));
      }
    } catch (err) {
      console.warn('Insert confession fallback:', err);
    }
  };

  const addMenfessLagu = async (
    song: { title: string; artist: string; cover: string }, 
    message: string, 
    dedicatedTo?: string, 
    isAnonymous = false
  ) => {
    if (!currentUser) return;
    const tempId = `mnf_${Date.now()}`;
    const newPost: Post = {
      id: tempId,
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

    setPosts(prev => [newPost, ...prev]);

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: currentUser.id,
          type: 'menfess_lagu',
          content: message,
          is_anonymous: isAnonymous,
          song_data: {
            title: song.title,
            artist: song.artist,
            cover: song.cover,
            dedicatedTo
          }
        })
        .select(`*, profiles(*)`)
        .single();

      if (!error && data) {
        setPosts(prev => prev.map(p => p.id === tempId ? mapPostRow(data, currentUser.id) : p));
      }
    } catch (err) {
      console.warn('Insert menfess fallback:', err);
    }
  };

  // -------------------------------------------------------------
  // 7. USER PROFILE & SOCIAL NAVIGATION
  // -------------------------------------------------------------
  const viewProfile = (userId: string | null, onNavigate?: (view: string) => void) => {
    setSelectedProfileId(userId);
    if (onNavigate) {
      onNavigate('profile');
    }
  };

  const toggleFollowUser = async (targetUserId: string) => {
    if (!currentUser || currentUser.id === targetUserId) return;
    setUsers(prev => prev.map(u => {
      if (u.id === targetUserId) {
        const isFollowed = (u as any).isFollowing;
        return {
          ...u,
          isFollowing: !isFollowed,
          followersCount: isFollowed ? Math.max(0, u.followersCount - 1) : u.followersCount + 1
        };
      }
      return u;
    }));
  };

  const acceptFollowRequest = async (_targetUid: string, _followerUid: string) => true;
  const rejectFollowRequest = async (_targetUid: string, _followerUid: string) => true;

  const startChatWithUser = (userId: string, onNavigate?: (view: string) => void) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return '';

    let existingConv = conversations.find(c => c.participant.id === userId);
    let convId = existingConv?.id;

    if (!existingConv) {
      convId = `conv_${Date.now()}`;
      const newConv: Conversation = {
        id: convId,
        participant: {
          id: targetUser.id,
          name: targetUser.name,
          username: targetUser.username,
          avatar: targetUser.avatar,
          userType: targetUser.userType
        },
        lastMessage: 'Memulai percakapan',
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

  // -------------------------------------------------------------
  // 8. MUSIC & RADIO
  // -------------------------------------------------------------
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
      if (nextState) setIsPlaying(true);
      return nextState;
    });
  };

  const submitRadioRequest = async (songTitle: string, artist: string, message: string) => {
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

    try {
      await supabase.from('radio_requests').insert({
        sender_id: currentUser.id,
        sender_name: `${currentUser.name} (${currentUser.kelas || currentUser.userType})`,
        sender_username: currentUser.username,
        song_title: songTitle,
        artist,
        message,
        status: 'Pending',
      });
    } catch (err) {
      console.warn('Radio request fallback:', err);
    }
  };

  const approveRadioRequest = async (id: string) => {
    setRadioRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    try {
      await supabase.from('radio_requests').update({ status: 'Approved' }).eq('id', id);
    } catch (err) {
      console.warn('Approve radio fallback:', err);
    }
  };

  // -------------------------------------------------------------
  // 9. NEWS & DOCUMENTATION
  // -------------------------------------------------------------
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

  const addDocumentation = (docData: Omit<DocumentationItem, 'id' | 'createdAt'>) => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      alert('Hanya Admin yang dapat menambahkan dokumentasi.');
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

  const refreshDriveMedia = async () => {
    // Refresh Drive metadata
  };

  // -------------------------------------------------------------
  // 10. CHAT & MESSAGING
  // -------------------------------------------------------------
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
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, lastMessage: text, lastMessageTime: 'Baru saja' } : c));
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

  // -------------------------------------------------------------
  // 11. MODERATION & ADMIN MANAGEMENT (SUPABASE POWERED)
  // -------------------------------------------------------------
  const reportContent = async (
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

    try {
      await supabase.from('reports').insert({
        reporter_id: currentUser.id,
        target_type: targetType,
        target_id: targetId,
        content_preview: contentPreview,
        reason,
        status: 'Pending',
      });
    } catch (err) {
      console.warn('Report content fallback:', err);
    }
  };

  const resolveReport = async (reportId: string, status: 'Resolved' | 'Dismissed') => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: status === 'Resolved' ? 'Resolved' : 'Rejected' } : r));
    try {
      await supabase.from('reports').update({ status: status === 'Resolved' ? 'Resolved' : 'Rejected' }).eq('id', reportId);
    } catch (err) {
      console.warn('Resolve report fallback:', err);
    }
  };

  const updateReportStatus = async (reportId: string, status: 'Pending' | 'Reviewed' | 'Resolved' | 'Rejected') => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
    try {
      await supabase.from('reports').update({ status }).eq('id', reportId);
    } catch (err) {
      console.warn('Update report status fallback:', err);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, role: newRole } : null);
    }

    try {
      await supabase.from('profiles').update({ role: newRole, updated_at: new Date().toISOString() }).eq('id', userId);
    } catch (err) {
      console.error('Update user role error:', err);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: 'Active' | 'Suspended') => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    try {
      await supabase.from('profiles').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', userId);
    } catch (err) {
      console.error('Update user status error:', err);
    }
  };

  const deleteUser = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setPosts(prev => prev.filter(p => p.authorId !== userId));
    setStories(prev => prev.filter(s => s.authorId !== userId));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(null);
    }

    try {
      await supabase.from('profiles').delete().eq('id', userId);
    } catch (err) {
      console.error('Delete user error:', err);
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
        mustChangeAdminPassword,
        login,
        register,
        logout,
        updateProfile,
        resendVerification,
        verifyEmailStatus,
        sendResetPasswordEmail,
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
