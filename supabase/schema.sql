
-- PulseThread Main Schema
-- Includes: Profiles, Requests, Donations, Area Stats, and the Badge System.

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Custom Types (Idempotent)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM ('PENDING', 'ACCEPTED', 'FULFILLED', 'CANCELLED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'donation_status') THEN
        CREATE TYPE donation_status AS ENUM ('EN_ROUTE', 'ARRIVED', 'MATCHED', 'DONATED', 'CANCELLED');
    END IF;
END $$;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name text,
  phone text,
  blood_type text,
  is_donor_active boolean DEFAULT false,
  last_donation_date timestamp with time zone,
  location geography(POINT),
  preferred_areas text[] DEFAULT '{}'::text[],
  expo_push_token text,
  age integer,
  weight integer, -- weight in kg
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Requests Table
CREATE TABLE IF NOT EXISTS public.requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid REFERENCES public.profiles(id) NOT NULL,
  blood_type text NOT NULL,
  units_needed int NOT NULL,
  hospital_name text,
  area text,
  location geography(POINT) NOT NULL,
  urgency text DEFAULT 'Standard',
  component_type text DEFAULT 'Whole Blood',
  scheduled_datetime timestamp with time zone,
  status request_status DEFAULT 'PENDING',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS for Requests
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Requests are viewable by everyone." ON public.requests;
CREATE POLICY "Requests are viewable by everyone." ON public.requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert requests." ON public.requests;
CREATE POLICY "Authenticated users can insert requests." ON public.requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Requesters can update their own requests." ON public.requests;
CREATE POLICY "Requesters can update their own requests." ON public.requests FOR UPDATE USING (auth.uid() = requester_id);

-- 4. Donations Table
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid REFERENCES public.requests(id) NOT NULL,
  donor_id uuid REFERENCES public.profiles(id) NOT NULL,
  status donation_status DEFAULT 'EN_ROUTE',
  timeline_logs jsonb DEFAULT '[]'::jsonb,
  cancellation_reason text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS for Donations
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Donations are viewable by involved parties." ON public.donations;
CREATE POLICY "Donations are viewable by involved parties." ON public.donations FOR SELECT USING (auth.uid() = donor_id or auth.uid() in (select requester_id from public.requests where id = request_id));

DROP POLICY IF EXISTS "Donors can accept requests." ON public.donations;
CREATE POLICY "Donors can accept requests." ON public.donations FOR INSERT WITH CHECK (auth.uid() = donor_id);

DROP POLICY IF EXISTS "Involved parties can update donations." ON public.donations;
CREATE POLICY "Involved parties can update donations." ON public.donations FOR UPDATE USING (auth.uid() = donor_id or auth.uid() in (select requester_id from public.requests where id = request_id));

-- 5. Nearby Donors Function
CREATE OR REPLACE FUNCTION get_nearby_donors(
  lat float,
  long float,
  radius_meters float
)
RETURNS SETOF public.profiles
LANGUAGE sql
AS $$
  SELECT * FROM public.profiles
  WHERE st_dwithin(
    location,
    st_point(long, lat)::geography,
    radius_meters
  )
  AND is_donor_active = true;
$$;

-- 6. Area Stats System
CREATE TABLE IF NOT EXISTS public.area_stats (
  area_name text PRIMARY KEY,
  donor_count int DEFAULT 0
);

-- RLS for Area Stats
ALTER TABLE public.area_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Area stats are viewable by everyone." ON public.area_stats;
CREATE POLICY "Area stats are viewable by everyone." ON public.area_stats FOR SELECT USING (true);

-- Area Stats Trigger Function
CREATE OR REPLACE FUNCTION public.update_area_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_areas text[];
  new_areas text[];
  area text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    old_areas := OLD.preferred_areas;
    new_areas := array[]::text[];
  ELSIF TG_OP = 'INSERT' THEN
    old_areas := array[]::text[];
    new_areas := NEW.preferred_areas;
  ELSE
    old_areas := OLD.preferred_areas;
    new_areas := NEW.preferred_areas;
  END IF;

  IF old_areas IS NULL THEN old_areas := array[]::text[]; END IF;
  IF new_areas IS NULL THEN new_areas := array[]::text[]; END IF;

  -- Decrement areas that are in old_areas but not in new_areas
  FOREACH area IN ARRAY old_areas LOOP
    IF NOT (area = ANY(new_areas)) THEN
      UPDATE public.area_stats
      SET donor_count = greatest(0, donor_count - 1)
      WHERE area_name = area;
    END IF;
  END LOOP;

  -- Increment areas that are in new_areas but not in old_areas
  FOREACH area IN ARRAY new_areas LOOP
    IF NOT (area = ANY(old_areas)) THEN
      INSERT INTO public.area_stats (area_name, donor_count)
      VALUES (area, 1)
      ON CONFLICT (area_name) DO UPDATE
      SET donor_count = public.area_stats.donor_count + 1;
    END IF;
  END LOOP;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_preferred_areas_change ON public.profiles;
CREATE TRIGGER on_profile_preferred_areas_change
  AFTER INSERT OR UPDATE OF preferred_areas OR DELETE
  ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_area_stats();

-- 7. Badge System
CREATE TABLE IF NOT EXISTS public.badges (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon_name text NOT NULL -- Lucide icon name placeholder
);

-- RLS for Badges
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Badges are viewable by everyone." ON public.badges;
CREATE POLICY "Badges are viewable by everyone." ON public.badges FOR SELECT USING (true);

-- Insert Badges
INSERT INTO public.badges (id, name, description, icon_name) VALUES
  ('account_created', 'New Joinee', 'Joined the PulseThread community.', 'CalendarRange'),
  ('profile_complete', 'Verified Profile', 'Completed all required profile information.', 'BadgeCheck'),
  ('donor_active', 'Hero Donor', 'Marked themselves as an active donor ready to help.', 'Award'),
  ('request_made', 'Help Seeker', 'Created their first blood request.', 'Megaphone'),
  ('request_accepted', 'Quick Responder', 'Accepted their first blood request.', 'Zap'),
  ('donation_successful', 'Life Saver', 'Successfully completed a blood donation.', 'HeartHandshake'),
  ('learned_request', 'Informed Requester', 'Completed the learning module on how to request blood.', 'BookOpen'),
  ('learned_donate', 'Prepared Donor', 'Completed the learning module on the donation process.', 'BookCheck'),
  ('onboarding_master', 'Community Scholar', 'Completed all onboarding and app policy modules.', 'GraduationCap')
ON CONFLICT (id) DO NOTHING;

-- User Badges Junction Table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  badge_id text REFERENCES public.badges(id) NOT NULL,
  awarded_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, badge_id)
);

-- RLS for user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User badges are viewable by everyone." ON public.user_badges;
CREATE POLICY "User badges are viewable by everyone." ON public.user_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users cannot insert their own badges" ON public.user_badges;
CREATE POLICY "Users cannot insert their own badges" ON public.user_badges FOR INSERT WITH CHECK (false); 

DROP POLICY IF EXISTS "Users cannot update their own badges" ON public.user_badges;
CREATE POLICY "Users cannot update their own badges" ON public.user_badges FOR UPDATE USING (false);

-- Helper function to safely award a badge
CREATE OR REPLACE FUNCTION public.award_badge(p_user_id uuid, p_badge_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public.user_badges (user_id, badge_id)
  VALUES (p_user_id, p_badge_id)
  ON CONFLICT (user_id, badge_id) DO NOTHING;
$$;

-- Triggers for Profiles
CREATE OR REPLACE FUNCTION public.check_profile_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.award_badge(NEW.id, 'account_created');
  
  IF NEW.full_name IS NOT NULL AND NEW.phone IS NOT NULL AND NEW.blood_type IS NOT NULL THEN
    PERFORM public.award_badge(NEW.id, 'profile_complete');
  END IF;
  
  IF NEW.is_donor_active = true THEN
    PERFORM public.award_badge(NEW.id, 'donor_active');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_badge_checks ON public.profiles;
CREATE TRIGGER on_profile_badge_checks
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_badges();

-- Triggers for Requests
CREATE OR REPLACE FUNCTION public.check_request_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.award_badge(NEW.requester_id, 'request_made');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_request_badge_checks ON public.requests;
CREATE TRIGGER on_request_badge_checks
  AFTER INSERT ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.check_request_badges();

-- Triggers for Donations
CREATE OR REPLACE FUNCTION public.check_donation_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.award_badge(NEW.donor_id, 'request_accepted');
  END IF;

  IF NEW.status = 'DONATED' AND (TG_OP = 'INSERT' OR OLD.status != 'DONATED') THEN
    PERFORM public.award_badge(NEW.donor_id, 'donation_successful');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_donation_badge_checks ON public.donations;
CREATE TRIGGER on_donation_badge_checks
  AFTER INSERT OR UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.check_donation_badges();

-- 9. Persistent Learning Progress System
CREATE TABLE IF NOT EXISTS public.learning_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  module_id text NOT NULL,
  completed_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, module_id)
);

-- RLS for learning_progress
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own learning progress." ON public.learning_progress;
CREATE POLICY "Users can view their own learning progress." ON public.learning_progress 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own learning progress." ON public.learning_progress;
CREATE POLICY "Users can insert their own learning progress." ON public.learning_progress 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Helper function to record completion and award badges
CREATE OR REPLACE FUNCTION public.complete_learning_module(p_module_id text, p_badge_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Record module completion
  INSERT INTO public.learning_progress (user_id, module_id)
  VALUES (auth.uid(), p_module_id)
  ON CONFLICT (user_id, module_id) DO NOTHING;

  -- 2. Award specific badge if provided
  IF p_badge_id IS NOT NULL THEN
    PERFORM public.award_badge(auth.uid(), p_badge_id);
  END IF;

  -- 3. Check for Onboarding Master badge (assumes 3 modules)
  IF (
    SELECT count(*) 
    FROM public.learning_progress 
    WHERE user_id = auth.uid() 
    AND module_id IN ('learn_request', 'learn_donate', 'learn_policies')
  ) = 3 THEN
    PERFORM public.award_badge(auth.uid(), 'onboarding_master');
  END IF;
END;
$$;

-- 10. Realtime Enablement
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE requests;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'donations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE donations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'learning_progress'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE learning_progress;
    END IF;
END $$;
