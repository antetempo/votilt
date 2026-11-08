-- Archive a seed-parser error from the initial development run, preserving all records.
BEGIN;
SELECT pg_advisory_xact_lock(8815001);
SELECT api.invalidate_content('2b36eba1-5227-4209-a016-2dbc225e496f');
UPDATE public.content_items SET moderation_status='hidden' WHERE id='2b36eba1-5227-4209-a016-2dbc225e496f';
SELECT api.invalidate_content('bd510e38-ea9a-4b36-af7f-f71de7f6cda1');
UPDATE public.content_items SET moderation_status='hidden' WHERE id='bd510e38-ea9a-4b36-af7f-f71de7f6cda1';
SELECT api.invalidate_content('635b4168-d4a0-42d0-a914-353019aacf2e');
UPDATE public.content_items SET moderation_status='hidden' WHERE id='635b4168-d4a0-42d0-a914-353019aacf2e';
UPDATE public.categories SET status='archived' WHERE id IN ('7bb6749f-b852-48ad-a34a-2b62afdc7023','531b1861-714f-4b0a-a58e-2f6d1853fbd6','793154d5-602c-4d0a-aa1e-40edba1624ce');
COMMIT;
