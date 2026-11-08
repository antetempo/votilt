// Generated from the running native PostgreSQL schema. npm run db:types
export type BattleSharesRow = {
  id: string;
  creator_id: string | null;
  recipient_id: string;
  category_id: string | null;
  expires_at: string;
  revoked: boolean;
};

export type CategoriesRow = {
  id: string;
  parent_id: string | null;
  depth: number;
  slug: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  status: string;
  reference_kind: string;
  reference_label: string;
  requires_url: boolean;
  allowed_kinds: string;
};

export type CategorySuggestionsRow = {
  id: string;
  proposer_id: string | null;
  parent_id: string;
  title: string;
  description: string;
  examples: unknown;
  status: string;
  review_reason: string | null;
  created_at: string;
  reference_kind: string;
};

export type ContentCategoriesRow = {
  content_id: string;
  category_id: string;
  status: string;
};

export type ContentImpressionsRow = {
  user_id: string;
  content_id: string;
  category_id: string;
  session_id: string;
  seen_at: string;
};

export type ContentItemsRow = {
  id: string;
  author_id: string;
  kind: string;
  title: string;
  caption: string;
  media_path: string;
  provenance: string;
  moderation_status: string;
  review_reason: string | null;
  created_at: string;
  approved_at: string | null;
  rights_attested: boolean;
  adult_consent: boolean;
  byte_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  visibility: string;
};

export type ContentMetadataRow = {
  content_id: string;
  category_id: string;
  subject_name: string;
  reference_url: string | null;
};

export type DailyChallengesRow = {
  date_utc: string;
  category_id: string | null;
};

export type DuelRatingsRow = {
  category_id: string;
  content_id: string;
  rating: number;
  matches: number;
  wins: number;
  losses: number;
};

export type FollowsRow = {
  follower_id: string;
  followed_id: string;
};

export type FriendRequestsRow = {
  id: string;
  requester_id: string | null;
  recipient_id: string | null;
  status: string;
  created_at: string;
};

export type FriendshipsRow = {
  user_low_id: string;
  user_high_id: string;
};

export type ModerationActionsRow = {
  id: string;
  moderator_id: string | null;
  target_id: string | null;
  action: string;
  reason: string;
  created_at: string;
};

export type NotificationsRow = {
  id: string;
  recipient_id: string | null;
  type: string;
  title: string;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type OperationReceiptsRow = {
  user_id: string;
  operation_id: string;
  action: string;
  fingerprint: string;
  result_json: unknown;
  created_at: string;
};

export type ProfileSettingsRow = {
  user_id: string;
  show_champions: string;
  allow_comparison: boolean;
  haptics: boolean;
  reduce_motion: boolean;
  onboarding_complete: boolean;
};

export type ProfilesRow = {
  id: string;
  handle: string;
  display_name: string;
  bio: string;
  visibility: string;
  suspended: boolean;
  created_at: string;
};

export type RankingSnapshotsRow = {
  date_utc: string;
  category_id: string;
  content_id: string;
  support: number;
};

export type RatingEventsRow = {
  duel_id: string;
  user_id: string | null;
  category_id: string | null;
  winner_id: string | null;
  loser_id: string | null;
  rated: boolean;
  formula_version: string;
  old_winner: number | null;
  new_winner: number | null;
  old_loser: number | null;
  new_loser: number | null;
  created_at: string;
};

export type RealAiAnswersRow = {
  user_id: string;
  quiz_item_id: string;
  answer: string | null;
  is_correct: boolean;
  created_at: string;
};

export type ReportsRow = {
  id: string;
  reporter_id: string | null;
  content_id: string | null;
  reason: string;
  status: string;
  created_at: string;
};

export type TiltDuelsRow = {
  id: string;
  user_id: string;
  category_id: string;
  incumbent_id: string;
  challenger_id: string;
  expected_slot_version: number;
  status: string;
  winner_side: string | null;
  created_at: string;
  expires_at: string;
  resolved_at: string | null;
};

export type UserBlocksRow = {
  blocker_id: string;
  blocked_id: string;
};

export type UserCategoryInterestsRow = {
  user_id: string;
  category_id: string;
};

export type UserRolesRow = {
  user_id: string;
  role: string;
};

export type VoteEventsRow = {
  id: string;
  user_id: string | null;
  category_id: string;
  kind: string;
  old_content_id: string | null;
  new_content_id: string | null;
  duel_id: string | null;
  created_at: string;
};

export type VoteSlotsRow = {
  user_id: string;
  category_id: string;
  champion_content_id: string | null;
  version: number;
  updated_at: string;
};
