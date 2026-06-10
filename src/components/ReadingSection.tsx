import { getAllSpreads, getSpreadById } from "../data/spreadStore";

type ReadingSectionProps = {
  selectedSpreadId: string;
  question: string;
  hasReading: boolean;
  onSpreadChange: (spreadId: string) => void;
  onQuestionChange: (question: string) => void;
  onStartReading: () => void;
};

export function ReadingSection({
  selectedSpreadId,
  question,
  hasReading,
  onSpreadChange,
  onQuestionChange,
  onStartReading,
}: ReadingSectionProps) {
  const spreads = getAllSpreads();
  const currentSpread = getSpreadById(selectedSpreadId);
  const positionCount = currentSpread.positions.length;

  return (
    <section className="counter">
      <div>
        <p className="eyebrow">夜市占卜摊</p>
        <h1>抽一张属于你的牌</h1>
        <p>牌面会保存到今天结束，明天再来时摊主会洗出新的结果。</p>
        {!hasReading && (
          <>
            <div className="spread-section">
              <label className="question-label">选择牌阵</label>
              <div className="spread-options">
                {spreads.map((spread) => (
                  <button
                    key={spread.id}
                    className={`spread-option ${selectedSpreadId === spread.id ? "active" : ""}`}
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
          <ReadingDisplay spreadId={selectedSpreadId} question={question} />
        )}
      </div>
      <div className="counter-right">
        {!hasReading && (
          <div className="progress-hint">
            <span className="progress-hint-icon">🎯</span>
            <span>共{positionCount}张牌</span>
          </div>
        )}
        <button
          onClick={onStartReading}
          disabled={hasReading}
          className="draw-button"
        >
          {hasReading ? "今日已抽牌" : "开始抽牌"}
        </button>
      </div>
    </section>
  );
}

function ReadingDisplay({ spreadId, question }: { spreadId: string; question?: string }) {
  const spread = getSpreadById(spreadId);
  const totalCards = spread.positions.length;

  return (
    <>
      <div className="spread-display">
        <span className="spread-display-icon">{spread.icon}</span>
        <span className="spread-display-name">{spread.name}</span>
        <span className="spread-display-count">{totalCards}张牌</span>
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
