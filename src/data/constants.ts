import type { Theme, Spread, Card } from "../types";

export const THEMES: Theme[] = [
  { id: "night-market", name: "夜市", icon: "🌙" },
  { id: "dawn-morning", name: "清晨", icon: "🌅" },
  { id: "rainy-night", name: "雨夜", icon: "🌧️" },
];

export const THEME_KEY = "hxwl-2-theme";
export const DEFAULT_THEME_ID = "night-market" as const;

export const SPREADS: Spread[] = [
  {
    id: "one-card",
    name: "一张牌快速指引",
    subtitle: "今日一签",
    description: "抽一张牌，快速获得今日指引",
    positions: ["今日指引"],
    icon: "✨",
  },
  {
    id: "three-card",
    name: "三张牌展开",
    subtitle: "事件·阻碍·建议",
    description: "经典三张牌阵，看清问题全貌",
    positions: ["事件", "阻碍", "建议"],
    icon: "🎴",
  },
  {
    id: "five-card",
    name: "五张牌深度展开",
    subtitle: "过去·现在·未来·核心·指引",
    description: "五张牌深度解读，探寻更多维度",
    positions: ["过去", "现在", "未来", "核心", "指引"],
    icon: "🌟",
  },
];

export const DEFAULT_SPREAD_ID = "three-card";

export const DEFAULT_CARDS: Card[] = [
  { id: "lantern", name: "倒挂灯笼", keyword: "迟来的消息", meaning: "不要急着催促，答案会在你转身之后出现。", hue: "#e05d5d", glyph: "灯" },
  { id: "well", name: "井边银币", keyword: "被忽略的资源", meaning: "你已经拥有一枚能撬动局面的筹码，只是它看起来太普通。", hue: "#6ba3b8", glyph: "井" },
  { id: "moth", name: "月蛾", keyword: "靠近光源", meaning: "今天适合靠近真正吸引你的东西，但要保留退路。", hue: "#b9a76f", glyph: "蛾" },
  { id: "mask", name: "半面具", keyword: "角色切换", meaning: "换一种表达方式，比解释更多道理更有效。", hue: "#8d6cc4", glyph: "面" },
  { id: "needle", name: "绣针", keyword: "细小修补", meaning: "别试图一次解决全部，先缝好最细的一道裂口。", hue: "#4ca678", glyph: "针" },
  { id: "boat", name: "纸船", keyword: "轻装出发", meaning: "把多余的顾虑放下，事情会比想象中更容易推进。", hue: "#d9904f", glyph: "舟" },
  { id: "mirror", name: "雾镜", keyword: "误读", meaning: "你看到的不一定是对方的真实想法，先确认再行动。", hue: "#8295aa", glyph: "镜" },
  { id: "bell", name: "铜铃", keyword: "提醒", meaning: "一个重复出现的小信号，今天值得被认真对待。", hue: "#c99a35", glyph: "铃" }
];

export const STORAGE_KEYS = {
  reading: "hxwl-2-reading",
  customCards: "hxwl-2-custom-cards",
  history: "hxwl-2-history",
  theme: "hxwl-2-theme",
} as const;

export const EMPTY_CARD_TEMPLATE: Card = {
  id: "",
  name: "",
  keyword: "",
  meaning: "",
  hue: "#8d6cc4",
  glyph: "牌",
  isCustom: true,
};

export const IMAGE_CONFIG = {
  MAX_IMAGE_SIZE: 400,
  IMAGE_QUALITY: 0.7,
} as const;
