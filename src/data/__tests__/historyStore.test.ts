import { describe, it, expect } from "vitest";
import type { HistoryRecord, Reading, Card, Space, Spread } from "../../types";
import {
  addRecord,
  addReadingToHistory,
  readingToHistoryRecord,
  createArchivedRecord,
  getHistoryBySpace,
  getSpreadForHistory,
} from "../historyStore";
import { DEFAULT_CARDS, DELETED_CARD_PLACEHOLDER, DELETED_SPREAD_PLACEHOLDER, DEFAULT_SPACE } from "../constants";
import { getSnapshot } from "../spreadStore";

describe("historyStore 纯函数", () => {
  const mockCards: Card[] = [
    ...DEFAULT_CARDS.slice(0, 5),
    {
      id: "custom-1",
      name: "自定义牌1",
      keyword: "自定义1",
      meaning: "自定义含义1",
      hue: "#ff0000",
      glyph: "自",
      isCustom: true,
      spaceId: "work",
      illustration: "data:image/png;base64,custom-illustration",
    },
  ];

  const mockSpread: Spread = {
    id: "three-card",
    name: "三张牌展开",
    subtitle: "事件·阻碍·建议",
    description: "经典三张牌阵",
    positions: ["事件", "阻碍", "建议"],
    icon: "🎴",
    isCustom: false,
  };

  const mockCustomSpread: Spread = {
    id: "custom-spread-1",
    name: "自定义牌阵",
    subtitle: "自定义",
    description: "自定义牌阵描述",
    positions: ["位置1", "位置2", "位置3"],
    icon: "✨",
    isCustom: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  };

  const mockSpace: Space = {
    id: "work",
    name: "工作空间",
    icon: "💼",
    createdAt: "2024-01-01T00:00:00.000Z",
  };

  const mockReading: Reading = {
    date: "2024-01-16",
    cardIds: [DEFAULT_CARDS[0].id, DEFAULT_CARDS[1].id, "custom-1"],
    revealed: 3,
    spreadId: "three-card",
    spaceId: "work",
    question: "今天的工作运势如何？",
    spreadSnapshot: getSnapshot(mockSpread),
  };

  const mockHistoryRecords: HistoryRecord[] = [
    {
      date: "2024-01-15",
      cards: [
        { position: "事件", name: "倒挂灯笼", keyword: "迟来的消息", meaning: "不要急着催促...", hue: "#e05d5d", glyph: "灯" },
        { position: "阻碍", name: "井边银币", keyword: "被忽略的资源", meaning: "你已经拥有...", hue: "#6ba3b8", glyph: "井" },
        { position: "建议", name: "月蛾", keyword: "靠近光源", meaning: "今天适合靠近...", hue: "#b9a76f", glyph: "蛾" },
      ],
      spreadId: "three-card",
      spreadSnapshot: getSnapshot(mockSpread),
      spaceId: "work",
      spaceName: "工作空间",
      question: "今天的工作运势如何？",
    },
    {
      date: "2024-01-14",
      cards: [
        { position: "今日指引", name: "纸船", keyword: "轻装出发", meaning: "把多余的顾虑放下...", hue: "#d9904f", glyph: "舟" },
      ],
      spreadId: "one-card",
      spreadSnapshot: getSnapshot({
        id: "one-card",
        name: "一张牌快速指引",
        subtitle: "今日一签",
        description: "抽一张牌",
        positions: ["今日指引"],
        icon: "✨",
      }),
      spaceId: "default",
      question: "今日运势",
    },
    {
      date: "2024-01-13",
      cards: [
        { position: "位置1", name: "自定义牌1", keyword: "自定义1", meaning: "自定义含义1", hue: "#ff0000", glyph: "自" },
      ],
      spreadId: "custom-spread-1",
      spreadSnapshot: getSnapshot(mockCustomSpread),
      spaceId: "relationship",
      spaceName: "关系空间",
    },
  ];

  describe("addRecord", () => {
    it("应该添加新记录到数组开头", () => {
      const newRecord: HistoryRecord = {
        date: "2024-01-16",
        cards: [],
        spreadId: "one-card",
        spaceId: "default",
      };
      const result = addRecord(mockHistoryRecords, newRecord);
      expect(result.length).toBe(mockHistoryRecords.length + 1);
      expect(result[0].date).toBe("2024-01-16");
      expect(result).not.toBe(mockHistoryRecords);
    });

    it("相同日期的记录应该被替换", () => {
      const updatedRecord: HistoryRecord = {
        ...mockHistoryRecords[0],
        question: "更新后的问题",
      };
      const result = addRecord(mockHistoryRecords, updatedRecord);
      expect(result.length).toBe(mockHistoryRecords.length);
      expect(result[0].question).toBe("更新后的问题");
    });

    it("空数组应该返回包含新记录的数组", () => {
      const newRecord: HistoryRecord = {
        date: "2024-01-16",
        cards: [],
        spreadId: "one-card",
        spaceId: "default",
      };
      const result = addRecord([], newRecord);
      expect(result.length).toBe(1);
      expect(result[0]).toBe(newRecord);
    });
  });

  describe("readingToHistoryRecord", () => {
    it("应该正确转换阅读记录为历史记录", () => {
      const positions = ["事件", "阻碍", "建议"];
      const result = readingToHistoryRecord(mockReading, mockCards, positions, mockSpread, mockSpace);

      expect(result.date).toBe(mockReading.date);
      expect(result.spaceId).toBe(mockReading.spaceId);
      expect(result.spaceName).toBe(mockSpace.name);
      expect(result.spreadId).toBe(mockReading.spreadId);
      expect(result.question).toBe(mockReading.question);
      expect(result.cards.length).toBe(3);
      expect(result.spreadSnapshot).toEqual(getSnapshot(mockSpread));
    });

    it("应该正确映射每张牌的信息", () => {
      const positions = ["事件", "阻碍", "建议"];
      const result = readingToHistoryRecord(mockReading, mockCards, positions, mockSpread, mockSpace);

      expect(result.cards[0].position).toBe("事件");
      expect(result.cards[0].name).toBe(DEFAULT_CARDS[0].name);
      expect(result.cards[0].keyword).toBe(DEFAULT_CARDS[0].keyword);
      expect(result.cards[0].meaning).toBe(DEFAULT_CARDS[0].meaning);
      expect(result.cards[0].hue).toBe(DEFAULT_CARDS[0].hue);
      expect(result.cards[0].glyph).toBe(DEFAULT_CARDS[0].glyph);

      expect(result.cards[2].name).toBe("自定义牌1");
      expect(result.cards[2].illustration).toBe("data:image/png;base64,custom-illustration");
    });

    it("已删除的牌应该返回占位牌", () => {
      const readingWithDeleted: Reading = {
        ...mockReading,
        cardIds: ["deleted-card", DEFAULT_CARDS[0].id, "another-deleted"],
      };
      const positions = ["事件", "阻碍", "建议"];
      const result = readingToHistoryRecord(readingWithDeleted, mockCards, positions, mockSpread, mockSpace);

      expect(result.cards[0].name).toBe(DELETED_CARD_PLACEHOLDER.name);
      expect(result.cards[0].isDeleted).toBe(true);
      expect(result.cards[1].name).toBe(DEFAULT_CARDS[0].name);
      expect(result.cards[2].name).toBe(DELETED_CARD_PLACEHOLDER.name);
    });

    it("只包含已翻开的牌", () => {
      const partialReading: Reading = {
        ...mockReading,
        revealed: 2,
      };
      const positions = ["事件", "阻碍", "建议"];
      const result = readingToHistoryRecord(partialReading, mockCards, positions, mockSpread, mockSpace);

      expect(result.cards.length).toBe(2);
    });

    it("未提供space时应该不设置spaceName", () => {
      const positions = ["事件", "阻碍", "建议"];
      const result = readingToHistoryRecord(mockReading, mockCards, positions, mockSpread);

      expect(result.spaceName).toBeUndefined();
      expect(result.spaceId).toBe(mockReading.spaceId);
    });

    it("没有问题时应该不设置question", () => {
      const readingWithoutQuestion: Reading = {
        ...mockReading,
        question: undefined,
      };
      const positions = ["事件", "阻碍", "建议"];
      const result = readingToHistoryRecord(readingWithoutQuestion, mockCards, positions, mockSpread, mockSpace);

      expect(result.question).toBeUndefined();
    });

    it("位置不足时应该使用空字符串", () => {
      const shortPositions = ["事件"];
      const result = readingToHistoryRecord(mockReading, mockCards, shortPositions, mockSpread, mockSpace);

      expect(result.cards[0].position).toBe("事件");
      expect(result.cards[1].position).toBe("");
      expect(result.cards[2].position).toBe("");
    });

    it("没有illustration的牌不应该包含该字段", () => {
      const positions = ["事件", "阻碍", "建议"];
      const result = readingToHistoryRecord(mockReading, mockCards, positions, mockSpread, mockSpace);

      expect("illustration" in result.cards[0]).toBe(false);
      expect("illustration" in result.cards[2]).toBe(true);
    });
  });

  describe("addReadingToHistory", () => {
    it("应该将阅读记录转换并添加到历史", () => {
      const positions = ["事件", "阻碍", "建议"];
      const result = addReadingToHistory(mockHistoryRecords, mockReading, mockCards, positions, mockSpread, mockSpace);

      expect(result.length).toBe(mockHistoryRecords.length + 1);
      expect(result[0].date).toBe(mockReading.date);
      expect(result[0].cards.length).toBe(3);
    });

    it("相同日期的阅读应该替换历史记录", () => {
      const sameDateReading: Reading = {
        ...mockReading,
        date: "2024-01-15",
        question: "更新后的问题",
      };
      const positions = ["事件", "阻碍", "建议"];
      const result = addReadingToHistory(mockHistoryRecords, sameDateReading, mockCards, positions, mockSpread, mockSpace);

      expect(result.length).toBe(mockHistoryRecords.length);
      expect(result[0].question).toBe("更新后的问题");
    });
  });

  describe("createArchivedRecord", () => {
    it("应该创建已完成的归档记录", () => {
      const positions = ["事件", "阻碍", "建议"];
      const result = createArchivedRecord(mockReading, mockCards, positions, "completed", mockSpread, mockSpace);

      expect(result.archived).toBe(true);
      expect(result.archiveReason).toBe("completed");
      expect(result.date).toBe(mockReading.date);
      expect(result.cards.length).toBe(3);
    });

    it("应该创建部分完成的归档记录", () => {
      const partialReading: Reading = {
        ...mockReading,
        revealed: 2,
      };
      const positions = ["事件", "阻碍", "建议"];
      const result = createArchivedRecord(partialReading, mockCards, positions, "partial", mockSpread, mockSpace);

      expect(result.archived).toBe(true);
      expect(result.archiveReason).toBe("partial");
      expect(result.cards.length).toBe(2);
    });

    it("应该创建过期的归档记录", () => {
      const positions = ["事件", "阻碍", "建议"];
      const result = createArchivedRecord(mockReading, mockCards, positions, "expired", mockSpread, mockSpace);

      expect(result.archived).toBe(true);
      expect(result.archiveReason).toBe("expired");
    });

    it("未提供space时应该不设置spaceName", () => {
      const positions = ["事件", "阻碍", "建议"];
      const result = createArchivedRecord(mockReading, mockCards, positions, "completed", mockSpread);

      expect(result.spaceName).toBeUndefined();
      expect(result.spaceId).toBe(mockReading.spaceId);
    });
  });

  describe("getHistoryBySpace", () => {
    it("应该返回指定空间的历史记录", () => {
      const result = getHistoryBySpace(mockHistoryRecords, "work");
      expect(result.length).toBe(1);
      expect(result[0].spaceId).toBe("work");
    });

    it("应该包含没有spaceId的记录", () => {
      const recordsWithoutSpace: HistoryRecord[] = [
        ...mockHistoryRecords,
        {
          date: "2024-01-12",
          cards: [],
          spreadId: "one-card",
        },
      ];
      const result = getHistoryBySpace(recordsWithoutSpace, "default");
      expect(result.length).toBe(2);
      expect(result.some((r) => r.spaceId === "default")).toBe(true);
      expect(result.some((r) => r.spaceId === undefined)).toBe(true);
    });

    it("空历史应该返回空数组", () => {
      const result = getHistoryBySpace([], "work");
      expect(result.length).toBe(0);
    });

    it("没有匹配的空间应该返回空数组", () => {
      const result = getHistoryBySpace(mockHistoryRecords, "non-existent");
      expect(result.length).toBe(0);
    });
  });

  describe("getSpreadForHistory", () => {
    it("有spreadSnapshot时应该直接返回", () => {
      const record = mockHistoryRecords[0];
      const result = getSpreadForHistory(record);
      expect(result).toEqual(record.spreadSnapshot);
    });

    it("没有spreadSnapshot但有spreadId时应该查询占位牌", () => {
      const recordWithoutSnapshot: HistoryRecord = {
        date: "2024-01-15",
        cards: [],
        spreadId: "deleted-spread-id",
      };
      const result = getSpreadForHistory(recordWithoutSnapshot);
      expect(result.id).toBe("deleted-spread-id");
      expect((result as { isDeleted?: boolean }).isDeleted).toBe(true);
    });

    it("既没有spreadSnapshot也没有spreadId时应该返回默认占位牌", () => {
      const recordWithoutBoth: HistoryRecord = {
        date: "2024-01-15",
        cards: [],
      };
      const result = getSpreadForHistory(recordWithoutBoth);
      expect(result.id).toBe(DELETED_SPREAD_PLACEHOLDER.id);
      expect(result.name).toBe(DELETED_SPREAD_PLACEHOLDER.name);
    });

    it("预设牌阵的spreadId应该正确返回", () => {
      const recordWithPresetSpread: HistoryRecord = {
        date: "2024-01-15",
        cards: [],
        spreadId: "three-card",
      };
      const result = getSpreadForHistory(recordWithPresetSpread);
      expect(result.id).toBe("three-card");
      expect((result as Spread).name).toBe("三张牌展开");
    });
  });
});
