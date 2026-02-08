
-- Enable PostGIS
create extension if not exists postgis;

-- Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  phone text,
  blood_type text,
  is_donor_active boolean default false,
  last_donation_date timestamp with time zone,
  location geography(POINT),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS for Profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile." on public.profiles for update using (auth.uid() = id);

-- Requests Table
create type request_status as enum ('PENDING', 'ACCEPTED', 'FULFILLED', 'CANCELLED');

create table public.requests (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) not null,
  blood_type text not null,
  units_needed int not null,
  hospital_name text,
  location geography(POINT) not null,
  urgency text default 'Standard',
  component_type text default 'Whole Blood',
  status request_status default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS for Requests
alter table public.requests enable row level security;
create policy "Requests are viewable by everyone." on public.requests for select using (true);
create policy "Authenticated users can insert requests." on public.requests for insert with check (auth.role() = 'authenticated');
create policy "Requesters can update their own requests." on public.requests for update using (auth.uid() = requester_id);

-- Donations Table
create type donation_status as enum ('EN_ROUTE', 'ARRIVED', 'MATCHED', 'DONATED', 'CANCELLED');

create table public.donations (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references public.requests(id) not null,
  donor_id uuid references public.profiles(id) not null,
  status donation_status default 'EN_ROUTE',
  timeline_logs jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS for Donations
alter table public.donations enable row level security;
create policy "Donations are viewable by involved parties." on public.donations for select using (auth.uid() = donor_id or auth.uid() in (select requester_id from public.requests where id = request_id));
create policy "Donors can accept requests." on public.donations for insert with check (auth.uid() = donor_id);
create policy "Involved parties can update donations." on public.donations for update using (auth.uid() = donor_id or auth.uid() in (select requester_id from public.requests where id = request_id));

-- Add cancellation_reason if not exists
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Nearby Donors Function
create or replace function get_nearby_donors(
  lat float,
  long float,
  radius_meters float
)
returns setof public.profiles
language sql
as $$
  select * from public.profiles
  where st_dwithin(
    location,
    st_point(long, lat)::geography,
    radius_meters
  )
  and is_donor_active = true;
$$;

-- Enable Realtime
alter publication supabase_realtime add table requests;
alter publication supabase_realtime add table donations;
