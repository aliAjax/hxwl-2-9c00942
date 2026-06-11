import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Reading, Card, HistoryRecord, Space, Spread, SpreadSnapshot } from "../types";
import {
  loadReading,
  saveReading,
  clearReading as clearReadingStorage,
  createReading,
  revealNextCard,
  isReadingComplete,
  clearReadingIfFromSpace,
} from "../data/readingStore";

export type UseDivinationDeps = {
  customCards: Card[];
  getAllCardsForSpace: (spaceId: string) => Card[];
  getCardsForReading: (cardIds: string[], spaceId?: string) => Card[];
  getSpread: (spreadId: string) => Spread;
  getSpreadPositions: (spreadId: string) => string[];
  getSpreadPositionCount: (spreadId: string) => number;
  getSpreadSnapshot: (spread: Spread | SpreadSnapshot) => SpreadSnapshot;
  getSpace: (spaceId: string) => Space | undefined;
  addCompletedReading: (
    reading: Reading,
    cards: Card[],
    positions: string[],
    spread: Spread | SpreadSnapshot,
    space?: Space
  ) => void;
};

export type UseDivinationReturn = {
  reading: Reading | null;
  question: string;
  setQuestion: (q: string) => void;
  selectedCards: Card[];
  currentPositions: string[];
  totalCards: number;
  isComplete: boolean;
  readingSpace: Space | undefined;
  startReading: (spreadId: string, spaceId: string) => void;
  revealCard: (index: number) => void;
  clearReading: () => void;
  restartReading: () => void;
  handleSpaceDeletion: (spaceId: string, customCards: Card[]) => boolean;
  handleCardDeletion: (cardWasInReading: boolean) => void;
  handleSpreadDeletionReset: () => void;
  handleBatchCardReset: () => void;
  readingCardIds: string[];
};

export function useDivination(deps: UseDivinationDeps): UseDivinationReturn {
  const {
    customCards,
    getAllCardsForSpace,
    getCardsForReading,
    getSpread,
    getSpreadPositions,
    getSpreadPositionCount,
    getSpreadSnapshot,
    getSpace,
    addCompletedReading,
  } = deps;

  const [reading, setReading] = useState<Reading | null>(loadReading);
  const [question, setQuestion] = useState(reading?.question ?? "");
  const archivedReadingRef = useRef<string | null>(null);

  const currentSpreadId = reading?.spreadId ?? "";
  const currentPositions = useMemo(() => {
    if (!reading) return [];
    return getSpreadPositions(reading.spreadId);
  }, [reading, getSpreadPositions]);

  const totalCards = currentPositions.length;

  const isComplete = useMemo(() => {
    if (!reading) return false;
    return isReadingComplete(reading, totalCards);
  }, [reading, totalCards]);

  const readingSpace = useMemo(() => {
    if (!reading?.spaceId) return undefined;
    return getSpace(reading.spaceId);
  }, [reading, getSpace]);

  const selectedCards = useMemo(() => {
    if (!reading) return [];
    return getCardsForReading(reading.cardIds, reading.spaceId);
  }, [reading, getCardsForReading]);

  useEffect(() => {
    if (reading) {
      saveReading(reading);
    }
  }, [reading]);

  useEffect(() => {
    if (
      reading &&
      isComplete &&
      selectedCards.length === totalCards &&
      archivedReadingRef.current !== reading.date
    ) {
      archivedReadingRef.current = reading.date;
      const positions = getSpreadPositions(reading.spreadId);
      const spreadForHistory = getSpread(reading.spreadId);
      const spaceForHistory = reading.spaceId ? getSpace(reading.spaceId) : undefined;
      const cardsToUse = reading.spaceId
        ? getAllCardsForSpace(reading.spaceId)
        : [...customCards];
      addCompletedReading(
        reading,
        cardsToUse,
        positions,
        spreadForHistory,
        spaceForHistory
      );
    }
  }, [
    reading,
    isComplete,
    selectedCards,
    totalCards,
    getSpreadPositions,
    getSpread,
    getSpace,
    getAllCardsForSpace,
    customCards,
    addCompletedReading,
  ]);

  const startReading = useCallback(
    (spreadId: string, spaceId: string) => {
      archivedReadingRef.current = null;
      const positionsCount = getSpreadPositionCount(spreadId);
      const cardsForSpace = getAllCardsForSpace(spaceId);
      const selectedSpread = getSpread(spreadId);
      const spreadSnapshot = getSpreadSnapshot(selectedSpread);
      const next = createReading(
        cardsForSpace,
        positionsCount,
        spreadId,
        spaceId,
        question,
        spreadSnapshot
      );
      setReading(next);
      setQuestion(next.question ?? "");
      saveReading(next);
    },
    [
      getSpreadPositionCount,
      getAllCardsForSpace,
      getSpread,
      getSpreadSnapshot,
      question,
    ]
  );

  const revealCard = useCallback(
    (index: number) => {
      if (!reading) return;
      const updated = revealNextCard(reading, index);
      setReading(updated);
    },
    [reading]
  );

  const clearReading = useCallback(() => {
    archivedReadingRef.current = null;
    setReading(null);
    clearReadingStorage();
  }, []);

  const restartReading = useCallback(() => {
    archivedReadingRef.current = null;
    setReading(null);
    clearReadingStorage();
  }, []);

  const handleSpaceDeletion = useCallback(
    (spaceId: string, cardsSnapshot: Card[]): boolean => {
      if (!reading) return false;
      const updatedReading = clearReadingIfFromSpace(reading, spaceId, cardsSnapshot);
      if (updatedReading === null) {
        archivedReadingRef.current = null;
        setReading(null);
        return true;
      }
      return false;
    },
    [reading]
  );

  const handleCardDeletion = useCallback(
    (cardWasInReading: boolean) => {
      if (cardWasInReading) {
        clearReading();
      }
    },
    [clearReading]
  );

  const handleSpreadDeletionReset = useCallback(() => {
    clearReading();
  }, [clearReading]);

  const handleBatchCardReset = useCallback(() => {
    clearReading();
  }, [clearReading]);

  const readingCardIds = reading?.cardIds ?? [];

  return {
    reading,
    question,
    setQuestion,
    selectedCards,
    currentPositions,
    totalCards,
    isComplete,
    readingSpace,
    startReading,
    revealCard,
    clearReading,
    restartReading,
    handleSpaceDeletion,
    handleCardDeletion,
    handleSpreadDeletionReset,
    handleBatchCardReset,
    readingCardIds,
  };
}
