-- VOTILT, PostgreSQL 18 native. Canonical fresh-install schema. No Docker.
CREATE SCHEMA IF NOT EXISTS private;
CREATE SCHEMA IF NOT EXISTS api;
REVOKE ALL ON SCHEMA private,api FROM PUBLIC;

CREATE TABLE IF NOT EXISTS public.profiles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), handle text NOT NULL UNIQUE CHECK(handle ~ '^[a-z0-9_]{3,24}$'),
 display_name text NOT NULL CHECK(length(display_name) BETWEEN 1 AND 60), bio text NOT NULL DEFAULT '' CHECK(length(bio)<=160),
 visibility text NOT NULL DEFAULT 'public' CHECK(visibility IN ('public','friends','private')),
 suspended boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS private.credentials (
 user_id uuid PRIMARY KEY REFERENCES public.profiles ON DELETE CASCADE,
 email text UNIQUE NOT NULL, password_hash text NOT NULL
);
CREATE TABLE IF NOT EXISTS private.sessions (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.profile_settings (
 user_id uuid PRIMARY KEY REFERENCES public.profiles ON DELETE CASCADE,
 show_champions text NOT NULL DEFAULT 'owner' CHECK(show_champions IN ('owner','friends','public')),
 allow_comparison boolean NOT NULL DEFAULT false, haptics boolean NOT NULL DEFAULT true,
 reduce_motion boolean NOT NULL DEFAULT false, onboarding_complete boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS public.user_roles (
 user_id uuid PRIMARY KEY REFERENCES public.profiles ON DELETE CASCADE,
 role text NOT NULL DEFAULT 'user' CHECK(role IN ('user','moderator','admin'))
);
CREATE TABLE IF NOT EXISTS public.categories (
 id uuid PRIMARY KEY, parent_id uuid REFERENCES public.categories ON DELETE RESTRICT,
 depth integer NOT NULL CHECK(depth BETWEEN 1 AND 32), slug text NOT NULL, title text NOT NULL,
 description text NOT NULL DEFAULT '', icon text NOT NULL DEFAULT 'sparkles', sort_order integer NOT NULL DEFAULT 0,
 status text NOT NULL DEFAULT 'published' CHECK(status IN ('published','draft','archived')),
 reference_kind text NOT NULL DEFAULT 'name' CHECK(reference_kind IN ('name','person','website','place','tool')),
 reference_label text NOT NULL DEFAULT 'Nome del soggetto', requires_url boolean NOT NULL DEFAULT false,
 CHECK((parent_id IS NULL) = (depth=1)), UNIQUE NULLS NOT DISTINCT(parent_id,slug)
);
CREATE TABLE IF NOT EXISTS public.user_category_interests (
 user_id uuid REFERENCES public.profiles ON DELETE CASCADE, category_id uuid REFERENCES public.categories ON DELETE CASCADE,
 PRIMARY KEY(user_id,category_id)
);
CREATE TABLE IF NOT EXISTS public.content_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('photo','illustration','ai_art','ai_tool')),
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 80), caption text NOT NULL DEFAULT '' CHECK(length(caption)<=400),
 visibility text NOT NULL DEFAULT 'public' CHECK(visibility IN ('public','friends','private')),
 media_path text NOT NULL UNIQUE, provenance text NOT NULL DEFAULT 'original_illustration'
   CHECK(provenance IN ('original_illustration','ai_generated','verified_real','unknown','demo_placeholder')),
 moderation_status text NOT NULL DEFAULT 'draft' CHECK(moderation_status IN ('draft','pending_review','approved','rejected','hidden','removed')),
 review_reason text, created_at timestamptz NOT NULL DEFAULT now(), approved_at timestamptz,
 rights_attested boolean NOT NULL DEFAULT false, adult_consent boolean NOT NULL DEFAULT false,
 byte_size integer, mime_type text, width integer, height integer
);
CREATE TABLE IF NOT EXISTS public.content_categories (
 content_id uuid REFERENCES public.content_items ON DELETE CASCADE, category_id uuid REFERENCES public.categories ON DELETE RESTRICT,
 status text NOT NULL DEFAULT 'approved' CHECK(status IN ('pending','approved','rejected')),
 PRIMARY KEY(content_id,category_id)
);
CREATE TABLE IF NOT EXISTS public.vote_slots (
 user_id uuid REFERENCES public.profiles ON DELETE CASCADE, category_id uuid REFERENCES public.categories ON DELETE RESTRICT,
 champion_content_id uuid REFERENCES public.content_items ON DELETE RESTRICT,
 version integer NOT NULL DEFAULT 0 CHECK(version>=0), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,category_id), FOREIGN KEY(champion_content_id,category_id) REFERENCES public.content_categories(content_id,category_id)
);
CREATE TABLE IF NOT EXISTS public.content_metadata (
 content_id uuid NOT NULL, category_id uuid NOT NULL, subject_name text NOT NULL CHECK(length(trim(subject_name)) BETWEEN 1 AND 120),
 reference_url text CHECK(reference_url IS NULL OR reference_url ~ '^https?://[^[:space:]@]+$'),
 PRIMARY KEY(content_id,category_id), FOREIGN KEY(content_id,category_id) REFERENCES public.content_categories ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS metadata_subject_idx ON public.content_metadata(lower(subject_name));
CREATE TABLE IF NOT EXISTS public.tilt_duels (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
 category_id uuid NOT NULL REFERENCES public.categories, incumbent_id uuid NOT NULL REFERENCES public.content_items ON DELETE CASCADE,
 challenger_id uuid NOT NULL REFERENCES public.content_items ON DELETE CASCADE, expected_slot_version integer NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','resolved','expired','stale','superseded','cancelled')),
 winner_side text CHECK(winner_side IN ('INCUMBENT','CHALLENGER')), created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '15 minutes', resolved_at timestamptz,
 CHECK(incumbent_id<>challenger_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS tilt_one_pending ON public.tilt_duels(user_id,category_id) WHERE status='pending';
CREATE TABLE IF NOT EXISTS public.vote_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES public.profiles ON DELETE SET NULL,
 category_id uuid NOT NULL REFERENCES public.categories, kind text NOT NULL CHECK(kind IN ('initial','transfer','confirmed','invalidated')),
 old_content_id uuid, new_content_id uuid, duel_id uuid, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.operation_receipts (
 user_id uuid REFERENCES public.profiles ON DELETE CASCADE, operation_id uuid NOT NULL, action text NOT NULL,
 fingerprint text NOT NULL, result_json jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,operation_id,action)
);
CREATE TABLE IF NOT EXISTS public.duel_ratings (
 category_id uuid REFERENCES public.categories, content_id uuid REFERENCES public.content_items ON DELETE CASCADE,
 rating numeric NOT NULL DEFAULT 1500, matches integer NOT NULL DEFAULT 0 CHECK(matches>=0),
 wins integer NOT NULL DEFAULT 0 CHECK(wins>=0), losses integer NOT NULL DEFAULT 0 CHECK(losses>=0),
 PRIMARY KEY(category_id,content_id), CHECK(matches=wins+losses)
);
CREATE TABLE IF NOT EXISTS public.rating_events (
 duel_id uuid PRIMARY KEY REFERENCES public.tilt_duels ON DELETE CASCADE, user_id uuid REFERENCES public.profiles ON DELETE SET NULL,
 category_id uuid REFERENCES public.categories, winner_id uuid, loser_id uuid, rated boolean NOT NULL,
 formula_version text NOT NULL DEFAULT 'elo-1500-k32-v1', old_winner numeric, new_winner numeric, old_loser numeric, new_loser numeric,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_blocks (
 blocker_id uuid REFERENCES public.profiles ON DELETE CASCADE, blocked_id uuid REFERENCES public.profiles ON DELETE CASCADE,
 PRIMARY KEY(blocker_id,blocked_id), CHECK(blocker_id<>blocked_id)
);
CREATE TABLE IF NOT EXISTS public.follows (
 follower_id uuid REFERENCES public.profiles ON DELETE CASCADE, followed_id uuid REFERENCES public.profiles ON DELETE CASCADE,
 PRIMARY KEY(follower_id,followed_id), CHECK(follower_id<>followed_id)
);
CREATE TABLE IF NOT EXISTS public.friend_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), requester_id uuid REFERENCES public.profiles ON DELETE CASCADE,
 recipient_id uuid REFERENCES public.profiles ON DELETE CASCADE, status text NOT NULL DEFAULT 'pending'
 CHECK(status IN ('pending','accepted','rejected','cancelled')), created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(requester_id<>recipient_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS friend_one_pending ON public.friend_requests(least(requester_id,recipient_id),greatest(requester_id,recipient_id)) WHERE status='pending';
CREATE TABLE IF NOT EXISTS public.friendships (
 user_low_id uuid REFERENCES public.profiles ON DELETE CASCADE, user_high_id uuid REFERENCES public.profiles ON DELETE CASCADE,
 PRIMARY KEY(user_low_id,user_high_id), CHECK(user_low_id<user_high_id)
);
CREATE TABLE IF NOT EXISTS public.battle_shares (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), creator_id uuid REFERENCES public.profiles ON DELETE CASCADE,
 recipient_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE, category_id uuid REFERENCES public.categories,
 expires_at timestamptz NOT NULL DEFAULT now()+interval '24 hours', revoked boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS public.notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), recipient_id uuid REFERENCES public.profiles ON DELETE CASCADE,
 type text NOT NULL, title text NOT NULL, entity_id uuid, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reporter_id uuid REFERENCES public.profiles ON DELETE SET NULL,
 content_id uuid REFERENCES public.content_items ON DELETE CASCADE, reason text NOT NULL CHECK(length(reason) BETWEEN 3 AND 500),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewed','dismissed')), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(reporter_id,content_id)
);
CREATE TABLE IF NOT EXISTS public.moderation_actions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), moderator_id uuid REFERENCES public.profiles ON DELETE SET NULL,
 target_id uuid, action text NOT NULL, reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.category_suggestions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), proposer_id uuid REFERENCES public.profiles ON DELETE SET NULL,
 parent_id uuid NOT NULL REFERENCES public.categories, title text NOT NULL CHECK(length(title) BETWEEN 3 AND 60),
 description text NOT NULL CHECK(length(description) BETWEEN 20 AND 250), examples jsonb NOT NULL CHECK(jsonb_array_length(examples) BETWEEN 0 AND 10),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')), review_reason text, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.category_suggestions ADD COLUMN IF NOT EXISTS reference_kind text NOT NULL DEFAULT 'name' CHECK(reference_kind IN ('name','person','website','place','tool'));
ALTER TABLE public.category_suggestions DROP CONSTRAINT IF EXISTS category_suggestions_description_check;
ALTER TABLE public.category_suggestions ADD CONSTRAINT category_suggestions_description_check CHECK(length(description) BETWEEN 20 AND 250);
ALTER TABLE public.category_suggestions DROP CONSTRAINT IF EXISTS category_suggestions_examples_check;
ALTER TABLE public.category_suggestions ADD CONSTRAINT category_suggestions_examples_check CHECK(jsonb_array_length(examples) BETWEEN 0 AND 10);
CREATE TABLE IF NOT EXISTS public.daily_challenges (
 date_utc date PRIMARY KEY, category_id uuid REFERENCES public.categories
);
CREATE TABLE IF NOT EXISTS public.ranking_snapshots (
 date_utc date, category_id uuid REFERENCES public.categories, content_id uuid REFERENCES public.content_items ON DELETE CASCADE,
 support integer NOT NULL CHECK(support>=0), PRIMARY KEY(date_utc,category_id,content_id)
);
CREATE TABLE IF NOT EXISTS public.content_impressions (
 user_id uuid REFERENCES public.profiles ON DELETE CASCADE, content_id uuid REFERENCES public.content_items ON DELETE CASCADE,
 category_id uuid REFERENCES public.categories, session_id uuid NOT NULL, seen_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,content_id,category_id,session_id)
);
CREATE TABLE IF NOT EXISTS private.quiz_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), media_path text NOT NULL, ground_truth text CHECK(ground_truth IN ('REAL','AI')),
 evidence_note text NOT NULL, enabled boolean NOT NULL DEFAULT false, test_only boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.real_ai_answers (
 user_id uuid REFERENCES public.profiles ON DELETE CASCADE, quiz_item_id uuid REFERENCES private.quiz_items ON DELETE CASCADE,
 answer text CHECK(answer IN ('REAL','AI')), is_correct boolean NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,quiz_item_id)
);
CREATE INDEX IF NOT EXISTS slots_champion_idx ON public.vote_slots(category_id,champion_content_id);
CREATE INDEX IF NOT EXISTS content_status_idx ON public.content_items(moderation_status,created_at DESC,id);
CREATE INDEX IF NOT EXISTS duel_user_idx ON public.tilt_duels(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS notification_user_idx ON public.notifications(recipient_id,created_at DESC);
CREATE INDEX IF NOT EXISTS rating_cooldown_idx ON public.rating_events(user_id,category_id,created_at DESC) WHERE rated;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public' CHECK(visibility IN ('public','friends','private'));
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS reference_kind text NOT NULL DEFAULT 'name' CHECK(reference_kind IN ('name','person','website','place','tool'));
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS reference_label text NOT NULL DEFAULT 'Nome del soggetto';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS requires_url boolean NOT NULL DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS allowed_kinds text[] NOT NULL DEFAULT ARRAY['photo','illustration','ai_art']::text[] CHECK(cardinality(allowed_kinds)>0 AND allowed_kinds <@ ARRAY['photo','illustration','ai_art','ai_tool']::text[]);
ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS content_items_title_check;
ALTER TABLE public.content_items ADD CONSTRAINT content_items_title_check CHECK(length(title) BETWEEN 1 AND 80);

ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_depth_check;
ALTER TABLE public.categories ADD CONSTRAINT categories_depth_check CHECK(depth BETWEEN 1 AND 32);
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS aliases text[] NOT NULL DEFAULT ARRAY[]::text[];
ALTER TABLE public.vote_slots ADD COLUMN IF NOT EXISTS origin_content_id uuid REFERENCES public.content_items ON DELETE SET NULL;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT ARRAY[]::text[] CHECK(cardinality(tags)<=20);
CREATE TABLE IF NOT EXISTS public.category_follows (
 user_id uuid REFERENCES public.profiles ON DELETE CASCADE, category_id uuid REFERENCES public.categories ON DELETE CASCADE,
 PRIMARY KEY(user_id,category_id)
);
CREATE TABLE IF NOT EXISTS public.creator_duel_ratings (
 category_id uuid REFERENCES public.categories, author_id uuid REFERENCES public.profiles ON DELETE CASCADE,
 rating numeric NOT NULL DEFAULT 1500, matches integer NOT NULL DEFAULT 0 CHECK(matches>=0),
 wins integer NOT NULL DEFAULT 0 CHECK(wins>=0), losses integer NOT NULL DEFAULT 0 CHECK(losses>=0),
 PRIMARY KEY(category_id,author_id), CHECK(matches=wins+losses)
);
CREATE TABLE IF NOT EXISTS public.creator_rating_events (
 duel_id uuid PRIMARY KEY REFERENCES public.tilt_duels ON DELETE CASCADE, user_id uuid REFERENCES public.profiles ON DELETE SET NULL,
 category_id uuid REFERENCES public.categories, winner_id uuid, loser_id uuid, rated boolean NOT NULL,
 formula_version text NOT NULL DEFAULT 'creator-elo-1500-k32-v1', old_winner numeric, new_winner numeric, old_loser numeric, new_loser numeric,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.creator_ranking_snapshots (
 date_utc date, category_id uuid REFERENCES public.categories, author_id uuid REFERENCES public.profiles ON DELETE CASCADE,
 support integer NOT NULL CHECK(support>=0), PRIMARY KEY(date_utc,category_id,author_id)
);
CREATE TABLE IF NOT EXISTS private.model_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS private.legacy_membership_archive (
 content_id uuid, category_id uuid, membership jsonb NOT NULL, archived_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(content_id,category_id)
);

CREATE OR REPLACE FUNCTION api.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.user_id',true),'')::uuid $$;
CREATE OR REPLACE FUNCTION api.is_mod() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=api.uid() AND role IN ('admin','moderator')) $$;
CREATE OR REPLACE FUNCTION api.blocked(a uuid,b uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_blocks WHERE (blocker_id=a AND blocked_id=b) OR (blocker_id=b AND blocked_id=a)) $$;
CREATE OR REPLACE FUNCTION api.friends(a uuid,b uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.friendships WHERE user_low_id=least(a,b) AND user_high_id=greatest(a,b)) $$;
CREATE OR REPLACE FUNCTION api.can_read(c public.content_items) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT NOT api.blocked(api.uid(),c.author_id) AND EXISTS(SELECT 1 FROM public.profiles WHERE id=c.author_id AND NOT suspended)
 AND ((c.moderation_status='approved' AND (c.visibility='public' OR (c.visibility='friends' AND api.friends(api.uid(),c.author_id)))) OR (api.uid()=c.author_id AND c.moderation_status<>'removed') OR api.is_mod()) $$;
CREATE OR REPLACE FUNCTION api.content_json(cid uuid, cat uuid DEFAULT NULL) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('id',c.id,'title',coalesce((SELECT subject_name FROM public.content_metadata WHERE content_id=c.id AND category_id=cat),c.title),'caption',c.caption,'kind',c.kind,'provenance',c.provenance,
 'status',c.moderation_status,'visibility',c.visibility,'reviewReason',c.review_reason,'authorId',p.id,'handle',p.handle,'displayName',p.display_name,
 'mediaUrl','/media/'||c.id,'categoryId',cat,'categoryTitle',(SELECT title FROM public.categories WHERE id=cat),
 'reference',(SELECT jsonb_build_object('name',m.subject_name,'url',m.reference_url,'label',rules.reference_label,'kind',rules.reference_kind)
   FROM public.content_metadata m JOIN public.categories rules ON rules.id=m.category_id WHERE m.content_id=c.id AND m.category_id=cat),
 'references',coalesce((SELECT jsonb_agg(jsonb_build_object('categoryId',m.category_id,'categoryTitle',rules.title,'name',m.subject_name,'url',m.reference_url,'label',rules.reference_label,'kind',rules.reference_kind,'status',cc.status))
   FROM public.content_metadata m JOIN public.categories rules ON rules.id=m.category_id JOIN public.content_categories cc ON cc.content_id=m.content_id AND cc.category_id=m.category_id
   WHERE m.content_id=c.id AND rules.status='published' AND (cc.status='approved' OR c.author_id=api.uid() OR api.is_mod())),'[]'))
 FROM public.content_items c JOIN public.profiles p ON p.id=c.author_id WHERE c.id=cid AND api.can_read(c)
 AND (cat IS NULL OR EXISTS(SELECT 1 FROM public.content_categories cc JOIN public.categories rules ON rules.id=cc.category_id
 WHERE cc.content_id=c.id AND cc.category_id=cat AND rules.status='published' AND (cc.status='approved' OR c.author_id=api.uid() OR api.is_mod()))) $$;

CREATE OR REPLACE FUNCTION api.validate_candidate(cid uuid,cat uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.categories WHERE id=cat AND status='published') THEN RAISE EXCEPTION 'CATEGORY_NOT_LEAF'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.content_items c JOIN public.content_categories cc ON cc.content_id=c.id
   JOIN public.profiles p ON p.id=c.author_id WHERE c.id=cid AND cc.category_id=cat AND cc.status='approved'
   AND c.moderation_status='approved' AND NOT p.suspended) THEN RAISE EXCEPTION 'CONTENT_UNAVAILABLE'; END IF;
 IF EXISTS(SELECT 1 FROM public.content_items WHERE id=cid AND api.blocked(api.uid(),author_id)) THEN RAISE EXCEPTION 'BLOCKED_CONTENT'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.content_items c WHERE c.id=cid AND api.can_read(c)) THEN RAISE EXCEPTION 'CONTENT_UNAVAILABLE'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.content_metadata m JOIN public.categories c ON c.id=m.category_id WHERE m.content_id=cid AND m.category_id=cat AND length(trim(m.subject_name))>0 AND (NOT c.requires_url OR nullif(m.reference_url,'') IS NOT NULL)) THEN RAISE EXCEPTION 'METADATA_REQUIRED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.categories rules JOIN public.content_items c ON c.id=cid WHERE rules.id=cat AND c.kind=ANY(rules.allowed_kinds)) THEN RAISE EXCEPTION 'INVALID_CONTENT_KIND'; END IF;
END $$;

CREATE OR REPLACE FUNCTION api.vote(p jsonb, action_name text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 u uuid:=api.uid(); op uuid:=(p->>'clientOperationId')::uuid; cat uuid; cid uuid; did uuid;
 slot public.vote_slots; duel public.tilt_duels; receipt public.operation_receipts; result jsonb; winner uuid; loser uuid;
 win_rating numeric; lose_rating numeric; delta numeric; is_rated boolean; changed boolean; win_author uuid; lose_author uuid;
BEGIN
 IF u IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND NOT suspended) THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 IF op IS NULL THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
 -- debt: serialisation globale pour demo locale; raffiner par categorie apres mesure d'un goulot de contention.
 -- All vote/moderation/block/deletion mutations acquire this lock before row locks.
 PERFORM pg_advisory_xact_lock(8815001);
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND NOT suspended) THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 SELECT * INTO receipt FROM public.operation_receipts WHERE user_id=u AND operation_id=op AND action=action_name||':creator-v1';
 IF FOUND THEN
   IF receipt.fingerprint<>md5(p::text) THEN RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSE'; END IF;
   RETURN receipt.result_json;
 END IF;
 IF action_name='vote_intent' THEN
   cat:=(p->>'categoryId')::uuid; cid:=(p->>'contentId')::uuid;
   PERFORM api.validate_candidate(cid,cat);
   INSERT INTO public.vote_slots(user_id,category_id) VALUES(u,cat) ON CONFLICT DO NOTHING;
   SELECT * INTO slot FROM public.vote_slots WHERE user_id=u AND category_id=cat FOR UPDATE;
   IF slot.champion_content_id IS NULL THEN
     UPDATE public.vote_slots SET champion_content_id=cid,origin_content_id=cid,version=version+1,updated_at=now() WHERE user_id=u AND category_id=cat RETURNING * INTO slot;
     INSERT INTO public.vote_events(user_id,category_id,kind,new_content_id) VALUES(u,cat,'initial',cid);
     result:=jsonb_build_object('kind','INITIAL_VOTE','championId',cid,'slotVersion',slot.version);
   ELSIF (SELECT author_id FROM public.content_items WHERE id=slot.champion_content_id)=(SELECT author_id FROM public.content_items WHERE id=cid) THEN
     result:=jsonb_build_object('kind','ALREADY_CHAMPION','championId',cid,'slotVersion',slot.version);
   ELSE
     PERFORM api.validate_candidate(slot.champion_content_id,cat);
     UPDATE public.tilt_duels SET status='superseded' WHERE user_id=u AND category_id=cat AND status='pending';
     INSERT INTO public.tilt_duels(user_id,category_id,incumbent_id,challenger_id,expected_slot_version)
       VALUES(u,cat,slot.champion_content_id,cid,slot.version) RETURNING * INTO duel;
     result:=jsonb_build_object('kind','TILT_REQUIRED','duelId',duel.id,'categoryId',cat,'incumbentId',duel.incumbent_id,
       'challengerId',cid,'expectedSlotVersion',slot.version,'expiresAt',duel.expires_at);
   END IF;
 ELSIF action_name IN ('resolve_tilt','cancel_tilt') THEN
   did:=(p->>'duelId')::uuid;
   SELECT * INTO duel FROM public.tilt_duels WHERE id=did AND user_id=u;
   IF NOT FOUND THEN RAISE EXCEPTION 'DUEL_NOT_FOUND'; END IF;
   cat:=duel.category_id;
   SELECT * INTO slot FROM public.vote_slots WHERE user_id=u AND category_id=cat FOR UPDATE;
   SELECT * INTO duel FROM public.tilt_duels WHERE id=did FOR UPDATE;
   IF duel.status='superseded' THEN RAISE EXCEPTION 'DUEL_SUPERSEDED'; END IF;
   IF duel.status<>'pending' THEN RAISE EXCEPTION 'DUEL_STALE'; END IF;
   IF duel.expires_at<=now() THEN RAISE EXCEPTION 'DUEL_EXPIRED'; END IF;
   IF slot.version<>duel.expected_slot_version OR slot.champion_content_id IS DISTINCT FROM duel.incumbent_id THEN RAISE EXCEPTION 'DUEL_STALE'; END IF;
   IF action_name='cancel_tilt' THEN
     UPDATE public.tilt_duels SET status='cancelled' WHERE id=did;
     result:=jsonb_build_object('kind','TILT_CANCELLED','duelId',did);
   ELSE
     IF p->>'winnerSide' NOT IN ('INCUMBENT','CHALLENGER') OR p->>'winnerSide' IS NULL THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
     PERFORM api.validate_candidate(duel.incumbent_id,cat); PERFORM api.validate_candidate(duel.challenger_id,cat);
     changed:=(p->>'winnerSide'='CHALLENGER');
     winner:=CASE WHEN changed THEN duel.challenger_id ELSE duel.incumbent_id END;
     loser:=CASE WHEN changed THEN duel.incumbent_id ELSE duel.challenger_id END;
     IF changed THEN
       UPDATE public.vote_slots SET champion_content_id=winner,origin_content_id=winner,version=version+1,updated_at=now() WHERE user_id=u AND category_id=cat RETURNING * INTO slot;
     END IF;
     INSERT INTO public.vote_events(user_id,category_id,kind,old_content_id,new_content_id,duel_id)
       VALUES(u,cat,CASE WHEN changed THEN 'transfer' ELSE 'confirmed' END,duel.incumbent_id,winner,did);
     SELECT author_id INTO win_author FROM public.content_items WHERE id=winner;
     SELECT author_id INTO lose_author FROM public.content_items WHERE id=loser;
     IF win_author=lose_author THEN RAISE EXCEPTION 'DUEL_STALE'; END IF;
     INSERT INTO public.creator_duel_ratings(category_id,author_id) VALUES(cat,win_author),(cat,lose_author) ON CONFLICT DO NOTHING;
     PERFORM author_id FROM public.creator_duel_ratings WHERE category_id=cat AND author_id IN(win_author,lose_author) ORDER BY author_id FOR UPDATE;
     SELECT rating INTO win_rating FROM public.creator_duel_ratings WHERE category_id=cat AND author_id=win_author;
     SELECT rating INTO lose_rating FROM public.creator_duel_ratings WHERE category_id=cat AND author_id=lose_author;
     is_rated:=NOT EXISTS(SELECT 1 FROM public.creator_rating_events WHERE user_id=u AND category_id=cat AND rated AND created_at>now()-interval '24 hours'
       AND least(winner_id,loser_id)=least(win_author,lose_author) AND greatest(winner_id,loser_id)=greatest(win_author,lose_author));
     delta:=CASE WHEN is_rated THEN 32*(1-1/(1+power(10::numeric,(lose_rating-win_rating)/400))) ELSE 0 END;
     IF is_rated THEN
       UPDATE public.creator_duel_ratings SET rating=rating+delta,matches=matches+1,wins=wins+1 WHERE category_id=cat AND author_id=win_author;
       UPDATE public.creator_duel_ratings SET rating=rating-delta,matches=matches+1,losses=losses+1 WHERE category_id=cat AND author_id=lose_author;
     END IF;
     INSERT INTO public.creator_rating_events(duel_id,user_id,category_id,winner_id,loser_id,rated,old_winner,new_winner,old_loser,new_loser)
       VALUES(did,u,cat,win_author,lose_author,is_rated,win_rating,win_rating+delta,lose_rating,lose_rating-delta);
     UPDATE public.tilt_duels SET status='resolved',winner_side=p->>'winnerSide',resolved_at=now() WHERE id=did;
     UPDATE public.tilt_duels SET status='superseded' WHERE user_id=u AND category_id=cat AND status='pending';
     result:=jsonb_build_object('kind','TILT_RESOLVED','duelId',did,'categoryId',cat,'winnerContentId',winner,
       'championContentId',winner,'didChampionChange',changed,'slotVersion',slot.version,'rated',is_rated);
   END IF;
 ELSE RAISE EXCEPTION 'INVALID_ACTION'; END IF;
 result:=result||jsonb_build_object('receiptId',op);
 INSERT INTO public.operation_receipts VALUES(u,op,action_name||':creator-v1',md5(p::text),result,now());
 RETURN result;
END $$;

-- The API role can read only through RLS or constrained SECURITY DEFINER functions.
DO $policies$
DECLARE t text;
BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
   EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
   EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC',t);
 END LOOP;
END $policies$;
DROP POLICY IF EXISTS visible_profiles ON public.profiles;
CREATE POLICY visible_profiles ON public.profiles FOR SELECT USING(NOT suspended AND NOT api.blocked(api.uid(),id) AND (visibility='public' OR id=api.uid() OR (visibility='friends' AND api.friends(id,api.uid()))));
DROP POLICY IF EXISTS visible_categories ON public.categories;
CREATE POLICY visible_categories ON public.categories FOR SELECT USING(status='published');
DROP POLICY IF EXISTS visible_content ON public.content_items;
CREATE POLICY visible_content ON public.content_items FOR SELECT USING(api.can_read(content_items));
DROP POLICY IF EXISTS own_settings ON public.profile_settings;
CREATE POLICY own_settings ON public.profile_settings FOR SELECT USING(user_id=api.uid());
DROP POLICY IF EXISTS own_roles ON public.user_roles;
CREATE POLICY own_roles ON public.user_roles FOR SELECT USING(user_id=api.uid());
DROP POLICY IF EXISTS own_slots ON public.vote_slots;
CREATE POLICY own_slots ON public.vote_slots FOR SELECT USING(user_id=api.uid());
DROP POLICY IF EXISTS own_duels ON public.tilt_duels;
CREATE POLICY own_duels ON public.tilt_duels FOR SELECT USING(user_id=api.uid());
DROP POLICY IF EXISTS own_notifications ON public.notifications;
CREATE POLICY own_notifications ON public.notifications FOR SELECT USING(recipient_id=api.uid());
DROP POLICY IF EXISTS visible_metadata ON public.content_metadata;
CREATE POLICY visible_metadata ON public.content_metadata FOR SELECT USING(EXISTS(SELECT 1 FROM public.content_items c JOIN public.content_categories cc ON cc.content_id=c.id JOIN public.categories rules ON rules.id=cc.category_id WHERE c.id=content_metadata.content_id AND cc.category_id=content_metadata.category_id AND rules.status='published' AND api.can_read(c) AND (cc.status='approved' OR c.author_id=api.uid() OR api.is_mod())));
DROP POLICY IF EXISTS visible_memberships ON public.content_categories;
CREATE POLICY visible_memberships ON public.content_categories FOR SELECT USING(EXISTS(SELECT 1 FROM public.content_items c WHERE c.id=content_categories.content_id AND api.can_read(c) AND (content_categories.status='approved' OR c.author_id=api.uid() OR api.is_mod())));
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA api FROM PUBLIC;
