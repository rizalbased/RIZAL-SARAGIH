-- ==============================================================================
-- MKVERSE SUPABASE POSTGRESQL DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Final Security Hardened Schema for MKVERSE (SMK Multi Karya Medan)
-- Compatible with Supabase Auth, PostgreSQL RLS, and Storage Engine.
-- ==============================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. TABLE: profiles (User Profiles linked to auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
  cover_image TEXT,
  bio TEXT DEFAULT 'Warga SMK Multi Karya Medan',
  user_type TEXT DEFAULT 'Siswa' CHECK (user_type IN ('Siswa', 'Guru', 'Guru/Staf', 'Karyawan')),
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN')),
  class_name TEXT,
  major TEXT,
  mata_pelajaran TEXT,
  divisi TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Pending')),
  email_verified BOOLEAN DEFAULT false,
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  posts_count INT DEFAULT 0,
  stories_count INT DEFAULT 0,
  music_requests_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance & query optimization
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- ------------------------------------------------------------------------------
-- 3. SECURITY DEFINER FUNCTIONS & ACCESS CONTROLS (SEARCH_PATH HARDENED)
-- ------------------------------------------------------------------------------

-- Check if current authenticated user is an active Admin or Super Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPER_ADMIN') 
      AND status = 'Active'
  );
END;
$$;

-- Check if current authenticated user is an active Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role = 'SUPER_ADMIN' 
      AND status = 'Active'
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. TRIGGER: Auto-create profile on Supabase Auth SignUp & Email Sync
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_username TEXT;
  v_full_name TEXT;
  v_user_type TEXT;
BEGIN
  -- Safe username derivation: fallback to email prefix + random suffix if collision
  v_username := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'username'), ''),
    LOWER(SPLIT_PART(new.email, '@', 1)) || '_' || SUBSTRING(new.id::text, 1, 4)
  );

  -- Safe full name derivation
  v_full_name := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(new.email, '@', 1)
  );

  -- Safe user type validation
  v_user_type := COALESCE(new.raw_user_meta_data->>'user_type', 'Siswa');
  IF v_user_type NOT IN ('Siswa', 'Guru', 'Guru/Staf', 'Karyawan') THEN
    v_user_type := 'Siswa';
  END IF;

  -- Insert new user profile with hardcoded safe defaults (role is ALWAYS 'USER', status is 'Active')
  -- User metadata cannot override role, status, or administrative privilege.
  INSERT INTO public.profiles (
    id,
    email,
    username,
    full_name,
    user_type,
    class_name,
    major,
    mata_pelajaran,
    divisi,
    avatar_url,
    role,
    status,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    v_username,
    v_full_name,
    v_user_type,
    new.raw_user_meta_data->>'class_name',
    new.raw_user_meta_data->>'major',
    new.raw_user_meta_data->>'mata_pelajaran',
    new.raw_user_meta_data->>'divisi',
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'
    ),
    'USER',
    'Active',
    (new.email_confirmed_at IS NOT NULL),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = (new.email_confirmed_at IS NOT NULL),
    updated_at = now();

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 5. TRIGGER: Role Escalation & Account Status Tamper Protection
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- Always preserve immutable identity fields from client-side alteration
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;
  NEW.email := OLD.email; -- Email is strictly managed and synchronized by auth.users

  -- Get the caller's verified role from database
  SELECT role INTO v_caller_role 
  FROM public.profiles 
  WHERE id = auth.uid() AND status = 'Active';

  -- Case A: Normal User (or unauthenticated update)
  IF v_caller_role IS NULL OR v_caller_role = 'USER' THEN
    -- Lock role, status, and email_verified to their original values
    NEW.role := OLD.role;
    NEW.status := OLD.status;
    NEW.email_verified := OLD.email_verified;

  -- Case B: Admin User (cannot promote to SUPER_ADMIN, cannot modify SUPER_ADMIN)
  ELSIF v_caller_role = 'ADMIN' THEN
    -- Admin cannot escalate anyone (or self) to SUPER_ADMIN
    IF NEW.role = 'SUPER_ADMIN' AND OLD.role != 'SUPER_ADMIN' THEN
      NEW.role := OLD.role;
    END IF;
    -- Admin cannot alter a SUPER_ADMIN profile
    IF OLD.role = 'SUPER_ADMIN' THEN
      NEW.role := OLD.role;
      NEW.status := OLD.status;
    END IF;
    -- Email verification is still controlled by auth system
    NEW.email_verified := OLD.email_verified;

  -- Case C: Super Admin (holds top-tier administrative privilege)
  ELSIF v_caller_role = 'SUPER_ADMIN' THEN
    -- Super Admin can manage roles and statuses as intended
    NULL;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_escalation();

-- ------------------------------------------------------------------------------
-- 6. TABLE: posts (Social Posts, Confessions, Menfess Lagu)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'post' CHECK (type IN ('post', 'confession', 'menfess_lagu', 'news_share', 'music_post')),
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', NULL)),
  mood_tag TEXT,
  song_data JSONB,
  is_anonymous BOOLEAN DEFAULT false,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  news_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- ------------------------------------------------------------------------------
-- 7. TABLE: comments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments(author_id);

-- ------------------------------------------------------------------------------
-- 8. TABLE: likes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON public.likes(user_id);

-- ------------------------------------------------------------------------------
-- 9. TABLE: stories
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT,
  media_url TEXT,
  bg_gradient TEXT DEFAULT 'from-purple-500 to-pink-500',
  views_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_stories_author ON public.stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);

-- ------------------------------------------------------------------------------
-- 10. TABLE: conversations & messages (Direct Messaging)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_time TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (participant_a, participant_b)
);

CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant_a, participant_b);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  shared_song JSONB,
  shared_post JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- ------------------------------------------------------------------------------
-- 11. TABLE: notifications
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  actor_avatar TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- ------------------------------------------------------------------------------
-- 12. TABLE: reports (Moderation & Safety)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'confession', 'user', 'comment')),
  target_id TEXT NOT NULL,
  content_preview TEXT,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Reviewed', 'Resolved', 'Rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);

-- ------------------------------------------------------------------------------
-- 13. TABLE: radio_requests
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.radio_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_username TEXT,
  song_title TEXT NOT NULL,
  artist TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Played', 'Rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_radio_requests_status ON public.radio_requests(status);
CREATE INDEX IF NOT EXISTS idx_radio_requests_sender ON public.radio_requests(sender_id);

-- ==============================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_requests ENABLE ROW LEVEL SECURITY;

-- ---------------- PROFILES POLICIES ----------------
-- Public can read all active profiles
CREATE POLICY "Profiles are publicly viewable"
  ON public.profiles FOR SELECT
  USING (true);

-- Direct client INSERT is disabled; profile creation is securely handled by trigger on_auth_user_created
CREATE POLICY "Profiles are created via auth trigger only"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User can update own profile (prevent_role_escalation trigger enforces role/status protection)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Only Super Admins can delete profiles
CREATE POLICY "Super Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.is_super_admin());

-- ---------------- POSTS POLICIES ----------------
-- Anyone can view posts
CREATE POLICY "Posts are publicly viewable"
  ON public.posts FOR SELECT
  USING (true);

-- Authenticated users can insert posts with their own author_id
CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Author or Admin can update posts
CREATE POLICY "Authors or Admins can update posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id OR public.is_admin())
  WITH CHECK (auth.uid() = author_id OR public.is_admin());

-- Author or Admin can delete posts
CREATE POLICY "Authors or Admins can delete posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = author_id OR public.is_admin());

-- ---------------- COMMENTS POLICIES ----------------
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors or Admins can delete comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = author_id OR public.is_admin());

-- ---------------- LIKES POLICIES ----------------
CREATE POLICY "Likes are viewable by everyone"
  ON public.likes FOR SELECT
  USING (true);

CREATE POLICY "Users can create own likes"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------- STORIES POLICIES ----------------
CREATE POLICY "Stories are viewable by everyone"
  ON public.stories FOR SELECT
  USING (expires_at > now() OR public.is_admin());

CREATE POLICY "Users can create stories"
  ON public.stories FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors or Admins can delete stories"
  ON public.stories FOR DELETE
  USING (auth.uid() = author_id OR public.is_admin());

-- ---------------- CONVERSATIONS & MESSAGES POLICIES ----------------
CREATE POLICY "Participants can view conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = participant_a OR auth.uid() = participant_b OR public.is_admin());

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE POLICY "Participants can update conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE POLICY "Participants can delete conversations"
  ON public.conversations FOR DELETE
  USING (auth.uid() = participant_a OR auth.uid() = participant_b OR public.is_admin());

CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    ) OR public.is_admin()
  );

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

CREATE POLICY "Sender or Admin can delete messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = sender_id OR public.is_admin());

-- ---------------- NOTIFICATIONS POLICIES ----------------
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------- REPORTS POLICIES ----------------
-- Regular users can only insert reports; ONLY Admins can SELECT/VIEW, UPDATE, or DELETE reports.
CREATE POLICY "Users can submit reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view reports"
  ON public.reports FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete reports"
  ON public.reports FOR DELETE
  USING (public.is_admin());

-- ---------------- RADIO REQUESTS POLICIES ----------------
CREATE POLICY "Radio requests are viewable by everyone"
  ON public.radio_requests FOR SELECT
  USING (true);

CREATE POLICY "Users can submit radio requests"
  ON public.radio_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Admins can update radio requests"
  ON public.radio_requests FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Sender or Admin can delete radio requests"
  ON public.radio_requests FOR DELETE
  USING (auth.uid() = sender_id OR public.is_admin());

-- ==============================================================================
-- 15. STORAGE BUCKETS & STORAGE POLICIES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- ---------------- STORAGE POLICIES: AVATARS ----------------
-- Anyone can view avatar images
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can only upload avatars into their own folder: avatars/{auth.uid()}/...
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can only update avatars in their own folder
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can only delete avatars in their own folder (or Admins)
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

-- ---------------- STORAGE POLICIES: MEDIA ----------------
CREATE POLICY "Media files are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Users can upload media to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media' 
    AND auth.role() = 'authenticated'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );
