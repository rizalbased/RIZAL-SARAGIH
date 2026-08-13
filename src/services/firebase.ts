import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  sendPasswordResetEmail,
  updateProfile as updateAuthProfile,
  updatePassword as updateAuthPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  increment
} from 'firebase/firestore';
import defaultConfig from '../../firebase-applet-config.json';
import { UserProfile, UserRole, UserType } from '../types';

// Construct config with environment variables override support
const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || defaultConfig.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || defaultConfig.authDomain,
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || defaultConfig.projectId,
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_DATABASE_ID as string) || defaultConfig.firestoreDatabaseId || '(default)',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || defaultConfig.storageBucket,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || defaultConfig.messagingSenderId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || defaultConfig.appId,
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || defaultConfig.measurementId || '',
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with specific databaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Enable offline persistence to handle transient connection issues smoothly
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('[Firestore Persistence] Multiple tabs open, persistence enabled in primary tab.');
    } else if (err.code === 'unimplemented') {
      console.warn('[Firestore Persistence] Browser does not support IndexedDB persistence.');
    }
  });
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export interface FirebaseRegisterInput {
  name: string;
  username: string;
  email: string;
  password: string;
  userType?: UserType;
  kelas?: string;
  jurusan?: string;
  mataPelajaran?: string;
  divisi?: string;
}

/**
 * Check if a username is already taken (case-insensitive)
 */
export async function isUsernameTaken(username: string, excludeEmail?: string): Promise<boolean> {
  try {
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_.]/g, '').trim();
    if (!cleanUsername) return false;
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('usernameLower', '==', cleanUsername));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;
    if (excludeEmail) {
      const cleanExclude = excludeEmail.toLowerCase().trim();
      const other = snapshot.docs.find(d => {
        const dData = d.data();
        return dData.email && dData.email.toLowerCase().trim() !== cleanExclude;
      });
      return Boolean(other);
    }
    return true;
  } catch (err) {
    console.warn('[Firestore] isUsernameTaken query check failed (offline/network):', err);
    return false;
  }
}

/**
 * Register a new user with Firebase Auth and create document in Firestore users/{uid}
 */
export async function registerWithFirebase(input: FirebaseRegisterInput): Promise<{
  success: boolean;
  message?: string;
  user?: UserProfile;
}> {
  const cleanUsername = input.username.toLowerCase().replace(/[^a-z0-9_.]/g, '').trim();
  const cleanEmail = input.email.toLowerCase().trim();

  // 1. Check if username is taken by a DIFFERENT user in Firestore
  const usernameTaken = await isUsernameTaken(cleanUsername, cleanEmail);
  if (usernameTaken) {
    return {
      success: false,
      message: 'Username sudah digunakan. Silakan pilih username lain.'
    };
  }

  try {
    // 2. Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, input.password);
    const firebaseUser = userCredential.user;

    // 3. Clean up any orphaned Firestore user docs from previously deleted Auth accounts
    try {
      const usersRef = collection(db, 'users');
      // Orphan check by email
      const qEmail = query(usersRef, where('email', '==', cleanEmail));
      const snapEmail = await getDocs(qEmail);
      for (const docSnap of snapEmail.docs) {
        if (docSnap.id !== firebaseUser.uid) {
          console.log('[Auth Log] Deleting orphaned Firestore user doc by email match:', docSnap.id);
          await deleteDoc(doc(db, 'users', docSnap.id)).catch(() => {});
        }
      }
      // Orphan check by usernameLower
      if (cleanUsername) {
        const qUser = query(usersRef, where('usernameLower', '==', cleanUsername));
        const snapUser = await getDocs(qUser);
        for (const docSnap of snapUser.docs) {
          if (docSnap.id !== firebaseUser.uid) {
            console.log('[Auth Log] Deleting orphaned Firestore user doc by username match:', docSnap.id);
            await deleteDoc(doc(db, 'users', docSnap.id)).catch(() => {});
          }
        }
      }
    } catch (cleanupErr) {
      console.warn('[Auth Log] Orphan cleanup warning:', cleanupErr);
    }

    // 4. Update Auth display name
    await updateAuthProfile(firebaseUser, {
      displayName: input.name.trim()
    }).catch((pErr) => console.warn('[Auth Log] Auth profile update error:', pErr));

    // 5. Send email verification
    await sendEmailVerification(firebaseUser).catch((vErr) => console.warn('[Auth Log] sendEmailVerification warning:', vErr));

    // 6. Create user document in Firestore users/{firebaseUser.uid}
    const userProfileData: UserProfile = {
      id: firebaseUser.uid,
      name: input.name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
      coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1200',
      bio: `Warga SMK Multi Karya (${input.userType || 'Siswa'})`,
      userType: input.userType || 'Siswa',
      role: 'USER',
      kelas: input.kelas,
      jurusan: input.jurusan,
      mataPelajaran: input.mataPelajaran,
      divisi: input.divisi,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
      emailVerified: false,
      hasCompletedUsername: true,
      followingIds: [],
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      storiesCount: 0,
      musicRequestsCount: 0
    };

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userDocRef, {
      ...userProfileData,
      uid: firebaseUser.uid,
      displayName: input.name.trim(),
      displayNameLower: input.name.trim().toLowerCase(),
      usernameLower: cleanUsername,
      accountStatus: 'active',
      isPrivate: false,
      emailVerified: false,
      hasCompletedUsername: true,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: 'Email verifikasi telah dikirim. Silakan periksa inbox atau folder spam.',
      user: userProfileData
    };

  } catch (error: any) {
    console.error("REGISTER ERROR CODE:", error?.code);
    console.error("REGISTER ERROR MESSAGE:", error?.message);

    let msg = 'Gagal mendaftar. Silakan coba lagi.';
    if (error?.code === 'auth/email-already-in-use') {
      msg = 'Email sudah terdaftar. Silakan login.';
    } else if (error?.code === 'auth/invalid-email') {
      msg = 'Format email tidak valid.';
    } else if (error?.code === 'auth/weak-password') {
      msg = 'Password minimal 8 karakter.';
    } else if (error?.code === 'auth/network-request-failed') {
      msg = 'Koneksi internet bermasalah. Silakan coba lagi.';
    } else if (error?.code === 'auth/operation-not-allowed') {
      msg = 'Pendaftaran Email/Password belum diaktifkan di Firebase.';
    } else if (error?.code === 'auth/too-many-requests') {
      msg = 'Terlalu banyak percobaan. Silakan coba beberapa saat lagi.';
    } else if (error?.code) {
      msg = `Registrasi gagal: [${error.code}]`;
    } else if (error?.message) {
      msg = `Registrasi gagal: ${error.message}`;
    }

    return { success: false, message: msg };
  }
}

/**
 * Login with Firebase Auth (supports Email or Username)
 */
export async function loginWithFirebase(
  emailOrUsername: string,
  pass: string,
  rememberMe: boolean = true
): Promise<{
  success: boolean;
  message?: string;
  user?: UserProfile;
  needsVerification?: boolean;
  isSuspended?: boolean;
  mustChangeAdminPassword?: boolean;
}> {
  try {
    const cleanInput = emailOrUsername.toLowerCase().trim();
    let emailToAuth = cleanInput;
    let foundDocData: any = null;
    let foundDocUid: string | null = null;

    console.log('[Auth Log] --- Login Attempt Started ---');
    console.log('[Auth Log] Input identifier:', cleanInput, 'RememberMe:', rememberMe);

    // Configure session persistence based on "Remember Me"
    const persistenceMode = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceMode).catch((pErr) => {
      console.warn('[Auth Log] Could not set persistence:', pErr);
    });

    const isAdminIdentifier = cleanInput === 'rizalapp' || cleanInput === 'rizalapp@smkmultikarya.sch.id';

    // 1. Look up user by usernameLower or email in Firestore
    const usersRef = collection(db, 'users');
    let q;
    if (cleanInput.includes('@')) {
      q = query(usersRef, where('email', '==', cleanInput));
    } else {
      q = query(usersRef, where('usernameLower', '==', cleanInput));
    }

    let snapshot: any = null;
    try {
      snapshot = await getDocs(q);
    } catch (dbErr: any) {
      console.warn('[Auth Log] Firestore lookup query error (offline/network):', dbErr?.message);
    }

    if (snapshot && !snapshot.empty) {
      foundDocData = snapshot.docs[0].data();
      foundDocUid = snapshot.docs[0].id;
      emailToAuth = foundDocData.email || (isAdminIdentifier ? 'rizalapp@smkmultikarya.sch.id' : `${cleanInput}@smkmultikarya.sch.id`);
      console.log('[Auth Log] Firestore user document matched! UID:', foundDocUid, 'Email:', emailToAuth, 'Role:', foundDocData.role);
    } else {
      if (isAdminIdentifier) {
        emailToAuth = 'rizalapp@smkmultikarya.sch.id';
        console.log('[Auth Log] Identified admin account "rizalapp". Default auth email:', emailToAuth);
      } else {
        console.warn('[Auth Log] Authentication failed: Username/email not registered.');
        return {
          success: false,
          message: 'Username atau password salah.'
        };
      }
    }

    // Check account status if user doc exists
    if (foundDocData) {
      const statusStr = (foundDocData.accountStatus || foundDocData.status || '').toLowerCase();
      if (statusStr === 'suspended') {
        console.warn('[Auth Log] Account is suspended for UID:', foundDocUid);
        return {
          success: false,
          isSuspended: true,
          message: 'Akun Anda sedang ditangguhkan (Suspended).'
        };
      }
    }

    // 2. Authenticate with Firebase Auth
    let firebaseUser: FirebaseUser | null = null;
    let authError: any = null;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailToAuth, pass);
      firebaseUser = userCredential.user;
      console.log('[Auth Log] Firebase signInWithEmailAndPassword succeeded. Auth UID:', firebaseUser.uid);
    } catch (err: any) {
      authError = err;
      console.warn('[Auth Log] Firebase signInWithEmailAndPassword failed. Code:', err?.code, 'Message:', err?.message);
    }

    // 3. Admin Provisioning & Verification Logic for 'rizalapp'
    if (!firebaseUser && isAdminIdentifier) {
      const isInitialAdminPass = (pass === '1902');

      if (isInitialAdminPass) {
        console.log('[Auth Log] Admin initial password (1902) attempted.');

        try {
          const createCred = await createUserWithEmailAndPassword(auth, 'rizalapp@smkmultikarya.sch.id', '1902');
          firebaseUser = createCred.user;
          console.log('[Auth Log] Successfully created admin user in Firebase Auth. UID:', firebaseUser.uid);
        } catch (createErr: any) {
          console.warn('[Auth Log] Firebase Auth createUser failed. Code:', createErr?.code, createErr?.message);
          if (createErr?.code === 'auth/email-already-in-use') {
            return {
              success: false,
              message: 'Username atau password salah.'
            };
          }
        }
      } else {
        console.warn('[Auth Log] Invalid password for admin rizalapp.');
        return { success: false, message: 'Username atau password salah.' };
      }
    } else if (!firebaseUser) {
      console.warn('[Auth Log] User authentication failed for email/username:', cleanInput);
      return { success: false, message: 'Username atau password salah.' };
    }

    // 4. Construct & Verify User Profile
    const activeUid = firebaseUser ? firebaseUser.uid : (foundDocUid || 'admin_rizalapp_uid');
    const userDocRef = doc(db, 'users', activeUid);
    let userSnap: any = null;
    try {
      userSnap = await getDoc(userDocRef);
    } catch (snapErr: any) {
      console.warn('[Auth Log] Firestore getDoc profile error (offline/network):', snapErr?.message);
    }

    let userProfile: UserProfile;

    if (userSnap && userSnap.exists()) {
      const data = userSnap.data();
      const rawRole = (data.role || '').toUpperCase();
      const userRole: UserRole = (rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN' || isAdminIdentifier) ? 'ADMIN' : 'USER';

      userProfile = {
        id: activeUid,
        name: data.name || data.displayName || (isAdminIdentifier ? 'Rizal App (Admin)' : 'Warga MKVERSE'),
        username: data.username || (isAdminIdentifier ? 'rizalapp' : 'user'),
        email: data.email || (firebaseUser ? firebaseUser.email || '' : 'rizalapp@smkmultikarya.sch.id'),
        avatar: data.avatar || (isAdminIdentifier ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300' : `https://api.dicebear.com/7.x/bottts/svg?seed=${activeUid}`),
        coverImage: data.coverImage,
        bio: data.bio || (isAdminIdentifier ? 'Administrator Resmi MKVERSE SMK Multi Karya Medan' : 'Warga SMK Multi Karya Medan'),
        userType: data.userType || (isAdminIdentifier ? 'Guru/Staf' : 'Siswa'),
        role: userRole,
        kelas: data.kelas,
        jurusan: data.jurusan,
        mataPelajaran: data.mataPelajaran,
        divisi: data.divisi,
        status: data.accountStatus === 'suspended' || data.status === 'Suspended' ? 'Suspended' : 'Active',
        createdAt: data.createdAt || new Date().toISOString().split('T')[0],
        hasCompletedUsername: true,
        mustChangePassword: false,
        followingIds: data.followingIds || [],
        followersCount: data.followersCount || 0,
        followingCount: data.followingCount || 0,
        postsCount: data.postsCount || 0,
        storiesCount: data.storiesCount || 0,
        musicRequestsCount: data.musicRequestsCount || 0
      };

      // Ensure Firestore doc has admin role and usernameLower
      if (isAdminIdentifier && (data.role !== 'ADMIN' || data.usernameLower !== 'rizalapp' || data.mustChangePassword === true)) {
        await updateDoc(userDocRef, {
          role: 'ADMIN',
          username: 'rizalapp',
          usernameLower: 'rizalapp',
          accountStatus: 'active',
          mustChangePassword: false,
          updatedAt: serverTimestamp()
        }).catch(() => {});
      }
    } else {
      // Create user profile doc if missing
      const roleStr: UserRole = isAdminIdentifier ? 'ADMIN' : 'USER';

      userProfile = {
        id: activeUid,
        name: isAdminIdentifier ? 'Rizal App (Admin)' : (firebaseUser?.displayName || 'Warga MKVERSE'),
        username: isAdminIdentifier ? 'rizalapp' : (firebaseUser?.email?.split('@')[0] || 'user').toLowerCase(),
        email: firebaseUser ? (firebaseUser.email || '') : 'rizalapp@smkmultikarya.sch.id',
        avatar: isAdminIdentifier ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300' : (firebaseUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeUid}`),
        bio: isAdminIdentifier ? 'Administrator Resmi MKVERSE SMK Multi Karya Medan' : 'Warga SMK Multi Karya Medan',
        userType: isAdminIdentifier ? 'Guru/Staf' : 'Siswa',
        role: roleStr,
        status: 'Active',
        createdAt: new Date().toISOString().split('T')[0],
        hasCompletedUsername: true,
        mustChangePassword: false,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        storiesCount: 0,
        musicRequestsCount: 0
      };

      if (firebaseUser) {
        await setDoc(userDocRef, {
          ...userProfile,
          uid: activeUid,
          displayName: userProfile.name,
          displayNameLower: userProfile.name.toLowerCase(),
          usernameLower: userProfile.username.toLowerCase(),
          role: roleStr,
          accountStatus: 'active',
          isPrivate: false,
          emailVerified: isAdminIdentifier ? true : firebaseUser.emailVerified,
          mustChangePassword: false,
          hasCompletedUsername: true,
          updatedAt: serverTimestamp()
        }).catch(() => {});
      }
    }

    // Role Verification
    if (isAdminIdentifier && userProfile.role !== 'ADMIN') {
      console.warn('[Auth Log] User role verification failed for admin account.');
      return { success: false, message: 'Akses ditolak. Akun Anda bukan Admin.' };
    }

    console.log('[Auth Log] Login successful! User:', userProfile.username, 'Role:', userProfile.role);

    return {
      success: true,
      user: userProfile
    };

  } catch (error: any) {
    console.error('[Auth Log] Exception in loginWithFirebase:', error?.code, error?.message);
    return { success: false, message: 'Username atau password salah.' };
  }
}

/**
 * Resend Email Verification
 */
export async function resendEmailVerification(): Promise<{ success: boolean; message: string }> {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, message: 'User tidak aktif.' };
    await sendEmailVerification(user);
    return { success: true, message: 'Email verifikasi berhasil dikirim.' };
  } catch (err: any) {
    console.error('Resend verification error:', err);
    return { success: false, message: 'Gagal mengirim ulang email verifikasi. Coba lagi dalam beberapa saat.' };
  }
}

/**
 * Check if current Auth user verified email
 */
export async function checkEmailVerified(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  await user.reload();
  
  if (user.emailVerified) {
    // Update firestore document
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, { emailVerified: true }).catch(() => {});
  }
  return user.emailVerified;
}

/**
 * Send Password Reset Email
 */
export async function sendPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      return { success: false, message: 'Silakan masukkan email yang terdaftar.' };
    }
    await sendPasswordResetEmail(auth, cleanEmail);
    return {
      success: true,
      message: 'Link reset password telah dikirim ke email Anda. Periksa inbox dan folder spam.'
    };
  } catch (err: any) {
    console.error('Password reset error:', err);
    if (err?.code === 'auth/invalid-email') {
      return { success: false, message: 'Format email tidak valid.' };
    }
    return {
      success: true,
      message: 'Jika email tersebut terdaftar di MKVERSE, kami telah mengirimkan link reset password. Silakan periksa inbox atau folder spam Anda.'
    };
  }
}

/**
 * Sign out from Firebase
 */
export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Google Sign In with Firebase
 */
export async function loginWithGoogle(rememberMe: boolean = true): Promise<{ 
  success: boolean; 
  user?: UserProfile; 
  needsUsernameSetup?: boolean;
  message?: string;
}> {
  try {
    const persistenceMode = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceMode).catch((pErr) => {
      console.warn('[Auth Log] Could not set Google auth persistence:', pErr);
    });

    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userDocRef);

    let userProfile: UserProfile;
    let needsUsernameSetup = false;

    if (userSnap.exists()) {
      const data = userSnap.data();
      
      const hasUsername = Boolean(data.username && data.username.trim() !== '');
      if (!hasUsername || data.hasCompletedUsername === false) {
        needsUsernameSetup = true;
      }

      userProfile = {
        id: data.id || firebaseUser.uid,
        name: data.name || data.displayName || firebaseUser.displayName || 'Warga MKVERSE',
        username: data.username || '',
        email: data.email || firebaseUser.email || '',
        avatar: data.avatar || firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${firebaseUser.uid}`,
        coverImage: data.coverImage,
        bio: data.bio || 'Warga SMK Multi Karya Medan',
        userType: data.userType || 'Siswa',
        role: (data.role?.toUpperCase() === 'ADMIN' || data.role?.toUpperCase() === 'SUPER_ADMIN') ? 'ADMIN' : 'USER',
        status: data.accountStatus === 'suspended' || data.status === 'Suspended' ? 'Suspended' : 'Active',
        createdAt: data.createdAt || new Date().toISOString().split('T')[0],
        emailVerified: true, // Google email is verified
        hasCompletedUsername: !needsUsernameSetup,
        followersCount: data.followersCount || 0,
        followingCount: data.followingCount || 0,
        postsCount: data.postsCount || 0,
        storiesCount: data.storiesCount || 0,
        musicRequestsCount: data.musicRequestsCount || 0
      };

      // Ensure emailVerified in firestore is true
      if (!data.emailVerified) {
        await updateDoc(userDocRef, { emailVerified: true }).catch(() => {});
      }
    } else {
      // First time Google User or link with existing email account
      const cleanEmail = (firebaseUser.email || '').toLowerCase().trim();
      let existingUid: string | null = null;

      if (cleanEmail) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', cleanEmail));
        const emailSnap = await getDocs(q);
        if (!emailSnap.empty) {
          existingUid = emailSnap.docs[0].id;
        }
      }

      if (existingUid && existingUid !== firebaseUser.uid) {
        // Use existing Firestore document
        const existingDocRef = doc(db, 'users', existingUid);
        const existingSnap = await getDoc(existingDocRef);
        if (existingSnap.exists()) {
          const data = existingSnap.data();
          const hasUsername = Boolean(data.username && data.username.trim() !== '');
          if (!hasUsername || data.hasCompletedUsername === false) {
            needsUsernameSetup = true;
          }

          userProfile = {
            id: existingUid,
            name: data.name || firebaseUser.displayName || 'Warga MKVERSE',
            username: data.username || '',
            email: data.email || firebaseUser.email || '',
            avatar: data.avatar || firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${existingUid}`,
            bio: data.bio || 'Warga SMK Multi Karya Medan',
            userType: data.userType || 'Siswa',
            role: (data.role?.toUpperCase() === 'ADMIN' || data.role?.toUpperCase() === 'SUPER_ADMIN') ? 'ADMIN' : 'USER',
            status: data.accountStatus === 'suspended' ? 'Suspended' : 'Active',
            createdAt: data.createdAt || new Date().toISOString().split('T')[0],
            emailVerified: true,
            hasCompletedUsername: !needsUsernameSetup,
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
            postsCount: data.postsCount || 0,
            storiesCount: data.storiesCount || 0,
            musicRequestsCount: data.musicRequestsCount || 0
          };
        } else {
          needsUsernameSetup = true;
          userProfile = createInitialGoogleProfile(firebaseUser);
          await setDoc(userDocRef, userProfileToFirestoreDoc(userProfile, firebaseUser));
        }
      } else {
        // Create new users/{uid} document with exact schema requested
        needsUsernameSetup = true;
        userProfile = createInitialGoogleProfile(firebaseUser);
        await setDoc(userDocRef, userProfileToFirestoreDoc(userProfile, firebaseUser));
      }
    }

    return { 
      success: true, 
      user: userProfile,
      needsUsernameSetup
    };
  } catch (err: any) {
    console.error('Google Sign-In Error:', err);
    return { success: false, message: 'Gagal masuk dengan Akun Google.' };
  }
}

/**
 * Helper to construct initial Google profile
 */
function createInitialGoogleProfile(firebaseUser: FirebaseUser): UserProfile {
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'Warga MKVERSE',
    username: '',
    email: firebaseUser.email || '',
    avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${firebaseUser.uid}`,
    bio: 'Warga SMK Multi Karya Medan',
    userType: 'Siswa',
    role: 'USER',
    status: 'Active',
    createdAt: new Date().toISOString().split('T')[0],
    emailVerified: true,
    hasCompletedUsername: false,
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    storiesCount: 0,
    musicRequestsCount: 0
  };
}

/**
 * Helper to construct Firestore document object for Google User
 */
function userProfileToFirestoreDoc(userProfile: UserProfile, firebaseUser: FirebaseUser) {
  return {
    uid: firebaseUser.uid,
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || userProfile.name,
    displayNameLower: (firebaseUser.displayName || userProfile.name).toLowerCase(),
    name: userProfile.name,
    username: '',
    usernameLower: '',
    photoURL: firebaseUser.photoURL || userProfile.avatar,
    avatar: userProfile.avatar,
    bio: userProfile.bio,
    userType: userProfile.userType,
    role: 'user', // "user" as specified in prompt section 2
    accountStatus: 'active',
    status: 'Active',
    isPrivate: false,
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    emailVerified: true,
    hasCompletedUsername: false,
    createdAt: userProfile.createdAt,
    updatedAt: serverTimestamp()
  };
}

/**
 * Complete Google User Profile with custom username
 */
export async function completeGoogleUsername(
  uid: string,
  rawUsername: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const cleanUsername = rawUsername.toLowerCase().replace(/[^a-z0-9_.]/g, '').trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, message: 'Username minimal 3 karakter.' };
    }

    // Check if username is already taken
    const taken = await isUsernameTaken(cleanUsername);
    if (taken) {
      return { success: false, message: 'Username sudah digunakan. Silakan pilih username lain.' };
    }

    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      username: cleanUsername,
      usernameLower: cleanUsername,
      hasCompletedUsername: true,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (err: any) {
    console.error('Complete Google Username Error:', err);
    return { success: false, message: 'Gagal menyimpan username. Coba lagi.' };
  }
}

/**
 * Update Admin Password on First Login
 */
export async function updateAdminPassword(newPassword: string): Promise<{ success: boolean; message?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('[Auth Log] updateAdminPassword called but auth.currentUser is null.');
      return { 
        success: false, 
        message: 'Tidak ada sesi login aktif. Silakan login terlebih dahulu.' 
      };
    }

    if (newPassword.length < 8) {
      return { success: false, message: 'Password minimal 8 karakter.' };
    }

    // Try updating password in Firebase Authentication
    try {
      await updateAuthPassword(user, newPassword);
      console.log('[Auth Log] updateAuthPassword succeeded for user:', user.uid);
    } catch (passErr: any) {
      console.warn('[Auth Log] updateAuthPassword error:', passErr?.code, passErr?.message);

      if (passErr?.code === 'auth/requires-recent-login') {
        console.log('[Auth Log] auth/requires-recent-login encountered. Attempting reauth with initial password 1902...');
        try {
          const cred = EmailAuthProvider.credential(user.email || 'rizalapp@smkmultikarya.sch.id', '1902');
          await reauthenticateWithCredential(user, cred);
          await updateAuthPassword(user, newPassword);
          console.log('[Auth Log] Reauth & updateAuthPassword succeeded!');
        } catch (reauthErr: any) {
          console.error('[Auth Log] Reauth failed:', reauthErr?.code, reauthErr?.message);
          return { 
            success: false, 
            message: 'Demi keamanan, akun perlu dikonfirmasi kembali sebelum password dapat diubah.' 
          };
        }
      } else if (passErr?.code === 'auth/weak-password') {
        return { success: false, message: 'Password terlalu lemah. Minimal 8 karakter.' };
      } else if (passErr?.code === 'auth/network-request-failed') {
        return { success: false, message: 'Koneksi bermasalah. Silakan coba lagi.' };
      } else if (passErr?.code === 'auth/invalid-credential') {
        return { success: false, message: 'Kredensial tidak valid. Silakan coba lagi.' };
      } else if (passErr?.code === 'auth/user-token-expired') {
        return { success: false, message: 'Autentikasi telah berakhir. Silakan login kembali.' };
      } else {
        return {
          success: false,
          message: passErr?.message ? `Gagal mengubah password: ${passErr.message}` : 'Gagal mengubah password. Silakan coba lagi.'
        };
      }
    }

    // Update Firestore user document: set mustChangePassword = false
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        mustChangePassword: false,
        updatedAt: serverTimestamp()
      });
      console.log('[Auth Log] Firestore user doc updated mustChangePassword = false for UID:', user.uid);
    } catch (dbErr: any) {
      console.warn('[Auth Log] updateDoc mustChangePassword error, attempting setDoc merge:', dbErr);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { mustChangePassword: false }, { merge: true });
      } catch (mergeErr) {
        console.warn('[Auth Log] setDoc merge error:', mergeErr);
      }
    }

    // Also update any matching user doc by email or username if UID differed
    try {
      const adminQ = query(collection(db, 'users'), where('usernameLower', '==', 'rizalapp'));
      const adminSnap = await getDocs(adminQ);
      for (const adminDoc of adminSnap.docs) {
        await updateDoc(doc(db, 'users', adminDoc.id), { mustChangePassword: false, updatedAt: serverTimestamp() }).catch(() => {});
      }
    } catch (qErr) {
      console.warn('[Auth Log] Non-critical admin username search error:', qErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Auth Log] Update Admin Password Exception:', err?.code, err?.message);
    if (err?.code === 'auth/network-request-failed') {
      return { success: false, message: 'Koneksi bermasalah. Silakan coba lagi.' };
    }
    if (err?.code === 'auth/user-token-expired') {
      return { success: false, message: 'Autentikasi telah berakhir. Silakan login kembali.' };
    }
    return { 
      success: false, 
      message: err?.message ? `Gagal mengubah password: ${err.message}` : 'Gagal mengubah password. Silakan coba lagi.' 
    };
  }
}

