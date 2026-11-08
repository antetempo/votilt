CREATE OR REPLACE FUNCTION api.register_user(p_id uuid,p_email text,p_hash text,p_handle text,p_name text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF p_handle IN ('admin','moderator','votilt','support','administrator') THEN RAISE EXCEPTION 'HANDLE_RESERVED'; END IF;
 INSERT INTO public.profiles(id,handle,display_name) VALUES(p_id,p_handle,p_name);
 INSERT INTO private.credentials VALUES(p_id,lower(p_email),p_hash);
 INSERT INTO public.profile_settings(user_id) VALUES(p_id);
 INSERT INTO public.user_roles(user_id) VALUES(p_id);
END $$;

CREATE OR REPLACE FUNCTION api.invalidate_content(cid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(8815001);
 PERFORM user_id FROM public.vote_slots WHERE champion_content_id=cid ORDER BY user_id,category_id FOR UPDATE;
 INSERT INTO public.vote_events(user_id,category_id,kind,old_content_id)
 SELECT user_id,category_id,'invalidated',cid FROM public.vote_slots WHERE champion_content_id=cid;
 UPDATE public.vote_slots SET champion_content_id=NULL,version=version+1,updated_at=now() WHERE champion_content_id=cid;
 UPDATE public.tilt_duels SET status='stale' WHERE status='pending' AND (incumbent_id=cid OR challenger_id=cid);
END $$;

CREATE OR REPLACE FUNCTION api.can_compare(a uuid,b uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT a=b OR (NOT api.blocked(a,b) AND api.friends(a,b)
 AND EXISTS(SELECT 1 FROM public.profile_settings WHERE user_id=a AND allow_comparison AND show_champions IN ('friends','public'))
 AND EXISTS(SELECT 1 FROM public.profile_settings WHERE user_id=b AND allow_comparison AND show_champions IN ('friends','public'))) $$;

CREATE OR REPLACE FUNCTION api.dispatch(action_name text,p jsonb DEFAULT '{}'::jsonb) RETURNS jsonb LANGUAGE plpgsql
SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 u uuid:=api.uid(); target uuid; cid uuid; cat uuid; req public.friend_requests; item public.content_items;
 suggestion public.category_suggestions; result jsonb; arr jsonb; n integer; same integer; role_name text;
 categories_array uuid[]; generated_content_id uuid; side text; day date:=(now() AT TIME ZONE 'UTC')::date;
BEGIN
 IF action_name IN ('vote_intent','resolve_tilt','cancel_tilt') THEN RETURN api.vote(p,action_name); END IF;
 IF action_name='search' THEN
  IF nullif(p->>'categoryId','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.categories WHERE id=(p->>'categoryId')::uuid AND depth=4 AND status='published') THEN RAISE EXCEPTION 'CATEGORY_NOT_LEAF'; END IF;
  RETURN coalesce((SELECT jsonb_agg(x.item) FROM (SELECT api.content_json(c.id,m.category_id) item FROM public.content_metadata m JOIN public.content_items c ON c.id=m.content_id JOIN public.categories cat ON cat.id=m.category_id JOIN public.content_categories cc ON cc.content_id=m.content_id AND cc.category_id=m.category_id
   WHERE c.moderation_status='approved' AND cc.status='approved' AND cat.status='published' AND api.can_read(c) AND (nullif(p->>'categoryId','') IS NULL OR cc.category_id=(p->>'categoryId')::uuid) AND (m.subject_name ILIKE '%'||(p->>'query')||'%' OR m.reference_url ILIKE '%'||(p->>'query')||'%') ORDER BY lower(m.subject_name),c.id LIMIT 24)x),'[]');
 ELSIF action_name='categories' THEN
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(c) ORDER BY sort_order,title) FROM public.categories c WHERE status='published'),'[]');
 ELSIF action_name='category_rankings' THEN
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."voteCount" DESC,x.title,x.id) FROM (
   SELECT cat.id,cat.title,cat.description,count(s.user_id) AS "voteCount",count(DISTINCT c.id) AS "contentCount"
   FROM public.categories cat LEFT JOIN public.content_categories cc ON cc.category_id=cat.id AND cc.status='approved'
   LEFT JOIN public.content_items c ON c.id=cc.content_id AND c.moderation_status='approved' AND api.can_read(c)
   LEFT JOIN public.vote_slots s ON s.category_id=cat.id AND s.champion_content_id=c.id
   WHERE cat.depth=4 AND cat.status='published' AND (coalesce(p->>'query','')='' OR cat.title ILIKE '%'||(p->>'query')||'%')
   GROUP BY cat.id ORDER BY count(s.user_id) DESC,cat.title,cat.id LIMIT 100
  )x),'[]');
 ELSIF action_name='feed' THEN
  RETURN jsonb_build_object('items',coalesce((SELECT jsonb_agg(x.item) FROM (
   SELECT api.content_json(c.id,cc.category_id) item FROM public.content_items c
   JOIN public.content_categories cc ON cc.content_id=c.id JOIN public.categories cat ON cat.id=cc.category_id
   WHERE c.moderation_status='approved' AND cc.status='approved' AND cat.status='published' AND api.can_read(c)
   AND (nullif(p->>'categoryId','') IS NULL OR cc.category_id=(p->>'categoryId')::uuid)
   AND (coalesce(p->>'mode','for_you')<>'following' OR EXISTS(SELECT 1 FROM public.follows WHERE follower_id=u AND followed_id=c.author_id))
   ORDER BY md5(c.id::text||cc.category_id::text||coalesce(p->>'seed','votilt'))
   LIMIT least(15,greatest(1,coalesce((p->>'limit')::integer,12))) OFFSET least(100000,greatest(0,coalesce((p->>'offset')::integer,0)))
  ) x),'[]'));
 ELSIF action_name='content' THEN
  cat:=coalesce(nullif(p->>'categoryId','')::uuid,(SELECT cc.category_id FROM public.content_categories cc JOIN public.content_items c ON c.id=cc.content_id WHERE cc.content_id=(p->>'contentId')::uuid AND (cc.status='approved' OR c.author_id=u OR api.is_mod()) ORDER BY cc.category_id LIMIT 1));
  result:=api.content_json((p->>'contentId')::uuid,cat);
  IF result IS NULL THEN RAISE EXCEPTION 'CONTENT_UNAVAILABLE'; END IF;
  RETURN result||jsonb_build_object('categories',coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'title',c.title)) FROM public.content_categories cc JOIN public.categories c ON c.id=cc.category_id JOIN public.content_items author_item ON author_item.id=cc.content_id WHERE cc.content_id=(p->>'contentId')::uuid AND (cc.status='approved' OR author_item.author_id=u OR api.is_mod()) AND c.status='published'),'[]'));
 ELSIF action_name='ranking' THEN
  cat:=(p->>'categoryId')::uuid;
  IF NOT EXISTS(SELECT 1 FROM public.categories WHERE id=cat AND depth=4 AND status='published') THEN RAISE EXCEPTION 'CATEGORY_NOT_LEAF'; END IF;
  IF p->>'metric'='trend' THEN
   IF NOT EXISTS(SELECT 1 FROM public.ranking_snapshots WHERE date_utc=day-7 AND category_id=cat) THEN
     RETURN jsonb_build_object('items','[]'::jsonb,'insufficientHistory',true); END IF;
  END IF;
  RETURN jsonb_build_object('items',coalesce((WITH scores AS (
   SELECT c.id,coalesce(r.matches,0) matches,
    CASE WHEN p->>'metric'='elo' THEN coalesce(r.rating,1500) WHEN p->>'metric'='trend' THEN count(s.user_id)-coalesce(snap.support,0) ELSE count(s.user_id) END score,
    api.content_json(c.id,cat)||jsonb_build_object('support',count(s.user_id),'rating',coalesce(r.rating,1500),'matches',coalesce(r.matches,0),
     'trend',count(s.user_id)-coalesce(snap.support,0)) item
   FROM public.content_items c JOIN public.content_categories cc ON cc.content_id=c.id AND cc.category_id=cat AND cc.status='approved'
   LEFT JOIN public.vote_slots s ON s.champion_content_id=c.id AND s.category_id=cat
   LEFT JOIN public.duel_ratings r ON r.content_id=c.id AND r.category_id=cat
   LEFT JOIN public.ranking_snapshots snap ON snap.content_id=c.id AND snap.category_id=cat AND snap.date_utc=day-7
   WHERE c.moderation_status='approved' AND api.can_read(c)
   GROUP BY c.id,r.matches,r.rating,snap.support
  ), positions AS (SELECT scores.*,row_number() OVER(ORDER BY score DESC,matches DESC,id) position FROM scores), filtered AS (
   SELECT positions.* FROM positions WHERE coalesce(p->>'query','')='' OR positions.item->>'title' ILIKE '%'||(p->>'query')||'%' OR positions.item->'reference'->>'url' ILIKE '%'||(p->>'query')||'%' ORDER BY positions.position LIMIT 50
  ) SELECT jsonb_agg(filtered.item||jsonb_build_object('position',filtered.position) ORDER BY filtered.position) FROM filtered),'[]'),'insufficientHistory',false);
 ELSIF action_name='profile' THEN
  target:=(p->>'userId')::uuid;
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=target AND NOT suspended AND NOT api.blocked(u,id)
   AND (visibility='public' OR id=u OR (visibility='friends' AND api.friends(id,u)))) THEN RAISE EXCEPTION 'PROFILE_UNAVAILABLE'; END IF;
  SELECT to_jsonb(pr)||jsonb_build_object('isFollowing',EXISTS(SELECT 1 FROM public.follows WHERE follower_id=u AND followed_id=target),
   'isFriend',api.friends(u,target),'contentCount',(SELECT count(*) FROM public.content_items WHERE author_id=target AND moderation_status='approved'),
   'followerCount',(SELECT count(*) FROM public.follows WHERE followed_id=target)) INTO result FROM public.profiles pr WHERE id=target;
  RETURN result;
 ELSIF action_name='daily' THEN
  SELECT d.category_id INTO cat FROM public.daily_challenges d JOIN public.categories c ON c.id=d.category_id WHERE d.date_utc=day AND c.status='published' AND c.depth=4;
  IF cat IS NULL THEN SELECT id INTO cat FROM public.categories WHERE depth=4 AND status='published' ORDER BY md5(id::text||day::text) LIMIT 1; END IF;
  RETURN jsonb_build_object('dateUtc',day,'categoryId',cat,'title',(SELECT title FROM public.categories WHERE id=cat));
 ELSIF action_name='quiz' THEN
  RETURN jsonb_build_object('items',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'mediaUrl','/quiz-media/'||id))
   FROM private.quiz_items WHERE enabled AND NOT test_only),'[]'),'message','Servono fotografie reali con provenienza verificata. Il quiz aprirà quando il catalogo sarà pronto.');
 END IF;
 IF u IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND NOT suspended) THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 IF action_name='me' THEN
  RETURN (SELECT to_jsonb(pr)||jsonb_build_object('settings',to_jsonb(s),'role',r.role,
   'interests',coalesce((SELECT jsonb_agg(category_id) FROM public.user_category_interests WHERE user_id=u),'[]'))
   FROM public.profiles pr JOIN public.profile_settings s ON s.user_id=pr.id JOIN public.user_roles r ON r.user_id=pr.id WHERE pr.id=u);
 ELSIF action_name='champions' THEN
  target:=coalesce((p->>'userId')::uuid,u);
  IF target<>u AND (api.blocked(u,target) OR NOT EXISTS(SELECT 1 FROM public.profile_settings WHERE user_id=target AND (show_champions='public' OR (show_champions='friends' AND api.friends(u,target))))) THEN RAISE EXCEPTION 'CHAMPIONS_PRIVATE'; END IF;
  RETURN coalesce((SELECT jsonb_agg(api.content_json(s.champion_content_id,s.category_id)||jsonb_build_object('slotVersion',s.version) ORDER BY c.title)
   FROM public.vote_slots s JOIN public.categories c ON c.id=s.category_id WHERE s.user_id=target AND s.champion_content_id IS NOT NULL
   AND api.content_json(s.champion_content_id,s.category_id) IS NOT NULL),'[]');
 ELSIF action_name='duel' THEN
  RETURN (SELECT to_jsonb(d)||jsonb_build_object('incumbent',api.content_json(incumbent_id,category_id),'challenger',api.content_json(challenger_id,category_id))
   FROM public.tilt_duels d WHERE id=(p->>'duelId')::uuid AND user_id=u);
 ELSIF action_name='history' THEN
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT d.id,d.category_id,d.status,d.winner_side,d.created_at,c.title category_title
   FROM public.tilt_duels d JOIN public.categories c ON c.id=d.category_id WHERE d.user_id=u ORDER BY created_at DESC LIMIT 50)x),'[]');
 ELSIF action_name='notifications' THEN
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT * FROM public.notifications WHERE recipient_id=u ORDER BY created_at DESC LIMIT 50)x),'[]');
 ELSIF action_name='social' THEN
  RETURN jsonb_build_object('people',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT pr.id,pr.handle,pr.display_name,pr.bio,api.friends(u,pr.id) is_friend,
    EXISTS(SELECT 1 FROM public.follows WHERE follower_id=u AND followed_id=pr.id) is_following
    FROM public.profiles pr WHERE pr.id<>u AND NOT pr.suspended AND NOT api.blocked(u,pr.id)
    AND (pr.visibility='public' OR (pr.visibility='friends' AND api.friends(u,pr.id))) AND (coalesce(p->>'search','')='' OR pr.handle ILIKE '%'||(p->>'search')||'%')
    ORDER BY pr.handle LIMIT 30)x),'[]'),
    'requests',coalesce((SELECT jsonb_agg(to_jsonb(fr)||jsonb_build_object('handle',pr.handle)) FROM public.friend_requests fr
      JOIN public.profiles pr ON pr.id=fr.requester_id WHERE fr.recipient_id=u AND fr.status='pending' AND NOT api.blocked(u,pr.id)),'[]'),
    'outgoing',coalesce((SELECT jsonb_agg(recipient_id) FROM public.friend_requests WHERE requester_id=u AND status='pending'),'[]'));
 ELSIF action_name='taste_match' THEN
  target:=(p->>'userId')::uuid;
  IF NOT api.can_compare(u,target) THEN RAISE EXCEPTION 'CHAMPIONS_PRIVATE'; END IF;
  SELECT count(*),count(*) FILTER(WHERE a.champion_content_id=b.champion_content_id) INTO n,same
   FROM public.vote_slots a JOIN public.vote_slots b USING(category_id) WHERE a.user_id=u AND b.user_id=target
   AND a.champion_content_id IS NOT NULL AND b.champion_content_id IS NOT NULL;
  RETURN jsonb_build_object('common',n,'same',same,'percentage',CASE WHEN n>=3 THEN round(100.0*same/n) ELSE NULL END);
 ELSIF action_name='my_uploads' THEN
  RETURN coalesce((SELECT jsonb_agg(api.content_json(id,NULL) ORDER BY created_at DESC) FROM public.content_items WHERE author_id=u AND moderation_status<>'removed'),'[]');
 ELSIF action_name='moderation' THEN
  IF NOT api.is_mod() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  RETURN jsonb_build_object('contents',coalesce((SELECT jsonb_agg(api.content_json(id,NULL) ORDER BY created_at) FROM public.content_items WHERE moderation_status=coalesce(p->>'status','pending_review') AND api.can_read(content_items)),'[]'),
   'users',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'handle',handle,'suspended',suspended)) FROM (SELECT id,handle,suspended FROM public.profiles WHERE length(coalesce(p->>'search',''))>=2 AND handle ILIKE '%'||(p->>'search')||'%' ORDER BY handle LIMIT 15)x),'[]'),
   'reports',coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM public.reports r WHERE status='pending'),'[]'),
   'suggestions',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM public.category_suggestions s WHERE status='pending'),'[]'),
   'audit',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT * FROM public.moderation_actions ORDER BY created_at DESC LIMIT 30)x),'[]'));
 ELSIF action_name='my_suggestions' THEN
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM public.category_suggestions s WHERE proposer_id=u),'[]');
 ELSIF action_name='battle' THEN
  SELECT recipient_id,category_id INTO target,cat FROM public.battle_shares
   WHERE id=(p->>'battleId')::uuid AND (creator_id=u OR recipient_id=u) AND NOT revoked AND expires_at>now();
  IF target=u THEN SELECT creator_id INTO target FROM public.battle_shares WHERE id=(p->>'battleId')::uuid; END IF;
  IF target IS NULL THEN RAISE EXCEPTION 'INVITE_UNAVAILABLE'; END IF;
  IF NOT api.can_compare(u,target) THEN RAISE EXCEPTION 'CHAMPIONS_PRIVATE'; END IF;
  RETURN jsonb_build_object('categoryId',cat,'mine',(SELECT api.content_json(champion_content_id,cat) FROM public.vote_slots WHERE user_id=u AND category_id=cat),
    'friend',(SELECT api.content_json(champion_content_id,cat) FROM public.vote_slots WHERE user_id=target AND category_id=cat));
 END IF;

 PERFORM pg_advisory_xact_lock(8815001);
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND NOT suspended) THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 IF action_name='settings' THEN
  UPDATE public.profile_settings SET show_champions=coalesce(p->>'showChampions',show_champions),
   allow_comparison=coalesce((p->>'allowComparison')::boolean,allow_comparison),haptics=coalesce((p->>'haptics')::boolean,haptics),
   reduce_motion=coalesce((p->>'reduceMotion')::boolean,reduce_motion) WHERE user_id=u;
 ELSIF action_name='interests' THEN
  SELECT array_agg(value::uuid) INTO categories_array FROM jsonb_array_elements_text(p->'categoryIds');
  IF cardinality(categories_array)>50 OR EXISTS(SELECT 1 FROM unnest(categories_array)x WHERE NOT EXISTS(SELECT 1 FROM public.categories WHERE id=x AND status='published')) THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  DELETE FROM public.user_category_interests WHERE user_id=u;
  INSERT INTO public.user_category_interests SELECT u,x FROM unnest(categories_array)x ON CONFLICT DO NOTHING;
  UPDATE public.profile_settings SET onboarding_complete=true WHERE user_id=u;
 ELSIF action_name='profile_update' THEN
  UPDATE public.profiles SET display_name=coalesce(p->>'displayName',display_name),bio=coalesce(p->>'bio',bio),visibility=coalesce(p->>'visibility',visibility) WHERE id=u;
 ELSIF action_name IN ('follow_toggle','friend_request','block') THEN
  target:=(p->>'userId')::uuid;
  IF target=u OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=target AND NOT suspended) THEN RAISE EXCEPTION 'PROFILE_UNAVAILABLE'; END IF;
  IF action_name<>'block' AND api.blocked(u,target) THEN RAISE EXCEPTION 'PROFILE_UNAVAILABLE'; END IF;
  IF action_name='follow_toggle' THEN
   IF coalesce((p->>'following')::boolean,NOT EXISTS(SELECT 1 FROM public.follows WHERE follower_id=u AND followed_id=target)) THEN
    INSERT INTO public.follows VALUES(u,target) ON CONFLICT DO NOTHING;
   ELSE DELETE FROM public.follows WHERE follower_id=u AND followed_id=target; END IF;
  ELSIF action_name='friend_request' THEN
   IF NOT api.friends(u,target) AND NOT EXISTS(SELECT 1 FROM public.friend_requests WHERE least(requester_id,recipient_id)=least(u,target) AND greatest(requester_id,recipient_id)=greatest(u,target) AND status='pending') THEN
    INSERT INTO public.friend_requests(requester_id,recipient_id) VALUES(u,target);
    INSERT INTO public.notifications(recipient_id,type,title,entity_id) VALUES(target,'friend_request','Hai una nuova richiesta di amicizia',u);
   END IF;
  ELSE
   INSERT INTO public.user_blocks VALUES(u,target) ON CONFLICT DO NOTHING;
   DELETE FROM public.follows WHERE (follower_id=u AND followed_id=target) OR (follower_id=target AND followed_id=u);
   DELETE FROM public.friendships WHERE user_low_id=least(u,target) AND user_high_id=greatest(u,target);
   UPDATE public.friend_requests SET status='cancelled' WHERE status='pending' AND least(requester_id,recipient_id)=least(u,target) AND greatest(requester_id,recipient_id)=greatest(u,target);
   INSERT INTO public.vote_events(user_id,category_id,kind,old_content_id)
    SELECT s.user_id,s.category_id,'invalidated',s.champion_content_id FROM public.vote_slots s JOIN public.content_items c ON c.id=s.champion_content_id
    WHERE (s.user_id=u AND c.author_id=target) OR (s.user_id=target AND c.author_id=u);
   UPDATE public.vote_slots s SET champion_content_id=NULL,version=version+1,updated_at=now() FROM public.content_items c
    WHERE c.id=s.champion_content_id AND ((s.user_id=u AND c.author_id=target) OR (s.user_id=target AND c.author_id=u));
   UPDATE public.tilt_duels d SET status='stale' WHERE d.status='pending' AND EXISTS(SELECT 1 FROM public.content_items c
    WHERE c.id IN(d.incumbent_id,d.challenger_id) AND ((d.user_id=u AND c.author_id=target) OR (d.user_id=target AND c.author_id=u)));
  END IF;
 ELSIF action_name='friend_answer' THEN
  SELECT * INTO req FROM public.friend_requests WHERE id=(p->>'requestId')::uuid AND recipient_id=u AND status='pending' FOR UPDATE;
  IF NOT FOUND OR api.blocked(u,req.requester_id) THEN RAISE EXCEPTION 'REQUEST_UNAVAILABLE'; END IF;
  IF coalesce((p->>'accept')::boolean,false) THEN
   UPDATE public.friend_requests SET status='accepted' WHERE id=req.id;
   INSERT INTO public.friendships VALUES(least(u,req.requester_id),greatest(u,req.requester_id)) ON CONFLICT DO NOTHING;
   INSERT INTO public.notifications(recipient_id,type,title,entity_id) VALUES(req.requester_id,'friend_accepted','La tua richiesta di amicizia è stata accettata',u);
  ELSE UPDATE public.friend_requests SET status='rejected' WHERE id=req.id; END IF;
 ELSIF action_name='report' THEN
  cid:=(p->>'contentId')::uuid;
  IF api.content_json(cid,NULL) IS NULL THEN RAISE EXCEPTION 'CONTENT_UNAVAILABLE'; END IF;
  IF (SELECT count(*) FROM public.reports WHERE reporter_id=u AND created_at>now()-interval '1 hour')>=20 THEN RAISE EXCEPTION 'RATE_LIMITED'; END IF;
  INSERT INTO public.reports(reporter_id,content_id,reason) VALUES(u,cid,p->>'reason') ON CONFLICT(reporter_id,content_id) DO NOTHING;
 ELSIF action_name='suspend_user' THEN
  IF NOT api.is_mod() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  target:=(p->>'userId')::uuid;
  IF target=u OR EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=target AND role<>'user') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=target) THEN RAISE EXCEPTION 'PROFILE_UNAVAILABLE'; END IF;
  IF length(coalesce(p->>'reason',''))<3 OR NOT p ? 'suspended' THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  IF EXISTS(SELECT 1 FROM public.profiles WHERE id=target AND suspended=(p->>'suspended')::boolean) THEN RETURN jsonb_build_object('ok',true); END IF;
  UPDATE public.profiles SET suspended=(p->>'suspended')::boolean WHERE id=target;
  IF (p->>'suspended')::boolean THEN
   FOR generated_content_id IN SELECT id FROM public.content_items WHERE author_id=target ORDER BY id LOOP PERFORM api.invalidate_content(generated_content_id); END LOOP;
   INSERT INTO public.vote_events(user_id,category_id,kind,old_content_id) SELECT user_id,category_id,'invalidated',champion_content_id FROM public.vote_slots WHERE user_id=target AND champion_content_id IS NOT NULL;
   UPDATE public.vote_slots SET champion_content_id=NULL,version=version+1,updated_at=now() WHERE user_id=target AND champion_content_id IS NOT NULL;
   UPDATE public.tilt_duels SET status='stale' WHERE user_id=target AND status='pending';
   DELETE FROM private.sessions WHERE user_id=target;
  END IF;
  INSERT INTO public.moderation_actions(moderator_id,target_id,action,reason) VALUES(u,target,CASE WHEN (p->>'suspended')::boolean THEN 'suspend_user' ELSE 'restore_user' END,p->>'reason');
 ELSIF action_name IN ('moderate','delete_content') THEN
  cid:=(p->>'contentId')::uuid;
  SELECT * INTO item FROM public.content_items WHERE id=cid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CONTENT_UNAVAILABLE'; END IF;
  IF action_name='delete_content' THEN
   IF item.author_id<>u THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
   side:='removed';
  ELSE
   IF NOT api.is_mod() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
   side:=p->>'decision';
   IF side NOT IN ('approved','rejected','hidden') OR length(coalesce(p->>'reason',''))<3 THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
   IF item.moderation_status='draft' OR item.moderation_status='removed' THEN RAISE EXCEPTION 'INVALID_STATE'; END IF;
  END IF;
  IF side='approved' AND EXISTS(SELECT 1 FROM public.content_categories cc JOIN public.categories rules ON rules.id=cc.category_id LEFT JOIN public.content_metadata m ON m.content_id=cc.content_id AND m.category_id=cc.category_id WHERE cc.content_id=cid AND (m.subject_name IS NULL OR trim(m.subject_name)='' OR (rules.requires_url AND nullif(m.reference_url,'') IS NULL))) THEN RAISE EXCEPTION 'METADATA_REQUIRED'; END IF;
  IF item.moderation_status=side THEN RETURN jsonb_build_object('ok',true); END IF;
  IF side IN ('hidden','removed','rejected') THEN PERFORM api.invalidate_content(cid); END IF;
  UPDATE public.content_items SET moderation_status=side,review_reason=coalesce(p->>'reason','Ritirato dall’autore'),
    approved_at=CASE WHEN side='approved' THEN now() ELSE approved_at END WHERE id=cid;
  UPDATE public.content_categories SET status=CASE WHEN side='approved' THEN 'approved' ELSE status END WHERE content_id=cid;
  INSERT INTO public.moderation_actions(moderator_id,target_id,action,reason) VALUES(u,cid,side,coalesce(p->>'reason','Ritiro autore'));
  INSERT INTO public.notifications(recipient_id,type,title,entity_id) VALUES(item.author_id,'content_review',CASE WHEN side='approved' THEN 'Il tuo contenuto è stato approvato' ELSE 'Lo stato del tuo contenuto è cambiato' END,cid);
  UPDATE public.reports SET status='reviewed' WHERE content_id=cid AND status='pending';
 ELSIF action_name='dismiss_report' THEN
  IF NOT api.is_mod() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  UPDATE public.reports SET status='dismissed' WHERE id=(p->>'reportId')::uuid;
  INSERT INTO public.moderation_actions(moderator_id,target_id,action,reason) VALUES(u,(p->>'reportId')::uuid,'dismiss_report',p->>'reason');
 ELSIF action_name='mark_notification' THEN
  UPDATE public.notifications SET read_at=now() WHERE recipient_id=u AND (p->>'notificationId' IS NULL OR id=(p->>'notificationId')::uuid);
 ELSIF action_name='delete_notification' THEN
  DELETE FROM public.notifications WHERE recipient_id=u AND id=(p->>'notificationId')::uuid;
 ELSIF action_name='suggest_category' THEN
  IF (SELECT count(*) FROM public.category_suggestions WHERE proposer_id=u AND created_at>now()-interval '1 day')>=5 THEN RAISE EXCEPTION 'RATE_LIMITED'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.categories WHERE id=(p->>'parentId')::uuid AND depth=3 AND status='published') THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  INSERT INTO public.category_suggestions(proposer_id,parent_id,title,description,examples,reference_kind) VALUES(u,(p->>'parentId')::uuid,p->>'title',p->>'description',p->'examples',coalesce(p->>'referenceKind','name'));
 ELSIF action_name='moderate_suggestion' THEN
  IF NOT api.is_mod() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT * INTO suggestion FROM public.category_suggestions WHERE id=(p->>'suggestionId')::uuid AND status='pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'REQUEST_UNAVAILABLE'; END IF;
  IF p->>'decision' NOT IN ('approved','rejected') OR length(coalesce(p->>'reason',''))<3 THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  UPDATE public.category_suggestions SET status=p->>'decision',review_reason=p->>'reason' WHERE id=suggestion.id;
  IF p->>'decision'='approved' THEN
   INSERT INTO public.categories(id,parent_id,depth,slug,title,description,reference_kind,reference_label,requires_url,allowed_kinds) VALUES(gen_random_uuid(),suggestion.parent_id,4,
     lower(regexp_replace(suggestion.title,'[^a-zA-Z0-9]+','-','g'))||'-'||left(suggestion.id::text,6),suggestion.title,suggestion.description,suggestion.reference_kind,
     CASE suggestion.reference_kind WHEN 'person' THEN 'Nome della persona' WHEN 'website' THEN 'Nome del sito' WHEN 'place' THEN 'Nome del luogo' WHEN 'tool' THEN 'Nome dello strumento' ELSE 'Nome della creazione' END,suggestion.reference_kind IN ('website','tool'),CASE WHEN suggestion.reference_kind='tool' THEN ARRAY['ai_tool'] ELSE ARRAY['photo','illustration','ai_art'] END);
  END IF;
  INSERT INTO public.moderation_actions(moderator_id,target_id,action,reason) VALUES(u,suggestion.id,'category_'||(p->>'decision'),p->>'reason');
 ELSIF action_name='create_battle' THEN
  target:=(p->>'userId')::uuid; cat:=(p->>'categoryId')::uuid;
  IF NOT api.can_compare(u,target) THEN RAISE EXCEPTION 'CHAMPIONS_PRIVATE'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.categories WHERE id=cat AND depth=4 AND status='published') THEN RAISE EXCEPTION 'CATEGORY_NOT_LEAF'; END IF;
  INSERT INTO public.battle_shares(creator_id,recipient_id,category_id) VALUES(u,target,cat) RETURNING id INTO generated_content_id;
  INSERT INTO public.notifications(recipient_id,type,title,entity_id) VALUES(target,'battle','Un amico ti ha invitato a una Friends Battle',generated_content_id);
  RETURN jsonb_build_object('id',generated_content_id,'url','votilt://battle/'||generated_content_id);
 ELSIF action_name='revoke_battle' THEN
  UPDATE public.battle_shares SET revoked=true WHERE id=(p->>'battleId')::uuid AND creator_id=u;
 ELSIF action_name='quiz_answer' THEN
  IF p->>'answer' NOT IN ('REAL','AI') THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  IF NOT EXISTS(SELECT 1 FROM private.quiz_items WHERE id=(p->>'quizId')::uuid AND enabled AND NOT test_only) THEN RAISE EXCEPTION 'QUIZ_UNAVAILABLE'; END IF;
  INSERT INTO public.real_ai_answers SELECT u,id,p->>'answer',ground_truth=p->>'answer',now() FROM private.quiz_items WHERE id=(p->>'quizId')::uuid ON CONFLICT DO NOTHING;
  RETURN (SELECT jsonb_build_object('correct',a.is_correct,'answer',a.answer,'groundTruth',q.ground_truth,'evidence',q.evidence_note)
   FROM public.real_ai_answers a JOIN private.quiz_items q ON q.id=a.quiz_item_id WHERE a.user_id=u AND q.id=(p->>'quizId')::uuid);
 ELSIF action_name='delete_account' THEN
  IF p->>'confirmation' IS DISTINCT FROM 'ELIMINA' THEN RAISE EXCEPTION 'CONFIRMATION_REQUIRED'; END IF;
  FOR generated_content_id IN SELECT id FROM public.content_items WHERE author_id=u ORDER BY id LOOP PERFORM api.invalidate_content(generated_content_id); END LOOP;
  DELETE FROM public.profiles WHERE id=u;
 ELSIF action_name='impression' THEN
  cid:=(p->>'contentId')::uuid; cat:=(p->>'categoryId')::uuid;
  PERFORM api.validate_candidate(cid,cat);
  INSERT INTO public.content_impressions(user_id,content_id,category_id,session_id) VALUES(u,cid,cat,(p->>'sessionId')::uuid) ON CONFLICT DO NOTHING;
 ELSE RAISE EXCEPTION 'INVALID_ACTION'; END IF;
 RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION api.create_upload(p jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u uuid:=api.uid(); cat uuid; cid uuid:=(p->>'id')::uuid; kind_name text:=p->>'kind'; ref jsonb; rule public.categories;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 PERFORM pg_advisory_xact_lock(8815001);
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND NOT suspended) THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 IF (SELECT count(*) FROM public.content_items WHERE author_id=u AND created_at>now()-interval '1 day')>=30 THEN RAISE EXCEPTION 'RATE_LIMITED'; END IF;
 IF jsonb_array_length(p->'categoryIds') NOT BETWEEN 1 AND 3 OR p->>'rights'<>'true' OR p->>'adultConsent'<>'true' THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
 IF p->>'filename'<>cid::text||'.jpg' THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
 INSERT INTO public.content_items(id,author_id,kind,title,caption,media_path,provenance,moderation_status,rights_attested,adult_consent,byte_size,mime_type,width,height,visibility)
 VALUES(cid,u,kind_name,p->>'title',p->>'caption',p->>'filename',p->>'provenance','pending_review',true,true,(p->>'size')::integer,'image/jpeg',(p->>'width')::integer,(p->>'height')::integer,coalesce(p->>'visibility','public'));
 FOR cat IN SELECT value::uuid FROM jsonb_array_elements_text(p->'categoryIds') LOOP
  SELECT * INTO rule FROM public.categories WHERE id=cat AND depth=4 AND status='published';
  IF NOT FOUND THEN RAISE EXCEPTION 'CATEGORY_NOT_LEAF'; END IF;
  IF NOT kind_name=ANY(rule.allowed_kinds) THEN RAISE EXCEPTION 'INVALID_CONTENT_KIND'; END IF;
  ref:=p->'metadata'->cat::text;
  IF length(trim(coalesce(ref->>'name','')))=0 THEN RAISE EXCEPTION 'METADATA_REQUIRED'; END IF;
  IF rule.requires_url AND (nullif(ref->>'url','') IS NULL OR ref->>'url' !~ '^https?://[^[:space:]@]+$') THEN RAISE EXCEPTION 'INVALID_REFERENCE_URL'; END IF;
  INSERT INTO public.content_categories(content_id,category_id,status) VALUES(cid,cat,'pending');
  INSERT INTO public.content_metadata VALUES(cid,cat,trim(ref->>'name'),nullif(ref->>'url',''));
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION api.feed_candidates(p jsonb) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (
  SELECT c.id,cc.category_id AS "categoryId",
   EXISTS(WITH RECURSIVE lineage AS(SELECT id,parent_id FROM public.categories WHERE id=cc.category_id UNION ALL SELECT cat.id,cat.parent_id FROM public.categories cat JOIN lineage l ON l.parent_id=cat.id)
    SELECT 1 FROM public.user_category_interests i JOIN lineage l ON l.id=i.category_id WHERE i.user_id=api.uid()) interested,
   ((SELECT count(*) FROM public.content_impressions WHERE content_id=c.id)<3 OR c.approved_at>now()-interval '7 days') fresh,
   EXISTS(SELECT 1 FROM (SELECT content_id,category_id FROM public.content_impressions WHERE user_id=api.uid() ORDER BY seen_at DESC LIMIT 100) recent WHERE recent.content_id=c.id AND recent.category_id=cc.category_id) seen
  FROM public.content_items c JOIN public.content_categories cc ON cc.content_id=c.id JOIN public.categories cat ON cat.id=cc.category_id
  WHERE c.moderation_status='approved' AND cc.status='approved' AND cat.status='published' AND api.can_read(c)
   AND (nullif(p->>'categoryId','') IS NULL OR cc.category_id=(p->>'categoryId')::uuid)
   AND (coalesce(p->>'mode','for_you')<>'following' OR EXISTS(SELECT 1 FROM public.follows WHERE follower_id=api.uid() AND followed_id=c.author_id))
  ORDER BY md5(c.id::text||cc.category_id::text||coalesce(p->>'seed','votilt')) LIMIT 600
 )x $$;
CREATE OR REPLACE FUNCTION api.feed_items(p jsonb) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(api.content_json(c.id,(e.value->>'categoryId')::uuid) ORDER BY e.ordinality),'[]')
 FROM jsonb_array_elements(p) WITH ORDINALITY e(value,ordinality) JOIN public.content_items c ON c.id=(e.value->>'id')::uuid
 JOIN public.content_categories cc ON cc.content_id=c.id AND cc.category_id=(e.value->>'categoryId')::uuid
 JOIN public.categories cat ON cat.id=cc.category_id
 WHERE c.moderation_status='approved' AND cc.status='approved' AND cat.status='published' AND api.can_read(c) $$;

CREATE OR REPLACE FUNCTION api.auth_lookup(p_email text) RETURNS TABLE(user_id uuid,password_hash text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT c.user_id,c.password_hash FROM private.credentials c JOIN public.profiles p ON p.id=c.user_id WHERE c.email=p_email AND NOT p.suspended $$;
CREATE OR REPLACE FUNCTION api.auth_session(p_hash text) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT s.user_id FROM private.sessions s JOIN public.profiles p ON p.id=s.user_id WHERE s.token_hash=p_hash AND s.expires_at>now() AND NOT p.suspended $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA api FROM PUBLIC;
CREATE OR REPLACE FUNCTION api.quiz_media_path(p_id uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT media_path FROM private.quiz_items WHERE id=p_id AND enabled AND NOT test_only $$;
REVOKE ALL ON FUNCTION api.quiz_media_path(uuid) FROM PUBLIC;
CREATE OR REPLACE FUNCTION api.upload_receipt(p jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u uuid:=api.uid(); op uuid:=(p->>'clientOperationId')::uuid; fingerprint text:=md5((p-'id'-'filename')::text); receipt public.operation_receipts; result jsonb;
BEGIN
 IF u IS NULL OR op IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 PERFORM pg_advisory_xact_lock(8815001);
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND NOT suspended) THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 SELECT * INTO receipt FROM public.operation_receipts WHERE user_id=u AND operation_id=op AND action='upload';
 IF FOUND THEN
  IF receipt.fingerprint<>fingerprint THEN RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSE'; END IF;
  RETURN receipt.result_json;
 END IF;
 PERFORM api.create_upload(p);
 result:=jsonb_build_object('id',p->>'id','status','pending_review');
 INSERT INTO public.operation_receipts VALUES(u,op,'upload',fingerprint,result,now());
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION api.upload_receipt(jsonb) FROM PUBLIC;
CREATE OR REPLACE FUNCTION api.media_referenced(p_filename text) RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(8815001);
 RETURN EXISTS(SELECT 1 FROM public.content_items WHERE media_path=p_filename);
END $$;
REVOKE ALL ON FUNCTION api.media_referenced(text) FROM PUBLIC;
CREATE OR REPLACE FUNCTION api.revoke_session(p_hash text) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 DELETE FROM private.sessions WHERE token_hash=p_hash $$;
REVOKE ALL ON FUNCTION api.revoke_session(text) FROM PUBLIC;
CREATE OR REPLACE FUNCTION api.category_policy_context() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('published',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'title',title,'status','published')) FROM public.categories WHERE depth=4 AND status='published'),'[]'),
 'pending',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'title',title,'description',description,'examples',examples,'status','pending','proposerId',proposer_id)) FROM public.category_suggestions WHERE status='pending'),'[]')) $$;
REVOKE ALL ON FUNCTION api.category_policy_context() FROM PUBLIC;
