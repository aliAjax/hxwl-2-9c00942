import type { HistoryRecord, Reading, Card, HistoryCard, Space, Spread, SpreadSnapshot } from "../types";
import {
  STORAGE_KEYS,
  DEFAULT_SPACE_ID,
  CURRENT_MIGRATION_VERSION,
  DELETED_CARD_PLACEHOLDER,
  DELETED_SPREAD_PLACEHOLDER,
} from "./constants";
import { safeGetItem, safeSetItem, safeRemoveItem } from "./storage";
import { getSpreadOrPlaceholder, getSnapshot } from "./spreadStore";

export function loadHistory(): HistoryRecord[] {
  const raw = safeGetItem<HistoryRecord[] | null>(STORAGE_KEYS.history, null);
  if (!raw) {
    return [];
  }
  const migratedVersion = safeGetItem<number>(STORAGE_KEYS.migrationVersion, 0);
  if (migratedVersion < CURRENT_MIGRATION_VERSION) {
    const migrated = raw.map((record) => {
      const base: HistoryRecord = {
        ...record,
        spaceId: record.spaceId || DEFAULT_SPACE_ID,
        cards: record.cards.map((card) => ({
          ...card,
          isDeleted: card.isDeleted || false,
        })),
      };
      if (migratedVersion < 3) {
        if (!base.spreadSnapshot && base.spreadId) {
          const spread = getSpreadOrPlaceholder(base.spreadId);
          base.spreadSnapshot = {
            ...getSnapshot(spread),
            isDeleted: (spread as SpreadSnapshot).isDeleted,
          };
        }
      }
      return base;
    });
    safeSetItem(STORAGE_KEYS.history, migrated);
    return migrated;
  }
  return raw;
}

export function saveHistory(history: HistoryRecord[]): boolean {
  return safeSetItem(STORAGE_KEYS.history, history);
}

export function clearHistory(): void {
  safeRemoveItem(STORAGE_KEYS.history);
}

export function addRecord(history: HistoryRecord[], record: HistoryRecord): HistoryRecord[] {
  const existingIndex = history.findIndex((r) => r.date === record.date);
  const next = [...history];
  if (existingIndex >= 0) {
    next[existingIndex] = record;
  } else {
    next.unshift(record);
  }
  return next;
}

export function addReadingToHistory(
  history: HistoryRecord[],
  reading: Reading,
  cards: Card[],
  positions: string[],
  spread: Spread | SpreadSnapshot,
  space?: Space
): HistoryRecord[] {
  const record = readingToHistoryRecord(reading, cards, positions, spread, space);
  return addRecord(history, record);
}

export function readingToHistoryRecord(
  reading: Reading,
  cards: Card[],
  positions: string[],
  spread: Spread | SpreadSnapshot,
  space?: Space
): HistoryRecord {
  const cardMap = new Map(cards.map((c) => [c.id, c]));
  const revealedCardIds = reading.cardIds.slice(0, reading.revealed);

  const historyCards = revealedCardIds
    .map((cardId, index): HistoryCard => {
      const card = cardMap.get(cardId);
      if (!card) {
        return {
          ...DELETED_CARD_PLACEHOLDER,
          position: positions[index] || "",
        };
      }
      const historyCard: HistoryCard = {
        position: positions[index] || "",
        name: card.name,
        keyword: card.keyword,
        meaning: card.meaning,
        hue: card.hue,
        glyph: card.glyph,
      };
      if (card.illustration) {
        historyCard.illustration = card.illustration;
      }
      return historyCard;
    });

  const record: HistoryRecord = {
    date: reading.date,
    cards: historyCards,
    spaceId: reading.spaceId || DEFAULT_SPACE_ID,
    spaceName: space?.name,
    spreadId: reading.spreadId,
    spreadSnapshot: getSnapshot(spread),
  };
  if (reading.question) {
    record.question = reading.question;
  }
  return record;
}

export function createArchivedRecord(
  reading: Reading,
  cards: Card[],
  positions: string[],
  reason: "completed" | "partial" | "expired",
  spread: Spread | SpreadSnapshot,
  space?: Space
): HistoryRecord {
  const baseRecord = readingToHistoryRecord(reading, cards, positions, spread, space);
  return {
    ...baseRecord,
    archived: true,
    archiveReason: reason,
  } satisfies HistoryRecord;
}

export function getHistoryBySpace(
  history: HistoryRecord[],
  spaceId: string
): HistoryRecord[] {
  return history.filter((record) => record.spaceId === spaceId || !record.spaceId);
}

export function getSpreadForHistory(record: HistoryRecord): Spread | SpreadSnapshot {
  if (record.spreadSnapshot) {
    return record.spreadSnapshot;
  }
  if (record.spreadId) {
    return getSpreadOrPlaceholder(record.spreadId);
  }
  return DELETED_SPREAD_PLACEHOLDER;
}
