-- Optional PostgreSQL hardening for TripPilot AI demo bookings.
-- Application-level duplicate checks already exist in BookingsService.
-- Run this against Neon if you want the database to enforce the same rule.

CREATE UNIQUE INDEX IF NOT EXISTS bookings_user_flight_confirmed_unique
ON bookings (user_id, flight_id)
WHERE status = 'confirmed';
