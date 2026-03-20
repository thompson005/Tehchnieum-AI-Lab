-- ══════════════════════════════════════════════════════════════════════════
--  TravelNest AI Security Lab — PostgreSQL Init Script
--  LAB-4 Database Initialization
-- ══════════════════════════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────────────────────
-- USERS TABLE
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    uuid        UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    username    VARCHAR(50) UNIQUE NOT NULL,
    email       VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role        VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'agent')),
    full_name   VARCHAR(100),
    passport_number VARCHAR(20),
    phone       VARCHAR(20),
    nationality VARCHAR(50),
    created_at  TIMESTAMP DEFAULT NOW(),
    last_login  TIMESTAMP,
    is_active   BOOLEAN DEFAULT TRUE
);

-- ──────────────────────────────────────────────────────────────────────────
-- FLIGHTS TABLE
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flights (
    id              SERIAL PRIMARY KEY,
    airline         VARCHAR(50) NOT NULL,
    flight_number   VARCHAR(10) UNIQUE NOT NULL,
    origin          VARCHAR(100) NOT NULL,
    destination     VARCHAR(100) NOT NULL,
    origin_code     VARCHAR(3) NOT NULL,
    destination_code VARCHAR(3) NOT NULL,
    date            DATE NOT NULL,
    departure_time  TIME NOT NULL,
    arrival_time    TIME NOT NULL,
    duration_mins   INTEGER NOT NULL,
    price           NUMERIC(10,2) NOT NULL,
    cost_price      NUMERIC(10,2) NOT NULL,
    seats_available INTEGER DEFAULT 150,
    seats_total     INTEGER DEFAULT 150,
    class_type      VARCHAR(20) DEFAULT 'economy' CHECK (class_type IN ('economy', 'business', 'first')),
    aircraft        VARCHAR(50),
    internal_notes  TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────
-- TRAINS TABLE
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trains (
    id              SERIAL PRIMARY KEY,
    operator        VARCHAR(50) NOT NULL,
    train_number    VARCHAR(10) UNIQUE NOT NULL,
    origin          VARCHAR(100) NOT NULL,
    destination     VARCHAR(100) NOT NULL,
    date            DATE NOT NULL,
    departure_time  TIME NOT NULL,
    arrival_time    TIME NOT NULL,
    duration_mins   INTEGER NOT NULL,
    price           NUMERIC(10,2) NOT NULL,
    class_type      VARCHAR(20) DEFAULT 'standard' CHECK (class_type IN ('standard', 'first', 'sleeper')),
    seats_available INTEGER DEFAULT 200,
    platform        VARCHAR(10),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────
-- BUSES TABLE
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS buses (
    id              SERIAL PRIMARY KEY,
    operator        VARCHAR(50) NOT NULL,
    bus_number      VARCHAR(10) UNIQUE NOT NULL,
    origin          VARCHAR(100) NOT NULL,
    destination     VARCHAR(100) NOT NULL,
    date            DATE NOT NULL,
    departure_time  TIME NOT NULL,
    arrival_time    TIME NOT NULL,
    duration_mins   INTEGER NOT NULL,
    price           NUMERIC(10,2) NOT NULL,
    seats_available INTEGER DEFAULT 52,
    amenities       TEXT[],
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────
-- HOTELS TABLE
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hotels (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    city            VARCHAR(50) NOT NULL,
    country         VARCHAR(50) NOT NULL,
    address         TEXT NOT NULL,
    stars           INTEGER CHECK (stars BETWEEN 1 AND 5),
    price_per_night NUMERIC(10,2) NOT NULL,
    cost_per_night  NUMERIC(10,2) NOT NULL,
    description     TEXT,
    amenities       TEXT[],
    available_rooms INTEGER DEFAULT 50,
    total_rooms     INTEGER DEFAULT 50,
    image_url       TEXT,
    rating          NUMERIC(3,2) DEFAULT 4.0,
    internal_notes  TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────
-- BOOKINGS TABLE
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
    id              SERIAL PRIMARY KEY,
    booking_ref     VARCHAR(20) UNIQUE NOT NULL DEFAULT ('TN-' || upper(substr(md5(random()::text), 1, 8))),
    user_id         INTEGER REFERENCES users(id),
    booking_type    VARCHAR(20) NOT NULL CHECK (booking_type IN ('flight', 'hotel', 'train', 'bus', 'package')),
    reference_id    INTEGER NOT NULL,
    details         JSONB NOT NULL DEFAULT '{}',
    total_price     NUMERIC(10,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'USD',
    status          VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    passengers      JSONB DEFAULT '[]',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────
-- PAYMENTS TABLE
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id              SERIAL PRIMARY KEY,
    payment_ref     VARCHAR(30) UNIQUE NOT NULL DEFAULT ('PAY-' || upper(substr(md5(random()::text), 1, 10))),
    booking_id      INTEGER REFERENCES bookings(id),
    user_id         INTEGER REFERENCES users(id),
    amount          NUMERIC(10,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'USD',
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method  VARCHAR(30) DEFAULT 'card',
    card_last_four  VARCHAR(4),
    card_holder     VARCHAR(100),
    card_number_full VARCHAR(16),
    transaction_id  VARCHAR(50),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────
-- TRAVEL DOCUMENTS TABLE
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS travel_documents (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id),
    document_type   VARCHAR(50) NOT NULL,
    document_number VARCHAR(50) NOT NULL,
    issuing_country VARCHAR(50),
    expiry_date     DATE,
    data            JSONB DEFAULT '{}',
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────
-- SECRET FLAGS TABLE (intentional vulnerability - admin endpoint exposes it)
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS secret_flags (
    id          SERIAL PRIMARY KEY,
    flag_name   VARCHAR(100) NOT NULL,
    flag_value  TEXT NOT NULL,
    hint        TEXT,
    points      INTEGER DEFAULT 100,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────
-- SEED: USERS
-- ──────────────────────────────────────────────────────────────────────────
-- Passwords: admin=TravelNest2024!, alice=password123, bob=password123
INSERT INTO users (username, email, password_hash, role, full_name, passport_number, phone, nationality) VALUES
('admin',   'admin@travelnest.ai',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMAAqqqBUEDgCjL/RMKMh9KyGy',  'admin', 'TravelNest Admin', 'ADMIN-001', '+1-555-0100', 'American'),
('alice',   'alice@example.com',      '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',  'user',  'Alice Johnson',   'P12345678', '+1-555-0101', 'American'),
('bob',     'bob@example.com',        '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',  'user',  'Bob Smith',       'P87654321', '+44-555-0102', 'British'),
('charlie', 'charlie@example.com',    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',  'user',  'Charlie Brown',   'P11223344', '+61-555-0103', 'Australian'),
('diana',   'diana@example.com',      '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',  'user',  'Diana Prince',    'P99887766', '+33-555-0104', 'French');

-- ──────────────────────────────────────────────────────────────────────────
-- SEED: FLIGHTS (10 flights, various international routes)
-- ──────────────────────────────────────────────────────────────────────────
INSERT INTO flights (airline, flight_number, origin, destination, origin_code, destination_code, date, departure_time, arrival_time, duration_mins, price, cost_price, seats_available, class_type, aircraft, internal_notes) VALUES
('TechAir',      'TA101', 'London Heathrow', 'Paris CDG',          'LHR', 'CDG', CURRENT_DATE + 1,  '08:00', '10:15', 135,  189.99,  95.00, 142, 'economy', 'Airbus A320', 'TECHNIEUM{fl1ght_d4t4_3xf1l} - internal cost data'),
('GlobalWings',  'GW205', 'London Heathrow', 'New York JFK',        'LHR', 'JFK', CURRENT_DATE + 2,  '10:30', '13:45', 435,  549.00, 280.00, 120, 'economy', 'Boeing 777',  'Internal pricing: margin 96%'),
('SkyBridge',    'SB310', 'New York JFK',    'Dubai International', 'JFK', 'DXB', CURRENT_DATE + 3,  '14:00', '09:30', 810,  799.00, 410.00,  98, 'economy', 'Boeing 787',  'High-margin route'),
('NestAir',      'NA415', 'Dubai International', 'Tokyo Narita',    'DXB', 'NRT', CURRENT_DATE + 4,  '23:00', '14:00', 540,  680.00, 350.00, 115, 'economy', 'Airbus A380', 'Premium demand route'),
('TechAir',      'TA520', 'Tokyo Narita',    'Sydney Kingsford',    'NRT', 'SYD', CURRENT_DATE + 5,  '11:00', '23:30', 570,  720.00, 375.00,  88, 'economy', 'Boeing 787',  'Oceania route'),
('GlobalWings',  'GW625', 'Sydney Kingsford', 'London Heathrow',    'SYD', 'LHR', CURRENT_DATE + 6,  '21:00', '06:30', 1350, 1150.00, 580.00, 75, 'economy', 'Airbus A380', 'Long-haul flagship'),
('SkyBridge',    'SB730', 'Paris CDG',       'Dubai International', 'CDG', 'DXB', CURRENT_DATE + 7,  '09:45', '19:30', 405,  450.00, 225.00, 130, 'economy', 'Boeing 777',  'Middle East hub route'),
('NestAir',      'NA835', 'London Heathrow', 'Tokyo Narita',        'LHR', 'NRT', CURRENT_DATE + 8,  '13:00', '09:45', 705,  850.00, 430.00,  95, 'business','Boeing 787',  'Business premium route'),
('TechAir',      'TA940', 'New York JFK',    'Paris CDG',           'JFK', 'CDG', CURRENT_DATE + 9,  '18:30', '07:45', 435,  520.00, 265.00, 108, 'economy', 'Airbus A330', 'Transatlantic'),
('GlobalWings',  'GW045', 'Dubai International', 'Sydney Kingsford','DXB', 'SYD', CURRENT_DATE + 10, '02:30', '22:00', 810,  890.00, 455.00,  82, 'economy', 'Boeing 777',  'Gulf-Pacific route');

-- ──────────────────────────────────────────────────────────────────────────
-- SEED: TRAINS (5 UK rail routes)
-- ──────────────────────────────────────────────────────────────────────────
INSERT INTO trains (operator, train_number, origin, destination, date, departure_time, arrival_time, duration_mins, price, class_type, seats_available, platform) VALUES
('LNER',         'TRN001', 'London Kings Cross', 'Edinburgh Waverley', CURRENT_DATE + 1, '07:00', '11:30', 270,  89.00, 'standard', 180, '3'),
('Avanti West',  'TRN002', 'London Euston',      'Manchester Piccadilly', CURRENT_DATE + 1, '08:03', '10:08', 125, 45.00, 'standard', 220, '6'),
('Great Western', 'TRN003', 'London Paddington',  'Bristol Temple Meads', CURRENT_DATE + 2, '09:00', '10:45', 105, 38.00, 'standard', 195, '2'),
('Southeastern', 'TRN004', 'London St Pancras',  'Paris Gare du Nord', CURRENT_DATE + 2,   '10:31', '13:58', 147, 149.00, 'first',   105, '1'),
('ScotRail',     'TRN005', 'Edinburgh Waverley', 'Glasgow Central', CURRENT_DATE + 3,       '09:15', '09:58',  43,  15.50, 'standard', 250, '4');

-- ──────────────────────────────────────────────────────────────────────────
-- SEED: BUSES (5 national coach routes)
-- ──────────────────────────────────────────────────────────────────────────
INSERT INTO buses (operator, bus_number, origin, destination, date, departure_time, arrival_time, duration_mins, price, seats_available, amenities) VALUES
('National Express', 'NE101', 'London Victoria', 'Birmingham', CURRENT_DATE + 1, '08:00', '10:30', 150, 15.00, 45, ARRAY['wifi','usb-charging','toilet']),
('National Express', 'NE202', 'London Victoria', 'Manchester', CURRENT_DATE + 1, '09:00', '13:30', 270, 22.00, 40, ARRAY['wifi','usb-charging','toilet']),
('FlixBus',         'FB303', 'London',           'Paris',      CURRENT_DATE + 2, '06:00', '14:30', 510, 29.99, 52, ARRAY['wifi','usb-charging','toilet','reclining-seats']),
('Megabus',         'MB404', 'Edinburgh',        'London',     CURRENT_DATE + 2, '20:00', '06:00', 600, 19.00, 48, ARRAY['wifi','toilet']),
('National Express', 'NE505', 'Bristol',         'London',     CURRENT_DATE + 3, '07:30', '10:00', 150, 12.00, 50, ARRAY['wifi','usb-charging']);

-- ──────────────────────────────────────────────────────────────────────────
-- SEED: HOTELS (8 hotels with intentional XSS in description)
-- ──────────────────────────────────────────────────────────────────────────
INSERT INTO hotels (name, city, country, address, stars, price_per_night, cost_per_night, description, amenities, available_rooms, image_url, rating, internal_notes) VALUES
('The Grand Parisian',   'Paris',  'France',    '1 Rue de la Paix, 75001 Paris',             5, 450.00, 220.00,
 'Luxury hotel steps from the Eiffel Tower. <script>console.log("XSS-in-hotel-desc")</script> Spectacular views and world-class service.',
 ARRAY['spa','pool','gym','restaurant','bar','concierge','valet'], 48, '/images/paris-grand.jpg', 4.8,
 'High-margin luxury property. Cost structure: 220 USD/night baseline.'),

('London Bridge Hotel',  'London', 'UK',        '8-18 London Bridge St, London SE1 9SG',     4, 280.00, 140.00,
 'Modern hotel with iconic views of Tower Bridge. Walking distance to Borough Market.',
 ARRAY['restaurant','bar','gym','business-center','wifi'], 35, '/images/london-bridge.jpg', 4.5, 'Business traveller favourite.'),

('NYC Skyline Suites',   'New York','USA',       '350 Fifth Avenue, New York, NY 10118',      4, 320.00, 165.00,
 'Stunning Empire State Building views. Central Midtown location. <img src=x onerror="alert(1)">',
 ARRAY['rooftop-bar','gym','spa','concierge','valet-parking'], 28, '/images/nyc-skyline.jpg', 4.6, 'Popular with tourists and business travellers.'),

('Dubai Palace Resort',  'Dubai',  'UAE',        'Sheikh Zayed Road, Dubai, UAE',             5, 680.00, 340.00,
 'Ultra-luxury resort with private beach access, world-class dining, and infinity pools.',
 ARRAY['private-beach','spa','pool','multiple-restaurants','butler-service','helicopter-pad'], 22, '/images/dubai-palace.jpg', 4.9, 'Top-tier luxury. Extremely high margin.'),

('Tokyo Zen Hotel',      'Tokyo',  'Japan',      '2-1-1 Nihonbashi, Chuo-ku, Tokyo',          4, 290.00, 148.00,
 'Minimalist luxury in the heart of Tokyo. Authentic Japanese hospitality and cuisine.',
 ARRAY['onsen','restaurant','bar','gym','tea-ceremony'], 40, '/images/tokyo-zen.jpg', 4.7, 'High demand during cherry blossom season.'),

('Sydney Harbour View',  'Sydney', 'Australia',  '61 Macquarie St, Sydney NSW 2000',          4, 310.00, 158.00,
 'Iconic views of Sydney Opera House and Harbour Bridge from every room.',
 ARRAY['pool','restaurant','bar','gym','harbour-view','concierge'], 32, '/images/sydney-harbour.jpg', 4.6, 'Landmark property.'),

('Budget Traveller Inn', 'London', 'UK',         '123 Hostel Street, Shoreditch, London E1',  2,  65.00,  30.00,
 'Clean, comfortable budget accommodation in trendy Shoreditch. Shared facilities available.',
 ARRAY['wifi','shared-kitchen','lounge','24hr-checkin'], 18, '/images/budget-london.jpg', 3.8, 'Volume-based revenue model.'),

('Paris Montmartre B&B', 'Paris',  'France',     '15 Rue Lepic, 75018 Paris',                 3, 120.00,  58.00,
 'Charming bed and breakfast in the artistic heart of Montmartre. Authentic Parisian experience.',
 ARRAY['breakfast-included','wifi','garden','artistic-decor'], 8, '/images/paris-bb.jpg', 4.4, 'Boutique property. Limited availability.');

-- ──────────────────────────────────────────────────────────────────────────
-- SEED: BOOKINGS (3 sample bookings)
-- ──────────────────────────────────────────────────────────────────────────
INSERT INTO bookings (user_id, booking_type, reference_id, details, total_price, status, passengers) VALUES
(2, 'flight', 1, '{"flight_number": "TA101", "origin": "London Heathrow", "destination": "Paris CDG", "date": "2024-03-20", "passengers": 1, "class": "economy"}', 189.99, 'confirmed',
 '[{"name": "Alice Johnson", "passport": "P12345678", "nationality": "American", "dob": "1990-05-15"}]'),

(3, 'hotel', 1, '{"hotel_name": "The Grand Parisian", "city": "Paris", "check_in": "2024-03-21", "check_out": "2024-03-25", "rooms": 1, "guests": 2}', 1800.00, 'confirmed',
 '[{"name": "Bob Smith", "passport": "P87654321"}, {"name": "Jane Smith", "passport": "P87654322"}]'),

(2, 'train', 4, '{"train_number": "TRN004", "origin": "London St Pancras", "destination": "Paris Gare du Nord", "date": "2024-04-01", "passengers": 1, "class": "first"}', 149.00, 'pending',
 '[{"name": "Alice Johnson", "passport": "P12345678"}]');

-- ──────────────────────────────────────────────────────────────────────────
-- SEED: SECRET FLAGS TABLE
-- ──────────────────────────────────────────────────────────────────────────
INSERT INTO secret_flags (flag_name, flag_value, hint, points) VALUES
('Payment Logic Flaw',      'TECHNIEUM{p4ym3nt_l0g1c_fl4w}',     'Try submitting a negative payment amount...', 500),
('TravelNest God Mode',     'TECHNIEUM{tr4v3l_g0d_m0d3}',         'Combine all vulnerabilities to achieve full platform compromise', 1000),
('Admin Override Active',   'OVERRIDE-TRAVELNEST-9921',            'The admin override code used internally', 0),
('DB Admin Credentials',    'admin:TravelNest2024!',               'Default admin credentials - change immediately!', 0);

-- ──────────────────────────────────────────────────────────────────────────
-- SEED: TRAVEL DOCUMENTS
-- ──────────────────────────────────────────────────────────────────────────
INSERT INTO travel_documents (user_id, document_type, document_number, issuing_country, expiry_date, data) VALUES
(2, 'passport', 'P12345678', 'United States', '2030-05-15', '{"given_name": "Alice", "family_name": "Johnson", "nationality": "USA", "dob": "1990-05-15"}'),
(3, 'passport', 'P87654321', 'United Kingdom', '2028-11-22', '{"given_name": "Bob", "family_name": "Smith", "nationality": "GBR", "dob": "1985-11-22"}'),
(2, 'visa',     'V-US-FR-2024', 'France', '2025-12-31',     '{"type": "tourist", "issued": "2024-01-01", "entries": "multiple"}');

-- ──────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_username   ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
CREATE INDEX IF NOT EXISTS idx_flights_route    ON flights(origin_code, destination_code, date);
CREATE INDEX IF NOT EXISTS idx_hotels_city      ON hotels(city);
CREATE INDEX IF NOT EXISTS idx_bookings_user    ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_type    ON bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user    ON payments(user_id);
