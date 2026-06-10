import { useState } from "react";
import { CardGlyph } from "./CardGlyph";
import type { HistoryRecord, Space } from "../types";
import { getSpreadById } from "../data/spreadStore";
import { formatDate } from "../data/dateUtils";
import { DEFAULT_SPACE_ID } from "../data/constants";

type HistoryPanelProps = {
  history: HistoryRecord[];
  spaces: Space[];
  isOpen: boolean;
  onToggle: () => void;
  onClearHistory: () => void;
};

export function HistoryPanel({
  history,
  spaces,
  isOpen,
  onToggle,
  onClearHistory,
}: HistoryPanelProps) {
  const handleClearHistory = () => {
    if (confirm("确定要清空所有历史记录吗？此操作不可恢复。")) {
      onClearHistory();
    }
  };

  return (
    <section className="history-section">
      <div className="history-header">
        <button className="history-toggle" onClick={onToggle}>
          <span className="history-title">历史记录</span>
          <span className="history-count">{history.length} 条</span>
          <span className={`history-arrow ${isOpen ? "expanded" : ""}`}>▾</span>
        </button>
        {history.length > 0 && isOpen && (
          <button className="clear-history-button" onClick={handleClearHistory}>
            清空历史
          </button>
        )}
      </div>
      {isOpen && (
        <div className="history-content">
          {history.length === 0 ? (
            <p className="empty-history">还没有历史记录，完成一次抽牌后会自动保存。</p>
          ) : (
            <div className="history-list">
              {history.map((record) => (
                <HistoryItem key={record.date} record={record} spaces={spaces} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function HistoryItem({
  record,
  spaces,
}: {
  record: HistoryRecord;
  spaces: Space[];
}) {
  const [expanded, setExpanded] = useState(false);
  const spread = record.spreadId ? getSpreadById(record.spreadId) : null;
  const space = record.spaceId
    ? spaces.find((s) => s.id === record.spaceId)
    : undefined;
  const spaceDisplay = space
    ? space
    : record.spaceId === DEFAULT_SPACE_ID || !record.spaceId
    ? { name: "默认空间", icon: "🏠" }
    : { name: record.spaceName || "已删除空间", icon: "📦" };

  return (
    <div className="history-item">
      <button
        className="history-item-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="history-item-left">
          <span className="history-item-date">{formatDate(record.date)}</span>
          <div className="history-item-meta">
            {spread && (
              <span className="history-item-spread">
                {spread.icon} {spread.name}
              </span>
            )}
            <span className="history-item-space">
              {spaceDisplay.icon} {spaceDisplay.name}
            </span>
            {record.archived && (
              <span className="history-item-archived">
                {record.archiveReason === "completed"
                  ? "已完成"
                  : record.archiveReason === "partial"
                  ? "部分翻开"
                  : "过期"}
              </span>
            )}
          </div>
        </div>
        <div className="history-item-preview">
          {record.cards.map((card, index) => (
            <CardGlyph
              key={`${card.position}-${index}`}
              card={card}
              className="history-item-glyph"
              size="small"
            />
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
          {record.cards.map((card, index) => (
            <div
              key={`${card.position}-${index}`}
              className={`history-card ${card.isDeleted ? "deleted" : ""}`}
            >
              <CardGlyph
                card={card}
                className="history-card-glyph"
                size="small"
              />
              <div className="history-card-info">
                <small>{card.position}</small>
                <h4>{card.name}</h4>
                <strong style={{ color: card.hue }}>{card.keyword}</strong>
                <p>{card.meaning}</p>
                {card.isDeleted && (
                  <span className="history-card-deleted-hint">此牌已随所属空间删除</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
