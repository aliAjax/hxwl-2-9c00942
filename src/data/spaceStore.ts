import type { Space, Card, HistoryRecord, Reading, Spread } from "../types";
import { STORAGE_KEYS, DEFAULT_SPACE, DEFAULT_SPACE_ID } from "./constants";
import { safeGetItem, safeSetItem } from "./storage";
import { getSpreadById } from "./spreadStore";

export type SpaceStats = {
  customCardCount: number;
  drawCount: number;
  lastDrawDate: string | null;
  mostUsedSpread: Spread | null;
};

export type SortField =
  | "createdAt"
  | "name"
  | "customCardCount"
  | "drawCount"
  | "lastDrawDate";

export type SortOrder = "asc" | "desc";

export function computeSpaceStats(
  spaceId: string,
  customCards: Card[],
  history: HistoryRecord[],
  allSpreads: Spread[]
): SpaceStats {
  const spaceCustomCards = customCards.filter(
    (c) => c.spaceId === spaceId || (!c.spaceId && spaceId === DEFAULT_SPACE_ID)
  );
  const customCardCount = spaceCustomCards.length;

  const spaceHistory = history.filter((r) => r.spaceId === spaceId || (!r.spaceId && spaceId === DEFAULT_SPACE_ID));
  const drawCount = spaceHistory.length;

  const sortedByDate = [...spaceHistory].sort((a, b) => b.date.localeCompare(a.date));
  const lastDrawDate = sortedByDate.length > 0 ? sortedByDate[0].date : null;

  const spreadCountMap = new Map<string, number>();
  for (const record of spaceHistory) {
    if (record.spreadId) {
      spreadCountMap.set(record.spreadId, (spreadCountMap.get(record.spreadId) ?? 0) + 1);
    }
  }
  let mostUsedSpread: Spread | null = null;
  let maxCount = 0;
  for (const [spreadId, count] of spreadCountMap.entries()) {
    if (count > maxCount) {
      maxCount = count;
      const spread = allSpreads.find((s) => s.id === spreadId);
      if (spread) {
        mostUsedSpread = spread;
      }
    }
  }

  return {
    customCardCount,
    drawCount,
    lastDrawDate,
    mostUsedSpread,
  };
}

export function sortSpaces(
  spaces: Space[],
  statsMap: Map<string, SpaceStats>,
  field: SortField,
  order: SortOrder
): Space[] {
  const sorted = [...spaces].sort((a, b) => {
    const statsA = statsMap.get(a.id) ?? {
      customCardCount: 0,
      drawCount: 0,
      lastDrawDate: null,
      mostUsedSpread: null,
    };
    const statsB = statsMap.get(b.id) ?? {
      customCardCount: 0,
      drawCount: 0,
      lastDrawDate: null,
      mostUsedSpread: null,
    };

    let compareVal = 0;
    switch (field) {
      case "createdAt":
        compareVal = a.createdAt.localeCompare(b.createdAt);
        break;
      case "name":
        compareVal = a.name.localeCompare(b.name, "zh-CN");
        break;
      case "customCardCount":
        compareVal = statsA.customCardCount - statsB.customCardCount;
        break;
      case "drawCount":
        compareVal = statsA.drawCount - statsB.drawCount;
        break;
      case "lastDrawDate":
        const dateA = statsA.lastDrawDate ?? "";
        const dateB = statsB.lastDrawDate ?? "";
        if (!dateA && !dateB) compareVal = 0;
        else if (!dateA) compareVal = -1;
        else if (!dateB) compareVal = 1;
        else compareVal = dateA.localeCompare(dateB);
        break;
    }
    return order === "asc" ? compareVal : -compareVal;
  });

  const defaultIdx = sorted.findIndex((s) => s.isDefault);
  if (defaultIdx > 0) {
    const [defaultSpace] = sorted.splice(defaultIdx, 1);
    sorted.unshift(defaultSpace);
  }

  return sorted;
}

export function getDeletionImpact(
  spaceId: string,
  customCards: Card[],
  reading: Reading | null,
  allSpreads: Spread[]
): {
  customCardCount: number;
  affectsTodayReading: boolean;
  todayReadingDetails: {
    isSameSpace: boolean;
    usesSpaceCards: boolean;
    spreadName: string | null;
    revealedCount: number;
    totalPositions: number;
  } | null;
} {
  const spaceCards = customCards.filter((c) => c.spaceId === spaceId);
  const customCardCount = spaceCards.length;

  let todayReadingDetails: ReturnType<typeof getDeletionImpact>["todayReadingDetails"] = null;
  let affectsTodayReading = false;

  if (reading) {
    const isSameSpace = reading.spaceId === spaceId;
    const spaceCardIdSet = new Set(spaceCards.map((c) => c.id));
    const usesSpaceCards = reading.cardIds.some((id) => spaceCardIdSet.has(id));
    affectsTodayReading = isSameSpace || usesSpaceCards;

    if (affectsTodayReading) {
      const spread = allSpreads.find((s) => s.id === reading.spreadId);
      todayReadingDetails = {
        isSameSpace,
        usesSpaceCards,
        spreadName: spread?.name ?? null,
        revealedCount: reading.revealed,
        totalPositions: spread?.positions.length ?? reading.cardIds.length,
      };
    }
  }

  return {
    customCardCount,
    affectsTodayReading,
    todayReadingDetails,
  };
}

export function loadSpaces(): Space[] {
  const raw = safeGetItem<Space[] | null>(STORAGE_KEYS.spaces, null);
  if (!raw || raw.length === 0) {
    return [DEFAULT_SPACE];
  }
  const hasDefault = raw.some((s) => s.id === DEFAULT_SPACE_ID);
  if (!hasDefault) {
    return [DEFAULT_SPACE, ...raw];
  }
  return raw;
}

export function saveSpaces(spaces: Space[]): boolean {
  return safeSetItem(STORAGE_KEYS.spaces, spaces);
}

export function loadCurrentSpaceId(): string {
  return safeGetItem<string>(STORAGE_KEYS.currentSpaceId, DEFAULT_SPACE_ID);
}

export function saveCurrentSpaceId(spaceId: string): boolean {
  return safeSetItem(STORAGE_KEYS.currentSpaceId, spaceId);
}

export function createSpace(name: string, icon: string): Space {
  return {
    id: `space-${Date.now()}`,
    name: name.trim(),
    icon: icon.trim() || "📁",
    createdAt: new Date().toISOString(),
  };
}

export function addSpace(spaces: Space[], space: Space): Space[] {
  return [...spaces, space];
}

export function updateSpace(spaces: Space[], space: Space): Space[] {
  return spaces.map((s) => (s.id === space.id ? space : s));
}

export function deleteSpace(spaces: Space[], spaceId: string): Space[] {
  if (spaceId === DEFAULT_SPACE_ID) {
    return spaces;
  }
  return spaces.filter((s) => s.id !== spaceId);
}

export function getSpaceById(spaces: Space[], spaceId: string): Space | undefined {
  return spaces.find((s) => s.id === spaceId);
}

export function isDefaultSpace(spaceId: string): boolean {
  return spaceId === DEFAULT_SPACE_ID;
}

export function validateSpace(name: string): { valid: boolean; error?: string } {
  if (!name.trim()) {
    return { valid: false, error: "空间名称不能为空" };
  }
  if (name.trim().length > 20) {
    return { valid: false, error: "空间名称不能超过20个字符" };
  }
  return { valid: true };
}
