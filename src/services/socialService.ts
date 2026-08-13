import { 
  db, 
  auth 
} from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  increment 
} from 'firebase/firestore';
import { UserProfile, NotificationItem, Post } from '../types';

export interface FollowRelationship {
  id: string;
  followerUid: string;
  targetUid: string;
  status: 'active' | 'pending';
  createdAt: string;
}

/**
 * Search users in Firestore by term (searches displayNameLower and usernameLower)
 */
export async function searchUsersFirestore(term: string): Promise<UserProfile[]> {
  const cleanTerm = term.toLowerCase().trim();
  if (!cleanTerm) return [];

  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);

  const results: UserProfile[] = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const nameLower = (data.displayNameLower || data.name || '').toLowerCase();
    const usernameLower = (data.usernameLower || data.username || '').toLowerCase();

    if (nameLower.includes(cleanTerm) || usernameLower.includes(cleanTerm)) {
      results.push({
        id: data.id || docSnap.id,
        name: data.name || data.displayName || 'Warga MKVERSE',
        username: data.username || 'user',
        email: data.email || '',
        avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${docSnap.id}`,
        coverImage: data.coverImage,
        bio: data.bio || 'Warga SMK Multi Karya Medan',
        userType: data.userType || 'Siswa',
        role: (data.role?.toUpperCase() === 'ADMIN' || data.role?.toUpperCase() === 'SUPER_ADMIN') ? 'ADMIN' : 'USER',
        kelas: data.kelas,
        jurusan: data.jurusan,
        mataPelajaran: data.mataPelajaran,
        divisi: data.divisi,
        status: data.accountStatus === 'suspended' || data.status === 'Suspended' ? 'Suspended' : 'Active',
        createdAt: data.createdAt || new Date().toISOString().split('T')[0],
        followingIds: data.followingIds || [],
        followersCount: data.followersCount || 0,
        followingCount: data.followingCount || 0,
        postsCount: data.postsCount || 0,
        storiesCount: data.storiesCount || 0,
        musicRequestsCount: data.musicRequestsCount || 0
      });
    }
  });

  return results;
}

/**
 * Toggle follow user (handles public accounts and private account follow requests)
 */
export async function toggleFollowFirestore(
  currentUid: string,
  targetUid: string,
  targetIsPrivate = false
): Promise<{ success: boolean; status: 'following' | 'unfollowed' | 'requested' }> {
  try {
    const currentUserRef = doc(db, 'users', currentUid);
    const targetUserRef = doc(db, 'users', targetUid);

    const followingRef = doc(db, 'users', currentUid, 'following', targetUid);
    const followerRef = doc(db, 'users', targetUid, 'followers', currentUid);
    const requestRef = doc(db, 'users', targetUid, 'followRequests', currentUid);

    const followingSnap = await getDoc(followingRef);
    const requestSnap = await getDoc(requestRef);

    // Get current user details for notification
    const currentUserSnap = await getDoc(currentUserRef);
    const currentUserData = currentUserSnap.data() || {};
    const currentUsername = currentUserData.username || 'user';
    const currentName = currentUserData.name || currentUserData.displayName || 'Seseorang';
    const currentAvatar = currentUserData.avatar || '';

    if (followingSnap.exists()) {
      // Already following -> UNFOLLOW
      await deleteDoc(followingRef);
      await deleteDoc(followerRef);

      // Decrement counts
      await updateDoc(currentUserRef, {
        followingCount: increment(-1),
        followingIds: (currentUserData.followingIds || []).filter((id: string) => id !== targetUid)
      }).catch(() => {});

      await updateDoc(targetUserRef, {
        followersCount: increment(-1)
      }).catch(() => {});

      return { success: true, status: 'unfollowed' };
    } else if (requestSnap.exists()) {
      // Cancel follow request
      await deleteDoc(requestRef);
      return { success: true, status: 'unfollowed' };
    } else {
      // Not following yet
      if (targetIsPrivate) {
        // Create follow request
        await setDoc(requestRef, {
          followerUid: currentUid,
          targetUid,
          followerName: currentName,
          followerUsername: currentUsername,
          followerAvatar: currentAvatar,
          status: 'pending',
          createdAt: new Date().toISOString()
        });

        // Send notification to target user
        await createNotificationInFirestore(targetUid, {
          type: 'follow',
          title: 'Permintaan Mengikuti',
          message: `@${currentUsername} meminta untuk mengikuti Anda.`,
          time: 'Baru saja',
          read: false,
          actorAvatar: currentAvatar,
          actorUid: currentUid,
          isRequest: true
        });

        return { success: true, status: 'requested' };
      } else {
        // Direct follow
        await setDoc(followingRef, {
          targetUid,
          createdAt: new Date().toISOString()
        });

        await setDoc(followerRef, {
          followerUid: currentUid,
          createdAt: new Date().toISOString()
        });

        const updatedFollowing = [...(currentUserData.followingIds || []), targetUid];

        await updateDoc(currentUserRef, {
          followingCount: increment(1),
          followingIds: updatedFollowing
        }).catch(() => {});

        await updateDoc(targetUserRef, {
          followersCount: increment(1)
        }).catch(() => {});

        // Send notification to target user
        await createNotificationInFirestore(targetUid, {
          type: 'follow',
          title: 'Pengikut Baru',
          message: `@${currentUsername} mulai mengikuti Anda.`,
          time: 'Baru saja',
          read: false,
          actorAvatar: currentAvatar,
          actorUid: currentUid
        });

        return { success: true, status: 'following' };
      }
    }
  } catch (error) {
    console.error('Toggle Follow Error:', error);
    return { success: false, status: 'unfollowed' };
  }
}

/**
 * Accept follow request
 */
export async function acceptFollowRequestFirestore(
  targetUid: string, // the user who received the request
  followerUid: string // the user who sent the request
): Promise<boolean> {
  try {
    const requestRef = doc(db, 'users', targetUid, 'followRequests', followerUid);
    await deleteDoc(requestRef);

    const followingRef = doc(db, 'users', followerUid, 'following', targetUid);
    const followerRef = doc(db, 'users', targetUid, 'followers', followerUid);

    await setDoc(followingRef, { targetUid, createdAt: new Date().toISOString() });
    await setDoc(followerRef, { followerUid, createdAt: new Date().toISOString() });

    const followerUserRef = doc(db, 'users', followerUid);
    const targetUserRef = doc(db, 'users', targetUid);

    const followerSnap = await getDoc(followerUserRef);
    const followerData = followerSnap.data() || {};

    await updateDoc(followerUserRef, {
      followingCount: increment(1),
      followingIds: [...(followerData.followingIds || []), targetUid]
    }).catch(() => {});

    await updateDoc(targetUserRef, {
      followersCount: increment(1)
    }).catch(() => {});

    // Get target username for notification
    const targetSnap = await getDoc(targetUserRef);
    const targetUsername = targetSnap.data()?.username || 'user';

    // Notify follower
    await createNotificationInFirestore(followerUid, {
      type: 'follow',
      title: 'Permintaan Diterima',
      message: `@${targetUsername} menerima permintaan mengikuti Anda.`,
      time: 'Baru saja',
      read: false
    });

    return true;
  } catch (err) {
    console.error('Accept follow request error:', err);
    return false;
  }
}

/**
 * Reject follow request
 */
export async function rejectFollowRequestFirestore(
  targetUid: string,
  followerUid: string
): Promise<boolean> {
  try {
    const requestRef = doc(db, 'users', targetUid, 'followRequests', followerUid);
    await deleteDoc(requestRef);
    return true;
  } catch (err) {
    console.error('Reject follow request error:', err);
    return false;
  }
}

/**
 * Create a notification in Firestore
 */
export async function createNotificationInFirestore(
  recipientUid: string,
  notification: Omit<NotificationItem, 'id'> & { actorUid?: string; isRequest?: boolean }
): Promise<void> {
  try {
    const notifRef = doc(collection(db, 'users', recipientUid, 'notifications'));
    await setDoc(notifRef, {
      ...notification,
      id: notifRef.id,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error('Create notification error:', err);
  }
}

/**
 * Admin: Suspend or Activate user
 */
export async function adminUpdateUserStatus(
  targetUid: string,
  status: 'active' | 'suspended'
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', targetUid);
    await updateDoc(userRef, {
      accountStatus: status,
      status: status === 'suspended' ? 'Suspended' : 'Active',
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('Admin update status error:', err);
    return false;
  }
}

/**
 * Admin: Permanent Delete User and associated data from Firestore
 */
export async function adminDeleteUserFirestore(targetUid: string): Promise<boolean> {
  try {
    // 1. Delete user document from Firestore
    const userRef = doc(db, 'users', targetUid);
    await deleteDoc(userRef);

    // 2. Query and delete user's posts
    const postsRef = collection(db, 'posts');
    const qPosts = query(postsRef, where('authorId', '==', targetUid));
    const postsSnap = await getDocs(qPosts);
    postsSnap.forEach(pDoc => {
      deleteDoc(pDoc.ref).catch(() => {});
    });

    return true;
  } catch (err) {
    console.error('Admin delete user error:', err);
    return false;
  }
}
