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
  guest_limit integer NOT NULL DEFAULT 50 CHECK (guest_limit IN (50,100,200,300,500,1000)),
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
  guest_limit integer NOT NULL DEFAULT 50 CHECK (guest_limit IN (50,100,200,300,500,1000)),
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
  drink text,
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

-- Notifications de l'organisateur (réponses des invités, mots doux)
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitation_id uuid NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('rsvp','rsvp_update','guestbook')),
  title text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications (user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON notifications (user_id) WHERE read_at IS NULL;

-- Réinitialisation du mot de passe (le jeton n'est jamais stocké en clair)
CREATE TABLE password_resets (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX password_resets_user_idx ON password_resets (user_id);

-- Abonnements aux notifications push (un par appareil)
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX push_subscriptions_user_idx ON push_subscriptions (user_id);

-- Codes de connexion à usage unique envoyés par e-mail (un seul code actif par adresse)
CREATE TABLE login_codes (
  email text PRIMARY KEY,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Date à laquelle le client a supprimé l'invitation d'une commande payée (signalée à l'admin pour remboursement éventuel)
ALTER TABLE orders ADD COLUMN invitation_deleted_at timestamptz;

-- Type d'invité : seul(e) ou en couple (la réponse compte alors 2 personnes)
ALTER TABLE guests ADD COLUMN party_type text NOT NULL DEFAULT 'single' CHECK (party_type IN ('single','couple'));

-- ───────── Garde-fous d'intégrité (appliqués en base, indépendamment du code) ─────────
ALTER TABLE orders ADD CONSTRAINT orders_paid_has_date CHECK (status NOT IN ('paid','refunded') OR paid_at IS NOT NULL);
ALTER TABLE orders ADD CONSTRAINT orders_usd_amount CHECK (currency <> 'USD' OR amount = amount_usd_cents);
ALTER TABLE invitations ADD CONSTRAINT invitations_published_complete CHECK (status <> 'published' OR (published_at IS NOT NULL AND event_date IS NOT NULL AND expires_at IS NOT NULL));
ALTER TABLE invitations ADD CONSTRAINT invitations_expiry_needs_date CHECK (expires_at IS NULL OR event_date IS NOT NULL);
ALTER TABLE users ADD CONSTRAINT users_email_clean CHECK (email = lower(btrim(email)));
ALTER TABLE rsvps ADD CONSTRAINT rsvps_no_party CHECK (attendance <> 'no' OR party_size = 1);
ALTER TABLE rsvps ADD CONSTRAINT rsvps_party_max2 CHECK (party_size <= 2) NOT VALID;
ALTER TABLE rsvps ADD CONSTRAINT rsvps_text_len CHECK (char_length(name) BETWEEN 1 AND 80 AND (message IS NULL OR char_length(message) <= 300));
ALTER TABLE settings ADD CONSTRAINT settings_object CHECK (jsonb_typeof(value) = 'object');
-- Déclencheurs : orders_guard (commande payée figée, pas de retour en arrière), invitations_guard (propriétaire/formule/capacité figés,
-- pas d'activation sans paiement, pas de réactivation après remboursement), guests_cap (capacité d'invités), same_invitation_guard
-- (un invité ne répond que pour sa propre invitation), last_admin_guard (toujours un administrateur actif), append_only (journal et événements de paiement).
-- Corps des fonctions : voir la migration « garde-fous » appliquée sur Neon.
