CREATE OR REPLACE FUNCTION api.search_text(value text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
 SELECT lower(translate(coalesce(value,''),'àáâäãåèéêëìíîïòóôöõùúûüçÀÁÂÄÃÅÈÉÊËÌÍÎÏÒÓÔÖÕÙÚÛÜÇ#','aaaaaaeeeeiiiiooooouuuucAAAAAAEEEEIIIIOOOOOUUUUC')) $$;

-- Creator preferences retain an image as evidence, never as a second vote.
CREATE OR REPLACE FUNCTION api.category_path(cat uuid) RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 WITH RECURSIVE lineage AS (
  SELECT id,parent_id,title,depth FROM public.categories WHERE id=cat AND status='published'
  UNION ALL SELECT c.id,c.parent_id,c.title,c.depth FROM public.categories c JOIN lineage l ON c.id=l.parent_id WHERE c.status='published' AND c.depth<l.depth
 ) SELECT coalesce(array_agg(title ORDER BY depth),ARRAY[]::text[]) FROM lineage $$;

CREATE OR REPLACE FUNCTION api.catalog_json() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('path',api.category_path(c.id),'terminal',NOT EXISTS(SELECT 1 FROM public.categories ch WHERE ch.parent_id=c.id AND ch.status='published'),'isFollowing',EXISTS(SELECT 1 FROM public.category_follows f WHERE f.user_id=api.uid() AND f.category_id=c.id)) ORDER BY CASE WHEN c.slug LIKE 'editorial-%' THEN 0 ELSE 1 END,c.sort_order,c.title),'[]') FROM public.categories c WHERE c.status='published' $$;

CREATE OR REPLACE FUNCTION api.preference_active(slot public.vote_slots) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.content_items c
 JOIN public.content_categories cc ON cc.content_id=c.id AND cc.category_id=slot.category_id AND cc.status='approved'
 JOIN public.categories cat ON cat.id=cc.category_id AND cat.status='published'
 JOIN public.content_metadata m ON m.content_id=c.id AND m.category_id=cat.id
 JOIN public.profiles author ON author.id=c.author_id AND NOT author.suspended
 JOIN public.profiles voter ON voter.id=slot.user_id AND NOT voter.suspended
 WHERE c.id=slot.champion_content_id AND c.moderation_status='approved' AND c.kind=ANY(cat.allowed_kinds)
 AND trim(m.subject_name)<>'' AND (NOT cat.requires_url OR nullif(m.reference_url,'') IS NOT NULL)
 AND NOT api.blocked(slot.user_id,c.author_id)
 AND (c.visibility='public' OR slot.user_id=c.author_id OR (c.visibility='friends' AND api.friends(slot.user_id,c.author_id)))) $$;

CREATE OR REPLACE FUNCTION api.creator_support(creator uuid,cat uuid) RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT count(*) FROM public.vote_slots s JOIN public.content_items c ON c.id=s.champion_content_id
 JOIN public.profiles voter ON voter.id=s.user_id AND NOT voter.suspended
 WHERE c.author_id=creator AND s.category_id=cat AND api.preference_active(s) $$;

CREATE OR REPLACE FUNCTION api.creator_representative(creator uuid,cat uuid,viewer uuid,excluded uuid DEFAULT NULL) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT c.id FROM public.content_items c JOIN public.content_categories cc ON cc.content_id=c.id AND cc.category_id=cat AND cc.status='approved'
 JOIN public.categories rules ON rules.id=cat AND rules.status='published'
 JOIN public.profiles pr ON pr.id=c.author_id AND NOT pr.suspended
 JOIN public.content_metadata m ON m.content_id=c.id AND m.category_id=cat
 WHERE c.author_id=creator AND c.id IS DISTINCT FROM excluded AND c.moderation_status='approved'
 AND NOT api.blocked(viewer,creator) AND (c.visibility='public' OR viewer=creator OR (c.visibility='friends' AND api.friends(viewer,creator)))
 AND c.kind=ANY(rules.allowed_kinds) AND trim(m.subject_name)<>'' AND (NOT rules.requires_url OR nullif(m.reference_url,'') IS NOT NULL)
 ORDER BY c.approved_at DESC NULLS LAST,c.created_at DESC,c.id LIMIT 1 $$;

CREATE OR REPLACE FUNCTION api.creator_ranking(p jsonb) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE cat uuid:=(p->>'categoryId')::uuid; metric text:=coalesce(p->>'metric','popular'); day date:=(now() AT TIME ZONE 'UTC')::date;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.categories WHERE id=cat AND status='published') THEN RAISE EXCEPTION 'CATEGORY_UNAVAILABLE'; END IF;
 IF metric='trend' AND NOT EXISTS(SELECT 1 FROM public.creator_ranking_snapshots WHERE date_utc=day-7 AND category_id=cat) THEN
  RETURN jsonb_build_object('items','[]'::jsonb,'insufficientHistory',true,'voteModel','creator-v1');
 END IF;
 RETURN jsonb_build_object('items',coalesce((WITH authors AS (
  SELECT DISTINCT c.author_id FROM public.content_items c JOIN public.content_categories cc ON cc.content_id=c.id AND cc.category_id=cat AND cc.status='approved'
  WHERE c.moderation_status='approved' AND api.can_read(c)
 ), scores AS (
  SELECT a.author_id,api.creator_representative(a.author_id,cat,api.uid()) representative,
  api.creator_support(a.author_id,cat) support,coalesce(r.rating,1500) rating,coalesce(r.matches,0) matches,
  api.creator_support(a.author_id,cat)-coalesce(snap.support,0) trend,
  CASE WHEN metric='elo' THEN coalesce(r.rating,1500) WHEN metric='trend' THEN api.creator_support(a.author_id,cat)-coalesce(snap.support,0) ELSE api.creator_support(a.author_id,cat) END score
  FROM authors a LEFT JOIN public.creator_duel_ratings r ON r.author_id=a.author_id AND r.category_id=cat
  LEFT JOIN public.creator_ranking_snapshots snap ON snap.author_id=a.author_id AND snap.category_id=cat AND snap.date_utc=day-7
 ), positions AS (
  SELECT scores.*,rank() OVER(ORDER BY score DESC) position,count(*) FILTER(WHERE support>0) OVER() participants FROM scores WHERE representative IS NOT NULL
 ) SELECT jsonb_agg(x.item ORDER BY x.position,x.author_id) FROM (
  SELECT positions.*,api.content_json(representative,cat)||jsonb_build_object('support',support,'rating',rating,'matches',matches,'trend',trend,'position',position,'participants',participants,'voteModel','creator-v1') item
  FROM positions WHERE coalesce(p->>'query','')='' OR EXISTS(SELECT 1 FROM public.profiles pr WHERE pr.id=author_id AND (pr.handle ILIKE '%'||(p->>'query')||'%' OR pr.display_name ILIKE '%'||(p->>'query')||'%'))
  OR api.content_json(representative,cat)->>'title' ILIKE '%'||(p->>'query')||'%'
  ORDER BY position,author_id LIMIT 100
 ) x),'[]'),'insufficientHistory',false,'voteModel','creator-v1');
END $$;

CREATE OR REPLACE FUNCTION api.catalog_rankings(p jsonb) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 WITH RECURSIVE paths AS (
  SELECT id,parent_id,depth,title,description,ARRAY[title] path,aliases search_aliases FROM public.categories WHERE parent_id IS NULL AND status='published'
  UNION ALL SELECT c.id,c.parent_id,c.depth,c.title,c.description,paths.path||c.title,paths.search_aliases||c.aliases FROM public.categories c JOIN paths ON c.parent_id=paths.id WHERE c.status='published' AND c.depth=paths.depth+1
 ), candidates AS (
  SELECT cat.id,cat.title,cat.description,cat.path,
  (SELECT count(*) FROM public.vote_slots s JOIN public.content_items c ON c.id=s.champion_content_id WHERE s.category_id=cat.id AND api.preference_active(s) AND api.creator_representative(c.author_id,cat.id,api.uid()) IS NOT NULL) "voteCount",
  (SELECT count(*) FROM public.content_categories cc JOIN public.content_items c ON c.id=cc.content_id WHERE cc.category_id=cat.id AND cc.status='approved' AND c.moderation_status='approved' AND api.can_read(c)) "contentCount"
  FROM paths cat WHERE CASE WHEN p ? 'candidateIds' THEN cat.id::text IN (SELECT jsonb_array_elements_text(p->'candidateIds')) ELSE NOT EXISTS(SELECT 1 FROM regexp_split_to_table(trim(coalesce(p->>'query','')),'\s+') term WHERE term<>'' AND api.search_text(array_to_string(cat.path||cat.search_aliases,' ')) NOT LIKE '%'||api.search_text(term)||'%') END
 ), selected AS (
  SELECT * FROM candidates WHERE coalesce(p->>'query','')<>'' OR "voteCount">0 ORDER BY "voteCount" DESC,title,id LIMIT CASE WHEN coalesce(p->>'query','')='' THEN 12 ELSE 100 END
 ) SELECT coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('leader',CASE WHEN "voteCount">0 THEN api.creator_ranking(jsonb_build_object('categoryId',id,'metric','popular'))->'items'->0 ELSE NULL END) ORDER BY "voteCount" DESC,title,id),'[]') FROM selected x $$;

CREATE OR REPLACE FUNCTION api.category_follow(p jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u uuid:=api.uid(); cat uuid:=(p->>'categoryId')::uuid;
BEGIN
 IF u IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND NOT suspended) THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 PERFORM pg_advisory_xact_lock(8815001);
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND NOT suspended) THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.categories WHERE id=cat AND status='published') THEN RAISE EXCEPTION 'CATEGORY_UNAVAILABLE'; END IF;
 IF (p->>'following')::boolean THEN INSERT INTO public.category_follows(user_id,category_id) VALUES(u,cat) ON CONFLICT DO NOTHING;
 ELSE DELETE FROM public.category_follows WHERE user_id=u AND category_id=cat; END IF;
 RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION api.creator_profile(creator uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 WITH eligible AS (
  SELECT DISTINCT s.category_id,api.creator_support(creator,s.category_id) preference_count FROM public.vote_slots s JOIN public.content_items c ON c.id=s.champion_content_id
  JOIN public.profiles voter ON voter.id=s.user_id AND NOT voter.suspended
  WHERE c.author_id=creator AND api.preference_active(s) AND api.creator_representative(creator,s.category_id,api.uid()) IS NOT NULL
 ) SELECT jsonb_build_object('preferenceCount',coalesce(sum(preference_count),0),'categoryPreferences',coalesce(jsonb_agg(jsonb_build_object('categoryId',e.category_id,'title',cat.title,'path',api.category_path(e.category_id),'preferences',e.preference_count,'position',(SELECT (item->>'position')::int FROM jsonb_array_elements(api.creator_ranking(jsonb_build_object('categoryId',e.category_id,'metric','popular'))->'items') item WHERE item->>'authorId'=creator::text),'participants',(SELECT (item->>'participants')::int FROM jsonb_array_elements(api.creator_ranking(jsonb_build_object('categoryId',e.category_id,'metric','popular'))->'items') item WHERE item->>'authorId'=creator::text)) ORDER BY e.preference_count DESC,cat.title),'[]')) FROM eligible e JOIN public.categories cat ON cat.id=e.category_id AND cat.status='published' $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA api FROM PUBLIC;

CREATE OR REPLACE FUNCTION api.invalidate_content(cid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE slot public.vote_slots; replacement uuid; creator uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(8815001);
 SELECT author_id INTO creator FROM public.content_items WHERE id=cid;
 FOR slot IN SELECT * FROM public.vote_slots WHERE champion_content_id=cid ORDER BY user_id,category_id FOR UPDATE LOOP
  replacement:=api.creator_representative(creator,slot.category_id,slot.user_id,cid);
  IF replacement IS NULL THEN INSERT INTO public.vote_events(user_id,category_id,kind,old_content_id) VALUES(slot.user_id,slot.category_id,'invalidated',cid); END IF;
  UPDATE public.vote_slots SET champion_content_id=replacement,version=version+1,updated_at=now() WHERE user_id=slot.user_id AND category_id=slot.category_id;
 END LOOP;
 UPDATE public.tilt_duels SET status='stale' WHERE status='pending' AND (incumbent_id=cid OR challenger_id=cid);
END $$;

CREATE OR REPLACE FUNCTION api.content_json_image_v0(cid uuid, cat uuid DEFAULT NULL) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('id',c.id,'title',coalesce((SELECT subject_name FROM public.content_metadata WHERE content_id=c.id AND category_id=cat),c.title),'caption',c.caption,'tags',c.tags,'kind',c.kind,'provenance',c.provenance,
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


CREATE OR REPLACE FUNCTION api.content_json(cid uuid, cat uuid DEFAULT NULL) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 WITH selected AS (SELECT coalesce(cat,(SELECT cc.category_id FROM public.content_categories cc WHERE cc.content_id=cid AND cc.status IN ('approved','pending') ORDER BY cc.category_id LIMIT 1)) category_id), base AS (
 SELECT api.content_json_image_v0(cid,selected.category_id) item,selected.category_id FROM selected)
 SELECT CASE WHEN item IS NULL THEN NULL ELSE item||jsonb_build_object('categoryPath',api.category_path(category_id),'creatorSupport',api.creator_support((item->>'authorId')::uuid,category_id),'originSupport',(SELECT count(*) FROM public.vote_slots s WHERE s.category_id=base.category_id AND s.origin_content_id=cid AND api.preference_active(s)),'voteModel','creator-v1') END FROM base $$;

-- One-time conversion is non-destructive: old image ratings and association rows remain archived.
DO $migration$
BEGIN
 PERFORM pg_advisory_xact_lock(8815001);
 IF NOT EXISTS(SELECT 1 FROM private.model_migrations WHERE name='creator-single-category-v1') THEN
  UPDATE public.vote_slots SET origin_content_id=champion_content_id WHERE origin_content_id IS NULL;
  UPDATE public.tilt_duels SET status='stale' WHERE status='pending';
  INSERT INTO private.legacy_membership_archive(content_id,category_id,membership)
  SELECT content_id,category_id,row_data FROM (
   SELECT cc.*,to_jsonb(cc) row_data,row_number() OVER(PARTITION BY cc.content_id ORDER BY CASE WHEN cc.status='approved' THEN 0 ELSE 1 END,(SELECT count(*) FROM public.vote_slots s WHERE s.champion_content_id=cc.content_id AND s.category_id=cc.category_id) DESC,cc.category_id) ord
   FROM public.content_categories cc WHERE cc.status IN ('approved','pending')) x WHERE ord>1 ON CONFLICT DO NOTHING;
  UPDATE public.content_categories cc SET status='rejected' FROM private.legacy_membership_archive a WHERE a.content_id=cc.content_id AND a.category_id=cc.category_id;
  INSERT INTO public.vote_events(user_id,category_id,kind,old_content_id)
  SELECT s.user_id,s.category_id,'invalidated',s.champion_content_id FROM public.vote_slots s JOIN public.content_categories cc ON cc.content_id=s.champion_content_id AND cc.category_id=s.category_id WHERE cc.status<>'approved';
  UPDATE public.vote_slots s SET champion_content_id=NULL,version=version+1,updated_at=now() FROM public.content_categories cc WHERE cc.content_id=s.champion_content_id AND cc.category_id=s.category_id AND cc.status<>'approved';
  INSERT INTO private.model_migrations(name) VALUES('creator-single-category-v1');
 END IF;
END $migration$;
CREATE UNIQUE INDEX IF NOT EXISTS content_single_category_idx ON public.content_categories(content_id) WHERE status IN ('approved','pending');
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA api FROM PUBLIC;
