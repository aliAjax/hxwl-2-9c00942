import type { Spread } from "../types";
import { SPREADS, DEFAULT_SPREAD_ID } from "./constants";

export function getAllSpreads(): Spread[] {
  return SPREADS;
}

export function getSpreadById(spreadId: string): Spread {
  return SPREADS.find((s) => s.id === spreadId) || SPREADS.find((s) => s.id === DEFAULT_SPREAD_ID)!;
}

export function getPositions(spreadId: string): string[] {
  return getSpreadById(spreadId).positions;
}

export function getPositionCount(spreadId: string): number {
  return getPositions(spreadId).length;
}
