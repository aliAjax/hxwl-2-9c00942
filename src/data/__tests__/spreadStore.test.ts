import { describe, it, expect } from "vitest";
import type { Spread } from "../../types";
import {
  getAllSpreads,
  getPresetSpreadIds,
  isPresetSpread,
  getSpreadById,
  getSpreadOrPlaceholder,
  getSnapshot,
  getPositions,
  getPositionCount,
  createSpread,
  addCustomSpread,
  updateCustomSpread,
  deleteCustomSpread,
  validateSpread,
  duplicateSpread,
} from "../spreadStore";
import { SPREADS, DEFAULT_SPREAD_ID, DELETED_SPREAD_PLACEHOLDER } from "../constants";

describe("spreadStore 纯函数", () => {
  const mockCustomSpreads: Spread[] = [
    {
      id: "custom-spread-1",
      name: "自定义牌阵1",
      subtitle: "自定义1",
      description: "自定义描述1",
      positions: ["位置1", "位置2", "位置3"],
      icon: "✨",
      isCustom: true,
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "custom-spread-2",
      name: "自定义牌阵2",
      subtitle: "自定义2",
      description: "自定义描述2",
      positions: ["过去", "现在", "未来"],
      icon: "🔮",
      isCustom: true,
      createdAt: "2024-01-02T00:00:00.000Z",
    },
  ];

  describe("getAllSpreads", () => {
    it("应该合并预设牌阵和自定义牌阵", () => {
      const all = getAllSpreads(mockCustomSpreads);
      expect(all.length).toBe(SPREADS.length + mockCustomSpreads.length);
      expect(all[0].id).toBe(SPREADS[0].id);
      expect(all[all.length - 1].id).toBe(mockCustomSpreads[mockCustomSpreads.length - 1].id);
    });

    it("未提供自定义牌阵时应该只返回预设牌阵", () => {
      const all = getAllSpreads();
      expect(all.length).toBe(SPREADS.length);
      expect(all).toEqual(SPREADS);
    });

    it("自定义牌阵为空时应该只返回预设牌阵", () => {
      const all = getAllSpreads([]);
      expect(all.length).toBe(SPREADS.length);
    });
  });

  describe("getPresetSpreadIds", () => {
    it("应该返回所有预设牌阵的ID", () => {
      const ids = getPresetSpreadIds();
      expect(ids.length).toBe(SPREADS.length);
      expect(ids).toEqual(SPREADS.map((s) => s.id));
      expect(ids).toContain("one-card");
      expect(ids).toContain("three-card");
      expect(ids).toContain("five-card");
    });
  });

  describe("isPresetSpread", () => {
    it("预设牌阵应该返回true", () => {
      expect(isPresetSpread("one-card")).toBe(true);
      expect(isPresetSpread("three-card")).toBe(true);
      expect(isPresetSpread("five-card")).toBe(true);
    });

    it("自定义牌阵应该返回false", () => {
      expect(isPresetSpread("custom-spread-1")).toBe(false);
      expect(isPresetSpread("non-existent")).toBe(false);
    });
  });

  describe("getSpreadById", () => {
    it("应该根据ID找到预设牌阵", () => {
      const spread = getSpreadById("three-card", mockCustomSpreads);
      expect(spread.id).toBe("three-card");
      expect(spread.name).toBe("三张牌展开");
    });

    it("应该根据ID找到自定义牌阵", () => {
      const spread = getSpreadById("custom-spread-1", mockCustomSpreads);
      expect(spread.id).toBe("custom-spread-1");
      expect(spread.name).toBe("自定义牌阵1");
    });

    it("找不到时应该返回默认牌阵", () => {
      const spread = getSpreadById("non-existent", mockCustomSpreads);
      expect(spread.id).toBe(DEFAULT_SPREAD_ID);
    });

    it("未提供自定义牌阵时应该只搜索预设牌阵", () => {
      const spread = getSpreadById("one-card");
      expect(spread.id).toBe("one-card");
    });
  });

  describe("getSpreadOrPlaceholder", () => {
    it("存在的牌阵应该返回原牌阵", () => {
      const spread = getSpreadOrPlaceholder("three-card", mockCustomSpreads);
      expect(spread.id).toBe("three-card");
      expect((spread as Spread).name).toBe("三张牌展开");
    });

    it("已删除的牌阵应该返回占位牌", () => {
      const spread = getSpreadOrPlaceholder("deleted-spread", mockCustomSpreads);
      expect(spread.id).toBe("deleted-spread");
      expect(spread.name).toBe("（此牌阵已删除）");
      expect((spread as { isDeleted?: boolean }).isDeleted).toBe(true);
    });

    it("未提供自定义牌阵时应该只搜索预设牌阵", () => {
      const spread = getSpreadOrPlaceholder("non-existent");
      expect(spread.id).toBe("non-existent");
      expect(spread.name).toBe("（此牌阵已删除）");
    });
  });

  describe("getSnapshot", () => {
    it("应该生成牌阵快照", () => {
      const spread = mockCustomSpreads[0];
      const snapshot = getSnapshot(spread);
      expect(snapshot.id).toBe(spread.id);
      expect(snapshot.name).toBe(spread.name);
      expect(snapshot.subtitle).toBe(spread.subtitle);
      expect(snapshot.description).toBe(spread.description);
      expect(snapshot.positions).toEqual(spread.positions);
      expect(snapshot.icon).toBe(spread.icon);
      expect((snapshot as Partial<Spread>).isCustom).toBeUndefined();
      expect((snapshot as Partial<Spread>).createdAt).toBeUndefined();
    });

    it("应该复制positions数组而不是引用", () => {
      const spread = mockCustomSpreads[0];
      const snapshot = getSnapshot(spread);
      snapshot.positions.push("新位置");
      expect(spread.positions.length).toBe(3);
    });
  });

  describe("getPositions", () => {
    it("应该返回牌阵的位置数组", () => {
      const positions = getPositions("three-card", mockCustomSpreads);
      expect(positions).toEqual(["事件", "阻碍", "建议"]);
    });

    it("应该返回自定义牌阵的位置数组", () => {
      const positions = getPositions("custom-spread-1", mockCustomSpreads);
      expect(positions).toEqual(["位置1", "位置2", "位置3"]);
    });
  });

  describe("getPositionCount", () => {
    it("应该返回牌阵的位置数量", () => {
      expect(getPositionCount("one-card", mockCustomSpreads)).toBe(1);
      expect(getPositionCount("three-card", mockCustomSpreads)).toBe(3);
      expect(getPositionCount("five-card", mockCustomSpreads)).toBe(5);
    });

    it("应该返回自定义牌阵的位置数量", () => {
      expect(getPositionCount("custom-spread-1", mockCustomSpreads)).toBe(3);
    });
  });

  describe("createSpread", () => {
    it("应该创建新的自定义牌阵", () => {
      const spread = createSpread(
        "新牌阵",
        "新副标题",
        "新描述",
        ["位置A", "位置B"],
        "🌟"
      );
      expect(spread.id).toMatch(/^spread-\d+-\w+$/);
      expect(spread.name).toBe("新牌阵");
      expect(spread.subtitle).toBe("新副标题");
      expect(spread.description).toBe("新描述");
      expect(spread.positions).toEqual(["位置A", "位置B"]);
      expect(spread.icon).toBe("🌟");
      expect(spread.isCustom).toBe(true);
      expect(spread.createdAt).toBeDefined();
    });

    it("应该trim名称和位置", () => {
      const spread = createSpread(
        "  新牌阵  ",
        "  副标题  ",
        "  描述  ",
        ["  位置1  ", "  位置2  ", "  "],
        "  🌟  "
      );
      expect(spread.name).toBe("新牌阵");
      expect(spread.subtitle).toBe("副标题");
      expect(spread.description).toBe("描述");
      expect(spread.positions).toEqual(["位置1", "位置2"]);
      expect(spread.icon).toBe("🌟");
    });

    it("空图标应该使用默认图标", () => {
      const spread = createSpread(
        "新牌阵",
        "副标题",
        "描述",
        ["位置1"],
        "   "
      );
      expect(spread.icon).toBe("✨");
    });
  });

  describe("addCustomSpread", () => {
    it("应该添加新牌阵到数组末尾", () => {
      const newSpread: Spread = {
        id: "new-spread",
        name: "新牌阵",
        subtitle: "新",
        description: "新描述",
        positions: ["位置1"],
        icon: "✨",
        isCustom: true,
        createdAt: "2024-01-03T00:00:00.000Z",
      };
      const result = addCustomSpread(mockCustomSpreads, newSpread);
      expect(result.length).toBe(mockCustomSpreads.length + 1);
      expect(result[result.length - 1].id).toBe("new-spread");
      expect(result).not.toBe(mockCustomSpreads);
    });
  });

  describe("updateCustomSpread", () => {
    it("应该更新指定ID的牌阵", () => {
      const updated: Spread = {
        ...mockCustomSpreads[0],
        name: "更新后的牌阵名",
        positions: ["新位置1", "新位置2"],
      };
      const result = updateCustomSpread(mockCustomSpreads, updated);
      expect(result.find((s) => s.id === "custom-spread-1")?.name).toBe("更新后的牌阵名");
      expect(result.find((s) => s.id === "custom-spread-1")?.positions).toEqual(["新位置1", "新位置2"]);
      expect(result.length).toBe(mockCustomSpreads.length);
    });

    it("找不到ID时应该返回原数组", () => {
      const updated: Spread = {
        ...mockCustomSpreads[0],
        id: "non-existent",
        name: "不存在的牌阵",
      };
      const result = updateCustomSpread(mockCustomSpreads, updated);
      expect(result).toEqual(mockCustomSpreads);
    });
  });

  describe("deleteCustomSpread", () => {
    it("应该删除指定ID的牌阵", () => {
      const result = deleteCustomSpread(mockCustomSpreads, "custom-spread-1");
      expect(result.length).toBe(mockCustomSpreads.length - 1);
      expect(result.some((s) => s.id === "custom-spread-1")).toBe(false);
    });

    it("找不到ID时应该返回原数组过滤后的结果", () => {
      const result = deleteCustomSpread(mockCustomSpreads, "non-existent");
      expect(result.length).toBe(mockCustomSpreads.length);
    });
  });

  describe("validateSpread", () => {
    it("有效牌阵应该返回valid: true", () => {
      const result = validateSpread("有效牌阵", ["位置1", "位置2", "位置3"]);
      expect(result).toEqual({ valid: true });
    });

    it("空名称应该返回错误", () => {
      const result = validateSpread("   ", ["位置1"]);
      expect(result).toEqual({ valid: false, error: "牌阵名称不能为空" });
    });

    it("名称超过30字符应该返回错误", () => {
      const longName = "a".repeat(31);
      const result = validateSpread(longName, ["位置1"]);
      expect(result).toEqual({ valid: false, error: "牌阵名称不能超过30个字符" });
    });

    it("名称正好30字符应该有效", () => {
      const validName = "a".repeat(30);
      const result = validateSpread(validName, ["位置1"]);
      expect(result).toEqual({ valid: true });
    });

    it("空位置数组应该返回错误", () => {
      const result = validateSpread("牌阵名", []);
      expect(result).toEqual({ valid: false, error: "至少需要一个位置" });
    });

    it("全空白位置应该返回错误", () => {
      const result = validateSpread("牌阵名", ["   ", "  "]);
      expect(result).toEqual({ valid: false, error: "至少需要一个位置" });
    });

    it("位置超过10个应该返回错误", () => {
      const positions = Array.from({ length: 11 }, (_, i) => `位置${i + 1}`);
      const result = validateSpread("牌阵名", positions);
      expect(result).toEqual({ valid: false, error: "位置数量不能超过10个" });
    });

    it("位置正好10个应该有效", () => {
      const positions = Array.from({ length: 10 }, (_, i) => `位置${i + 1}`);
      const result = validateSpread("牌阵名", positions);
      expect(result).toEqual({ valid: true });
    });

    it("单个位置超过20字符应该返回错误", () => {
      const longPosition = "a".repeat(21);
      const result = validateSpread("牌阵名", [longPosition]);
      expect(result).toEqual({ valid: false, error: "第1个位置名称不能超过20个字符" });
    });

    it("多个位置中有超长应该返回第一个错误", () => {
      const positions = ["位置1", "a".repeat(21), "位置3", "b".repeat(25)];
      const result = validateSpread("牌阵名", positions);
      expect(result).toEqual({ valid: false, error: "第2个位置名称不能超过20个字符" });
    });

    it("位置正好20字符应该有效", () => {
      const validPosition = "a".repeat(20);
      const result = validateSpread("牌阵名", [validPosition]);
      expect(result).toEqual({ valid: true });
    });

    it("空白位置应该被过滤后再校验", () => {
      const result = validateSpread("牌阵名", ["  位置1  ", "   ", "  位置2  "]);
      expect(result).toEqual({ valid: true });
    });
  });

  describe("duplicateSpread", () => {
    it("应该复制牌阵并生成新ID", () => {
      const original = mockCustomSpreads[0];
      const duplicated = duplicateSpread(original);

      expect(duplicated.id).not.toBe(original.id);
      expect(duplicated.id).toMatch(/^spread-\d+-\w+$/);
      expect(duplicated.name).toBe(`${original.name} 副本`);
      expect(duplicated.subtitle).toBe(original.subtitle);
      expect(duplicated.description).toBe(original.description);
      expect(duplicated.positions).toEqual(original.positions);
      expect(duplicated.icon).toBe(original.icon);
      expect(duplicated.isCustom).toBe(true);
      expect(duplicated.createdAt).toBeDefined();
    });

    it("应该复制positions数组而不是引用", () => {
      const original = mockCustomSpreads[0];
      const duplicated = duplicateSpread(original);
      duplicated.positions.push("新位置");
      expect(original.positions.length).toBe(3);
    });

    it("可以指定目标位置数组", () => {
      const original = mockCustomSpreads[0];
      const targetPositions = ["新位置1", "新位置2"];
      const duplicated = duplicateSpread(original, targetPositions);

      expect(duplicated.positions).toEqual(targetPositions);
      expect(duplicated.positions).not.toBe(targetPositions);
    });

    it("复制预设牌阵应该标记为自定义", () => {
      const original = SPREADS[0];
      const duplicated = duplicateSpread(original);
      expect(duplicated.isCustom).toBe(true);
      expect(duplicated.name).toBe(`${original.name} 副本`);
    });
  });
});
