import type { Reading, Card } from "../types";
import { STORAGE_KEYS, DEFAULT_SPREAD_ID } from "./constants";
import { safeGetItem, safeSetItem, safeRemoveItem } from "./storage";
import { todayKey } from "./dateUtils";

function normalizeReading(raw: Reading & { revealed?: number; spreadId?: string }): Reading {
  return {
    ...raw,
    revealed: raw.revealed ?? 0,
    spreadId: raw.spreadId ?? DEFAULT_SPREAD_ID,
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
  return normalizeReading(raw);
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
  question?: string
): Reading {
  return {
    date: todayKey(),
    cardIds: drawCardIds(allCards, positionsCount),
    revealed: 0,
    question: question?.trim() || undefined,
    spreadId,
  };
}

export function getRevealedCards(
  reading: Reading,
  allCards: Card[],
  getCardByIdFn: (id: string, cards: Card[]) => Card | undefined
): Card[] {
  return reading.cardIds
    .slice(0, reading.revealed)
    .map((id) => getCardByIdFn(id, allCards)!)
    .filter(Boolean);
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
