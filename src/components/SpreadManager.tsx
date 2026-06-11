import { useState } from "react";
import type { Spread } from "../types";
import { SPREAD_ICON_OPTIONS, SPREADS } from "../data/constants";
import { validateSpread } from "../data/spreadStore";

type SpreadManagerProps = {
  customSpreads: Spread[];
  isOpen: boolean;
  onClose: () => void;
  onAddSpread: (spread: Spread) => void;
  onUpdateSpread: (spread: Spread) => void;
  onDeleteSpread: (spreadId: string) => boolean;
};

export function SpreadManager({
  customSpreads,
  isOpen,
  onClose,
  onAddSpread,
  onUpdateSpread,
  onDeleteSpread,
}: SpreadManagerProps) {
  const [editingSpread, setEditingSpread] = useState<Spread | null>(null);
  const [isNewSpread, setIsNewSpread] = useState(false);
  const [spreadName, setSpreadName] = useState("");
  const [spreadSubtitle, setSpreadSubtitle] = useState("");
  const [spreadDescription, setSpreadDescription] = useState("");
  const [spreadIcon, setSpreadIcon] = useState("✨");
  const [positions, setPositions] = useState<string[]>(["位置1", "位置2", "位置3"]);

  if (!isOpen) return null;

  const handleAddSpread = () => {
    setEditingSpread(null);
    setIsNewSpread(true);
    setSpreadName("");
    setSpreadSubtitle("");
    setSpreadDescription("");
    setSpreadIcon("✨");
    setPositions(["位置1", "位置2", "位置3"]);
  };

  const handleEditSpread = (spread: Spread) => {
    setEditingSpread(spread);
    setIsNewSpread(false);
    setSpreadName(spread.name);
    setSpreadSubtitle(spread.subtitle);
    setSpreadDescription(spread.description);
    setSpreadIcon(spread.icon);
    setPositions([...spread.positions]);
  };

  const handleDuplicateSpread = (spread: Spread) => {
    setEditingSpread(null);
    setIsNewSpread(true);
    setSpreadName(`${spread.name} 副本`);
    setSpreadSubtitle(spread.subtitle);
    setSpreadDescription(spread.description);
    setSpreadIcon(spread.icon);
    setPositions([...spread.positions]);
  };

  const handleDeleteSpread = (spread: Spread) => {
    const confirmMessage = `确定要删除「${spread.name}」牌阵吗？\n\n删除后，已有的历史记录仍会保留当时的牌阵名称和位置信息，不会丢失。`;
    if (confirm(confirmMessage)) {
      const deleted = onDeleteSpread(spread.id);
      if (deleted) {
        setEditingSpread(null);
        setIsNewSpread(false);
      }
    }
  };

  const handleAddPosition = () => {
    if (positions.length >= 10) return;
    setPositions([...positions, `位置${positions.length + 1}`]);
  };

  const handleRemovePosition = (index: number) => {
    if (positions.length <= 1) return;
    setPositions(positions.filter((_, i) => i !== index));
  };

  const handleUpdatePosition = (index: number, value: string) => {
    const next = [...positions];
    next[index] = value;
    setPositions(next);
  };

  const handleMovePosition = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= positions.length) return;
    const next = [...positions];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setPositions(next);
  };

  const handleSaveSpread = () => {
    const validation = validateSpread(spreadName, positions);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    if (spreadSubtitle.length > 30) {
      alert("副标题不能超过30个字符");
      return;
    }
    if (spreadDescription.length > 200) {
      alert("说明不能超过200个字符");
      return;
    }
    const validPositions = positions
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (isNewSpread) {
      const newSpread: Spread = {
        id: `spread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: spreadName.trim(),
        subtitle: spreadSubtitle.trim(),
        description: spreadDescription.trim(),
        positions: validPositions,
        icon: spreadIcon,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
      onAddSpread(newSpread);
    } else if (editingSpread) {
      onUpdateSpread({
        ...editingSpread,
        name: spreadName.trim(),
        subtitle: spreadSubtitle.trim(),
        description: spreadDescription.trim(),
        positions: validPositions,
        icon: spreadIcon,
      });
    }
    setEditingSpread(null);
    setIsNewSpread(false);
  };

  const handleCancelEdit = () => {
    setEditingSpread(null);
    setIsNewSpread(false);
  };

  const handleOverlayClick = () => {
    if (!editingSpread && !isNewSpread) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>牌阵管理</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {!editingSpread && !isNewSpread ? (
          <SpreadList
            customSpreads={customSpreads}
            onAddSpread={handleAddSpread}
            onEditSpread={handleEditSpread}
            onDuplicateSpread={handleDuplicateSpread}
            onDeleteSpread={handleDeleteSpread}
          />
        ) : (
          <SpreadForm
            spreadName={spreadName}
            spreadSubtitle={spreadSubtitle}
            spreadDescription={spreadDescription}
            spreadIcon={spreadIcon}
            positions={positions}
            isNewSpread={isNewSpread}
            isPreset={editingSpread ? !editingSpread.isCustom : false}
            onNameChange={setSpreadName}
            onSubtitleChange={setSpreadSubtitle}
            onDescriptionChange={setSpreadDescription}
            onIconChange={setSpreadIcon}
            onPositionsChange={setPositions}
            onAddPosition={handleAddPosition}
            onRemovePosition={handleRemovePosition}
            onUpdatePosition={handleUpdatePosition}
            onMovePosition={handleMovePosition}
            onSave={handleSaveSpread}
            onCancel={handleCancelEdit}
          />
        )}
      </div>
    </div>
  );
}

function SpreadList({
  customSpreads,
  onAddSpread,
  onEditSpread,
  onDuplicateSpread,
  onDeleteSpread,
}: {
  customSpreads: Spread[];
  onAddSpread: () => void;
  onEditSpread: (spread: Spread) => void;
  onDuplicateSpread: (spread: Spread) => void;
  onDeleteSpread: (spread: Spread) => void;
}) {
  return (
    <>
      <div className="deck-actions">
        <button className="add-card-button" onClick={onAddSpread}>
          + 新增自定义牌阵
        </button>
      </div>

      <div className="card-list">
        <h3 className="card-section-title">预设牌阵（不可编辑）</h3>
        {SPREADS.map((spread) => (
          <div key={spread.id} className="card-item">
            <div
              className="space-item-glyph"
              style={{ background: "var(--surface-accent)" }}
            >
              {spread.icon}
            </div>
            <div className="card-item-info">
              <h4>
                {spread.name}
                <span className="default-badge" style={{ marginLeft: 8 }}>
                  预设
                </span>
              </h4>
              <p>
                {spread.subtitle || "无副标题"}
                <br />
                <span style={{ color: "var(--text-muted)" }}>
                  {spread.positions.length}个位置 · {spread.description || "无说明"}
                </span>
              </p>
            </div>
            <div className="card-item-actions">
              <button className="edit-button" onClick={() => onDuplicateSpread(spread)}>
                复制
              </button>
            </div>
          </div>
        ))}

        <h3 className="card-section-title">自定义牌阵</h3>
        {customSpreads.length === 0 ? (
          <div className="empty-custom">还没有自定义牌阵，点击上方按钮创建你的第一个牌阵</div>
        ) : (
          customSpreads.map((spread) => (
            <div key={spread.id} className="card-item">
              <div
                className="space-item-glyph"
                style={{ background: "var(--surface-accent)" }}
              >
                {spread.icon}
              </div>
              <div className="card-item-info">
                <h4>{spread.name}</h4>
                <p>
                  {spread.subtitle || "无副标题"}
                  <br />
                  <span style={{ color: "var(--text-muted)" }}>
                    {spread.positions.length}个位置 · {spread.description || "无说明"}
                  </span>
                </p>
              </div>
              <div className="card-item-actions">
                <button className="edit-button" onClick={() => onEditSpread(spread)}>
                  编辑
                </button>
                <button className="delete-button" onClick={() => onDeleteSpread(spread)}>
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function SpreadForm({
  spreadName,
  spreadSubtitle,
  spreadDescription,
  spreadIcon,
  positions,
  isNewSpread,
  isPreset,
  onNameChange,
  onSubtitleChange,
  onDescriptionChange,
  onIconChange,
  onPositionsChange,
  onAddPosition,
  onRemovePosition,
  onUpdatePosition,
  onMovePosition,
  onSave,
  onCancel,
}: {
  spreadName: string;
  spreadSubtitle: string;
  spreadDescription: string;
  spreadIcon: string;
  positions: string[];
  isNewSpread: boolean;
  isPreset: boolean;
  onNameChange: (v: string) => void;
  onSubtitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onIconChange: (v: string) => void;
  onPositionsChange: (v: string[]) => void;
  onAddPosition: () => void;
  onRemovePosition: (index: number) => void;
  onUpdatePosition: (index: number, value: string) => void;
  onMovePosition: (index: number, direction: -1 | 1) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="card-form">
      <h3>{isNewSpread ? "新增自定义牌阵" : "编辑自定义牌阵"}</h3>

      <div className="form-row">
        <label>牌阵名称 *</label>
        <input
          type="text"
          value={spreadName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="输入牌阵名称，如：日运三张牌"
          maxLength={30}
          disabled={isPreset}
        />
      </div>

      <div className="form-row">
        <label>副标题</label>
        <input
          type="text"
          value={spreadSubtitle}
          onChange={(e) => onSubtitleChange(e.target.value)}
          placeholder="简短副标题，如：过去·现在·未来"
          maxLength={30}
          disabled={isPreset}
        />
      </div>

      <div className="form-row">
        <label>说明</label>
        <textarea
          value={spreadDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="牌阵的详细说明"
          maxLength={200}
          rows={3}
          disabled={isPreset}
        />
      </div>

      <div className="form-row">
        <label>牌阵图标</label>
        <div className="icon-picker">
          {SPREAD_ICON_OPTIONS.map((icon) => (
            <button
              key={icon}
              type="button"
              className={`icon-option ${spreadIcon === icon ? "active" : ""}`}
              onClick={() => onIconChange(icon)}
              disabled={isPreset}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="form-row">
        <label>位置列表 *（1-10个，每个位置不超过20字）</label>
        <div className="position-list">
          {positions.map((position, index) => (
            <div key={index} className="position-item">
              <span className="position-index">{index + 1}</span>
              <input
                type="text"
                className="position-input"
                value={position}
                onChange={(e) => onUpdatePosition(index, e.target.value)}
                placeholder={`第${index + 1}个位置的含义`}
                maxLength={20}
                disabled={isPreset}
              />
              <div className="position-actions">
                <button
                  type="button"
                  className="position-move-btn"
                  onClick={() => onMovePosition(index, -1)}
                  disabled={index === 0 || isPreset}
                  title="上移"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="position-move-btn"
                  onClick={() => onMovePosition(index, 1)}
                  disabled={index === positions.length - 1 || isPreset}
                  title="下移"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="position-remove-btn"
                  onClick={() => onRemovePosition(index)}
                  disabled={positions.length <= 1 || isPreset}
                  title="删除此位置"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
        {!isPreset && positions.length < 10 && (
          <button
            type="button"
            className="add-position-button"
            onClick={onAddPosition}
          >
            + 添加位置
          </button>
        )}
      </div>

      {isPreset && (
        <div className="space-form-hint">
          预设牌阵不可修改，如需修改请先复制为自定义牌阵
        </div>
      )}

      <div className="form-actions">
        <button className="cancel-button" onClick={onCancel}>
          取消
        </button>
        <button
          className="save-button"
          onClick={onSave}
          disabled={isPreset}
        >
          保存
        </button>
      </div>
    </div>
  );
}
