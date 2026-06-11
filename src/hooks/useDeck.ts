import { useState, useEffect, useCallback, useMemo } from "react";
import type { Card } from "../types";
import {
  loadCustomCards,
  saveCustomCards,
  getAllCards,
  getCardById,
  addCustomCard,
  updateCustomCard,
  deleteCustomCard,
  isCardInReading,
  getCardsForSpace,
  deleteCustomCardsBySpaceId,
  hasAnyCardInReading,
  duplicateCustomCard,
  batchDeleteCards,
  batchMoveCards,
  batchDuplicateCards,
  checkStorageCapacity,
} from "../data/cardStore";
import { DELETED_CARD_PLACEHOLDER } from "../data/constants";

export type UseDeckReturn = {
  customCards: Card[];
  allCards: Card[];
  addCard: (card: Card) => void;
  updateCard: (card: Card) => void;
  deleteCard: (cardId: string, readingCardIds: string[]) => boolean;
  duplicateCard: (card: Card, targetSpaceId: string) => void;
  batchDelete: (cardIds: string[]) => void;
  batchMove: (cardIds: string[], targetSpaceId: string) => void;
  batchCopy: (cardIds: string[], targetSpaceId: string) => boolean;
  getAllCardsForSpace: (spaceId: string) => Card[];
  getCardsForReading: (cardIds: string[], spaceId?: string) => Card[];
  deleteCardsBySpaceId: (spaceId: string) => void;
  hasAnyCardFromSpaceInReading: (
    spaceId: string,
    readingCardIds: string[]
  ) => boolean;
};

export function useDeck(): UseDeckReturn {
  const [customCards, setCustomCards] = useState<Card[]>(loadCustomCards);

  useEffect(() => {
    saveCustomCards(customCards);
  }, [customCards]);

  const allCards = useMemo(() => getAllCards(customCards), [customCards]);

  const getAllCardsForSpace = useCallback(
    (spaceId: string) => getCardsForSpace(customCards, spaceId),
    [customCards]
  );

  const getCardsForReading = useCallback(
    (cardIds: string[], spaceId?: string) => {
      const cardsToUse = spaceId ? getCardsForSpace(customCards, spaceId) : allCards;
      return cardIds
        .map((id) => {
          const card = getCardById(id, cardsToUse);
          return card ?? (DELETED_CARD_PLACEHOLDER as Card);
        })
        .filter((card): card is Card => card !== undefined);
    },
    [customCards, allCards]
  );

  const addCard = useCallback((card: Card) => {
    setCustomCards((prev) => addCustomCard(prev, card));
  }, []);

  const updateCard = useCallback((card: Card) => {
    setCustomCards((prev) => updateCustomCard(prev, card));
  }, []);

  const deleteCard = useCallback(
    (cardId: string, readingCardIds: string[]): boolean => {
      const isInReading = isCardInReading(cardId, readingCardIds);
      setCustomCards((prev) => deleteCustomCard(prev, cardId));
      return isInReading;
    },
    []
  );

  const duplicateCard = useCallback((card: Card, targetSpaceId: string) => {
    const newCard = duplicateCustomCard(card, targetSpaceId);
    setCustomCards((prev) => addCustomCard(prev, newCard));
  }, []);

  const batchDelete = useCallback((cardIds: string[]) => {
    setCustomCards((prev) => batchDeleteCards(prev, cardIds));
  }, []);

  const batchMove = useCallback((cardIds: string[], targetSpaceId: string) => {
    setCustomCards((prev) => batchMoveCards(prev, cardIds, targetSpaceId));
  }, []);

  const batchCopy = useCallback(
    (cardIds: string[], targetSpaceId: string): boolean => {
      const updated = batchDuplicateCards(customCards, cardIds, targetSpaceId);
      const testData = JSON.stringify(updated);
      if (!checkStorageCapacity(testData)) {
        return false;
      }
      setCustomCards(updated);
      return true;
    },
    [customCards]
  );

  const deleteCardsBySpaceId = useCallback((spaceId: string) => {
    setCustomCards((prev) => deleteCustomCardsBySpaceId(prev, spaceId));
  }, []);

  const hasAnyCardFromSpaceInReading = useCallback(
    (spaceId: string, readingCardIds: string[]): boolean => {
      return hasAnyCardInReading(spaceId, customCards, readingCardIds);
    },
    [customCards]
  );

  return {
    customCards,
    allCards,
    addCard,
    updateCard,
    deleteCard,
    duplicateCard,
    batchDelete,
    batchMove,
    batchCopy,
    getAllCardsForSpace,
    getCardsForReading,
    deleteCardsBySpaceId,
    hasAnyCardFromSpaceInReading,
  };
}
