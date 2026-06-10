import type { HistoryRecord, Reading, Card, HistoryCard } from "../types";
import { STORAGE_KEYS } from "./constants";
import { safeGetItem, safeSetItem, safeRemoveItem } from "./storage";

export function loadHistory(): HistoryRecord[] {
  return safeGetItem<HistoryRecord[]>(STORAGE_KEYS.history, []);
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
  positions: string[]
): HistoryRecord[] {
  const record: HistoryRecord = readingToHistoryRecord(reading, cards, positions);
  return addRecord(history, record);
}

export function readingToHistoryRecord(
  reading: Reading,
  cards: Card[],
  positions: string[]
): HistoryRecord {
  const historyCards: HistoryCard[] = reading.cardIds
    .slice(0, reading.revealed)
    .map((cardId, index) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return null;
      return {
        position: positions[index] || "",
        name: card.name,
        keyword: card.keyword,
        meaning: card.meaning,
        hue: card.hue,
        glyph: card.glyph,
        illustration: card.illustration,
      };
    })
    .filter((c): c is HistoryCard => c !== null);

  return {
    date: reading.date,
    cards: historyCards,
    question: reading.question,
    spreadId: reading.spreadId,
  };
}

export function createArchivedRecord(
  reading: Reading,
  cards: Card[],
  positions: string[],
  reason: "completed" | "partial" | "expired"
): HistoryRecord {
  const record = readingToHistoryRecord(reading, cards, positions);
  return {
    ...record,
    archived: true,
    archiveReason: reason,
  };
}
