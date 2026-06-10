import { useMemo, useState, useEffect, useCallback } from "react";

type ThemeId = "night-market" | "dawn-morning" | "rainy-night";

type Theme = {
  id: ThemeId;
  name: string;
  icon: string;
};

const THEMES: Theme[] = [
  { id: "night-market", name: "夜市", icon: "🌙" },
  { id: "dawn-morning", name: "清晨", icon: "🌅" },
  { id: "rainy-night", name: "雨夜", icon: "🌧️" },
];

const THEME_KEY = "hxwl-2-theme";
const DEFAULT_THEME: ThemeId = "night-market";

function loadTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(THEME_KEY) as ThemeId | null;
    if (saved && THEMES.some((t) => t.id === saved)) {
      return saved;
    }
  } catch {}
  return DEFAULT_THEME;
}

function applyTheme(themeId: ThemeId) {
  document.documentElement.setAttribute("data-theme", themeId);
}

function saveTheme(themeId: ThemeId) {
  try {
    localStorage.setItem(THEME_KEY, themeId);
  } catch {}
}

function ThemeSwitcher({
  currentTheme,
  onThemeChange,
}: {
  currentTheme: ThemeId;
  onThemeChange: (themeId: ThemeId) => void;
}) {
  return (
    <section className="theme-section">
      <div className="theme-switcher" role="tablist" aria-label="主题切换">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            className={`theme-button ${currentTheme === theme.id ? "active" : ""}`}
            onClick={() => onThemeChange(theme.id)}
            role="tab"
            aria-selected={currentTheme === theme.id}
            title={theme.name}
          >
            <span className="theme-icon">{theme.icon}</span>
            <span>{theme.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

type Spread = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  positions: string[];
  icon: string;
};

type Card = {
  id: string;
  name: string;
  keyword: string;
  meaning: string;
  hue: string;
  glyph: string;
  isCustom?: boolean;
};

type Reading = {
  date: string;
  cardIds: string[];
  revealed: number;
  question?: string;
  spreadId: string;
};

type HistoryCard = {
  position: string;
  name: string;
  keyword: string;
  meaning: string;
  hue: string;
  glyph: string;
};

type HistoryRecord = {
  date: string;
  cards: HistoryCard[];
  question?: string;
  spreadId?: string;
};

const spreads: Spread[] = [
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

const defaultSpreadId = "three-card";
const historyKey = "hxwl-2-history";

const defaultCards: Card[] = [
  { id: "lantern", name: "倒挂灯笼", keyword: "迟来的消息", meaning: "不要急着催促，答案会在你转身之后出现。", hue: "#e05d5d", glyph: "灯" },
  { id: "well", name: "井边银币", keyword: "被忽略的资源", meaning: "你已经拥有一枚能撬动局面的筹码，只是它看起来太普通。", hue: "#6ba3b8", glyph: "井" },
  { id: "moth", name: "月蛾", keyword: "靠近光源", meaning: "今天适合靠近真正吸引你的东西，但要保留退路。", hue: "#b9a76f", glyph: "蛾" },
  { id: "mask", name: "半面具", keyword: "角色切换", meaning: "换一种表达方式，比解释更多道理更有效。", hue: "#8d6cc4", glyph: "面" },
  { id: "needle", name: "绣针", keyword: "细小修补", meaning: "别试图一次解决全部，先缝好最细的一道裂口。", hue: "#4ca678", glyph: "针" },
  { id: "boat", name: "纸船", keyword: "轻装出发", meaning: "把多余的顾虑放下，事情会比想象中更容易推进。", hue: "#d9904f", glyph: "舟" },
  { id: "mirror", name: "雾镜", keyword: "误读", meaning: "你看到的不一定是对方的真实想法，先确认再行动。", hue: "#8295aa", glyph: "镜" },
  { id: "bell", name: "铜铃", keyword: "提醒", meaning: "一个重复出现的小信号，今天值得被认真对待。", hue: "#c99a35", glyph: "铃" }
];

const storageKey = "hxwl-2-reading";
const customCardsKey = "hxwl-2-custom-cards";

function getSpreadById(spreadId: string): Spread {
  return spreads.find((s) => s.id === spreadId) || spreads.find((s) => s.id === defaultSpreadId)!;
}

function getPositions(spreadId: string): string[] {
  return getSpreadById(spreadId).positions;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadReading(): Reading | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const reading = JSON.parse(raw) as Reading & { revealed?: number; spreadId?: string };
    if (reading.date !== todayKey()) return null;
    if (reading.revealed === undefined) {
      reading.revealed = 0;
    }
    if (reading.spreadId === undefined) {
      reading.spreadId = defaultSpreadId;
    }
    return reading as Reading;
  } catch {
    return null;
  }
}

function loadCustomCards(): Card[] {
  try {
    return JSON.parse(localStorage.getItem(customCardsKey) || "[]") as Card[];
  } catch {
    return [];
  }
}

function saveCustomCards(cards: Card[]) {
  localStorage.setItem(customCardsKey, JSON.stringify(cards));
}

function loadHistory(): HistoryRecord[] {
  try {
    return JSON.parse(localStorage.getItem(historyKey) || "[]") as HistoryRecord[];
  } catch {
    return [];
  }
}

function saveHistory(history: HistoryRecord[]) {
  localStorage.setItem(historyKey, JSON.stringify(history));
}

function addToHistory(record: HistoryRecord) {
  const history = loadHistory();
  const existingIndex = history.findIndex((r) => r.date === record.date);
  if (existingIndex >= 0) {
    history[existingIndex] = record;
  } else {
    history.unshift(record);
  }
  saveHistory(history);
}

function clearHistory() {
  localStorage.removeItem(historyKey);
}

function drawCards(allCards: Card[], count: number) {
  return [...allCards]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((card) => card.id);
}

const emptyCard: Card = {
  id: "",
  name: "",
  keyword: "",
  meaning: "",
  hue: "#8d6cc4",
  glyph: "牌",
  isCustom: true,
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === todayKey()) {
    return "今天";
  } else if (dateStr === yesterday.toISOString().slice(0, 10)) {
    return "昨天";
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
}

function HistoryItem({ record }: { record: HistoryRecord }) {
  const [expanded, setExpanded] = useState(false);
  const spread = record.spreadId ? getSpreadById(record.spreadId) : null;

  return (
    <div className="history-item">
      <button className="history-item-header" onClick={() => setExpanded(!expanded)}>
        <div className="history-item-left">
          <span className="history-item-date">{formatDate(record.date)}</span>
          {spread && (
            <span className="history-item-spread">
              {spread.icon} {spread.name}
            </span>
          )}
        </div>
        <div className="history-item-preview">
          {record.cards.map((card) => (
            <span
              key={card.position}
              className="history-item-glyph"
              style={{ background: card.hue }}
              title={card.name}
            >
              {card.glyph}
            </span>
          ))}
        </div>
        <span className={`history-item-arrow ${expanded ? "expanded" : ""}`}>▾</span>
      </button>
      {expanded && (
        <div className="history-item-cards">
          {record.question && (
            <div className="history-question">
              <span className="history-question-label">问</span>
              <p className="history-question-text">{record.question}</p>
            </div>
          )}
          {record.cards.map((card) => (
            <div key={card.position} className="history-card">
              <div className="history-card-glyph" style={{ background: card.hue }}>
                {card.glyph}
              </div>
              <div className="history-card-info">
                <small>{card.position}</small>
                <h4>{card.name}</h4>
                <strong style={{ color: card.hue }}>{card.keyword}</strong>
                <p>{card.meaning}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<ThemeId>(loadTheme);
  const [reading, setReading] = useState<Reading | null>(loadReading);
  const [revealed, setRevealed] = useState(reading?.revealed ?? 0);
  const [customCards, setCustomCards] = useState<Card[]>(loadCustomCards);
  const [showDeckManager, setShowDeckManager] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isNewCard, setIsNewCard] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string>("");
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [question, setQuestion] = useState(reading?.question ?? "");
  const [selectedSpreadId, setSelectedSpreadId] = useState<string>(reading?.spreadId ?? defaultSpreadId);

  const handleThemeChange = useCallback((themeId: ThemeId) => {
    setTheme(themeId);
    applyTheme(themeId);
    saveTheme(themeId);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const currentSpread = getSpreadById(reading?.spreadId ?? selectedSpreadId);
  const currentPositions = currentSpread.positions;
  const totalCards = currentPositions.length;

  const allCards = useMemo(() => [...defaultCards, ...customCards], [customCards]);
  const selectedCards = useMemo(
    () => reading?.cardIds.map((id) => allCards.find((card) => card.id === id)!) ?? [],
    [reading, allCards]
  );

  useEffect(() => {
    saveCustomCards(customCards);
  }, [customCards]);

  useEffect(() => {
    if (reading) {
      const updated = { ...reading, revealed };
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  }, [revealed, reading]);

  useEffect(() => {
    if (reading && revealed === totalCards && selectedCards.length === totalCards) {
      const positions = getPositions(reading.spreadId);
      const record: HistoryRecord = {
        date: reading.date,
        cards: selectedCards.map((card, index) => ({
          position: positions[index],
          name: card.name,
          keyword: card.keyword,
          meaning: card.meaning,
          hue: card.hue,
          glyph: card.glyph,
        })),
        question: reading.question,
        spreadId: reading.spreadId,
      };
      addToHistory(record);
      setHistory(loadHistory());
    }
  }, [revealed, reading, selectedCards, totalCards]);

  function startReading() {
    const trimmed = question.trim();
    const positions = getPositions(selectedSpreadId);
    const next: Reading = {
      date: todayKey(),
      cardIds: drawCards(allCards, positions.length),
      revealed: 0,
      question: trimmed || undefined,
      spreadId: selectedSpreadId,
    };
    setReading(next);
    setRevealed(0);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function handleAddCard() {
    setEditingCard({ ...emptyCard, id: `custom-${Date.now()}` });
    setIsNewCard(true);
  }

  function handleEditCard(card: Card) {
    setEditingCard({ ...card });
    setIsNewCard(false);
  }

  function clearReading() {
    setReading(null);
    setRevealed(0);
    localStorage.removeItem(storageKey);
  }

  function formatShareDate(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    let currentLine = "";
    for (const char of text) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  async function generateShareImage(): Promise<string> {
    const canvas = document.createElement("canvas");
    const W = 1080;
    const positions = currentPositions;
    const cardCount = positions.length;
    const cardGap = cardCount <= 3 ? 40 : 28;
    const cardHeight = cardCount <= 3 ? 320 : Math.max(180, Math.floor(900 / cardCount));
    const shareTitle = cardCount === 1 ? "今日一签" : "今日牌面";
    const footerText = cardCount === 1 ? "—— 一张牌的指引 ——" : `—— ${cardCount}张牌展开 ——`;
    const H = Math.max(1440, 400 + cardCount * (cardHeight + cardGap) + 100);
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
    bgGradient.addColorStop(0, "#201b24");
    bgGradient.addColorStop(0.48, "#3a2830");
    bgGradient.addColorStop(1, "#1b2430");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(224, 93, 93, 0.2)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#f0bd68";
    ctx.font = "800 32px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif";
    ctx.fillText("夜市占卜摊", W / 2, 100);

    ctx.fillStyle = "#f7f0df";
    ctx.font = "900 64px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif";
    ctx.fillText(shareTitle, W / 2, 180);

    ctx.fillStyle = "#d7c7b8";
    ctx.font = "600 28px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif";
    ctx.fillText(formatShareDate(reading?.date || todayKey()), W / 2, 230);

    ctx.fillStyle = "rgba(240, 189, 104, 0.7)";
    ctx.font = "700 24px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif";
    ctx.fillText(`${currentSpread.icon} ${currentSpread.name}`, W / 2, 270);

    const shareQuestion = reading?.question;
    let cardStartY = 320;
    if (shareQuestion) {
      ctx.fillStyle = "rgba(240, 189, 104, 0.85)";
      ctx.font = "700 30px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif";
      const questionLines = wrapText(ctx, `「${shareQuestion}」`, W - 160);
      questionLines.forEach((line, idx) => {
        ctx.fillText(line, W / 2, cardStartY + idx * 42);
      });
      cardStartY = cardStartY + questionLines.length * 42 + 30;
    }

    const cardWidth = W - 120;
    const cardX = 60;
    const glyphRatio = cardCount <= 3 ? 0.78 : 0.85;
    const glyphSize = cardCount <= 3 ? 200 : Math.floor(cardHeight * 0.8);
    const fontScale = cardCount <= 3 ? 1 : Math.max(0.55, 1 - (cardCount - 3) * 0.15);

    for (let i = 0; i < cardCount; i++) {
      const card = selectedCards[i];
      const position = positions[i];
      const y = cardStartY + i * (cardHeight + cardGap);

      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      drawRoundedRect(ctx, cardX, y, cardWidth, cardHeight, 20);
      ctx.fill();
      ctx.strokeStyle = "rgba(240, 189, 104, 0.15)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const glyphX = cardX + 50;
      const glyphY = y + (cardHeight - glyphSize) / 2;

      ctx.fillStyle = card.hue;
      drawRoundedRect(ctx, glyphX, glyphY, glyphSize, glyphSize * glyphRatio, 16);
      ctx.fill();

      ctx.fillStyle = "#fffaf0";
      ctx.font = `900 ${Math.floor(120 * fontScale)}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(card.glyph, glyphX + glyphSize / 2, glyphY + (glyphSize * glyphRatio) / 2);
      ctx.textBaseline = "alphabetic";

      const infoX = glyphX + glyphSize + 40;
      const infoWidth = cardWidth - (glyphSize + 90);
      const meaningLineCount = cardCount <= 3 ? 3 : 2;
      const titleFontSize = Math.floor(44 * fontScale);
      const keywordFontSize = Math.floor(30 * fontScale);
      const textFontSize = Math.floor(26 * fontScale);
      const topPadding = cardCount <= 3 ? 65 : Math.floor(cardHeight * 0.22);

      ctx.textAlign = "left";
      ctx.fillStyle = "#8a7a6d";
      ctx.font = `700 ${Math.floor(26 * fontScale)}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
      ctx.fillText(position, infoX, y + topPadding);

      ctx.fillStyle = "#f7f0df";
      ctx.font = `900 ${titleFontSize}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
      ctx.fillText(card.name, infoX, y + topPadding + titleFontSize + 8);

      ctx.fillStyle = card.hue;
      ctx.font = `800 ${keywordFontSize}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
      ctx.fillText(card.keyword, infoX, y + topPadding + titleFontSize + keywordFontSize + 16);

      ctx.fillStyle = "#d7c7b8";
      ctx.font = `500 ${textFontSize}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
      const meaningLines = wrapText(ctx, card.meaning, infoWidth);
      meaningLines.slice(0, meaningLineCount).forEach((line, idx) => {
        ctx.fillText(line, infoX, y + topPadding + titleFontSize + keywordFontSize + textFontSize + 24 + idx * (textFontSize + 14));
      });
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(240, 189, 104, 0.6)";
    ctx.font = "600 24px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif";
    ctx.fillText(footerText, W / 2, H - 80);

    return canvas.toDataURL("image/png", 1.0);
  }

  async function handleShare() {
    setIsGeneratingShare(true);
    try {
      const url = await generateShareImage();
      setShareImageUrl(url);
      setShowShareModal(true);
    } finally {
      setIsGeneratingShare(false);
    }
  }

  function downloadShareImage() {
    if (!shareImageUrl) return;
    const link = document.createElement("a");
    link.download = `今日牌面_${reading?.date || todayKey()}.png`;
    link.href = shareImageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleClearHistory() {
    if (confirm("确定要清空所有历史记录吗？此操作不可恢复。")) {
      clearHistory();
      setHistory([]);
    }
  }

  function handleDeleteCard(cardId: string) {
    const isInTodayReading = reading?.cardIds.includes(cardId);
    let confirmMessage = "确定要删除这张牌吗？";
    if (isInTodayReading) {
      confirmMessage = "这张牌在今日抽牌结果中，删除后今日牌面将重置，确定要删除吗？";
    }
    if (confirm(confirmMessage)) {
      setCustomCards((prev) => prev.filter((c) => c.id !== cardId));
      if (isInTodayReading) {
        clearReading();
      }
    }
  }

  function handleSaveCard() {
    if (!editingCard) return;
    if (!editingCard.name.trim() || !editingCard.keyword.trim() || !editingCard.meaning.trim()) {
      alert("请填写完整的牌信息");
      return;
    }
    if (isNewCard) {
      setCustomCards((prev) => [...prev, editingCard]);
    } else {
      setCustomCards((prev) => prev.map((c) => (c.id === editingCard.id ? editingCard : c)));
    }
    setEditingCard(null);
    setIsNewCard(false);
  }

  function handleCancelEdit() {
    setEditingCard(null);
    setIsNewCard(false);
  }

  return (
    <main className="booth">
      <ThemeSwitcher currentTheme={theme} onThemeChange={handleThemeChange} />
      <section className="counter">
        <div>
          <p className="eyebrow">夜市占卜摊</p>
          <h1>抽一张属于你的牌</h1>
          <p>牌面会保存到今天结束，明天再来时摊主会洗出新的结果。</p>
          {!reading && (
            <>
              <div className="spread-section">
                <label className="question-label">选择牌阵</label>
                <div className="spread-options">
                  {spreads.map((spread) => (
                    <button
                      key={spread.id}
                      className={`spread-option ${selectedSpreadId === spread.id ? "active" : ""}`}
                      onClick={() => setSelectedSpreadId(spread.id)}
                      disabled={Boolean(reading)}
                    >
                      <span className="spread-icon">{spread.icon}</span>
                      <div className="spread-info">
                        <div className="spread-name">{spread.name}</div>
                        <div className="spread-subtitle">{spread.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="spread-description">{currentSpread.description}</p>
              </div>
              <div className="question-section">
                <label className="question-label">今天想问什么？</label>
                <input
                  type="text"
                  className="question-input"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="写下你的问题（可选）"
                  maxLength={100}
                />
              </div>
            </>
          )}
          {reading && (
            <>
              <div className="spread-display">
                <span className="spread-display-icon">{currentSpread.icon}</span>
                <span className="spread-display-name">{currentSpread.name}</span>
                <span className="spread-display-count">{totalCards}张牌</span>
              </div>
              {reading.question && (
                <div className="question-display">
                  <span className="question-display-label">今天的问题</span>
                  <p className="question-display-text">{reading.question}</p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="counter-right">
          {!reading && (
            <div className="progress-hint">
              <span className="progress-hint-icon">🎯</span>
              <span>共{getPositions(selectedSpreadId).length}张牌</span>
            </div>
          )}
          <button onClick={startReading} disabled={Boolean(reading)} className="draw-button">
            {reading ? "今日已抽牌" : "开始抽牌"}
          </button>
        </div>
      </section>

      {reading && (
        <div className="reveal-progress">
          <div className="reveal-progress-info">
            <span>翻牌进度</span>
            <span className="reveal-progress-count">{revealed} / {totalCards}</span>
          </div>
          <div className="reveal-progress-bar">
            <div
              className="reveal-progress-fill"
              style={{ width: `${(revealed / totalCards) * 100}%` }}
            />
          </div>
          {revealed < totalCards && (
            <p className="reveal-progress-hint">
              点击第 {revealed + 1} 张牌 · 「{currentPositions[revealed]}」
            </p>
          )}
        </div>
      )}

      <section className={`table table-${totalCards}-cards`}>
        {currentPositions.map((position, index) => {
          const card = selectedCards[index];
          const isRevealed = index < revealed;
          return (
            <article className={`oracle-card ${isRevealed ? "revealed" : ""}`} key={position}>
              <div className="card-inner">
                <button
                  className="card-back"
                  disabled={!card || isRevealed}
                  onClick={() => setRevealed((value) => Math.max(value, index + 1))}
                >
                  <span className="card-back-number">{index + 1}</span>
                  <span>{position}</span>
                </button>
                {card && (
                  <div className="card-front" style={{ borderColor: card.hue }}>
                    <div className="glyph" style={{ background: card.hue }}>
                      {card.glyph}
                    </div>
                    <small>{position}</small>
                    <h2>{card.name}</h2>
                    <strong style={{ color: card.hue }}>{card.keyword}</strong>
                    <p>{card.meaning}</p>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {reading && revealed === totalCards && selectedCards.length === totalCards && (
        <section className="share-section">
          <button className="share-button" onClick={handleShare} disabled={isGeneratingShare}>
            {isGeneratingShare ? "生成中..." : "✨ 生成分享图"}
          </button>
        </section>
      )}

      <section className="deck">
        <div className="deck-header">
          <span className="deck-title">牌组</span>
          <button className="deck-manage-button" onClick={() => setShowDeckManager(true)}>
            牌库管理
          </button>
        </div>
        <div className="deck-tags">
          {allCards.map((card) => (
            <span key={card.id} style={{ background: card.hue }}>
              {card.keyword}
            </span>
          ))}
        </div>
      </section>

      <section className="history-section">
        <div className="history-header">
          <button className="history-toggle" onClick={() => setShowHistory(!showHistory)}>
            <span className="history-title">历史记录</span>
            <span className="history-count">{history.length} 条</span>
            <span className={`history-arrow ${showHistory ? "expanded" : ""}`}>▾</span>
          </button>
          {history.length > 0 && showHistory && (
            <button className="clear-history-button" onClick={handleClearHistory}>
              清空历史
            </button>
          )}
        </div>
        {showHistory && (
          <div className="history-content">
            {history.length === 0 ? (
              <p className="empty-history">还没有历史记录，完成一次抽牌后会自动保存。</p>
            ) : (
              <div className="history-list">
                {history.map((record) => (
                  <HistoryItem key={record.date} record={record} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {showDeckManager && (
        <div className="modal-overlay" onClick={() => !editingCard && setShowDeckManager(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>牌库管理</h2>
              <button className="modal-close" onClick={() => setShowDeckManager(false)}>
                ×
              </button>
            </div>

            {!editingCard ? (
              <>
                <div className="deck-actions">
                  <button className="add-card-button" onClick={handleAddCard}>
                    + 新增自定义牌
                  </button>
                </div>

                <div className="card-list">
                  <h3 className="card-section-title">默认牌组</h3>
                  {defaultCards.map((card) => (
                    <div key={card.id} className="card-item">
                      <div className="card-item-glyph" style={{ background: card.hue }}>
                        {card.glyph}
                      </div>
                      <div className="card-item-info">
                        <h4>{card.name}</h4>
                        <span className="card-item-keyword" style={{ background: card.hue }}>
                          {card.keyword}
                        </span>
                        <p>{card.meaning}</p>
                      </div>
                      <div className="card-item-actions">
                        <span className="default-badge">默认</span>
                      </div>
                    </div>
                  ))}

                  <h3 className="card-section-title">自定义牌组</h3>
                  {customCards.length === 0 ? (
                    <p className="empty-custom">还没有自定义牌，点击上方按钮添加</p>
                  ) : (
                    customCards.map((card) => (
                      <div key={card.id} className="card-item">
                        <div className="card-item-glyph" style={{ background: card.hue }}>
                          {card.glyph}
                        </div>
                        <div className="card-item-info">
                          <h4>{card.name}</h4>
                          <span className="card-item-keyword" style={{ background: card.hue }}>
                            {card.keyword}
                          </span>
                          <p>{card.meaning}</p>
                        </div>
                        <div className="card-item-actions">
                          <button className="edit-button" onClick={() => handleEditCard(card)}>
                            编辑
                          </button>
                          <button className="delete-button" onClick={() => handleDeleteCard(card.id)}>
                            删除
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="card-form">
                <h3>{isNewCard ? "新增自定义牌" : "编辑自定义牌"}</h3>

                <div className="form-row">
                  <label>牌名</label>
                  <input
                    type="text"
                    value={editingCard.name}
                    onChange={(e) => setEditingCard({ ...editingCard, name: e.target.value })}
                    placeholder="输入牌的名称"
                    maxLength={20}
                  />
                </div>

                <div className="form-row">
                  <label>关键词</label>
                  <input
                    type="text"
                    value={editingCard.keyword}
                    onChange={(e) => setEditingCard({ ...editingCard, keyword: e.target.value })}
                    placeholder="输入关键词"
                    maxLength={20}
                  />
                </div>

                <div className="form-row">
                  <label>解释</label>
                  <textarea
                    value={editingCard.meaning}
                    onChange={(e) => setEditingCard({ ...editingCard, meaning: e.target.value })}
                    placeholder="输入牌的解释"
                    rows={3}
                    maxLength={200}
                  />
                </div>

                <div className="form-row form-row-inline">
                  <div className="form-item">
                    <label>颜色</label>
                    <input
                      type="color"
                      value={editingCard.hue}
                      onChange={(e) => setEditingCard({ ...editingCard, hue: e.target.value })}
                    />
                  </div>
                  <div className="form-item">
                    <label>字形</label>
                    <input
                      type="text"
                      value={editingCard.glyph}
                      onChange={(e) => setEditingCard({ ...editingCard, glyph: e.target.value.slice(0, 1) })}
                      placeholder="一个字"
                      maxLength={1}
                      className="glyph-input"
                    />
                  </div>
                </div>

                <div className="card-preview">
                  <div className="preview-label">预览</div>
                  <div className="card-preview-box" style={{ borderColor: editingCard.hue }}>
                    <div className="glyph" style={{ background: editingCard.hue }}>
                      {editingCard.glyph || "牌"}
                    </div>
                    <h4>{editingCard.name || "牌名"}</h4>
                    <strong style={{ color: editingCard.hue }}>{editingCard.keyword || "关键词"}</strong>
                    <p>{editingCard.meaning || "牌的解释"}</p>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="cancel-button" onClick={handleCancelEdit}>
                    取消
                  </button>
                  <button className="save-button" onClick={handleSaveCard}>
                    保存
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>今日牌面分享图</h2>
              <button className="modal-close" onClick={() => setShowShareModal(false)}>
                ×
              </button>
            </div>
            <div className="share-modal-body">
              <div className="share-image-preview">
                <img src={shareImageUrl} alt="今日牌面分享图" />
              </div>
              <div className="share-modal-actions">
                <button className="cancel-button" onClick={() => setShowShareModal(false)}>
                  关闭
                </button>
                <button className="save-button download-button" onClick={downloadShareImage}>
                  📥 保存到本地
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
