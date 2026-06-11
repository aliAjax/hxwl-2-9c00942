import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Reading, Card } from "../../types";
import {
  drawCardIds,
  createReading,
  getRevealedCards,
  isReadingComplete,
  revealNextCard,
  isReadingFromSpace,
  clearReadingIfFromSpace,
} from "../readingStore";
import { DEFAULT_CARDS, DELETED_CARD_PLACEHOLDER, DEFAULT_SPACE_ID } from "../constants";
import { getCardById } from "../cardStore";

describe("readingStore 纯函数", () => {
  const mockCustomCards: Card[] = [
    {
      id: "custom-1",
      name: "自定义牌1",
      keyword: "自定义1",
      meaning: "自定义含义1",
      hue: "#ff0000",
      glyph: "自",
      isCustom: true,
      spaceId: "work",
    },
    {
      id: "custom-2",
      name: "自定义牌2",
      keyword: "自定义2",
      meaning: "自定义含义2",
      hue: "#00ff00",
      glyph: "定",
      isCustom: true,
      spaceId: "work",
    },
  ];

  const allCards = [...DEFAULT_CARDS, ...mockCustomCards];

  describe("drawCardIds", () => {
    it("应该抽取指定数量的牌ID", () => {
      const count = 3;
      const result = drawCardIds(allCards, count);
      expect(result.length).toBe(count);
      expect(result.every((id) => allCards.some((c) => c.id === id))).toBe(true);
    });

    it("抽取0张牌应该返回空数组", () => {
      const result = drawCardIds(allCards, 0);
      expect(result.length).toBe(0);
    });

    it("抽取数量超过牌总数时应该返回所有牌", () => {
      const result = drawCardIds(allCards, allCards.length + 10);
      expect(result.length).toBe(allCards.length);
    });

    it("每次抽取应该是随机的", () => {
      const results: string[][] = [];
      for (let i = 0; i < 5; i++) {
        results.push(drawCardIds(allCards, 5));
      }
      const areAllSame = results.every((r) => r.join(",") === results[0].join(","));
      expect(areAllSame).toBe(false);
    });

    it("不应该有重复的牌ID", () => {
      const result = drawCardIds(allCards, 10);
      const uniqueIds = new Set(result);
      expect(uniqueIds.size).toBe(result.length);
    });
  });

  describe("createReading", () => {
    it("应该创建带有正确字段的阅读记录", () => {
      const reading = createReading(allCards, 3, "three-card", "work", "测试问题");
      expect(reading.cardIds.length).toBe(3);
      expect(reading.revealed).toBe(0);
      expect(reading.spreadId).toBe("three-card");
      expect(reading.spaceId).toBe("work");
      expect(reading.question).toBe("测试问题");
      expect(reading.date).toBeDefined();
    });

    it("应该使用默认空间ID", () => {
      const reading = createReading(allCards, 1, "one-card");
      expect(reading.spaceId).toBe(DEFAULT_SPACE_ID);
    });

    it("空问题应该设为undefined", () => {
      const reading = createReading(allCards, 1, "one-card", "default", "   ");
      expect(reading.question).toBeUndefined();
    });

    it("应该保存牌阵快照", () => {
      const spreadSnapshot = {
        id: "custom-spread",
        name: "自定义牌阵",
        subtitle: "测试",
        description: "测试描述",
        positions: ["位置1", "位置2"],
        icon: "✨",
      };
      const reading = createReading(allCards, 2, "custom-spread", "default", undefined, spreadSnapshot);
      expect(reading.spreadSnapshot).toEqual(spreadSnapshot);
    });
  });

  describe("getRevealedCards", () => {
    const mockGetCardById = vi.fn(getCardById);

    beforeEach(() => {
      mockGetCardById.mockClear();
    });

    it("应该返回已翻开的牌", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: [DEFAULT_CARDS[0].id, DEFAULT_CARDS[1].id, DEFAULT_CARDS[2].id],
        revealed: 2,
        spreadId: "three-card",
        spaceId: "default",
      };

      const result = getRevealedCards(reading, allCards, mockGetCardById);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(DEFAULT_CARDS[0].id);
      expect(result[1].id).toBe(DEFAULT_CARDS[1].id);
    });

    it("已删除的牌应该返回占位牌", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: ["deleted-card-id", DEFAULT_CARDS[1].id],
        revealed: 2,
        spreadId: "three-card",
        spaceId: "default",
      };

      const result = getRevealedCards(reading, allCards, mockGetCardById);
      expect(result.length).toBe(2);
      expect(result[0]).toBe(DELETED_CARD_PLACEHOLDER);
      expect(result[1].id).toBe(DEFAULT_CARDS[1].id);
    });

    it("revealed为0时应该返回空数组", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: [DEFAULT_CARDS[0].id],
        revealed: 0,
        spreadId: "one-card",
        spaceId: "default",
      };

      const result = getRevealedCards(reading, allCards, mockGetCardById);
      expect(result.length).toBe(0);
    });

    it("revealed超过牌总数时应该只返回所有牌", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: [DEFAULT_CARDS[0].id, DEFAULT_CARDS[1].id],
        revealed: 10,
        spreadId: "three-card",
        spaceId: "default",
      };

      const result = getRevealedCards(reading, allCards, mockGetCardById);
      expect(result.length).toBe(2);
    });

    it("混合已删除和存在的牌应该正确返回", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: [DEFAULT_CARDS[0].id, "deleted-1", DEFAULT_CARDS[1].id, "deleted-2"],
        revealed: 4,
        spreadId: "five-card",
        spaceId: "default",
      };

      const result = getRevealedCards(reading, allCards, mockGetCardById);
      expect(result[0].id).toBe(DEFAULT_CARDS[0].id);
      expect(result[1]).toBe(DELETED_CARD_PLACEHOLDER);
      expect(result[2].id).toBe(DEFAULT_CARDS[1].id);
      expect(result[3]).toBe(DELETED_CARD_PLACEHOLDER);
    });
  });

  describe("isReadingComplete", () => {
    it("所有牌都翻开时应该返回true", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: ["1", "2", "3"],
        revealed: 3,
        spreadId: "three-card",
        spaceId: "default",
      };
      expect(isReadingComplete(reading, 3)).toBe(true);
    });

    it("部分牌翻开时应该返回false", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: ["1", "2", "3"],
        revealed: 2,
        spreadId: "three-card",
        spaceId: "default",
      };
      expect(isReadingComplete(reading, 3)).toBe(false);
    });

    it("revealed超过总数时应该返回true", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: ["1", "2", "3"],
        revealed: 5,
        spreadId: "three-card",
        spaceId: "default",
      };
      expect(isReadingComplete(reading, 3)).toBe(true);
    });
  });

  describe("revealNextCard", () => {
    it("翻开下一张牌应该递增revealed", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: ["1", "2", "3"],
        revealed: 0,
        spreadId: "three-card",
        spaceId: "default",
      };

      const result = revealNextCard(reading, 0);
      expect(result.revealed).toBe(1);
      expect(result).not.toBe(reading);
    });

    it("按非顺序翻开应该取最大索引+1", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: ["1", "2", "3"],
        revealed: 2,
        spreadId: "three-card",
        spaceId: "default",
      };

      const result = revealNextCard(reading, 1);
      expect(result.revealed).toBe(2);
    });

    it("翻开最后一张牌应该完成阅读", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: ["1", "2", "3"],
        revealed: 2,
        spreadId: "three-card",
        spaceId: "default",
      };

      const result = revealNextCard(reading, 2);
      expect(result.revealed).toBe(3);
    });

    it("应该保持其他字段不变", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: ["1", "2", "3"],
        revealed: 1,
        spreadId: "three-card",
        spaceId: "work",
        question: "测试问题",
      };

      const result = revealNextCard(reading, 1);
      expect(result.date).toBe(reading.date);
      expect(result.cardIds).toEqual(reading.cardIds);
      expect(result.spreadId).toBe(reading.spreadId);
      expect(result.spaceId).toBe(reading.spaceId);
      expect(result.question).toBe(reading.question);
    });
  });

  describe("isReadingFromSpace", () => {
    it("阅读属于指定空间应该返回true", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: ["1"],
        revealed: 0,
        spreadId: "one-card",
        spaceId: "work",
      };
      expect(isReadingFromSpace(reading, "work")).toBe(true);
    });

    it("阅读不属于指定空间应该返回false", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: ["1"],
        revealed: 0,
        spreadId: "one-card",
        spaceId: "default",
      };
      expect(isReadingFromSpace(reading, "work")).toBe(false);
    });
  });

  describe("clearReadingIfFromSpace", () => {
    it("阅读为空应该返回null", () => {
      const result = clearReadingIfFromSpace(null, "work");
      expect(result).toBeNull();
    });

    it("阅读属于指定非默认空间应该返回null", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: ["custom-1"],
        revealed: 1,
        spreadId: "one-card",
        spaceId: "work",
      };

      const result = clearReadingIfFromSpace(reading, "work", mockCustomCards);
      expect(result).toBeNull();
    });

    it("阅读包含指定空间的牌应该返回null", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: ["custom-1", "lantern"],
        revealed: 2,
        spreadId: "three-card",
        spaceId: "default",
      };

      const result = clearReadingIfFromSpace(reading, "work", mockCustomCards);
      expect(result).toBeNull();
    });

    it("阅读不属于指定空间且不包含其牌应该返回原阅读", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: ["lantern", "well"],
        revealed: 1,
        spreadId: "three-card",
        spaceId: "default",
      };

      const result = clearReadingIfFromSpace(reading, "work", mockCustomCards);
      expect(result).toBe(reading);
    });

    it("默认空间切换应该不清除", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: ["lantern"],
        revealed: 1,
        spreadId: "one-card",
        spaceId: "default",
      };

      const result = clearReadingIfFromSpace(reading, "default", mockCustomCards);
      expect(result).toBe(reading);
    });

    it("未提供customCards时应该只检查spaceId", () => {
      const reading: Reading = {
        date: "2024-01-01",
        cardIds: ["custom-1"],
        revealed: 1,
        spreadId: "one-card",
        spaceId: "default",
      };

      const result = clearReadingIfFromSpace(reading, "work");
      expect(result).toBe(reading);
    });
  });
});
