-- Aliko Event — schéma PostgreSQL (Neon). Déjà appliqué sur le projet Neon "aliko-event".

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_key ON users (lower(email));

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  template_id text NOT NULL,
  category text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('essentiel','standard','premium')),
  amount_usd_cents integer NOT NULL CHECK (amount_usd_cents > 0),
  currency text NOT NULL CHECK (currency IN ('USD','CDF')),
  amount integer NOT NULL CHECK (amount > 0),            -- cents si USD, francs si CDF
  payment_method text NOT NULL CHECK (payment_method IN ('mobile','card','test')),
  phone text,
  reference text NOT NULL UNIQUE,
  flexpay_order_number text UNIQUE,
  provider_reference text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','cancelled','refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX orders_user_idx ON orders (user_id, created_at DESC);

-- Journal brut des notifications du prestataire (idempotence + preuve)
CREATE TABLE payment_events (
  id bigserial PRIMARY KEY,
  provider text NOT NULL,
  event_key text NOT NULL UNIQUE,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  template_id text NOT NULL,
  category text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('essentiel','standard','premium')),
  status text NOT NULL DEFAULT 'awaiting_payment'
    CHECK (status IN ('awaiting_payment','draft','published','suspended','archived')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  event_date date,
  expires_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX invitations_user_idx ON invitations (user_id, created_at DESC);

CREATE TABLE rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  attendance text NOT NULL CHECK (attendance IN ('yes','no','maybe')),
  party_size integer NOT NULL DEFAULT 1 CHECK (party_size BETWEEN 1 AND 10),
  message text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rsvps_invitation_idx ON rsvps (invitation_id, created_at DESC);

CREATE TABLE abuse_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  ip_hash text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rate_limits (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0
);

CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  actor text,
  action text NOT NULL,
  entity text,
  entity_id text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Invités nommés : chacun reçoit un lien personnel (?g=token) et un pass QR
CREATE TABLE guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  name text NOT NULL,
  token text NOT NULL UNIQUE,
  checked_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX guests_invitation_idx ON guests (invitation_id, created_at);

-- « Mots doux » : messages publics laissés par les invités
CREATE TABLE guestbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  name text NOT NULL,
  message text NOT NULL,
  hidden boolean NOT NULL DEFAULT false,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX guestbook_invitation_idx ON guestbook (invitation_id, created_at DESC);

ALTER TABLE rsvps ADD COLUMN guest_id uuid REFERENCES guests(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX rsvps_guest_uidx ON rsvps (guest_id) WHERE guest_id IS NOT NULL;
