import type { Reading, Card, SpreadSnapshot } from "../types";
import {
  STORAGE_KEYS,
  DEFAULT_SPREAD_ID,
  DEFAULT_SPACE_ID,
  CURRENT_MIGRATION_VERSION,
  DELETED_CARD_PLACEHOLDER,
} from "./constants";
import { safeGetItem, safeSetItem, safeRemoveItem } from "./storage";
import { todayKey } from "./dateUtils";

function normalizeReading(
  raw: Reading & { revealed?: number; spreadId?: string; spaceId?: string }
): Reading {
  return {
    ...raw,
    revealed: raw.revealed ?? 0,
    spreadId: raw.spreadId ?? DEFAULT_SPREAD_ID,
    spaceId: raw.spaceId ?? DEFAULT_SPACE_ID,
    spreadSnapshot: raw.spreadSnapshot,
  };
}

export function loadReading(): Reading | null {
  const raw = safeGetItem<Reading | null>(STORAGE_KEYS.reading, null);
  if (!raw) return null;
  if (raw.date !== todayKey()) return null;
  return normalizeReading(raw);
}

export function loadRawReading(): Reading | null {
  const raw = safeGetItem<Reading | null>(STORAGE_KEYS.reading, null);
  if (!raw) return null;
  const migrated = normalizeReading(raw);
  const migratedVersion = safeGetItem<number>(STORAGE_KEYS.migrationVersion, 0);
  if (migratedVersion < CURRENT_MIGRATION_VERSION) {
    safeSetItem(STORAGE_KEYS.reading, migrated);
  }
  return migrated;
}

export function saveReading(reading: Reading): boolean {
  return safeSetItem(STORAGE_KEYS.reading, reading);
}

export function clearReading(): void {
  safeRemoveItem(STORAGE_KEYS.reading);
}

export function drawCardIds(allCards: Card[], count: number): string[] {
  return [...allCards]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((card) => card.id);
}

export function createReading(
  allCards: Card[],
  positionsCount: number,
  spreadId: string,
  spaceId: string = DEFAULT_SPACE_ID,
  question?: string,
  spreadSnapshot?: SpreadSnapshot
): Reading {
  return {
    date: todayKey(),
    cardIds: drawCardIds(allCards, positionsCount),
    revealed: 0,
    question: question?.trim() || undefined,
    spreadId,
    spaceId,
    spreadSnapshot,
  };
}

export function getRevealedCards(
  reading: Reading,
  allCards: Card[],
  getCardByIdFn: (id: string, cards: Card[]) => Card | undefined
): (Card | typeof DELETED_CARD_PLACEHOLDER)[] {
  return reading.cardIds
    .slice(0, reading.revealed)
    .map((id) => {
      const card = getCardByIdFn(id, allCards);
      return card ?? DELETED_CARD_PLACEHOLDER;
    });
}

export function isReadingComplete(reading: Reading, totalPositions: number): boolean {
  return reading.revealed >= totalPositions;
}

export function revealNextCard(reading: Reading, index: number): Reading {
  return {
    ...reading,
    revealed: Math.max(reading.revealed, index + 1),
  };
}

export function isReadingFromSpace(reading: Reading, spaceId: string): boolean {
  return reading.spaceId === spaceId;
}

export function clearReadingIfFromSpace(
  reading: Reading | null,
  spaceId: string
): Reading | null {
  if (reading && reading.spaceId === spaceId && spaceId !== DEFAULT_SPACE_ID) {
    clearReading();
    return null;
  }
  return reading;
}
