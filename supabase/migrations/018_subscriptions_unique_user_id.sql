-- Add unique constraint on user_id for upsert operations
-- This is required by the RevenueCat webhook to properly upsert subscription records
alter table subscriptions add constraint subscriptions_user_id_key unique (user_id);
