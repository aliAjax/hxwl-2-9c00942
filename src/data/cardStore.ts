import type { Card } from "../types";
import {
  DEFAULT_CARDS,
  STORAGE_KEYS,
  EMPTY_CARD_TEMPLATE,
  DEFAULT_SPACE_ID,
  CURRENT_MIGRATION_VERSION,
} from "./constants";
import { safeGetItem, safeSetItem } from "./storage";

export function loadCustomCards(): Card[] {
  const raw = safeGetItem<Card[] | null>(STORAGE_KEYS.customCards, null);
  if (!raw) {
    return [];
  }
  const migratedVersion = safeGetItem<number>(STORAGE_KEYS.migrationVersion, 0);
  if (migratedVersion < CURRENT_MIGRATION_VERSION) {
    const migrated = raw.map((card) => ({
      ...card,
      spaceId: card.spaceId || DEFAULT_SPACE_ID,
    }));
    safeSetItem(STORAGE_KEYS.customCards, migrated);
    safeSetItem(STORAGE_KEYS.migrationVersion, CURRENT_MIGRATION_VERSION);
    return migrated;
  }
  return raw;
}

export function saveCustomCards(cards: Card[]): boolean {
  return safeSetItem(STORAGE_KEYS.customCards, cards);
}

export function getAllCards(customCards: Card[]): Card[] {
  return [...DEFAULT_CARDS, ...customCards];
}

export function getCardsForSpace(customCards: Card[], spaceId: string): Card[] {
  const spaceCustomCards = customCards.filter(
    (card) => !card.spaceId || card.spaceId === spaceId
  );
  return [...DEFAULT_CARDS, ...spaceCustomCards];
}

export function getCustomCardsForSpace(customCards: Card[], spaceId: string): Card[] {
  return customCards.filter(
    (card) => !card.spaceId || card.spaceId === spaceId
  );
}

export function getCardById(cardId: string, allCards: Card[]): Card | undefined {
  return allCards.find((card) => card.id === cardId);
}

export function createEmptyCustomCard(spaceId: string = DEFAULT_SPACE_ID): Card {
  return {
    ...EMPTY_CARD_TEMPLATE,
    id: `custom-${Date.now()}`,
    spaceId,
  };
}

export function addCustomCard(cards: Card[], card: Card): Card[] {
  return [...cards, card];
}

export function updateCustomCard(cards: Card[], card: Card): Card[] {
  return cards.map((c) => (c.id === card.id ? card : c));
}

export function deleteCustomCard(cards: Card[], cardId: string): Card[] {
  return cards.filter((c) => c.id !== cardId);
}

export function deleteCustomCardsBySpaceId(cards: Card[], spaceId: string): Card[] {
  return cards.filter((c) => c.spaceId !== spaceId);
}

export function duplicateCustomCard(card: Card, targetSpaceId: string): Card {
  return {
    name: card.name,
    keyword: card.keyword,
    meaning: card.meaning,
    hue: card.hue,
    glyph: card.glyph,
    illustration: card.illustration,
    isCustom: true,
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    spaceId: targetSpaceId,
  };
}

export function batchDeleteCards(cards: Card[], cardIds: string[]): Card[] {
  const idSet = new Set(cardIds);
  return cards.filter((c) => !idSet.has(c.id));
}

export function batchMoveCards(cards: Card[], cardIds: string[], targetSpaceId: string): Card[] {
  const idSet = new Set(cardIds);
  return cards.map((c) => (idSet.has(c.id) ? { ...c, spaceId: targetSpaceId } : c));
}

export function batchDuplicateCards(
  cards: Card[],
  cardIds: string[],
  targetSpaceId: string
): Card[] {
  const sourceCards = cards.filter((c) => cardIds.includes(c.id));
  const newCards = sourceCards.map((card) => duplicateCustomCard(card, targetSpaceId));
  return [...cards, ...newCards];
}

export function hasAnyCardsInReading(
  cardIds: string[],
  readingCardIds: string[]
): boolean {
  return cardIds.some((id) => readingCardIds.includes(id));
}

export function isCardInReading(cardId: string, cardIds: string[]): boolean {
  return cardIds.includes(cardId);
}

export function hasAnyCardInReading(
  spaceId: string,
  customCards: Card[],
  readingCardIds: string[]
): boolean {
  const spaceCardIds = customCards
    .filter((c) => c.spaceId === spaceId)
    .map((c) => c.id);
  return spaceCardIds.some((id) => readingCardIds.includes(id));
}

export function validateCard(card: Card): { valid: boolean; error?: string } {
  if (!card.name.trim()) return { valid: false, error: "牌名不能为空" };
  if (!card.keyword.trim()) return { valid: false, error: "关键词不能为空" };
  if (!card.meaning.trim()) return { valid: false, error: "解释不能为空" };
  return { valid: true };
}

export function checkStorageCapacity(testData: string): boolean {
  try {
    const testKey = "hxwl-storage-test";
    localStorage.setItem(testKey, testData);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
