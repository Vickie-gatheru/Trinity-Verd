-- ============================================================================
-- 🌿 Trinity Verd Limited — Supabase Database Schema & Seed Data
-- ============================================================================
-- Paste this script into your Supabase SQL Editor (https://database.new)
-- to automatically create and seed all tables for the Castor Seed Portal.

-- ----------------------------------------------------------------------------
-- 1. Create Tables
-- ----------------------------------------------------------------------------

-- A. Config Table (Pricing rates)
CREATE TABLE IF NOT EXISTS public.pricing (
    id TEXT PRIMARY KEY DEFAULT 'rates',
    clean_seed_per_kg NUMERIC NOT NULL DEFAULT 130,
    husks_seed_per_kg NUMERIC NOT NULL DEFAULT 75,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- B. Farmers Table
CREATE TABLE IF NOT EXISTS public.farmers (
    id TEXT PRIMARY KEY, -- Farmer custom registration code (e.g. FARM-101)
    id_number TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    village TEXT NOT NULL,
    ward TEXT NOT NULL,
    sub_county TEXT NOT NULL,
    county TEXT NOT NULL DEFAULT 'Kitui',
    registered_at TEXT NOT NULL, -- Date string (YYYY-MM-DD)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- C. Seed Distribution Table
CREATE TABLE IF NOT EXISTS public.distributions (
    id TEXT PRIMARY KEY, -- (e.g. DIST-201)
    farmer_id TEXT NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
    farmer_name TEXT NOT NULL,
    sacks_given INT NOT NULL,
    kgs_offered NUMERIC NOT NULL,
    date_offered TEXT NOT NULL, -- Date string (YYYY-MM-DD)
    is_registered_on_portal BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- D. Harvest Records Table
CREATE TABLE IF NOT EXISTS public.harvests (
    id TEXT PRIMARY KEY, -- (e.g. HARV-301)
    farmer_id TEXT NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
    farmer_name TEXT NOT NULL,
    clean_seed_kgs NUMERIC NOT NULL DEFAULT 0,
    husks_seed_kgs NUMERIC NOT NULL DEFAULT 0,
    total_kgs NUMERIC NOT NULL DEFAULT 0,
    amount_to_pay NUMERIC NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('Pending', 'Paid', 'Failed')),
    payment_date TEXT, -- Date string (YYYY-MM-DD)
    mpesa_trans_id TEXT,
    date_sold TEXT NOT NULL, -- Date string (YYYY-MM-DD)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- E. Bulk SMS Logs Table
CREATE TABLE IF NOT EXISTS public.sms_logs (
    id TEXT PRIMARY KEY, -- (e.g. SMS-401)
    recipient_phone TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at TEXT NOT NULL, -- Datetime string
    status TEXT NOT NULL CHECK (status IN ('Delivered', 'Failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Seed Baseline Datasets
-- ----------------------------------------------------------------------------

-- A. Config Pricing
INSERT INTO public.pricing (id, clean_seed_per_kg, husks_seed_per_kg)
VALUES ('rates', 130, 75)
ON CONFLICT (id) DO UPDATE 
SET clean_seed_per_kg = EXCLUDED.clean_seed_per_kg, 
    husks_seed_per_kg = EXCLUDED.husks_seed_per_kg;

-- B. Farmers Seeding
INSERT INTO public.farmers (id, id_number, full_name, phone, village, ward, sub_county, county, registered_at)
VALUES 
('FARM-101', '29482103', 'Emmanuel Mwaria Kimanga', '+254712345678', 'Kaveta', 'Township', 'Kitui Central', 'Kitui', '2026-03-12'),
('FARM-102', '31548291', 'Grace Syokau Mwendwa', '+254722987654', 'Kanyoonyoo', 'Mutonguni', 'Kitui West', 'Kitui', '2026-03-24'),
('FARM-103', '28405912', 'John Musyoka Nzamba', '+254705112233', 'Mutomo Central', 'Mutomo', 'Kitui South', 'Kitui', '2026-04-02'),
('FARM-104', '34910283', 'Agnes Kalumi Mutua', '+254799334455', 'Zombe West', 'Zombe/Mwitika', 'Kitui East', 'Kitui', '2026-04-15'),
('FARM-105', '22349051', 'Peter Ndambuki Kisilu', '+254711556677', 'Nguutani Market', 'Nguutani', 'Mwingi West', 'Kitui', '2026-05-01')
ON CONFLICT (id) DO NOTHING;

-- C. Distributions Seeding
INSERT INTO public.distributions (id, farmer_id, farmer_name, sacks_given, kgs_offered, date_offered, is_registered_on_portal)
VALUES 
('DIST-201', 'FARM-101', 'Emmanuel Mwaria Kimanga', 3, 75, '2026-03-15', TRUE),
('DIST-202', 'FARM-102', 'Grace Syokau Mwendwa', 5, 125, '2026-03-26', TRUE),
('DIST-203', 'FARM-103', 'John Musyoka Nzamba', 2, 50, '2026-04-05', TRUE),
('DIST-204', 'FARM-104', 'Agnes Kalumi Mutua', 4, 100, '2026-04-18', TRUE),
('DIST-205', 'FARM-101', 'Emmanuel Mwaria Kimanga', 2, 50, '2026-05-10', TRUE)
ON CONFLICT (id) DO NOTHING;

-- D. Harvest Records Seeding
INSERT INTO public.harvests (id, farmer_id, farmer_name, clean_seed_kgs, husks_seed_kgs, total_kgs, amount_to_pay, payment_status, payment_date, mpesa_trans_id, date_sold)
VALUES 
('HARV-301', 'FARM-101', 'Emmanuel Mwaria Kimanga', 180, 60, 240, 27900, 'Paid', '2026-05-20', 'MPW5E3K8L2', '2026-05-18'),
('HARV-302', 'FARM-102', 'Grace Syokau Mwendwa', 350, 110, 460, 53750, 'Paid', '2026-05-25', 'MPW9F6T0M8', '2026-05-24'),
('HARV-303', 'FARM-103', 'John Musyoka Nzamba', 95, 40, 135, 15350, 'Pending', NULL, NULL, '2026-06-10'),
('HARV-304', 'FARM-104', 'Agnes Kalumi Mutua', 210, 85, 295, 33675, 'Paid', '2026-06-14', 'MPW1Z4B5P0', '2026-06-12')
ON CONFLICT (id) DO NOTHING;

-- E. SMS Logs Seeding
INSERT INTO public.sms_logs (id, recipient_phone, recipient_name, message, sent_at, status)
VALUES 
('SMS-401', '+254712345678', 'Emmanuel Mwaria Kimanga', 'Hujambo Emmanuel, Trinity Verd Limited imepokea magunia 3 ya castor seed (180kg Clean, 60kg Husks). Malipo ya KSh 27,900 yatatumwa kwa Mpesa hivi punde.', '2026-05-18 14:15', 'Delivered'),
('SMS-402', '+254712345678', 'Emmanuel Mwaria Kimanga', 'Habari Emmanuel! Malipo yako ya KSh 27,900 yametumwa kupitia MPESA. Trans ID: MPW5E3K8L2. Ahsante kwa kushirikiana na Trinity Verd LLC.', '2026-05-20 09:30', 'Delivered'),
('SMS-403', '+254722987654', 'Grace Syokau Mwendwa', 'Habari Grace Syokau, mbegu zako mpya za castor zipo tayari kuchukuliwa katika ofisi yetu ya Mutonguni. Tafadhali beba kitambulisho chako.', '2026-03-24 11:00', 'Delivered')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Enable Real-Time Functionality
-- ----------------------------------------------------------------------------
-- This allows Supabase clients to listen to live database mutations immediately!

alter publication supabase_realtime add table public.pricing;
alter publication supabase_realtime add table public.farmers;
alter publication supabase_realtime add table public.distributions;
alter publication supabase_realtime add table public.harvests;
alter publication supabase_realtime add table public.sms_logs;
