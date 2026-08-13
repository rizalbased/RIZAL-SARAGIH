export type UserType = 'Siswa' | 'Guru' | 'Guru/Staf' | 'Karyawan';
export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  whatsapp?: string;
  threads?: string;
  twitter?: string;
  discord?: string;
  youtube?: string;
  website?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  userType: UserType;
  role: UserRole;
  kelas?: string;
  jurusan?: string;
  mataPelajaran?: string;
  divisi?: string;
  socialLinks?: SocialLinks;
  status: 'Active' | 'Suspended' | 'Pending';
  createdAt: string;
  emailVerified?: boolean;
  hasCompletedUsername?: boolean;
  mustChangePassword?: boolean;
  followingIds?: string[];
  followersCount: number;
  followingCount: number;
  postsCount: number;
  storiesCount: number;
  musicRequestsCount: number;
}

export interface DocumentationItem {
  id: string;
  title: string;
  category: DocCategory;
  eventDate: string;
  description: string;
  thumbnailUrl: string;
  driveUrl: string;
  createdAt: string;
}

export type PostType = 'post' | 'confession' | 'menfess_lagu' | 'news_share' | 'music_post';

export interface SongData {
  title: string;
  artist: string;
  cover: string;
  audioUrl?: string;
  dedicatedTo?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorType: UserType;
  type: PostType;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  moodTag?: string;
  songData?: SongData;
  isAnonymous?: boolean;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: string;
  newsId?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  mediaUrl?: string;
  text?: string;
  bgGradient?: string;
  createdAt: string;
  expiresAt: string;
  viewsCount: number;
}

export type NewsCategory = 'NEWS' | 'EVENT' | 'ACADEMIC' | 'ACHIEVEMENT' | 'ANNOUNCEMENT' | 'ACTIVITY';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  category: NewsCategory;
  authorName: string;
  publishedAt: string;
  isPublished: boolean;
  driveFolderId?: string;
  drivePhotos?: string[];
}

export type DocCategory = 
  | 'MPLS' 
  | 'PORSENIK' 
  | 'Sabtu Kreatif' 
  | 'Event Sekolah' 
  | 'Dokumentasi Kelas' 
  | 'Dokumentasi Guru' 
  | 'Dokumentasi Organisasi' 
  | 'Lomba' 
  | 'Kegiatan Siswa' 
  | 'Kegiatan Sekolah';

export interface DriveFolder {
  id: string;
  name: string;
  category: DocCategory;
  eventDate: string;
  itemCount: number;
  coverUrl: string;
}

export interface DriveFile {
  id: string;
  driveFileId: string;
  driveFolderId: string;
  filename: string;
  category: DocCategory;
  event: string;
  mimeType: string;
  thumbnailUrl: string;
  originalUrl: string;
  createdAt: string;
  sizeFormatted: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
  duration: number; // in seconds
  plays: number;
  isTrending?: boolean;
}

export interface RadioRequest {
  id: string;
  senderName: string;
  senderUsername?: string;
  songTitle: string;
  artist: string;
  message: string;
  status: 'Pending' | 'Approved' | 'Played' | 'Rejected';
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    userType: UserType;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  sharedSong?: {
    title: string;
    artist: string;
    cover: string;
  };
  sharedPost?: {
    id: string;
    content: string;
  };
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'mention' | 'story' | 'radio' | 'news';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actorAvatar?: string;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'post' | 'confession' | 'user' | 'comment';
  targetId: string;
  contentPreview: string;
  reason: string;
  status: 'Pending' | 'Reviewed' | 'Resolved' | 'Rejected';
  createdAt: string;
}

export interface AppContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  posts: Post[];
  stories: Story[];
  news: NewsArticle[];
  documentations: DocumentationItem[];
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  isLiveRadio: boolean;
  radioRequests: RadioRequest[];
  folders: DriveFolder[];
  files: DriveFile[];
  conversations: Conversation[];
  messages: ChatMessage[];
  notifications: NotificationItem[];
  reports: ReportItem[];
  selectedProfileId: string | null;
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
  viewProfile: (userId: string | null, onNavigate?: (view: string) => void) => void;
  startChatWithUser: (userId: string, onNavigate?: (view: string) => void) => string;
  
  // Handlers
  login: (credentials: { usernameOrEmail: string; password?: string }) => boolean;
  register: (userData: Partial<UserProfile>) => boolean;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  deleteUser: (userId: string) => void;
  toggleFollowUser: (userId: string) => void;
  
  addPost: (content: string, mediaUrl?: string, moodTag?: string, isAnonymous?: boolean, mediaType?: 'image' | 'video') => void;
  deletePost: (postId: string) => void;
  toggleLikePost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  addComment: (postId: string, commentText: string) => void;
  
  addStory: (text: string, mediaUrl?: string, bgGradient?: string) => void;
  deleteStory: (storyId: string) => void;
  
  addConfession: (content: string, isAnonymous: boolean) => void;
  addMenfessLagu: (song: { title: string; artist: string; cover: string }, message: string, dedicatedTo?: string, isAnonymous?: boolean) => void;
  
  // Direct Messaging / Share
  sendChatMessage: (conversationId: string, text: string) => void;
  sendDirectShareMessage: (recipientUserId: string, messageText: string) => void;

  playSong: (song: Song) => void;
  togglePlayPause: () => void;
  toggleLiveRadio: () => void;
  submitRadioRequest: (songTitle: string, artist: string, message: string) => void;
  approveRadioRequest: (id: string) => void;
  
  addNews: (newsData: Omit<NewsArticle, 'id' | 'publishedAt'>) => void;
  updateNews: (id: string, newsData: Partial<NewsArticle>) => void;
  deleteNews: (id: string) => void;
  
  addDocumentation: (docData: Omit<DocumentationItem, 'id' | 'createdAt'>) => void;
  updateDocumentation: (id: string, docData: Partial<DocumentationItem>) => void;
  deleteDocumentation: (id: string) => void;
  
  markNotificationsAsRead: () => void;
  reportContent: (targetType: 'post' | 'confession' | 'user' | 'comment', targetId: string, contentPreview: string, reason: string) => void;
  dismissReport: (reportId: string) => void;
}
