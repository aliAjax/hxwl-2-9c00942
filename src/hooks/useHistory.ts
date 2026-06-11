import { useState, useEffect, useCallback } from "react";
import type { HistoryRecord, ArchiveResult, Reading, Card, Space, Spread, SpreadSnapshot } from "../types";
import { loadHistory, saveHistory, clearHistory as clearHistoryStorage, addReadingToHistory } from "../data/historyStore";
import { checkAndArchive } from "../data/archiveService";

export type UseHistoryReturn = {
  history: HistoryRecord[];
  archiveNotice: ArchiveResult | null;
  dismissArchiveNotice: () => void;
  addCompletedReading: (
    reading: Reading,
    cards: Card[],
    positions: string[],
    spread: Spread | SpreadSnapshot,
    space?: Space
  ) => void;
  clearAllHistory: () => void;
};

export function useHistory(): UseHistoryReturn {
  const [history, setHistory] = useState<HistoryRecord[]>(loadHistory);
  const [archiveNotice, setArchiveNotice] = useState<ArchiveResult | null>(null);

  useEffect(() => {
    const result = checkAndArchive();
    if (result.archived.length > 0 || result.discarded > 0) {
      setArchiveNotice(result);
      setHistory(loadHistory());
    }
  }, []);

  const dismissArchiveNotice = useCallback(() => {
    setArchiveNotice(null);
  }, []);

  const addCompletedReading = useCallback(
    (
      reading: Reading,
      cards: Card[],
      positions: string[],
      spread: Spread | SpreadSnapshot,
      space?: Space
    ) => {
      setHistory((prevHistory) => {
        const updatedHistory = addReadingToHistory(
          prevHistory,
          reading,
          cards,
          positions,
          spread,
          space
        );
        saveHistory(updatedHistory);
        return updatedHistory;
      });
    },
    []
  );

  const clearAllHistory = useCallback(() => {
    clearHistoryStorage();
    setHistory([]);
  }, []);

  return {
    history,
    archiveNotice,
    dismissArchiveNotice,
    addCompletedReading,
    clearAllHistory,
  };
}
