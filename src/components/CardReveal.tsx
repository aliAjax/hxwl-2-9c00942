import { CardGlyph } from "./CardGlyph";
import type { Card } from "../types";

type CardRevealProps = {
  cards: Card[];
  positions: string[];
  revealed: number;
  totalCards: number;
  onReveal: (index: number) => void;
  readingDate?: string;
};

export function CardReveal({
  cards,
  positions,
  revealed,
  totalCards,
  onReveal,
}: CardRevealProps) {
  return (
    <>
      <RevealProgress
        revealed={revealed}
        totalCards={totalCards}
        currentPosition={positions[revealed]}
      />
      <section className={`table table-${totalCards}-cards`}>
        {positions.map((position, index) => {
          const card = cards[index];
          const isRevealed = index < revealed;
          return (
            <article
              className={`oracle-card ${isRevealed ? "revealed" : ""}`}
              key={position}
            >
              <div className="card-inner">
                <button
                  className="card-back"
                  disabled={!card || isRevealed}
                  onClick={() => onReveal(index)}
                >
                  <span className="card-back-number">{index + 1}</span>
                  <span>{position}</span>
                </button>
                {card && (
                  <div className="card-front" style={{ borderColor: card.hue }}>
                    <CardGlyph card={card} />
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
    </>
  );
}

function RevealProgress({
  revealed,
  totalCards,
  currentPosition,
}: {
  revealed: number;
  totalCards: number;
  currentPosition?: string;
}) {
  return (
    <div className="reveal-progress">
      <div className="reveal-progress-info">
        <span>翻牌进度</span>
        <span className="reveal-progress-count">
          {revealed} / {totalCards}
        </span>
      </div>
      <div className="reveal-progress-bar">
        <div
          className="reveal-progress-fill"
          style={{ width: `${(revealed / totalCards) * 100}%` }}
        />
      </div>
      {revealed < totalCards && currentPosition && (
        <p className="reveal-progress-hint">
          点击第 {revealed + 1} 张牌 · 「{currentPosition}」
        </p>
      )}
    </div>
  );
}
