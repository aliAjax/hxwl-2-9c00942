import type { Card } from "../types";
import { DEFAULT_CARDS, STORAGE_KEYS, EMPTY_CARD_TEMPLATE } from "./constants";
import { safeGetItem, safeSetItem } from "./storage";

export function loadCustomCards(): Card[] {
  return safeGetItem<Card[]>(STORAGE_KEYS.customCards, []);
}

export function saveCustomCards(cards: Card[]): boolean {
  return safeSetItem(STORAGE_KEYS.customCards, cards);
}

export function getAllCards(customCards: Card[]): Card[] {
  return [...DEFAULT_CARDS, ...customCards];
}

export function getCardById(cardId: string, allCards: Card[]): Card | undefined {
  return allCards.find((card) => card.id === cardId);
}

export function createEmptyCustomCard(): Card {
  return {
    ...EMPTY_CARD_TEMPLATE,
    id: `custom-${Date.now()}`,
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

export function isCardInReading(cardId: string, cardIds: string[]): boolean {
  return cardIds.includes(cardId);
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
