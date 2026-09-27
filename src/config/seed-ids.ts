import seedIds from './seed-ids.json';

/**
 * Document ids of the seeded demo data.
 *
 * Three of these are load-bearing and were hard-coded across the app before
 * this file existed - the seed script has to write exactly these ids or the
 * app breaks:
 *
 *   users.frederik  the guest account (firebase-auth.service.ts guestLogin)
 *   users.steffen   sender of the welcome DM every new user receives
 *   users.sofia     second DM contact every new user receives
 *   channels.lobby  the channel every new user is added to on signup
 *
 * The values live in seed-ids.json so the seed scripts (plain Node) and the
 * app (TypeScript) read the same source.
 */
export const SEED_IDS = seedIds;

export const GUEST_USER_ID = seedIds.users.frederik;
export const WELCOME_DM_SENDER_ID = seedIds.users.steffen;
export const SECOND_DM_CONTACT_ID = seedIds.users.sofia;
export const DEFAULT_CHANNEL_ID = seedIds.channels.lobby;
