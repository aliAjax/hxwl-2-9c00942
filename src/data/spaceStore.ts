import type { Space } from "../types";
import { STORAGE_KEYS, DEFAULT_SPACE, DEFAULT_SPACE_ID } from "./constants";
import { safeGetItem, safeSetItem } from "./storage";

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
