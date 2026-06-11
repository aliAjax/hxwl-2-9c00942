import { useState, useMemo } from "react";
import { CardGlyph } from "./CardGlyph";
import type { HistoryRecord, Space } from "../types";
import { getSpreadById, getAllSpreads } from "../data/spreadStore";
import { formatDate } from "../data/dateUtils";
import { DEFAULT_SPACE_ID } from "../data/constants";

type HistoryPanelProps = {
  history: HistoryRecord[];
  spaces: Space[];
  isOpen: boolean;
  onToggle: () => void;
  onClearHistory: () => void;
};

const ALL_SPACES_ID = "__all_spaces__";
const ALL_SPREADS_ID = "__all_spreads__";

export function HistoryPanel({
  history,
  spaces,
  isOpen,
  onToggle,
  onClearHistory,
}: HistoryPanelProps) {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(ALL_SPACES_ID);
  const [selectedSpreadId, setSelectedSpreadId] = useState<string>(ALL_SPREADS_ID);
  const spreads = getAllSpreads();

  const filteredHistory = useMemo(() => {
    return history.filter((record) => {
      const spaceMatch =
        selectedSpaceId === ALL_SPACES_ID ||
        record.spaceId === selectedSpaceId ||
        (!record.spaceId && selectedSpaceId === DEFAULT_SPACE_ID);
      const spreadMatch =
        selectedSpreadId === ALL_SPREADS_ID || record.spreadId === selectedSpreadId;
      return spaceMatch && spreadMatch;
    });
  }, [history, selectedSpaceId, selectedSpreadId]);

  const hasActiveFilter =
    selectedSpaceId !== ALL_SPACES_ID || selectedSpreadId !== ALL_SPREADS_ID;

  const handleClearHistory = () => {
    if (confirm("确定要清空所有历史记录吗？此操作不可恢复。")) {
      onClearHistory();
    }
  };

  const handleResetFilters = () => {
    setSelectedSpaceId(ALL_SPACES_ID);
    setSelectedSpreadId(ALL_SPREADS_ID);
  };

  return (
    <section className="history-section">
      <div className="history-header">
        <button className="history-toggle" onClick={onToggle}>
          <span className="history-title">历史记录</span>
          <span className="history-count">{filteredHistory.length} 条</span>
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
          {history.length > 0 && (
            <div className="history-filters">
              <div className="history-filter-group">
                <span className="history-filter-label">空间</span>
                <div className="history-filter-options">
                  <button
                    className={`history-filter-chip ${selectedSpaceId === ALL_SPACES_ID ? "active" : ""}`}
                    onClick={() => setSelectedSpaceId(ALL_SPACES_ID)}
                  >
                    全部
                  </button>
                  {spaces.map((space) => (
                    <button
                      key={space.id}
                      className={`history-filter-chip ${selectedSpaceId === space.id ? "active" : ""}`}
                      onClick={() => setSelectedSpaceId(space.id)}
                    >
                      {space.icon} {space.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="history-filter-group">
                <span className="history-filter-label">牌阵</span>
                <div className="history-filter-options">
                  <button
                    className={`history-filter-chip ${selectedSpreadId === ALL_SPREADS_ID ? "active" : ""}`}
                    onClick={() => setSelectedSpreadId(ALL_SPREADS_ID)}
                  >
                    全部
                  </button>
                  {spreads.map((spread) => (
                    <button
                      key={spread.id}
                      className={`history-filter-chip ${selectedSpreadId === spread.id ? "active" : ""}`}
                      onClick={() => setSelectedSpreadId(spread.id)}
                    >
                      {spread.icon} {spread.name}
                    </button>
                  ))}
                </div>
              </div>
              {hasActiveFilter && (
                <button className="history-filter-reset" onClick={handleResetFilters}>
                  清除筛选
                </button>
              )}
            </div>
          )}
          {history.length === 0 ? (
            <p className="empty-history">还没有历史记录，完成一次抽牌后会自动保存。</p>
          ) : filteredHistory.length === 0 ? (
            <div className="empty-history-wrapper">
              <p className="empty-history">当前筛选条件下没有历史记录。</p>
              {hasActiveFilter && (
                <button className="history-filter-reset-inline" onClick={handleResetFilters}>
                  清除筛选条件
                </button>
              )}
            </div>
          ) : (
            <div className="history-list">
              {filteredHistory.map((record) => (
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
