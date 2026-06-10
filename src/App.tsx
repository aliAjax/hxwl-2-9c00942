import { useMemo, useState, useEffect } from "react";

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
};

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

const positions = ["事件", "阻碍", "建议"];
const storageKey = "hxwl-2-reading";
const customCardsKey = "hxwl-2-custom-cards";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadReading(): Reading | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const reading = JSON.parse(raw) as Reading & { revealed?: number };
    if (reading.date !== todayKey()) return null;
    if (reading.revealed === undefined) {
      reading.revealed = 0;
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

function drawCards(allCards: Card[]) {
  return [...allCards]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
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

  return (
    <div className="history-item">
      <button className="history-item-header" onClick={() => setExpanded(!expanded)}>
        <span className="history-item-date">{formatDate(record.date)}</span>
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
  const [reading, setReading] = useState<Reading | null>(loadReading);
  const [revealed, setRevealed] = useState(reading?.revealed ?? 0);
  const [customCards, setCustomCards] = useState<Card[]>(loadCustomCards);
  const [showDeckManager, setShowDeckManager] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isNewCard, setIsNewCard] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);

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
    if (revealed === 3 && reading && selectedCards.length === 3) {
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
      };
      addToHistory(record);
      setHistory(loadHistory());
    }
  }, [revealed, reading, selectedCards]);

  function startReading() {
    const next = { date: todayKey(), cardIds: drawCards(allCards), revealed: 0 };
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
      <section className="counter">
        <div>
          <p className="eyebrow">夜市占卜摊</p>
          <h1>每天只翻三张牌</h1>
          <p>牌面会保存到今天结束，明天再来时摊主会洗出新的结果。</p>
        </div>
        <button onClick={startReading} disabled={Boolean(reading)} className="draw-button">
          {reading ? "今日已抽牌" : "开始抽牌"}
        </button>
      </section>

      <section className="table">
        {positions.map((position, index) => {
          const card = selectedCards[index];
          const isRevealed = index < revealed;
          return (
            <article className={`oracle-card ${isRevealed ? "revealed" : ""}`} key={position}>
              <div className="card-inner">
                <button className="card-back" disabled={!card || isRevealed} onClick={() => setRevealed((value) => Math.max(value, index + 1))}>
                  <span>{position}</span>
                </button>
                {card && (
                  <div className="card-front" style={{ borderColor: card.hue }}>
                    <div className="glyph" style={{ background: card.hue }}>
                      {card.glyph}
                    </div>
                    <small>{position}</small>
                    <h2>{card.name}</h2>
                    <strong>{card.keyword}</strong>
                    <p>{card.meaning}</p>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>

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
    </main>
  );
}
