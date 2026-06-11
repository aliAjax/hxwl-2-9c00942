import type { Spread, SpreadSnapshot } from "../types";
import {
  SPREADS,
  DEFAULT_SPREAD_ID,
  STORAGE_KEYS,
  DELETED_SPREAD_PLACEHOLDER,
} from "./constants";
import { safeGetItem, safeSetItem } from "./storage";

export function loadCustomSpreads(): Spread[] {
  return safeGetItem<Spread[]>(STORAGE_KEYS.customSpreads, []);
}

export function saveCustomSpreads(customSpreads: Spread[]): boolean {
  return safeSetItem(STORAGE_KEYS.customSpreads, customSpreads);
}

export function getAllSpreads(customSpreads?: Spread[]): Spread[] {
  const customs = customSpreads ?? loadCustomSpreads();
  return [...SPREADS, ...customs];
}

export function getPresetSpreadIds(): string[] {
  return SPREADS.map((s) => s.id);
}

export function isPresetSpread(spreadId: string): boolean {
  return SPREADS.some((s) => s.id === spreadId);
}

export function getSpreadById(
  spreadId: string,
  customSpreads?: Spread[]
): Spread {
  const all = getAllSpreads(customSpreads);
  const found = all.find((s) => s.id === spreadId);
  if (found) return found;
  const defaultSpread = all.find((s) => s.id === DEFAULT_SPREAD_ID);
  return defaultSpread ?? SPREADS[0];
}

export function getSpreadOrPlaceholder(
  spreadId: string,
  customSpreads?: Spread[]
): Spread | SpreadSnapshot {
  const all = getAllSpreads(customSpreads);
  const found = all.find((s) => s.id === spreadId);
  if (found) return found;
  return { ...DELETED_SPREAD_PLACEHOLDER, id: spreadId };
}

export function getSnapshot(spread: Spread | SpreadSnapshot): SpreadSnapshot {
  return {
    id: spread.id,
    name: spread.name,
    subtitle: spread.subtitle,
    description: spread.description,
    positions: [...spread.positions],
    icon: spread.icon,
  };
}

export function getPositions(spreadId: string, customSpreads?: Spread[]): string[] {
  return getSpreadById(spreadId, customSpreads).positions;
}

export function getPositionCount(spreadId: string, customSpreads?: Spread[]): number {
  return getPositions(spreadId, customSpreads).length;
}

export function createSpread(
  name: string,
  subtitle: string,
  description: string,
  positions: string[],
  icon: string
): Spread {
  return {
    id: `spread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    subtitle: subtitle.trim(),
    description: description.trim(),
    positions: positions.map((p) => p.trim()).filter((p) => p.length > 0),
    icon: icon.trim() || "✨",
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
}

export function addCustomSpread(
  customSpreads: Spread[],
  spread: Spread
): Spread[] {
  return [...customSpreads, spread];
}

export function updateCustomSpread(
  customSpreads: Spread[],
  spread: Spread
): Spread[] {
  return customSpreads.map((s) => (s.id === spread.id ? spread : s));
}

export function deleteCustomSpread(
  customSpreads: Spread[],
  spreadId: string
): Spread[] {
  return customSpreads.filter((s) => s.id !== spreadId);
}

export function validateSpread(
  name: string,
  positions: string[]
): { valid: boolean; error?: string } {
  if (!name.trim()) {
    return { valid: false, error: "牌阵名称不能为空" };
  }
  if (name.trim().length > 30) {
    return { valid: false, error: "牌阵名称不能超过30个字符" };
  }
  const validPositions = positions.map((p) => p.trim()).filter((p) => p.length > 0);
  if (validPositions.length === 0) {
    return { valid: false, error: "至少需要一个位置" };
  }
  if (validPositions.length > 10) {
    return { valid: false, error: "位置数量不能超过10个" };
  }
  for (let i = 0; i < validPositions.length; i++) {
    if (validPositions[i].length > 20) {
      return { valid: false, error: `第${i + 1}个位置名称不能超过20个字符` };
    }
  }
  return { valid: true };
}

export function duplicateSpread(
  spread: Spread,
  targetPositions?: string[]
): Spread {
  return {
    id: `spread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `${spread.name} 副本`,
    subtitle: spread.subtitle,
    description: spread.description,
    positions: targetPositions ? [...targetPositions] : [...spread.positions],
    icon: spread.icon,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
}
