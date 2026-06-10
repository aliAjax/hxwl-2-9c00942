import { useMemo, useState } from "react";

type Card = {
  id: string;
  name: string;
  keyword: string;
  meaning: string;
  hue: string;
  glyph: string;
};

type Reading = {
  date: string;
  cardIds: string[];
};

const cards: Card[] = [
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

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadReading(): Reading | null {
  try {
    const reading = JSON.parse(localStorage.getItem(storageKey) || "null") as Reading | null;
    return reading?.date === todayKey() ? reading : null;
  } catch {
    return null;
  }
}

function drawCards() {
  return [...cards]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((card) => card.id);
}

export default function App() {
  const [reading, setReading] = useState<Reading | null>(loadReading);
  const [revealed, setRevealed] = useState(reading ? 3 : 0);
  const selectedCards = useMemo(() => reading?.cardIds.map((id) => cards.find((card) => card.id === id)!) ?? [], [reading]);

  function startReading() {
    const next = { date: todayKey(), cardIds: drawCards() };
    setReading(next);
    setRevealed(0);
    localStorage.setItem(storageKey, JSON.stringify(next));
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
        {cards.map((card) => (
          <span key={card.id} style={{ background: card.hue }}>
            {card.keyword}
          </span>
        ))}
      </section>
    </main>
  );
}
