import { useState } from "react";
import { CardGlyph } from "./CardGlyph";
import type { Card } from "../types";
import { DEFAULT_CARDS } from "../data/constants";
import { createEmptyCustomCard, validateCard, checkStorageCapacity } from "../data/cardStore";
import { compressImage, isImageFile } from "../data/imageUtils";

type DeckManagerProps = {
  customCards: Card[];
  readingCardIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: Card) => void;
  onUpdateCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
};

export function DeckManager({
  customCards,
  readingCardIds,
  isOpen,
  onClose,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
}: DeckManagerProps) {
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isNewCard, setIsNewCard] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  if (!isOpen) return null;

  const handleAddCard = () => {
    setEditingCard(createEmptyCustomCard());
    setIsNewCard(true);
  };

  const handleEditCard = (card: Card) => {
    setEditingCard({ ...card });
    setIsNewCard(false);
  };

  const handleDeleteCard = (cardId: string) => {
    const isInTodayReading = readingCardIds.includes(cardId);
    let confirmMessage = "确定要删除这张牌吗？";
    if (isInTodayReading) {
      confirmMessage = "这张牌在今日抽牌结果中，删除后今日牌面将重置，确定要删除吗？";
    }
    if (confirm(confirmMessage)) {
      onDeleteCard(cardId);
      if (isInTodayReading) {
        onClose();
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingCard) return;

    if (!isImageFile(file)) {
      alert("请选择图片文件");
      return;
    }

    setIsUploadingImage(true);
    try {
      const compressed = await compressImage(file);
      setEditingCard({ ...editingCard, illustration: compressed });
    } catch {
      alert("图片处理失败，请尝试其他图片");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = () => {
    if (!editingCard) return;
    setEditingCard({ ...editingCard, illustration: undefined });
  };

  const handleSaveCard = () => {
    if (!editingCard) return;

    const validation = validateCard(editingCard);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const testCards = isNewCard
      ? [...customCards, editingCard]
      : customCards.map((c) => (c.id === editingCard.id ? editingCard : c));
    const testData = JSON.stringify(testCards);

    if (!checkStorageCapacity(testData)) {
      alert("存储空间不足，可能是图片太大了。请尝试移除图片或使用更小的图片。");
      return;
    }

    if (isNewCard) {
      onAddCard(editingCard);
    } else {
      onUpdateCard(editingCard);
    }
    setEditingCard(null);
    setIsNewCard(false);
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setIsNewCard(false);
  };

  const handleOverlayClick = () => {
    if (!editingCard) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>牌库管理</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {!editingCard ? (
          <CardList
            customCards={customCards}
            onAddCard={handleAddCard}
            onEditCard={handleEditCard}
            onDeleteCard={handleDeleteCard}
          />
        ) : (
          <CardForm
            card={editingCard}
            isNewCard={isNewCard}
            isUploadingImage={isUploadingImage}
            onCardChange={setEditingCard}
            onImageUpload={handleImageUpload}
            onRemoveImage={handleRemoveImage}
            onSave={handleSaveCard}
            onCancel={handleCancelEdit}
          />
        )}
      </div>
    </div>
  );
}

function CardList({
  customCards,
  onAddCard,
  onEditCard,
  onDeleteCard,
}: {
  customCards: Card[];
  onAddCard: () => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
}) {
  return (
    <>
      <div className="deck-actions">
        <button className="add-card-button" onClick={onAddCard}>
          + 新增自定义牌
        </button>
      </div>

      <div className="card-list">
        <h3 className="card-section-title">默认牌组</h3>
        {DEFAULT_CARDS.map((card) => (
          <div key={card.id} className="card-item">
            <CardGlyph card={card} className="card-item-glyph" size="small" />
            <div className="card-item-info">
              <h4>{card.name}</h4>
              <span className="card-item-keyword" style={{ background: card.hue }}>
                {card.keyword}
              </span>
              <p>{card.meaning}</p>
            </div>
            <div className="card-item-actions">
              <span className="default-badge">默认</span>
            </div>
          </div>
        ))}

        <h3 className="card-section-title">自定义牌组</h3>
        {customCards.length === 0 ? (
          <p className="empty-custom">还没有自定义牌，点击上方按钮添加</p>
        ) : (
          customCards.map((card) => (
            <div key={card.id} className="card-item">
              <CardGlyph card={card} className="card-item-glyph" size="small" />
              <div className="card-item-info">
                <h4>{card.name}</h4>
                <span className="card-item-keyword" style={{ background: card.hue }}>
                  {card.keyword}
                </span>
                <p>{card.meaning}</p>
              </div>
              <div className="card-item-actions">
                <button className="edit-button" onClick={() => onEditCard(card)}>
                  编辑
                </button>
                <button className="delete-button" onClick={() => onDeleteCard(card.id)}>
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

function CardForm({
  card,
  isNewCard,
  isUploadingImage,
  onCardChange,
  onImageUpload,
  onRemoveImage,
  onSave,
  onCancel,
}: {
  card: Card;
  isNewCard: boolean;
  isUploadingImage: boolean;
  onCardChange: (card: Card) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="card-form">
      <h3>{isNewCard ? "新增自定义牌" : "编辑自定义牌"}</h3>

      <div className="form-row">
        <label>牌名</label>
        <input
          type="text"
          value={card.name}
          onChange={(e) => onCardChange({ ...card, name: e.target.value })}
          placeholder="输入牌的名称"
          maxLength={20}
        />
      </div>

      <div className="form-row">
        <label>关键词</label>
        <input
          type="text"
          value={card.keyword}
          onChange={(e) => onCardChange({ ...card, keyword: e.target.value })}
          placeholder="输入关键词"
          maxLength={20}
        />
      </div>

      <div className="form-row">
        <label>解释</label>
        <textarea
          value={card.meaning}
          onChange={(e) => onCardChange({ ...card, meaning: e.target.value })}
          placeholder="输入牌的解释"
          rows={3}
          maxLength={200}
        />
      </div>

      <div className="form-row form-row-inline">
        <div className="form-item">
          <label>颜色</label>
          <input
            type="color"
            value={card.hue}
            onChange={(e) => onCardChange({ ...card, hue: e.target.value })}
          />
        </div>
        <div className="form-item">
          <label>字形</label>
          <input
            type="text"
            value={card.glyph}
            onChange={(e) => onCardChange({ ...card, glyph: e.target.value.slice(0, 1) })}
            placeholder="一个字"
            maxLength={1}
            className="glyph-input"
          />
        </div>
      </div>

      <div className="form-row">
        <label>牌面插画</label>
        <div className="illustration-upload">
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="illustration-input"
            id="illustration-upload"
            disabled={isUploadingImage}
          />
          <label htmlFor="illustration-upload" className="illustration-upload-button">
            {isUploadingImage ? "处理中..." : "📷 上传插画图片"}
          </label>
          {card.illustration && (
            <button
              type="button"
              className="remove-illustration-button"
              onClick={onRemoveImage}
            >
              移除图片
            </button>
          )}
        </div>
        <p className="illustration-hint">
          建议上传正方形图片，图片会自动压缩以节省存储空间。
        </p>
      </div>

      <div className="card-preview">
        <div className="preview-label">预览</div>
        <div className="card-preview-box" style={{ borderColor: card.hue }}>
          <CardGlyph card={card} />
          <h4>{card.name || "牌名"}</h4>
          <strong style={{ color: card.hue }}>{card.keyword || "关键词"}</strong>
          <p>{card.meaning || "牌的解释"}</p>
        </div>
      </div>

      <div className="form-actions">
        <button className="cancel-button" onClick={onCancel}>
          取消
        </button>
        <button className="save-button" onClick={onSave}>
          保存
        </button>
      </div>
    </div>
  );
}
