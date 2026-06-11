import { useState } from "react";
import { getAllSpreads, getSpreadById } from "../data/spreadStore";
import { SpaceSelector } from "./SpaceSelector";
import type { Space } from "../types";

type ReadingSectionProps = {
  selectedSpreadId: string;
  selectedSpaceId: string;
  spaces: Space[];
  question: string;
  hasReading: boolean;
  isReadingComplete: boolean;
  readingSpaceId?: string;
  onSpreadChange: (spreadId: string) => void;
  onSpaceChange: (spaceId: string) => void;
  onQuestionChange: (question: string) => void;
  onStartReading: () => void;
  onRestartReading: () => void;
  onManageSpaces: () => void;
};

export function ReadingSection({
  selectedSpreadId,
  selectedSpaceId,
  spaces,
  question,
  hasReading,
  isReadingComplete,
  readingSpaceId,
  onSpreadChange,
  onSpaceChange,
  onQuestionChange,
  onStartReading,
  onRestartReading,
  onManageSpaces,
}: ReadingSectionProps) {
  const spreads = getAllSpreads();
  const currentSpread = getSpreadById(selectedSpreadId);
  const positionCount = currentSpread.positions.length;
  const readingSpace = readingSpaceId
    ? spaces.find((s) => s.id === readingSpaceId)
    : undefined;
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleRestartClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmRestart = () => {
    setShowConfirmDialog(false);
    onRestartReading();
  };

  const handleCancelRestart = () => {
    setShowConfirmDialog(false);
  };

  return (
    <section className="counter">
      <div>
        <p className="eyebrow">🌙 夜市占卜摊</p>
        <h1>抽一张属于你的灵感牌</h1>
        <p>摊主已经洗牌完毕，今天的牌面只属于你。答案会保存到今日结束，明天再来时会有新的启示。</p>
        {!hasReading && (
          <>
            <SpaceSelector
              spaces={spaces}
              currentSpaceId={selectedSpaceId}
              disabled={hasReading}
              onSpaceChange={onSpaceChange}
              onManageSpaces={onManageSpaces}
            />
            <div className="spread-section">
              <label className="question-label">选择牌阵</label>
              <div className="spread-options">
                {spreads.map((spread) => (
                  <button
                    key={spread.id}
                    className={`spread-option ${
                      selectedSpreadId === spread.id ? "active" : ""
                    }`}
                    onClick={() => onSpreadChange(spread.id)}
                    disabled={hasReading}
                  >
                    <span className="spread-icon">{spread.icon}</span>
                    <div className="spread-info">
                      <div className="spread-name">{spread.name}</div>
                      <div className="spread-subtitle">{spread.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="spread-description">{currentSpread.description}</p>
            </div>
            <div className="question-section">
              <label className="question-label">今天想问什么？</label>
              <input
                type="text"
                className="question-input"
                value={question}
                onChange={(e) => onQuestionChange(e.target.value)}
                placeholder="写下你的问题（可选）"
                maxLength={100}
              />
            </div>
          </>
        )}
        {hasReading && (
          <ReadingDisplay
            spreadId={selectedSpreadId}
            question={question}
            space={readingSpace}
          />
        )}
      </div>
      <div className="counter-right">
        {!hasReading && (
          <div className="progress-hint">
            <span className="progress-hint-icon">🎯</span>
            <span>共{positionCount}张牌</span>
          </div>
        )}
        {hasReading ? (
          <div className="reading-actions">
            <button onClick={handleRestartClick} className="restart-button">
              🔄 重新开始今日抽牌
            </button>
            <button disabled className="draw-button">
              今日已抽牌
            </button>
          </div>
        ) : (
          <button onClick={onStartReading} className="draw-button">
            开始抽牌
          </button>
        )}
      </div>

      {showConfirmDialog && (
        <div className="modal-overlay" onClick={handleCancelRestart}>
          <div
            className="modal-content confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>重新抽牌</h2>
              <button className="modal-close" onClick={handleCancelRestart}>
                ×
              </button>
            </div>
            <div className="confirm-modal-body">
              <p>确定要重新开始今日抽牌吗？</p>
              {isReadingComplete ? (
                <p className="confirm-hint">
                  已完成的牌面已保存到历史记录中，重新抽牌不会删除历史记录。
                </p>
              ) : (
                <p className="confirm-hint">
                  当前未完成的牌面将被清除。
                </p>
              )}
            </div>
            <div className="confirm-modal-actions">
              <button className="cancel-button" onClick={handleCancelRestart}>
                取消
              </button>
              <button className="confirm-button danger" onClick={handleConfirmRestart}>
                确认重新抽牌
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ReadingDisplay({
  spreadId,
  question,
  space,
}: {
  spreadId: string;
  question?: string;
  space?: Space;
}) {
  const spread = getSpreadById(spreadId);
  const totalCards = spread.positions.length;

  return (
    <>
      <div className="spread-display">
        <span className="spread-display-icon">{spread.icon}</span>
        <span className="spread-display-name">{spread.name}</span>
        <span className="spread-display-count">{totalCards}张牌</span>
        {space && (
          <span className="spread-display-space">
            {space.icon} {space.name}
          </span>
        )}
      </div>
      {question && (
        <div className="question-display">
          <span className="question-display-label">今天的问题</span>
          <p className="question-display-text">{question}</p>
        </div>
      )}
    </>
  );
}
