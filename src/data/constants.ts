import type { Theme, Spread, Card, Space, HistoryCard } from "../types";

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
  { id: "bell", name: "铜铃", keyword: "提醒", meaning: "一个重复出现的小信号，今天值得被认真对待。", hue: "#c99a35", glyph: "铃" },
  { id: "incense", name: "沉香烟", keyword: "等待酝酿", meaning: "有些事需要时间入味，强行揭盖只会散去香气。", hue: "#8b6914", glyph: "烟" },
  { id: "compass", name: "旧罗盘", keyword: "方向浮现", meaning: "你曾以为迷路的地方，其实藏着新的坐标。", hue: "#4a7c59", glyph: "盘" },
  { id: "scroll", name: "未展卷轴", keyword: "隐藏信息", meaning: "重要的内容不在封面上，耐心展开才会看见。", hue: "#a65d7f", glyph: "卷" },
  { id: "chopsticks", name: "一双筷", keyword: "协作之力", meaning: "单独一根难以成事，找对伙伴事半功倍。", hue: "#c47e4e", glyph: "筷" },
  { id: "teacup", name: "空茶杯", keyword: "留白空间", meaning: "倒空心中的成见，才能装入新的可能。", hue: "#5f9ea0", glyph: "茶" },
  { id: "coin", name: "古铜钱", keyword: "方圆之道", meaning: "内心要有原则，外表不妨圆润些。", hue: "#b8860b", glyph: "钱" },
  { id: "kite", name: "断线风筝", keyword: "意外自由", meaning: "以为失去了控制，却可能飞向更广阔的天空。", hue: "#cd853f", glyph: "鸢" },
  { id: "seal", name: "朱砂印", keyword: "承诺生效", meaning: "一旦盖下印记，就要为结果负责。", hue: "#c41e3a", glyph: "印" },
  { id: "fan", name: "折叠扇", keyword: "收放自如", meaning: "知道何时展开锋芒，何时收敛光芒。", hue: "#9370db", glyph: "扇" },
  { id: "bowl", name: "缺口碗", keyword: "不完美美", meaning: "正因为有缺口，才有机会装入更多惊喜。", hue: "#708090", glyph: "碗" },
  { id: "thread", name: "红丝线", keyword: "隐秘联结", meaning: "你与某些人和事的缘分，比你以为的更深。", hue: "#dc143c", glyph: "线" },
  { id: "abacus", name: "旧算盘", keyword: "理清账目", meaning: "是时候算清楚哪些值得投入，哪些该止损。", hue: "#8b4513", glyph: "算" },
  { id: "rattle", name: "拨浪鼓", keyword: "回归童心", meaning: "用最简单的快乐，化解最复杂的难题。", hue: "#ff6347", glyph: "鼓" },
  { id: "lock", name: "铜挂锁", keyword: "等待钥匙", meaning: "不是所有门都需要强行打开，等对的时机。", hue: "#696969", glyph: "锁" },
  { id: "bamboo", name: "竹书签", keyword: "标记进度", meaning: "记得给自己的成长做个记号，回头看时会惊讶。", hue: "#6b8e23", glyph: "竹" },
];

export const DEFAULT_SPACE_ID = "default";

export const DEFAULT_SPACE: Space = {
  id: DEFAULT_SPACE_ID,
  name: "默认空间",
  icon: "🏠",
  isDefault: true,
  createdAt: new Date().toISOString(),
};

export const PRESET_SPACES: Space[] = [
  { id: "work", name: "工作", icon: "💼", createdAt: new Date().toISOString() },
  { id: "relationship", name: "关系", icon: "💕", createdAt: new Date().toISOString() },
  { id: "inspiration", name: "灵感", icon: "💡", createdAt: new Date().toISOString() },
];

export const DELETED_CARD_PLACEHOLDER: HistoryCard & Card = {
  id: "deleted-placeholder",
  position: "",
  name: "（此牌已删除）",
  keyword: "已删除",
  meaning: "这张牌所在的牌组空间已被删除。",
  hue: "#666666",
  glyph: "✕",
  isDeleted: true,
};

export const STORAGE_KEYS = {
  reading: "hxwl-2-reading",
  customCards: "hxwl-2-custom-cards",
  history: "hxwl-2-history",
  theme: "hxwl-2-theme",
  spaces: "hxwl-2-spaces",
  currentSpaceId: "hxwl-2-current-space",
  migrationVersion: "hxwl-2-migration-version",
} as const;

export const CURRENT_MIGRATION_VERSION = 2;

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
