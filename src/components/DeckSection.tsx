import { CardGlyph } from "./CardGlyph";
import type { Card } from "../types";
import { DEFAULT_CARDS } from "../data/constants";

type DeckTagsProps = {
  allCards: Card[];
  onManageClick: () => void;
};

export function DeckTags({ allCards, onManageClick }: DeckTagsProps) {
  return (
    <section className="deck">
      <div className="deck-header">
        <span className="deck-title">牌组</span>
        <button className="deck-manage-button" onClick={onManageClick}>
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
  );
}

type DeckSectionProps = {
  allCards: Card[];
  onManageClick: () => void;
};

export function DeckSection({ allCards, onManageClick }: DeckSectionProps) {
  return <DeckTags allCards={allCards} onManageClick={onManageClick} />;
}

export { DEFAULT_CARDS };
