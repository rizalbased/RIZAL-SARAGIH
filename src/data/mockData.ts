import { 
  UserProfile, 
  Post, 
  Story, 
  NewsArticle, 
  DriveFolder, 
  DriveFile, 
  Song, 
  RadioRequest, 
  Conversation, 
  ChatMessage, 
  NotificationItem, 
  ReportItem 
} from '../types';

export const DEFAULT_ADMIN_USER: UserProfile & { password?: string } = {
  id: 'usr_admin_rizal',
  name: 'Rizal App (Admin)',
  username: 'rizalapp',
  email: 'rizalapp@smkmultikarya.sch.id',
  password: '1902',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
  bio: 'Administrator Resmi MKVERSE SMK Multi Karya Medan',
  userType: 'Guru/Staf',
  role: 'ADMIN',
  mataPelajaran: 'Pengurus Admin Sekolah',
  socialLinks: {
    instagram: 'https://instagram.com/smkmultikarya',
    tiktok: 'https://tiktok.com/@smkmultikaryamedan',
    whatsapp: 'https://wa.me/6281234567890',
    youtube: 'https://youtube.com/@smkmultikaryamedan',
    website: 'https://smkmultikarya.sch.id'
  },
  status: 'Active',
  createdAt: '2026-01-01',
  followersCount: 250,
  followingCount: 10,
  postsCount: 15,
  storiesCount: 0,
  musicRequestsCount: 0
};

export const INITIAL_USERS: UserProfile[] = [
  DEFAULT_ADMIN_USER
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'pst_1',
    authorId: 'u_1',
    authorName: 'Budi Santoso',
    authorUsername: 'budi_tkj',
    authorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
    authorType: 'Siswa',
    type: 'post',
    content: 'Hari ini kelar ujicoba jaringan Fiber Optic di lab TKJ SMK Multi Karya! Agak pusing nemuin splicing yang pas, tapi pas dites ping 1ms rasanya lega banget 💻⚡ semangat buat temen-temen angkatan!',
    moodTag: '🎓 Momen Sekolah',
    likesCount: 24,
    commentsCount: 5,
    isLiked: false,
    isSaved: false,
    createdAt: '2 jam lalu'
  },
  {
    id: 'pst_2',
    authorId: 'u_anon_1',
    authorName: 'Siswa Multi Karya (Anonim)',
    authorUsername: 'anonymous',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
    authorType: 'Siswa',
    type: 'confession',
    content: 'Jujur kadang ngerasa kewalahan bagi waktu antara tugas jurusan sama jadwal ekskul. Tapi seneng banget punya temen-temen sekelas yang saling bantu dan gak pelit bagi ilmu 🥺❤️',
    moodTag: '💭 Curhat Siswa',
    isAnonymous: true,
    likesCount: 42,
    commentsCount: 8,
    isLiked: true,
    isSaved: false,
    createdAt: '4 jam lalu'
  },
  {
    id: 'pst_3',
    authorId: 'usr_admin_rizal',
    authorName: 'Rizal App (Admin)',
    authorUsername: 'rizalapp',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    authorType: 'Guru/Staf',
    type: 'post',
    content: 'Selamat pagi siswa-siswi SMK Multi Karya Medan! Wadah Feed MKVERSE ini resmi kita perbarui sebagai tempat kalian mencurahkan isi hati, ide, serta cerita positif keseharian di sekolah. Jaga kebersamaan dan terus berprestasi! 🌟',
    moodTag: '⚡ Semangat Belajar',
    likesCount: 89,
    commentsCount: 14,
    isLiked: false,
    isSaved: true,
    createdAt: '1 hari lalu'
  }
];

export const INITIAL_STORIES: Story[] = [];

export const INITIAL_NEWS: NewsArticle[] = [];

export const INITIAL_DOC_FOLDERS: DriveFolder[] = [];

export const INITIAL_DOC_FILES: DriveFile[] = [];

export const INITIAL_SONGS: Song[] = [
  {
    id: 'sng_1',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 263,
    plays: 0,
    isTrending: true
  },
  {
    id: 'sng_2',
    title: 'Dandelions',
    artist: 'Ruth B.',
    album: 'Safe Haven',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 233,
    plays: 0,
    isTrending: true
  },
  {
    id: 'sng_3',
    title: 'Tetap Dalam Jiwa',
    artist: 'Isyana Sarasvati',
    album: 'EXPLORE!',
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 212,
    plays: 0,
    isTrending: true
  },
  {
    id: 'sng_4',
    title: 'Laskar Pelangi',
    artist: 'Nidji',
    album: 'OST Laskar Pelangi',
    coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 215,
    plays: 0,
    isTrending: false
  }
];

export const INITIAL_RADIO_REQUESTS: RadioRequest[] = [];

export const INITIAL_CONVERSATIONS: Conversation[] = [];

export const INITIAL_MESSAGES: ChatMessage[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_REPORTS: ReportItem[] = [];
