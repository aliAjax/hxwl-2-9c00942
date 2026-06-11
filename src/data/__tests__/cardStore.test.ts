import { describe, it, expect } from "vitest";
import type { Card } from "../../types";
import {
  getAllCards,
  getCardsForSpace,
  getCustomCardsForSpace,
  getCardById,
  createEmptyCustomCard,
  addCustomCard,
  updateCustomCard,
  deleteCustomCard,
  deleteCustomCardsBySpaceId,
  duplicateCustomCard,
  batchDeleteCards,
  batchMoveCards,
  batchDuplicateCards,
  hasAnyCardsInReading,
  isCardInReading,
  hasAnyCardInReading,
  validateCard,
} from "../cardStore";
import { DEFAULT_CARDS, DEFAULT_SPACE_ID } from "../constants";

describe("cardStore 纯函数", () => {
  const mockCustomCards: Card[] = [
    {
      id: "custom-1",
      name: "测试牌1",
      keyword: "测试1",
      meaning: "测试含义1",
      hue: "#ff0000",
      glyph: "测",
      isCustom: true,
      spaceId: "work",
    },
    {
      id: "custom-2",
      name: "测试牌2",
      keyword: "测试2",
      meaning: "测试含义2",
      hue: "#00ff00",
      glyph: "试",
      isCustom: true,
      spaceId: "relationship",
    },
    {
      id: "custom-3",
      name: "测试牌3",
      keyword: "测试3",
      meaning: "测试含义3",
      hue: "#0000ff",
      glyph: "牌",
      isCustom: true,
      spaceId: "work",
    },
  ];

  describe("getAllCards", () => {
    it("应该合并默认牌和自定义牌", () => {
      const all = getAllCards(mockCustomCards);
      expect(all.length).toBe(DEFAULT_CARDS.length + mockCustomCards.length);
      expect(all[0].id).toBe(DEFAULT_CARDS[0].id);
      expect(all[all.length - 1].id).toBe(mockCustomCards[mockCustomCards.length - 1].id);
    });

    it("自定义牌为空时应该只返回默认牌", () => {
      const all = getAllCards([]);
      expect(all.length).toBe(DEFAULT_CARDS.length);
      expect(all).toEqual(DEFAULT_CARDS);
    });
  });

  describe("getCardsForSpace", () => {
    it("应该返回默认牌加指定空间的自定义牌", () => {
      const cards = getCardsForSpace(mockCustomCards, "work");
      const workCustomCards = mockCustomCards.filter((c) => c.spaceId === "work");
      expect(cards.length).toBe(DEFAULT_CARDS.length + workCustomCards.length);
      expect(cards.some((c) => c.id === "custom-1")).toBe(true);
      expect(cards.some((c) => c.id === "custom-2")).toBe(false);
    });

    it("没有spaceId的自定义牌应该包含在所有空间", () => {
      const cardsWithoutSpace: Card[] = [
        { ...mockCustomCards[0], spaceId: undefined },
      ];
      const cards = getCardsForSpace(cardsWithoutSpace, "any-space");
      expect(cards.some((c) => c.id === "custom-1")).toBe(true);
    });
  });

  describe("getCustomCardsForSpace", () => {
    it("应该只返回指定空间的自定义牌", () => {
      const cards = getCustomCardsForSpace(mockCustomCards, "work");
      expect(cards.length).toBe(2);
      expect(cards.every((c) => c.spaceId === "work")).toBe(true);
    });
  });

  describe("getCardById", () => {
    it("应该根据ID找到牌", () => {
      const allCards = getAllCards(mockCustomCards);
      const card = getCardById("custom-1", allCards);
      expect(card).toBeDefined();
      expect(card?.name).toBe("测试牌1");
    });

    it("找不到时应该返回undefined", () => {
      const card = getCardById("non-existent", DEFAULT_CARDS);
      expect(card).toBeUndefined();
    });
  });

  describe("createEmptyCustomCard", () => {
    it("应该创建带有默认空间的空牌", () => {
      const card = createEmptyCustomCard();
      expect(card.isCustom).toBe(true);
      expect(card.spaceId).toBe(DEFAULT_SPACE_ID);
      expect(card.id).toMatch(/^custom-\d+$/);
    });

    it("应该创建带有指定空间的空牌", () => {
      const card = createEmptyCustomCard("work");
      expect(card.spaceId).toBe("work");
    });
  });

  describe("addCustomCard", () => {
    it("应该添加新牌到数组末尾", () => {
      const newCard: Card = {
        id: "new-card",
        name: "新牌",
        keyword: "新",
        meaning: "新含义",
        hue: "#ffffff",
        glyph: "新",
        isCustom: true,
        spaceId: "work",
      };
      const result = addCustomCard(mockCustomCards, newCard);
      expect(result.length).toBe(mockCustomCards.length + 1);
      expect(result[result.length - 1].id).toBe("new-card");
      expect(result).not.toBe(mockCustomCards);
    });
  });

  describe("updateCustomCard", () => {
    it("应该更新指定ID的牌", () => {
      const updated: Card = {
        ...mockCustomCards[0],
        name: "更新后的牌名",
      };
      const result = updateCustomCard(mockCustomCards, updated);
      expect(result.find((c) => c.id === "custom-1")?.name).toBe("更新后的牌名");
      expect(result.length).toBe(mockCustomCards.length);
    });

    it("找不到ID时应该返回原数组", () => {
      const updated: Card = {
        ...mockCustomCards[0],
        id: "non-existent",
        name: "不存在的牌",
      };
      const result = updateCustomCard(mockCustomCards, updated);
      expect(result).toEqual(mockCustomCards);
    });
  });

  describe("deleteCustomCard", () => {
    it("应该删除指定ID的牌", () => {
      const result = deleteCustomCard(mockCustomCards, "custom-1");
      expect(result.length).toBe(mockCustomCards.length - 1);
      expect(result.some((c) => c.id === "custom-1")).toBe(false);
    });

    it("找不到ID时应该返回原数组过滤后的结果", () => {
      const result = deleteCustomCard(mockCustomCards, "non-existent");
      expect(result.length).toBe(mockCustomCards.length);
    });
  });

  describe("deleteCustomCardsBySpaceId", () => {
    it("应该删除指定空间的所有牌", () => {
      const result = deleteCustomCardsBySpaceId(mockCustomCards, "work");
      expect(result.some((c) => c.spaceId === "work")).toBe(false);
      expect(result.length).toBe(1);
      expect(result[0].spaceId).toBe("relationship");
    });
  });

  describe("duplicateCustomCard", () => {
    it("应该复制牌并生成新ID", () => {
      const original = mockCustomCards[0];
      const duplicated = duplicateCustomCard(original, "target-space");

      expect(duplicated.id).not.toBe(original.id);
      expect(duplicated.id).toMatch(/^custom-\d+-\w+$/);
      expect(duplicated.name).toBe(original.name);
      expect(duplicated.keyword).toBe(original.keyword);
      expect(duplicated.meaning).toBe(original.meaning);
      expect(duplicated.hue).toBe(original.hue);
      expect(duplicated.glyph).toBe(original.glyph);
      expect(duplicated.spaceId).toBe("target-space");
      expect(duplicated.isCustom).toBe(true);
    });

    it("应该保留原牌的illustration", () => {
      const originalWithIllustration: Card = {
        ...mockCustomCards[0],
        illustration: "data:image/png;base64,xxx",
      };
      const duplicated = duplicateCustomCard(originalWithIllustration, "work");
      expect(duplicated.illustration).toBe(originalWithIllustration.illustration);
    });
  });

  describe("batchDeleteCards", () => {
    it("应该批量删除指定ID的牌", () => {
      const result = batchDeleteCards(mockCustomCards, ["custom-1", "custom-2"]);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("custom-3");
    });

    it("空ID列表应该返回原数组", () => {
      const result = batchDeleteCards(mockCustomCards, []);
      expect(result).toEqual(mockCustomCards);
    });
  });

  describe("batchMoveCards", () => {
    it("应该批量移动牌到目标空间", () => {
      const result = batchMoveCards(mockCustomCards, ["custom-1", "custom-2"], "new-space");
      const movedCards = result.filter((c) => ["custom-1", "custom-2"].includes(c.id));
      expect(movedCards.every((c) => c.spaceId === "new-space")).toBe(true);
      expect(result.find((c) => c.id === "custom-3")?.spaceId).toBe("work");
    });

    it("应该不影响未选中的牌", () => {
      const result = batchMoveCards(mockCustomCards, ["custom-1"], "new-space");
      expect(result.find((c) => c.id === "custom-2")?.spaceId).toBe("relationship");
    });
  });

  describe("batchDuplicateCards", () => {
    it("应该批量复制牌到目标空间", () => {
      const originalLength = mockCustomCards.length;
      const result = batchDuplicateCards(mockCustomCards, ["custom-1", "custom-2"], "target-space");

      expect(result.length).toBe(originalLength + 2);

      const originalNames = mockCustomCards.slice(0, 2).map((c) => c.name);
      const newCards = result.slice(originalLength);
      expect(newCards.map((c) => c.name)).toEqual(originalNames);
      expect(newCards.every((c) => c.spaceId === "target-space")).toBe(true);
      expect(newCards.every((c) => c.id !== "custom-1" && c.id !== "custom-2")).toBe(true);
    });

    it("空ID列表应该返回原数组", () => {
      const result = batchDuplicateCards(mockCustomCards, [], "target-space");
      expect(result).toEqual(mockCustomCards);
    });
  });

  describe("hasAnyCardsInReading", () => {
    it("有任意牌在阅读中应该返回true", () => {
      const readingCardIds = ["custom-1", "default-card"];
      const result = hasAnyCardsInReading(["custom-1", "custom-3"], readingCardIds);
      expect(result).toBe(true);
    });

    it("没有牌在阅读中应该返回false", () => {
      const readingCardIds = ["default-card"];
      const result = hasAnyCardsInReading(["custom-1", "custom-3"], readingCardIds);
      expect(result).toBe(false);
    });
  });

  describe("isCardInReading", () => {
    it("牌在阅读中应该返回true", () => {
      expect(isCardInReading("custom-1", ["custom-1", "custom-2"])).toBe(true);
    });

    it("牌不在阅读中应该返回false", () => {
      expect(isCardInReading("custom-3", ["custom-1", "custom-2"])).toBe(false);
    });
  });

  describe("hasAnyCardInReading", () => {
    it("指定空间有牌在阅读中应该返回true", () => {
      const readingCardIds = ["custom-1", "default-card"];
      const result = hasAnyCardInReading("work", mockCustomCards, readingCardIds);
      expect(result).toBe(true);
    });

    it("指定空间没有牌在阅读中应该返回false", () => {
      const readingCardIds = ["custom-2"];
      const result = hasAnyCardInReading("work", mockCustomCards, readingCardIds);
      expect(result).toBe(false);
    });
  });

  describe("validateCard", () => {
    it("有效牌应该返回valid: true", () => {
      const validCard: Card = {
        id: "test",
        name: "有效牌",
        keyword: "关键词",
        meaning: "解释内容",
        hue: "#000000",
        glyph: "字",
      };
      expect(validateCard(validCard)).toEqual({ valid: true });
    });

    it("空牌名应该返回错误", () => {
      const invalidCard: Card = {
        id: "test",
        name: "   ",
        keyword: "关键词",
        meaning: "解释内容",
        hue: "#000000",
        glyph: "字",
      };
      expect(validateCard(invalidCard)).toEqual({ valid: false, error: "牌名不能为空" });
    });

    it("空关键词应该返回错误", () => {
      const invalidCard: Card = {
        id: "test",
        name: "牌名",
        keyword: "   ",
        meaning: "解释内容",
        hue: "#000000",
        glyph: "字",
      };
      expect(validateCard(invalidCard)).toEqual({ valid: false, error: "关键词不能为空" });
    });

    it("空解释应该返回错误", () => {
      const invalidCard: Card = {
        id: "test",
        name: "牌名",
        keyword: "关键词",
        meaning: "   ",
        hue: "#000000",
        glyph: "字",
      };
      expect(validateCard(invalidCard)).toEqual({ valid: false, error: "解释不能为空" });
    });
  });
});
