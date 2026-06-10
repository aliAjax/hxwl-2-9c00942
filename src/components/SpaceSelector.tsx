import { useState } from "react";
import type { Space } from "../types";

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

export function SpaceManager({
  spaces,
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

  const handleDeleteSpace = (space: Space) => {
    if (space.isDefault) {
      alert("默认空间不可删除");
      return;
    }
    const confirmMessage = `确定要删除「${space.name}」空间吗？该空间下的所有自定义牌将被删除，如果今日抽牌使用了此空间也会被清除。`;
    if (confirm(confirmMessage)) {
      const deleted = onDeleteSpace(space.id);
      if (deleted) {
        setEditingSpace(null);
        setIsNewSpace(false);
      }
    }
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
    if (!editingSpace && !isNewSpace) {
      onClose();
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

        {!editingSpace && !isNewSpace ? (
          <SpaceList
            spaces={spaces}
            onAddSpace={handleAddSpace}
            onEditSpace={handleEditSpace}
            onDeleteSpace={handleDeleteSpace}
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

function SpaceList({
  spaces,
  onAddSpace,
  onEditSpace,
  onDeleteSpace,
}: {
  spaces: Space[];
  onAddSpace: () => void;
  onEditSpace: (space: Space) => void;
  onDeleteSpace: (space: Space) => void;
}) {
  return (
    <>
      <div className="deck-actions">
        <button className="add-card-button" onClick={onAddSpace}>
          + 新增空间
        </button>
      </div>

      <div className="card-list">
        <h3 className="card-section-title">所有空间</h3>
        {spaces.map((space) => (
          <div key={space.id} className="card-item">
            <div
              className="space-item-glyph"
              style={{ background: "var(--surface-accent)" }}
            >
              {space.icon}
            </div>
            <div className="card-item-info">
              <h4>
                {space.name}
                {space.isDefault && (
                  <span className="default-badge" style={{ marginLeft: 8 }}>
                    默认
                  </span>
                )}
              </h4>
              <p>
                {space.isDefault
                  ? "包含全部默认牌，所有空间的自定义牌也会出现在这里"
                  : "自定义牌组空间，可以为不同场景创建不同的牌组"}
              </p>
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
        ))}
      </div>
    </>
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
