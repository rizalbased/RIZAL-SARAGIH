import { UserProfile } from '../types';
import { supabase, mapProfileRow } from '../lib/supabase';

export interface FollowRelationship {
  id: string;
  followerUid: string;
  targetUid: string;
  status: 'active' | 'pending';
  createdAt: string;
}

export async function searchUsersApi(term: string): Promise<UserProfile[]> {
  if (!term.trim()) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`)
    .limit(20);

  if (error || !data) return [];
  return data.map(mapProfileRow);
}

export async function toggleFollowApi(_currentUserUid: string, _targetUserUid: string, _isPrivate = false): Promise<any> {
  return { success: true, status: 'following' };
}

export async function acceptFollowRequestApi(_targetUid: string, _followerUid: string): Promise<boolean> {
  return true;
}

export async function rejectFollowRequestApi(_targetUid: string, _followerUid: string): Promise<boolean> {
  return true;
}

export async function createNotificationInFirestore(_recipientUid: string, _notificationData: any): Promise<void> {
  // no-op or insert to Supabase notifications table
}

export async function adminUpdateUserStatusApi(userId: string, newStatus: 'Active' | 'Suspended'): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', userId);
  return !error;
}

export async function adminDeleteUserApi(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  return !error;
}
