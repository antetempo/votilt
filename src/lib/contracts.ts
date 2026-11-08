import { z } from 'zod';
const id = z.uuid();
export const userContract = z
  .object({
    id,
    handle: z.string(),
    display_name: z.string(),
    bio: z.string(),
    visibility: z.enum(['public', 'friends', 'private']),
    role: z.enum(['user', 'moderator', 'admin']),
    interests: z.array(id),
    settings: z.object({
      show_champions: z.enum(['owner', 'friends', 'public']),
      allow_comparison: z.boolean(),
      haptics: z.boolean(),
      reduce_motion: z.boolean(),
      onboarding_complete: z.boolean(),
    }),
  })
  .passthrough();
export const mediaContract = z
  .object({
    id,
    title: z.string(),
    caption: z.string(),
    kind: z.enum(['photo', 'illustration', 'ai_art', 'ai_tool']),
    provenance: z.string(),
    status: z.string(),
    authorId: id,
    handle: z.string(),
    displayName: z.string(),
    mediaUrl: z.string().regex(/^\/media\/[a-f0-9-]+$/),
    categoryId: id.nullable(),
    categoryTitle: z.string().nullable(),
  })
  .passthrough();
const categoryContract = z
  .object({
    id,
    parent_id: id.nullable(),
    depth: z.number().int().min(1).max(4),
    title: z.string(),
    slug: z.string(),
    reference_kind: z.enum(['name', 'person', 'website', 'place', 'tool']),
    reference_label: z.string(),
    requires_url: z.boolean(),
  })
  .passthrough();
const version = z.number().int().nonnegative();
const voteContract = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.enum(['INITIAL_VOTE', 'ALREADY_CHAMPION']),
      championId: id,
      slotVersion: version,
      receiptId: id,
    })
    .passthrough(),
  z
    .object({
      kind: z.literal('TILT_REQUIRED'),
      duelId: id,
      categoryId: id,
      expectedSlotVersion: version,
      expiresAt: z.string(),
      receiptId: id,
    })
    .passthrough(),
  z
    .object({
      kind: z.literal('TILT_RESOLVED'),
      duelId: id,
      championContentId: id,
      slotVersion: version,
      rated: z.boolean(),
      didChampionChange: z.boolean(),
      receiptId: id,
    })
    .passthrough(),
  z.object({ kind: z.literal('TILT_CANCELLED'), duelId: id, receiptId: id }).passthrough(),
]);
export const responseContracts: Record<string, z.ZodType> = {
  me: userContract,
  categories: z.array(categoryContract),
  category_rankings: z.array(
    z.object({
      id,
      title: z.string(),
      description: z.string(),
      voteCount: z.number().int().nonnegative(),
      contentCount: z.number().int().nonnegative(),
      path: z.array(z.string()).min(1),
      leader: mediaContract
        .extend({ support: z.number().int().positive(), position: z.literal(1) })
        .nullable(),
    }),
  ),
  category_check: z.object({
    allowed: z.boolean(),
    duplicate: z.boolean(),
    pendingDuplicate: z.boolean(),
    issues: z.array(z.object({ field: z.string(), code: z.string(), message: z.string() })),
    matches: z.array(
      z.object({
        id,
        title: z.string(),
        duplicate: z.boolean(),
        score: z.number(),
        status: z.string(),
      }),
    ),
  }),
  content: mediaContract,
  feed: z.object({
    items: z.array(mediaContract),
    nextOffset: z.number().int().nonnegative().nullable(),
  }),
  champions: z.array(mediaContract),
  search: z.array(mediaContract),
  my_uploads: z.array(mediaContract),
  ranking: z.object({ items: z.array(mediaContract), insufficientHistory: z.boolean() }),
  vote_intent: voteContract,
  resolve_tilt: voteContract,
  cancel_tilt: voteContract,
  duel: z
    .object({
      id,
      category_id: id,
      status: z.string(),
      expires_at: z.string(),
      incumbent: mediaContract.nullable(),
      challenger: mediaContract.nullable(),
    })
    .passthrough()
    .nullable(),
  daily: z.object({ dateUtc: z.string(), categoryId: id, title: z.string() }),
  taste_match: z.object({
    common: z.number().int().nonnegative(),
    same: z.number().int().nonnegative(),
    percentage: z.number().min(0).max(100).nullable(),
  }),
};
