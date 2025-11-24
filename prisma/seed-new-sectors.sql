-- Create client companies for new sectors (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM client_companies WHERE "contactEmail" = 'info@grandviewhotel.com') THEN
    INSERT INTO client_companies (id, name, industry, "businessSector", website, "contactName", "contactEmail", "contactPhone", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'Grand View Hotel & Restaurant', 'Hospitality', 'HOSPITALITY', 'https://grandviewhotel.com', 'Emily Chen', 'info@grandviewhotel.com', '555-3000', NOW(), NOW());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM client_companies WHERE "contactEmail" = 'contact@zenfitstudio.com') THEN
    INSERT INTO client_companies (id, name, industry, "businessSector", website, "contactName", "contactEmail", "contactPhone", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'ZenFit Yoga & Wellness Studio', 'Fitness & Wellness', 'FITNESS_WELLNESS', 'https://zenfitstudio.com', 'Marcus Thompson', 'contact@zenfitstudio.com', '555-4000', NOW(), NOW());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM client_companies WHERE "contactEmail" = 'info@premierbuilders.com') THEN
    INSERT INTO client_companies (id, name, industry, "businessSector", website, "contactName", "contactEmail", "contactPhone", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'Premier Builders & Contractors', 'Construction', 'CONSTRUCTION', 'https://premierbuilders.com', 'David Rodriguez', 'info@premierbuilders.com', '555-5000', NOW(), NOW());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM client_companies WHERE "contactEmail" = 'hello@trendygoods.com') THEN
    INSERT INTO client_companies (id, name, industry, "businessSector", website, "contactName", "contactEmail", "contactPhone", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'TrendyGoods Online Store', 'E-Commerce', 'ECOMMERCE', 'https://trendygoods.com', 'Jessica Lee', 'hello@trendygoods.com', '555-6000', NOW(), NOW());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM client_companies WHERE "contactEmail" = 'contact@shieldinsurance.com') THEN
    INSERT INTO client_companies (id, name, industry, "businessSector", website, "contactName", "contactEmail", "contactPhone", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'Shield Insurance Agency', 'Insurance', 'INSURANCE', 'https://shieldinsurance.com', 'Brian Anderson', 'contact@shieldinsurance.com', '555-7000', NOW(), NOW());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM client_companies WHERE "contactEmail" = 'info@sunshinepowersolar.com') THEN
    INSERT INTO client_companies (id, name, industry, "businessSector", website, "contactName", "contactEmail", "contactPhone", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'Sunshine Power Solar', 'Solar Energy', 'SOLAR_ENERGY', 'https://sunshinepowersolar.com', 'Amanda Martinez', 'info@sunshinepowersolar.com', '555-8000', NOW(), NOW());
  END IF;
END $$;

-- Create users for new sectors
-- Password hash for "password123"
DO $$
DECLARE
  client_id text;
BEGIN
  -- Emily Chen - Hospitality
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'emily@grandviewhotel.com') THEN
    SELECT id INTO client_id FROM client_companies WHERE "contactEmail" = 'info@grandviewhotel.com';
    INSERT INTO users (id, email, "hashedPassword", name, role, "clientId", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'emily@grandviewhotel.com', '$2b$10$W.yj2pl9e4QEmhMBajLxbehFrWoVKoT.xFNIrcLAFW0rJBdPJIes6', 'Emily Chen', 'CLIENT', client_id, NOW(), NOW());
  END IF;

  -- Marcus Thompson - Fitness & Wellness
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'marcus@zenfitstudio.com') THEN
    SELECT id INTO client_id FROM client_companies WHERE "contactEmail" = 'contact@zenfitstudio.com';
    INSERT INTO users (id, email, "hashedPassword", name, role, "clientId", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'marcus@zenfitstudio.com', '$2b$10$W.yj2pl9e4QEmhMBajLxbehFrWoVKoT.xFNIrcLAFW0rJBdPJIes6', 'Marcus Thompson', 'CLIENT', client_id, NOW(), NOW());
  END IF;

  -- David Rodriguez - Construction
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'david@premierbuilders.com') THEN
    SELECT id INTO client_id FROM client_companies WHERE "contactEmail" = 'info@premierbuilders.com';
    INSERT INTO users (id, email, "hashedPassword", name, role, "clientId", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'david@premierbuilders.com', '$2b$10$W.yj2pl9e4QEmhMBajLxbehFrWoVKoT.xFNIrcLAFW0rJBdPJIes6', 'David Rodriguez', 'CLIENT', client_id, NOW(), NOW());
  END IF;

  -- Jessica Lee - E-Commerce
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'jessica@trendygoods.com') THEN
    SELECT id INTO client_id FROM client_companies WHERE "contactEmail" = 'hello@trendygoods.com';
    INSERT INTO users (id, email, "hashedPassword", name, role, "clientId", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'jessica@trendygoods.com', '$2b$10$W.yj2pl9e4QEmhMBajLxbehFrWoVKoT.xFNIrcLAFW0rJBdPJIes6', 'Jessica Lee', 'CLIENT', client_id, NOW(), NOW());
  END IF;

  -- Brian Anderson - Insurance
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'brian@shieldinsurance.com') THEN
    SELECT id INTO client_id FROM client_companies WHERE "contactEmail" = 'contact@shieldinsurance.com';
    INSERT INTO users (id, email, "hashedPassword", name, role, "clientId", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'brian@shieldinsurance.com', '$2b$10$W.yj2pl9e4QEmhMBajLxbehFrWoVKoT.xFNIrcLAFW0rJBdPJIes6', 'Brian Anderson', 'CLIENT', client_id, NOW(), NOW());
  END IF;

  -- Amanda Martinez - Solar Energy
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'amanda@sunshinepowersolar.com') THEN
    SELECT id INTO client_id FROM client_companies WHERE "contactEmail" = 'info@sunshinepowersolar.com';
    INSERT INTO users (id, email, "hashedPassword", name, role, "clientId", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'amanda@sunshinepowersolar.com', '$2b$10$W.yj2pl9e4QEmhMBajLxbehFrWoVKoT.xFNIrcLAFW0rJBdPJIes6', 'Amanda Martinez', 'CLIENT', client_id, NOW(), NOW());
  END IF;
END $$;
