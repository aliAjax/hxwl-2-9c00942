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
  const record = readingToHistoryRecord(reading, cards, positions);
  return addRecord(history, record);
}

export function readingToHistoryRecord(
  reading: Reading,
  cards: Card[],
  positions: string[]
): HistoryRecord {
  const cardMap = new Map(cards.map((c) => [c.id, c]));
  const revealedCardIds = reading.cardIds.slice(0, reading.revealed);

  const historyCards = revealedCardIds
    .map((cardId, index): HistoryCard | null => {
      const card = cardMap.get(cardId);
      if (!card) return null;
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
    })
    .filter((c): c is HistoryCard => c !== null);

  const record: HistoryRecord = {
    date: reading.date,
    cards: historyCards,
  };
  if (reading.question) {
    record.question = reading.question;
  }
  if (reading.spreadId) {
    record.spreadId = reading.spreadId;
  }
  return record;
}

export function createArchivedRecord(
  reading: Reading,
  cards: Card[],
  positions: string[],
  reason: "completed" | "partial" | "expired"
): HistoryRecord {
  const baseRecord = readingToHistoryRecord(reading, cards, positions);
  return {
    ...baseRecord,
    archived: true,
    archiveReason: reason,
  } satisfies HistoryRecord;
}
