import { useState, useEffect, useCallback } from "react";
import type { Space } from "../types";
import {
  loadSpaces,
  saveSpaces,
  loadCurrentSpaceId,
  saveCurrentSpaceId,
  createSpace,
  addSpace,
  updateSpace,
  deleteSpace,
  getSpaceById,
} from "../data/spaceStore";
import { DEFAULT_SPACE_ID } from "../data/constants";

export type UseSpacesReturn = {
  spaces: Space[];
  currentSpaceId: string;
  currentSpace: Space;
  getSpace: (spaceId: string) => Space | undefined;
  addSpaceItem: (name: string, icon: string) => Space;
  updateSpaceItem: (space: Space) => void;
  deleteSpaceItem: (spaceId: string) => {
    success: boolean;
    affectsReading: boolean;
  };
  changeCurrentSpace: (spaceId: string) => void;
};

export function useSpaces(): UseSpacesReturn {
  const [spaces, setSpaces] = useState<Space[]>(loadSpaces);
  const [currentSpaceId, setCurrentSpaceId] = useState<string>(loadCurrentSpaceId);

  useEffect(() => {
    saveSpaces(spaces);
  }, [spaces]);

  useEffect(() => {
    saveCurrentSpaceId(currentSpaceId);
  }, [currentSpaceId]);

  const currentSpace = getSpaceById(spaces, currentSpaceId) ?? spaces[0];

  const getSpace = useCallback(
    (spaceId: string) => getSpaceById(spaces, spaceId),
    [spaces]
  );

  const addSpaceItem = useCallback((name: string, icon: string): Space => {
    const space = createSpace(name, icon);
    setSpaces((prev) => addSpace(prev, space));
    setCurrentSpaceId(space.id);
    return space;
  }, []);

  const updateSpaceItem = useCallback((space: Space) => {
    setSpaces((prev) => updateSpace(prev, space));
  }, []);

  const deleteSpaceItem = useCallback(
    (
      spaceId: string
    ): {
      success: boolean;
      affectsReading: boolean;
    } => {
      if (spaceId === DEFAULT_SPACE_ID) {
        return { success: false, affectsReading: false };
      }

      setSpaces((prev) => deleteSpace(prev, spaceId));

      if (currentSpaceId === spaceId) {
        setCurrentSpaceId(DEFAULT_SPACE_ID);
      }

      return { success: true, affectsReading: true };
    },
    [currentSpaceId]
  );

  const changeCurrentSpace = useCallback((spaceId: string) => {
    setCurrentSpaceId(spaceId);
  }, []);

  return {
    spaces,
    currentSpaceId,
    currentSpace,
    getSpace,
    addSpaceItem,
    updateSpaceItem,
    deleteSpaceItem,
    changeCurrentSpace,
  };
}
