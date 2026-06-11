import { useState, useEffect, useCallback, useMemo } from "react";
import type { Spread, SpreadSnapshot } from "../types";
import {
  getAllSpreads,
  loadCustomSpreads,
  saveCustomSpreads,
  addCustomSpread,
  updateCustomSpread,
  deleteCustomSpread,
  isPresetSpread,
  getSpreadById,
  getPositions,
  getPositionCount,
  getSnapshot,
} from "../data/spreadStore";
import { DEFAULT_SPREAD_ID } from "../data/constants";

export type UseSpreadsReturn = {
  customSpreads: Spread[];
  allSpreads: Spread[];
  selectedSpreadId: string;
  currentSpread: Spread;
  setSelectedSpreadId: (id: string) => void;
  getSpread: (spreadId: string) => Spread;
  getSpreadPositions: (spreadId: string) => string[];
  getSpreadPositionCount: (spreadId: string) => number;
  getSpreadSnapshot: (spread: Spread | SpreadSnapshot) => SpreadSnapshot;
  addSpreadItem: (spread: Spread) => void;
  updateSpreadItem: (spread: Spread) => void;
  deleteSpreadItem: (
    spreadId: string,
    activeReadingSpreadId?: string
  ) => { success: boolean; resetReading: boolean };
  isPreset: (spreadId: string) => boolean;
};

export function useSpreads(initialSelectedId?: string): UseSpreadsReturn {
  const [customSpreads, setCustomSpreads] = useState<Spread[]>(loadCustomSpreads);
  const [selectedSpreadId, setSelectedSpreadId] = useState<string>(
    initialSelectedId ?? DEFAULT_SPREAD_ID
  );

  useEffect(() => {
    saveCustomSpreads(customSpreads);
  }, [customSpreads]);

  useEffect(() => {
    const allSpreadIds = getAllSpreads(customSpreads).map((s) => s.id);
    if (!allSpreadIds.includes(selectedSpreadId)) {
      setSelectedSpreadId(DEFAULT_SPREAD_ID);
    }
  }, [customSpreads, selectedSpreadId]);

  const allSpreads = useMemo(() => getAllSpreads(customSpreads), [customSpreads]);
  const currentSpread = useMemo(
    () => getSpreadById(selectedSpreadId, customSpreads),
    [selectedSpreadId, customSpreads]
  );

  const getSpread = useCallback(
    (spreadId: string) => getSpreadById(spreadId, customSpreads),
    [customSpreads]
  );

  const getSpreadPositions = useCallback(
    (spreadId: string) => getPositions(spreadId, customSpreads),
    [customSpreads]
  );

  const getSpreadPositionCount = useCallback(
    (spreadId: string) => getPositionCount(spreadId, customSpreads),
    [customSpreads]
  );

  const getSpreadSnapshot = useCallback(
    (spread: Spread | SpreadSnapshot) => getSnapshot(spread),
    []
  );

  const addSpreadItem = useCallback((spread: Spread) => {
    setCustomSpreads((prev) => addCustomSpread(prev, spread));
    setSelectedSpreadId(spread.id);
  }, []);

  const updateSpreadItem = useCallback((spread: Spread) => {
    setCustomSpreads((prev) => updateCustomSpread(prev, spread));
  }, []);

  const deleteSpreadItem = useCallback(
    (
      spreadId: string,
      activeReadingSpreadId?: string
    ): { success: boolean; resetReading: boolean } => {
      if (isPresetSpread(spreadId)) {
        return { success: false, resetReading: false };
      }
      setCustomSpreads((prev) => deleteCustomSpread(prev, spreadId));
      if (selectedSpreadId === spreadId) {
        setSelectedSpreadId(DEFAULT_SPREAD_ID);
      }
      const resetReading = activeReadingSpreadId === spreadId;
      return { success: true, resetReading };
    },
    [selectedSpreadId]
  );

  const isPreset = useCallback((spreadId: string) => isPresetSpread(spreadId), []);

  return {
    customSpreads,
    allSpreads,
    selectedSpreadId,
    currentSpread,
    setSelectedSpreadId,
    getSpread,
    getSpreadPositions,
    getSpreadPositionCount,
    getSpreadSnapshot,
    addSpreadItem,
    updateSpreadItem,
    deleteSpreadItem,
    isPreset,
  };
}
