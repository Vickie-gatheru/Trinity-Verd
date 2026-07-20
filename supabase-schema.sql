create table if not exists public.farmers (
  id text primary key,
  idNumber text,
  phone text,
  fullName text,
  village text,
  ward text,
  subCounty text,
  county text,
  registeredAt text
);

create table if not exists public.distributions (
  id text primary key,
  farmerId text,
  farmerName text,
  sacksGiven integer,
  kgsOffered integer,
  dateOffered text,
  isRegisteredOnPortal boolean
);

create table if not exists public.harvests (
  id text primary key,
  farmerId text,
  farmerName text,
  cleanSeedKgs numeric,
  husksSeedKgs numeric,
  totalKgs numeric,
  amountToPay numeric,
  paymentStatus text,
  paymentDate text,
  mpesaTransId text,
  dateSold text
);

create table if not exists public.sms_logs (
  id text primary key,
  recipientPhone text,
  recipientName text,
  message text,
  sentAt text,
  status text
);

create table if not exists public.pricing (
  id text primary key,
  cleanSeedPerKg numeric,
  husksSeedPerKg numeric
);
