/**
 * A direct message conversation.
 *
 * One document per conversation, shared by both sides. The id is derived from
 * the two participant ids (sorted, joined with `_`), so either side can
 * address it without looking it up - see FirebaseStorageService.buildDmId.
 * A conversation with yourself has the same id twice, which collapses to a
 * single participant.
 */
export interface DmInterface {
  participants: string[],
  id?: string,
  isSeed?: boolean,
}
