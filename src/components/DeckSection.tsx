import { CardGlyph } from "./CardGlyph";
import type { Card, Space } from "../types";
import { DEFAULT_CARDS } from "../data/constants";

type DeckTagsProps = {
  allCards: Card[];
  currentSpace?: Space;
  onManageClick: () => void;
};

export function DeckTags({ allCards, currentSpace, onManageClick }: DeckTagsProps) {
  return (
    <section className="deck">
      <div className="deck-header">
        <div className="deck-header-left">
          <span className="deck-title">牌组</span>
          {currentSpace && (
            <span className="deck-space-label">
              <span className="deck-space-icon">{currentSpace.icon}</span>
              <span>{currentSpace.name}</span>
              {currentSpace.isDefault && (
                <span className="default-badge" style={{ marginLeft: 6 }}>
                  默认
                </span>
              )}
            </span>
          )}
        </div>
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
  currentSpace?: Space;
  onManageClick: () => void;
};

export function DeckSection({ allCards, currentSpace, onManageClick }: DeckSectionProps) {
  return (
    <DeckTags
      allCards={allCards}
      currentSpace={currentSpace}
      onManageClick={onManageClick}
    />
  );
}

export { DEFAULT_CARDS };
