import { useState, useMemo } from "react";
import type { Space, Card, HistoryRecord, Reading, Spread } from "../types";
import {
  computeSpaceStats,
  sortSpaces,
  getDeletionImpact,
  type SpaceStats,
  type SortField,
  type SortOrder,
} from "../data/spaceStore";
import { getAllSpreads } from "../data/spreadStore";
import { formatDate, todayKey } from "../data/dateUtils";
import { DEFAULT_SPACE_ID } from "../data/constants";

type SpaceSelectorProps = {
  spaces: Space[];
  currentSpaceId: string;
  disabled?: boolean;
  onSpaceChange: (spaceId: string) => void;
  onManageSpaces: () => void;
};

export function SpaceSelector({
  spaces,
  currentSpaceId,
  disabled,
  onSpaceChange,
  onManageSpaces,
}: SpaceSelectorProps) {
  const currentSpace = spaces.find((s) => s.id === currentSpaceId) ?? spaces[0];

  return (
    <div className="space-selector-section">
      <label className="question-label">选择牌组空间</label>
      <div className="space-selector-wrapper">
        <div className="space-options">
          {spaces.map((space) => (
            <button
              key={space.id}
              className={`space-option ${
                currentSpaceId === space.id ? "active" : ""
              }`}
              onClick={() => onSpaceChange(space.id)}
              disabled={disabled}
              title={space.isDefault ? "默认空间 - 所有默认牌都可用" : `自定义空间：${space.name}`}
            >
              <span className="space-icon">{space.icon}</span>
              <span className="space-name">{space.name}</span>
              {space.isDefault && <span className="space-default-badge">默认</span>}
            </button>
          ))}
        </div>
        <button
          className="space-manage-button"
          onClick={onManageSpaces}
          disabled={disabled}
          title="管理空间"
        >
          ⚙ 管理
        </button>
      </div>
      {currentSpace && (
        <p className="space-hint">
          {currentSpace.isDefault
            ? "默认空间：包含全部默认牌和所有空间的自定义牌"
            : `「${currentSpace.name}」空间：包含默认牌和此空间的自定义牌`}
        </p>
      )}
    </div>
  );
}

type SpaceManagerProps = {
  spaces: Space[];
  customCards: Card[];
  history: HistoryRecord[];
  reading: Reading | null;
  customSpreads: Spread[];
  isOpen: boolean;
  onClose: () => void;
  onAddSpace: (name: string, icon: string) => void;
  onUpdateSpace: (space: Space) => void;
  onDeleteSpace: (spaceId: string) => boolean;
};

const SPACE_ICON_OPTIONS = [
  "🏠", "💼", "💕", "💡", "🎨", "📚", "🌱", "⭐",
  "🎯", "🚀", "🌈", "🌸", "🍀", "🎵", "✈️", "🏆",
];

const SORT_FIELD_LABELS: Record<SortField, string> = {
  createdAt: "创建时间",
  name: "名称",
  customCardCount: "自定义牌数",
  drawCount: "抽牌次数",
  lastDrawDate: "最近抽牌",
};

export function SpaceManager({
  spaces,
  customCards,
  history,
  reading,
  customSpreads,
  isOpen,
  onClose,
  onAddSpace,
  onUpdateSpace,
  onDeleteSpace,
}: SpaceManagerProps) {
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [isNewSpace, setIsNewSpace] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [spaceIcon, setSpaceIcon] = useState("📁");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [deleteConfirmSpace, setDeleteConfirmSpace] = useState<Space | null>(null);

  const allSpreads = useMemo(() => getAllSpreads(customSpreads), [customSpreads]);

  const statsMap = useMemo(() => {
    const map = new Map<string, SpaceStats>();
    for (const space of spaces) {
      map.set(
        space.id,
        computeSpaceStats(space.id, customCards, history, allSpreads)
      );
    }
    return map;
  }, [spaces, customCards, history, allSpreads]);

  const sortedSpaces = useMemo(
    () => sortSpaces(spaces, statsMap, sortField, sortOrder),
    [spaces, statsMap, sortField, sortOrder]
  );

  if (!isOpen) return null;

  const handleAddSpace = () => {
    setEditingSpace(null);
    setIsNewSpace(true);
    setSpaceName("");
    setSpaceIcon("📁");
  };

  const handleEditSpace = (space: Space) => {
    setEditingSpace(space);
    setIsNewSpace(false);
    setSpaceName(space.name);
    setSpaceIcon(space.icon);
  };

  const handleRequestDeleteSpace = (space: Space) => {
    if (space.isDefault) {
      alert("默认空间不可删除");
      return;
    }
    setDeleteConfirmSpace(space);
  };

  const handleConfirmDeleteSpace = () => {
    if (!deleteConfirmSpace) return;
    const deleted = onDeleteSpace(deleteConfirmSpace.id);
    if (deleted) {
      setEditingSpace(null);
      setIsNewSpace(false);
    }
    setDeleteConfirmSpace(null);
  };

  const handleCancelDeleteSpace = () => {
    setDeleteConfirmSpace(null);
  };

  const handleSaveSpace = () => {
    if (!spaceName.trim()) {
      alert("空间名称不能为空");
      return;
    }
    if (spaceName.trim().length > 20) {
      alert("空间名称不能超过20个字符");
      return;
    }
    if (isNewSpace) {
      onAddSpace(spaceName.trim(), spaceIcon);
    } else if (editingSpace) {
      onUpdateSpace({
        ...editingSpace,
        name: spaceName.trim(),
        icon: spaceIcon,
      });
    }
    setEditingSpace(null);
    setIsNewSpace(false);
  };

  const handleCancelEdit = () => {
    setEditingSpace(null);
    setIsNewSpace(false);
  };

  const handleOverlayClick = () => {
    if (!editingSpace && !isNewSpace && !deleteConfirmSpace) {
      onClose();
    }
  };

  const handleSortFieldChange = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "name" ? "asc" : "desc");
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>空间管理</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {deleteConfirmSpace ? (
          <DeleteConfirmDialog
            space={deleteConfirmSpace}
            customCards={customCards}
            reading={reading}
            allSpreads={allSpreads}
            onConfirm={handleConfirmDeleteSpace}
            onCancel={handleCancelDeleteSpace}
          />
        ) : !editingSpace && !isNewSpace ? (
          <SpaceList
            spaces={sortedSpaces}
            statsMap={statsMap}
            sortField={sortField}
            sortOrder={sortOrder}
            onSortFieldChange={handleSortFieldChange}
            onAddSpace={handleAddSpace}
            onEditSpace={handleEditSpace}
            onDeleteSpace={handleRequestDeleteSpace}
          />
        ) : (
          <SpaceForm
            spaceName={spaceName}
            spaceIcon={spaceIcon}
            isNewSpace={isNewSpace}
            isEditingDefault={editingSpace?.isDefault ?? false}
            onNameChange={setSpaceName}
            onIconChange={setSpaceIcon}
            onSave={handleSaveSpace}
            onCancel={handleCancelEdit}
          />
        )}
      </div>
    </div>
  );
}

function SortControls({
  sortField,
  sortOrder,
  onSortFieldChange,
}: {
  sortField: SortField;
  sortOrder: SortOrder;
  onSortFieldChange: (field: SortField) => void;
}) {
  const fields: SortField[] = [
    "createdAt",
    "name",
    "customCardCount",
    "drawCount",
    "lastDrawDate",
  ];

  return (
    <div className="sort-controls">
      <span className="sort-label">排序：</span>
      <div className="sort-buttons">
        {fields.map((field) => (
          <button
            key={field}
            className={`sort-button ${sortField === field ? "active" : ""}`}
            onClick={() => onSortFieldChange(field)}
          >
            {SORT_FIELD_LABELS[field]}
            {sortField === field && (
              <span className="sort-arrow">
                {sortOrder === "asc" ? " ↑" : " ↓"}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function SpaceStatsDisplay({ stats }: { stats: SpaceStats }) {
  const formattedDate = stats.lastDrawDate
    ? stats.lastDrawDate === todayKey()
      ? "今天"
      : formatDate(stats.lastDrawDate)
    : "尚未抽牌";

  return (
    <div className="space-stats-grid">
      <div className="space-stat-item">
        <span className="space-stat-icon">🃏</span>
        <div className="space-stat-content">
          <span className="space-stat-value">{stats.customCardCount}</span>
          <span className="space-stat-label">自定义牌</span>
        </div>
      </div>
      <div className="space-stat-item">
        <span className="space-stat-icon">🎴</span>
        <div className="space-stat-content">
          <span className="space-stat-value">{stats.drawCount}</span>
          <span className="space-stat-label">抽牌次数</span>
        </div>
      </div>
      <div className="space-stat-item">
        <span className="space-stat-icon">📅</span>
        <div className="space-stat-content">
          <span className="space-stat-value">{formattedDate}</span>
          <span className="space-stat-label">最近抽牌</span>
        </div>
      </div>
      <div className="space-stat-item">
        <span className="space-stat-icon">✨</span>
        <div className="space-stat-content">
          <span className="space-stat-value space-stat-spread">
            {stats.mostUsedSpread ? (
              <>
                <span className="spread-icon-inline">{stats.mostUsedSpread.icon}</span>
                {stats.mostUsedSpread.name}
              </>
            ) : (
              "—"
            )}
          </span>
          <span className="space-stat-label">常用牌阵</span>
        </div>
      </div>
    </div>
  );
}

function SpaceList({
  spaces,
  statsMap,
  sortField,
  sortOrder,
  onSortFieldChange,
  onAddSpace,
  onEditSpace,
  onDeleteSpace,
}: {
  spaces: Space[];
  statsMap: Map<string, SpaceStats>;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortFieldChange: (field: SortField) => void;
  onAddSpace: () => void;
  onEditSpace: (space: Space) => void;
  onDeleteSpace: (space: Space) => void;
}) {
  return (
    <>
      <div className="deck-actions space-actions-row">
        <button className="add-card-button" onClick={onAddSpace}>
          + 新增空间
        </button>
        <SortControls
          sortField={sortField}
          sortOrder={sortOrder}
          onSortFieldChange={onSortFieldChange}
        />
      </div>

      <div className="card-list">
        <h3 className="card-section-title">所有空间</h3>
        {spaces.map((space) => {
          const stats = statsMap.get(space.id);
          return (
            <div key={space.id} className="card-item space-card-item">
              <div
                className="space-item-glyph"
                style={{ background: "var(--surface-accent)" }}
              >
                {space.icon}
              </div>
              <div className="card-item-info space-card-info">
                <h4 className="space-card-title">
                  {space.name}
                  {space.isDefault && (
                    <span className="default-badge" style={{ marginLeft: 8 }}>
                      默认
                    </span>
                  )}
                </h4>
                <p className="space-card-desc">
                  {space.isDefault
                    ? "包含全部默认牌，所有空间的自定义牌也会出现在这里"
                    : "自定义牌组空间，可以为不同场景创建不同的牌组"}
                </p>
                {stats && <SpaceStatsDisplay stats={stats} />}
              </div>
              <div className="card-item-actions">
                <button className="edit-button" onClick={() => onEditSpace(space)}>
                  {space.isDefault ? "查看" : "编辑"}
                </button>
                {!space.isDefault && (
                  <button className="delete-button" onClick={() => onDeleteSpace(space)}>
                    删除
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function DeleteConfirmDialog({
  space,
  customCards,
  reading,
  allSpreads,
  onConfirm,
  onCancel,
}: {
  space: Space;
  customCards: Card[];
  reading: Reading | null;
  allSpreads: Spread[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const impact = useMemo(
    () => getDeletionImpact(space.id, customCards, reading, allSpreads),
    [space.id, customCards, reading, allSpreads]
  );

  return (
    <div className="delete-confirm-dialog">
      <h3 className="delete-confirm-title">
        <span className="delete-warning-icon">⚠️</span>
        确认删除空间
      </h3>

      <div className="delete-confirm-space">
        <span className="delete-confirm-space-icon">{space.icon}</span>
        <span className="delete-confirm-space-name">「{space.name}」</span>
      </div>

      <div className="delete-impact-section">
        <h4 className="delete-impact-title">删除后将发生以下变更：</h4>

        <ul className="delete-impact-list">
          <li className="delete-impact-item delete-impact-cards">
            <span className="impact-icon impact-icon-cards">🃏</span>
            <div className="impact-content">
              <div className="impact-main">
                删除 <strong>{impact.customCardCount}</strong> 张自定义牌
              </div>
              {impact.customCardCount === 0 ? (
                <div className="impact-sub">此空间没有自定义牌，牌数据不受影响</div>
              ) : (
                <div className="impact-sub">
                  这些牌将从牌库中永久移除，历史记录中的牌名会保留但标记为已删除
                </div>
              )}
            </div>
          </li>

          <li className={`delete-impact-item ${impact.affectsTodayReading ? "delete-impact-reading-danger" : "delete-impact-reading-safe"}`}>
            <span className={`impact-icon ${impact.affectsTodayReading ? "impact-icon-danger" : "impact-icon-safe"}`}>
              {impact.affectsTodayReading ? "🔴" : "✅"}
            </span>
            <div className="impact-content">
              <div className="impact-main">
                {impact.affectsTodayReading
                  ? "今日抽牌状态将被清除"
                  : "今日抽牌状态不受影响"}
              </div>
              {impact.todayReadingDetails && (
                <div className="impact-reading-details">
                  <div className="reading-detail-row">
                    <span className="reading-detail-label">牌阵：</span>
                    <span className="reading-detail-value">
                      {impact.todayReadingDetails.spreadName ?? "未知牌阵"}
                    </span>
                  </div>
                  <div className="reading-detail-row">
                    <span className="reading-detail-label">进度：</span>
                    <span className="reading-detail-value">
                      已翻 {impact.todayReadingDetails.revealedCount} /{" "}
                      {impact.todayReadingDetails.totalPositions} 张
                    </span>
                  </div>
                  <div className="reading-detail-row">
                    <span className="reading-detail-label">原因：</span>
                    <span className="reading-detail-value">
                      {impact.todayReadingDetails.isSameSpace
                        ? "今日抽牌使用了此空间"
                        : "今日抽牌中包含此空间的自定义牌"}
                    </span>
                  </div>
                </div>
              )}
              {!impact.affectsTodayReading && (
                <div className="impact-sub">
                  当前抽牌没有使用此空间，牌面将保持不变
                </div>
              )}
            </div>
          </li>

          <li className="delete-impact-item delete-impact-fallback">
            <span className="impact-icon impact-icon-fallback">🏠</span>
            <div className="impact-content">
              <div className="impact-main">自动切换到默认空间</div>
              <div className="impact-sub">
                如果您正使用此空间，删除后会自动切换到「默认空间」，避免操作中断
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div className="delete-confirm-warning">
        <strong>注意：</strong>删除后无法恢复，请确认您已备份重要牌组内容。
      </div>

      <div className="delete-confirm-actions">
        <button className="cancel-button delete-cancel-btn" onClick={onCancel}>
          取消
        </button>
        <button
          className="delete-button delete-confirm-btn"
          onClick={onConfirm}
        >
          确认删除
        </button>
      </div>
    </div>
  );
}

function SpaceForm({
  spaceName,
  spaceIcon,
  isNewSpace,
  isEditingDefault,
  onNameChange,
  onIconChange,
  onSave,
  onCancel,
}: {
  spaceName: string;
  spaceIcon: string;
  isNewSpace: boolean;
  isEditingDefault: boolean;
  onNameChange: (name: string) => void;
  onIconChange: (icon: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="card-form">
      <h3>{isNewSpace ? "新增空间" : "编辑空间"}</h3>

      <div className="form-row">
        <label>空间名称</label>
        <input
          type="text"
          value={spaceName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="输入空间名称，如：工作、关系、灵感"
          maxLength={20}
          disabled={isEditingDefault}
        />
      </div>

      <div className="form-row">
        <label>空间图标</label>
        <div className="icon-picker">
          {SPACE_ICON_OPTIONS.map((icon) => (
            <button
              key={icon}
              type="button"
              className={`icon-option ${spaceIcon === icon ? "active" : ""}`}
              onClick={() => onIconChange(icon)}
              disabled={isEditingDefault}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {isEditingDefault && (
        <div className="space-form-hint">
          默认空间的名称和图标不可修改
        </div>
      )}

      <div className="form-actions">
        <button className="cancel-button" onClick={onCancel}>
          取消
        </button>
        <button
          className="save-button"
          onClick={onSave}
          disabled={isEditingDefault}
        >
          保存
        </button>
      </div>
    </div>
  );
}
