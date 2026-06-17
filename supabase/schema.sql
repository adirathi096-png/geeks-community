-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  roll_number text UNIQUE NOT NULL,
  branch text NOT NULL,
  passing_year int NOT NULL,
  email text UNIQUE NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  featured_award text,
  featured_description text,
  featured_image_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- Recursion-free helper function to check if the current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to prevent non-admins from changing their role
CREATE OR REPLACE FUNCTION public.check_profile_role_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
    IF NOT public.is_admin() THEN
      NEW.is_admin := OLD.is_admin;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER enforce_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_role_update();

-- Create a function to handle new user profile creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, roll_number, branch, passing_year, email, is_admin)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'roll_number', ''),
    COALESCE(new.raw_user_meta_data->>'branch', ''),
    COALESCE(CAST(new.raw_user_meta_data->>'passing_year' AS integer), 2026),
    new.email,
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- COMMUNITY GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.community_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  zone text NOT NULL,
  description text NOT NULL,
  whatsapp_link text DEFAULT 'Add WhatsApp Link Later',
  created_at timestamp with time zone DEFAULT now()
);

-- GROUP JOIN REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.group_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now()
);

-- Condition to prevent duplicate pending requests
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_request 
  ON public.group_join_requests (group_id, user_id) 
  WHERE status = 'pending';

-- POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.community_groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  tag text,
  image_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- IDEAS TABLE
CREATE TABLE IF NOT EXISTS public.ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  suggested_group text,
  created_at timestamp with time zone DEFAULT now()
);

-- FEATURED STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.featured_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  student_name text NOT NULL,
  achievement text NOT NULL,
  badge text,
  created_at timestamp with time zone DEFAULT now()
);

-- STREAKS TABLE
CREATE TABLE IF NOT EXISTS public.streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email text UNIQUE NOT NULL,
  full_name text,
  current_streak int DEFAULT 0,
  total_posts int DEFAULT 0,
  last_post_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now()
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- 1. profiles policies
CREATE POLICY "Allow select for authenticated" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for owner" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow update for owner or admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- 2. community_groups policies
CREATE POLICY "Allow read for all authenticated users" ON public.community_groups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin manage groups" ON public.community_groups
  FOR ALL USING (public.is_admin());

-- 3. group_join_requests policies
CREATE POLICY "Allow student insert own request" ON public.group_join_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow student read own requests or admin read all" ON public.group_join_requests
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Allow admin modify requests" ON public.group_join_requests
  FOR ALL USING (public.is_admin());

-- 4. posts policies
DROP POLICY IF EXISTS "Allow select for authenticated" ON public.posts;
DROP POLICY IF EXISTS "Allow insert for owner" ON public.posts;
DROP POLICY IF EXISTS "Allow delete for owner or admin" ON public.posts;
DROP POLICY IF EXISTS "dev_posts_select" ON public.posts;
DROP POLICY IF EXISTS "dev_posts_insert" ON public.posts;
DROP POLICY IF EXISTS "dev_posts_update" ON public.posts;
DROP POLICY IF EXISTS "dev_posts_delete" ON public.posts;

CREATE POLICY "dev_posts_select"
ON public.posts
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "dev_posts_insert"
ON public.posts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "dev_posts_update"
ON public.posts
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "dev_posts_delete"
ON public.posts
FOR DELETE
TO anon, authenticated
USING (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO anon, authenticated;

-- 5. ideas policies
CREATE POLICY "Allow select for authenticated" ON public.ideas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for owner" ON public.ideas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow delete for owner or admin" ON public.ideas
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 6. featured_students policies
CREATE POLICY "Allow select for authenticated" ON public.featured_students
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin manage featured" ON public.featured_students
  FOR ALL USING (public.is_admin());

-- 7. streaks policies
CREATE POLICY "Allow select for authenticated" ON public.streaks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for owner" ON public.streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow update for owner" ON public.streaks
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- INSERT DEFAULT COMMUNITY GROUPS
INSERT INTO public.community_groups (name, zone, description, whatsapp_link) VALUES
-- Creative Zone
('Photo Geeks', 'Creative Zone', 'A place where students share photos clicked from daily life, nature, campus, sky, and creative moments.', 'Add WhatsApp Link Later'),
('Broken Geeks', 'Creative Zone', 'A place for broken quotes, deep messages, and reality-based thoughts about life.', 'https://chat.whatsapp.com/G03Ehwg1wfZG8cgd63qDDX'),
('Literature & Philosophy', 'Creative Zone', 'A space for quotes, thoughts, famous writers, philosophy, and meaningful discussions.', 'https://chat.whatsapp.com/DIWFLAe5o4yD0rtUbRn05D'),
('Cinema Geeks', 'Creative Zone', 'A place to discuss trending movies, cinema moments, reviews, and recommendations.', 'https://chat.whatsapp.com/HgrnH9nSmOH4ffH9Tg4tia'),

-- Brain Zone
('Maths & Physics Geeks', 'Brain Zone', 'A fun zone for maths and physics equations, irony-based concepts, puzzles, and creative academic humor.', 'https://chat.whatsapp.com/LMtTHvbk2cUEZ3uK5tgebI'),
('Chess Geeks', 'Brain Zone', 'A place for chess memes, puzzles, crazy moves, and chess challenges.', 'https://chat.whatsapp.com/KSPWvo2WoZH7KCPKYqgwk2'),
('FactGeeks', 'Brain Zone', 'A group for real-life facts, interesting knowledge, and surprising information.', 'https://chat.whatsapp.com/Fur2ZJNbeMnBqnTvzCwaaP'),

-- Tech & Future Zone
('TechGeeks', 'Tech & Future Zone', 'A place to share trending AI tools, technology updates, useful apps, and future tech ideas.', 'https://chat.whatsapp.com/K63swM9EZHD2auoKKADVr7'),
('EventGeeks', 'Tech & Future Zone', 'A group for hackathons, competitions, events, opportunities, and student programs.', 'https://chat.whatsapp.com/LUuzb4A8cfj34NXcrCWYWc?mode=gi_t'),
('Geopolitics', 'Tech & Future Zone', 'A space to discuss important events happening around the world in a student-friendly way.', 'https://chat.whatsapp.com/FFDt9VLP1DE9qnJ4cVUVyy'),
('Cyber Geeks', 'Tech & Future Zone', 'A group to discuss cybersecurity, hacking, network defense, and online privacy.', 'https://chat.whatsapp.com/DtAHzx0Yc7g2mHTLwfkasO?mode=gi_t'),

-- Fun Zone
('Irony Geeks', 'Fun Zone', 'A place for jokes, irony, memes, and dark humor but keep it safe and respectful.', 'https://chat.whatsapp.com/GJczJxfDoZd9snXDeLsoWa'),
('Anime Geeks', 'Fun Zone', 'A group for anime updates, recommendations, discussions, and anime memes.', 'https://chat.whatsapp.com/FV1qQH0XJE7LU23D1RhcP2?mode=gi_t');

-- POST INTERACTIONS TABLE (Likes)
CREATE TABLE IF NOT EXISTS public.post_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  interaction_type text NOT NULL DEFAULT 'like',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(post_id, user_email, interaction_type)
);

-- COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policies for post_interactions
DROP POLICY IF EXISTS "Allow select for authenticated" ON public.post_interactions;
DROP POLICY IF EXISTS "Allow insert/delete for owner" ON public.post_interactions;

CREATE POLICY "Allow select for authenticated" ON public.post_interactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert/delete for owner" ON public.post_interactions
  FOR ALL USING (auth.uid() = user_id);

-- Policies for comments
DROP POLICY IF EXISTS "Allow select for authenticated" ON public.comments;
DROP POLICY IF EXISTS "Allow insert for owner" ON public.comments;
DROP POLICY IF EXISTS "Allow delete for owner or admin" ON public.comments;

CREATE POLICY "Allow select for authenticated" ON public.comments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for owner" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow delete for owner or admin" ON public.comments
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_interactions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO anon, authenticated;
