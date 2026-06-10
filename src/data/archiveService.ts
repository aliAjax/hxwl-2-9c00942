import type { Reading, HistoryRecord, ArchiveResult, Card } from "../types";
import { loadRawReading, clearReading } from "./readingStore";
import { loadHistory, saveHistory, addRecord, createArchivedRecord } from "./historyStore";
import { getPositions, getSpreadById } from "./spreadStore";
import { getAllCards, loadCustomCards } from "./cardStore";
import { DEFAULT_CARDS } from "./constants";
import { todayKey, isToday } from "./dateUtils";

export function checkAndArchive(): ArchiveResult {
  const rawReading = loadRawReading();

  if (!rawReading) {
    return {
      archived: [],
      discarded: 0,
      message: "没有未完成的历史记录",
    };
  }

  if (isToday(rawReading.date)) {
    return {
      archived: [],
      discarded: 0,
      message: "今日记录有效，无需归档",
    };
  }

  const customCards = loadCustomCards();
  const allCards = getAllCards(customCards);
  const positions = getPositions(rawReading.spreadId);
  const history = loadHistory();

  const totalCards = positions.length;
  const revealedCount = rawReading.revealed;

  let archivedRecords: HistoryRecord[] = [];
  let discarded = 0;

  if (revealedCount === 0) {
    discarded = 1;
    clearReading();
  } else if (revealedCount >= totalCards) {
    const record = createArchivedRecord(rawReading, allCards, positions, "completed");
    const updatedHistory = addRecord(history, record);
    saveHistory(updatedHistory);
    archivedRecords = [record];
    clearReading();
  } else {
    const record = createArchivedRecord(rawReading, allCards, positions, "partial");
    const updatedHistory = addRecord(history, record);
    saveHistory(updatedHistory);
    archivedRecords = [record];
    clearReading();
  }

  const message = buildArchiveMessage(archivedRecords, discarded, rawReading);

  return {
    archived: archivedRecords,
    discarded,
    message,
  };
}

function buildArchiveMessage(
  archived: HistoryRecord[],
  discarded: number,
  reading: Reading
): string {
  const spread = getSpreadById(reading.spreadId);
  const dateLabel = reading.date;

  if (discarded > 0) {
    return `${dateLabel} 的 ${spread.name} 未翻开任何牌，已自动清除`;
  }

  if (archived.length > 0) {
    const record = archived[0];
    const reasonText = record.archiveReason === "completed" ? "已完成" : "部分翻开";
    return `${dateLabel} 的 ${spread.name}（${reasonText}）已归档到历史记录`;
  }

  return "归档完成";
}

export function archiveExpiredRecords(daysThreshold: number = 30): ArchiveResult {
  const history = loadHistory();
  const today = todayKey();
  const archived: HistoryRecord[] = [];

  const updated = history.map((record) => {
    if (record.archived) return record;

    const recordDate = new Date(record.date);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - recordDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > daysThreshold) {
      const archivedRecord: HistoryRecord = {
        ...record,
        archived: true,
        archiveReason: "expired",
      };
      archived.push(archivedRecord);
      return archivedRecord;
    }

    return record;
  });

  saveHistory(updated);

  return {
    archived,
    discarded: 0,
    message: `已将 ${archived.length} 条过期记录标记为已归档`,
  };
}
