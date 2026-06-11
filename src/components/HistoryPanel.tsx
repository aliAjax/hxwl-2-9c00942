import { useState, useMemo, useCallback } from "react";
import { CardGlyph } from "./CardGlyph";
import type { HistoryRecord, Space, Spread, SpreadSnapshot } from "../types";
import { getAllSpreads } from "../data/spreadStore";
import { getSpreadForHistory } from "../data/historyStore";
import { formatDate } from "../data/dateUtils";
import { DEFAULT_SPACE_ID } from "../data/constants";

type HistoryPanelProps = {
  history: HistoryRecord[];
  spaces: Space[];
  customSpreads: Spread[];
  isOpen: boolean;
  onToggle: () => void;
  onClearHistory: () => void;
};

const ALL_SPACES_ID = "__all_spaces__";
const ALL_SPREADS_ID = "__all_spreads__";
const ARCHIVE_FILTER_ALL = "__archive_all__";
const ARCHIVE_FILTER_ARCHIVED = "__archive_archived__";
const ARCHIVE_FILTER_ACTIVE = "__archive_active__";

type SpreadFilterOption = {
  id: string;
  name: string;
  icon: string;
  isDeleted?: boolean;
};

type ArchiveFilterValue =
  | typeof ARCHIVE_FILTER_ALL
  | typeof ARCHIVE_FILTER_ARCHIVED
  | typeof ARCHIVE_FILTER_ACTIVE;

const ARCHIVE_FILTER_OPTIONS: { id: ArchiveFilterValue; label: string }[] = [
  { id: ARCHIVE_FILTER_ALL, label: "全部" },
  { id: ARCHIVE_FILTER_ACTIVE, label: "未归档" },
  { id: ARCHIVE_FILTER_ARCHIVED, label: "已归档" },
];

export function HistoryPanel({
  history,
  spaces,
  customSpreads,
  isOpen,
  onToggle,
  onClearHistory,
}: HistoryPanelProps) {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(ALL_SPACES_ID);
  const [selectedSpreadId, setSelectedSpreadId] = useState<string>(ALL_SPREADS_ID);
  const [questionKeyword, setQuestionKeyword] = useState<string>("");
  const [cardNameKeyword, setCardNameKeyword] = useState<string>("");
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilterValue>(ARCHIVE_FILTER_ALL);
  const allSpreads = getAllSpreads(customSpreads);

  const spreadFilterOptions = useMemo<SpreadFilterOption[]>(() => {
    const options = new Map<string, SpreadFilterOption>();
    allSpreads.forEach((s) => {
      options.set(s.id, { id: s.id, name: s.name, icon: s.icon });
    });
    history.forEach((record) => {
      if (record.spreadSnapshot && !options.has(record.spreadSnapshot.id)) {
        options.set(record.spreadSnapshot.id, {
          id: record.spreadSnapshot.id,
          name: record.spreadSnapshot.name,
          icon: record.spreadSnapshot.icon,
          isDeleted: (record.spreadSnapshot as SpreadSnapshot).isDeleted,
        });
      }
    });
    return Array.from(options.values());
  }, [history, allSpreads]);

  const filteredHistory = useMemo(() => {
    const qKeyword = questionKeyword.trim().toLowerCase();
    const cKeyword = cardNameKeyword.trim().toLowerCase();
    return history.filter((record) => {
      const spaceMatch =
        selectedSpaceId === ALL_SPACES_ID ||
        record.spaceId === selectedSpaceId ||
        (!record.spaceId && selectedSpaceId === DEFAULT_SPACE_ID);
      const recordSpreadId = record.spreadSnapshot?.id ?? record.spreadId;
      const spreadMatch =
        selectedSpreadId === ALL_SPREADS_ID || recordSpreadId === selectedSpreadId;
      const questionMatch =
        qKeyword === "" ||
        (record.question != null && record.question.toLowerCase().includes(qKeyword));
      const cardNameMatch =
        cKeyword === "" ||
        record.cards.some(
          (card) =>
            card.name.toLowerCase().includes(cKeyword) ||
            card.keyword.toLowerCase().includes(cKeyword)
        );
      let archiveMatch = true;
      if (archiveFilter === ARCHIVE_FILTER_ARCHIVED) {
        archiveMatch = !!record.archived;
      } else if (archiveFilter === ARCHIVE_FILTER_ACTIVE) {
        archiveMatch = !record.archived;
      }
      return (
        spaceMatch &&
        spreadMatch &&
        questionMatch &&
        cardNameMatch &&
        archiveMatch
      );
    });
  }, [history, selectedSpaceId, selectedSpreadId, questionKeyword, cardNameKeyword, archiveFilter]);

  const hasActiveFilter =
    selectedSpaceId !== ALL_SPACES_ID ||
    selectedSpreadId !== ALL_SPREADS_ID ||
    questionKeyword.trim() !== "" ||
    cardNameKeyword.trim() !== "" ||
    archiveFilter !== ARCHIVE_FILTER_ALL;

  const handleClearHistory = useCallback(() => {
    if (confirm("确定要清空所有历史记录吗？此操作不可恢复。")) {
      onClearHistory();
      setQuestionKeyword("");
      setCardNameKeyword("");
      setSelectedSpaceId(ALL_SPACES_ID);
      setSelectedSpreadId(ALL_SPREADS_ID);
      setArchiveFilter(ARCHIVE_FILTER_ALL);
    }
  }, [onClearHistory]);

  const handleResetFilters = useCallback(() => {
    setSelectedSpaceId(ALL_SPACES_ID);
    setSelectedSpreadId(ALL_SPREADS_ID);
    setQuestionKeyword("");
    setCardNameKeyword("");
    setArchiveFilter(ARCHIVE_FILTER_ALL);
  }, []);

  const countActiveFilters = useCallback(() => {
    let count = 0;
    if (selectedSpaceId !== ALL_SPACES_ID) count++;
    if (selectedSpreadId !== ALL_SPREADS_ID) count++;
    if (questionKeyword.trim() !== "") count++;
    if (cardNameKeyword.trim() !== "") count++;
    if (archiveFilter !== ARCHIVE_FILTER_ALL) count++;
    return count;
  }, [selectedSpaceId, selectedSpreadId, questionKeyword, cardNameKeyword, archiveFilter]);

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
              <div className="history-filter-search-row">
                <div className="history-filter-search-group">
                  <span className="history-filter-label">🔍 问题关键词</span>
                  <input
                    type="text"
                    className="history-filter-search"
                    placeholder="输入问题中的关键词…"
                    value={questionKeyword}
                    onChange={(e) => setQuestionKeyword(e.target.value)}
                  />
                </div>
                <div className="history-filter-search-group">
                  <span className="history-filter-label">🎴 牌名/关键词</span>
                  <input
                    type="text"
                    className="history-filter-search"
                    placeholder="输入牌名或关键词…"
                    value={cardNameKeyword}
                    onChange={(e) => setCardNameKeyword(e.target.value)}
                  />
                </div>
              </div>
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
                  {spreadFilterOptions.map((opt) => (
                    <button
                      key={opt.id}
                      className={`history-filter-chip ${selectedSpreadId === opt.id ? "active" : ""} ${
                        opt.isDeleted ? "deleted-option" : ""
                      }`}
                      onClick={() => setSelectedSpreadId(opt.id)}
                      title={opt.isDeleted ? "该牌阵已删除，显示历史快照" : undefined}
                    >
                      {opt.icon} {opt.name}
                      {opt.isDeleted && <span className="chip-deleted-mark"> (已删)</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="history-filter-group">
                <span className="history-filter-label">归档状态</span>
                <div className="history-filter-options">
                  {ARCHIVE_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      className={`history-filter-chip ${archiveFilter === opt.id ? "active" : ""}`}
                      onClick={() => setArchiveFilter(opt.id)}
                    >
                      {opt.id === ARCHIVE_FILTER_ARCHIVED
                        ? "📦 "
                        : opt.id === ARCHIVE_FILTER_ACTIVE
                        ? "✨ "
                        : ""}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {hasActiveFilter && (
                <div className="history-filter-actions">
                  <span className="history-filter-active-count">
                    已应用 {countActiveFilters()} 项筛选
                  </span>
                  <button className="history-filter-reset" onClick={handleResetFilters}>
                    清除全部筛选
                  </button>
                </div>
              )}
            </div>
          )}
          {history.length === 0 ? (
            <div className="empty-history-wrapper">
              <div className="empty-history-icon">📜</div>
              <p className="empty-history">还没有历史记录，完成一次抽牌后会自动保存。</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="empty-history-wrapper empty-with-filter">
              <div className="empty-history-icon">🔍</div>
              <p className="empty-history">当前筛选条件下没有历史记录。</p>
              <p className="empty-history-hint">尝试调整或清除筛选条件，查看更多结果。</p>
              {hasActiveFilter && (
                <button className="history-filter-reset-inline" onClick={handleResetFilters}>
                  清除全部筛选条件
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
  const spread = getSpreadForHistory(record);
  const spreadIsDeleted = (spread as SpreadSnapshot).isDeleted;

  const space = record.spaceId
    ? spaces.find((s) => s.id === record.spaceId)
    : undefined;
  const spaceDisplay = space
    ? space
    : record.spaceId === DEFAULT_SPACE_ID || !record.spaceId
    ? { name: "默认空间", icon: "🏠" }
    : { name: record.spaceName || "已删除空间", icon: "📦" };

  return (
    <div className={`history-item ${spreadIsDeleted ? "has-deleted-spread" : ""}`}>
      <button
        className="history-item-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="history-item-left">
          <span className="history-item-date">{formatDate(record.date)}</span>
          <div className="history-item-meta">
            {spread && (
              <span className={`history-item-spread ${spreadIsDeleted ? "spread-deleted" : ""}`}>
                {spread.icon} {spread.name}
                {spreadIsDeleted && (
                  <span className="spread-deleted-hint" title="该牌阵已删除，显示当时的快照">
                    (已删除)
                  </span>
                )}
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
          {spreadIsDeleted && (
            <div className="spread-deleted-notice">
              <span className="spread-deleted-icon">📦</span>
              <span>
                此牌阵已被删除，这里显示的是抽牌当时的牌阵信息快照（
                {spread.positions.length}个位置）。
              </span>
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
