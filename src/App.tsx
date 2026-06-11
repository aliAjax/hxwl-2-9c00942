import { useState, useEffect, useCallback, useMemo } from "react";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { ReadingSection } from "./components/ReadingSection";
import { CardReveal } from "./components/CardReveal";
import { DeckSection } from "./components/DeckSection";
import { DeckManager } from "./components/DeckManager";
import { HistoryPanel } from "./components/HistoryPanel";
import { ShareModal } from "./components/ShareModal";
import { generateShareImage } from "./components/ShareModal";
import type { ShareConfig } from "./types";
import { SpaceManager } from "./components/SpaceSelector";
import { SpreadManager } from "./components/SpreadManager";
import { loadTheme, saveTheme, applyTheme } from "./data/themeStore";
import { todayKey } from "./data/dateUtils";
import { loadReading } from "./data/readingStore";
import type { ThemeId } from "./types";
import { useHistory } from "./hooks/useHistory";
import { useDeck } from "./hooks/useDeck";
import { useSpaces } from "./hooks/useSpaces";
import { useSpreads } from "./hooks/useSpreads";
import { useDivination } from "./hooks/useDivination";

export default function App() {
  const [theme, setTheme] = useState<ThemeId>(loadTheme);
  const [showDeckManager, setShowDeckManager] = useState(false);
  const [showSpaceManager, setShowSpaceManager] = useState(false);
  const [showSpreadManager, setShowSpreadManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);

  const initialReading = useMemo(() => loadReading(), []);
  const initialSpreadId = initialReading?.spreadId;

  const historyState = useHistory();
  const deckState = useDeck();
  const spacesState = useSpaces();
  const spreadsState = useSpreads(initialSpreadId);

  const divinationState = useDivination({
    customCards: deckState.customCards,
    getAllCardsForSpace: deckState.getAllCardsForSpace,
    getCardsForReading: deckState.getCardsForReading,
    getSpread: spreadsState.getSpread,
    getSpreadPositions: spreadsState.getSpreadPositions,
    getSpreadPositionCount: spreadsState.getSpreadPositionCount,
    getSpreadSnapshot: spreadsState.getSpreadSnapshot,
    getSpace: spacesState.getSpace,
    addCompletedReading: historyState.addCompletedReading,
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleThemeChange = useCallback((themeId: ThemeId) => {
    setTheme(themeId);
    applyTheme(themeId);
    saveTheme(themeId);
  }, []);

  const currentSpread = divinationState.reading
    ? spreadsState.getSpread(divinationState.reading.spreadId)
    : spreadsState.currentSpread;
  const currentPositions = divinationState.currentPositions;
  const totalCards = divinationState.totalCards;
  const currentSpace = spacesState.currentSpace;
  const readingSpace = divinationState.readingSpace;

  const allCardsForCurrentSpace = deckState.getAllCardsForSpace(spacesState.currentSpaceId);
  const selectedCards = divinationState.selectedCards;

  function handleStartReading() {
    divinationState.startReading(
      spreadsState.selectedSpreadId,
      spacesState.currentSpaceId
    );
  }

  function handleRevealCard(index: number) {
    divinationState.revealCard(index);
  }

  function handleClearReading() {
    divinationState.clearReading();
  }

  function handleRestartReading() {
    divinationState.restartReading();
  }

  function handleAddCard(card: Parameters<typeof deckState.addCard>[0]) {
    deckState.addCard(card);
  }

  function handleUpdateCard(card: Parameters<typeof deckState.updateCard>[0]) {
    deckState.updateCard(card);
  }

  function handleDeleteCard(cardId: string) {
    const wasInReading = deckState.deleteCard(cardId, divinationState.readingCardIds);
    divinationState.handleCardDeletion(wasInReading);
  }

  function handleDuplicateCard(
    card: Parameters<typeof deckState.duplicateCard>[0],
    targetSpaceId: Parameters<typeof deckState.duplicateCard>[1]
  ) {
    deckState.duplicateCard(card, targetSpaceId);
  }

  function handleBatchDeleteCards(cardIds: string[], willResetReading: boolean) {
    deckState.batchDelete(cardIds);
    if (willResetReading) {
      divinationState.handleBatchCardReset();
    }
  }

  function handleBatchMoveCards(
    cardIds: string[],
    targetSpaceId: Parameters<typeof deckState.batchMove>[1]
  ) {
    deckState.batchMove(cardIds, targetSpaceId);
  }

  function handleBatchCopyCards(
    cardIds: string[],
    targetSpaceId: Parameters<typeof deckState.batchCopy>[1]
  ) {
    const ok = deckState.batchCopy(cardIds, targetSpaceId);
    if (!ok) {
      alert("存储空间不足，批量复制后可能超出限制。请删除部分牌或移除图片后重试。");
    }
  }

  function handleClearHistory() {
    historyState.clearAllHistory();
  }

  function handleAddSpace(name: string, icon: string) {
    spacesState.addSpaceItem(name, icon);
  }

  function handleUpdateSpace(space: Parameters<typeof spacesState.updateSpaceItem>[0]) {
    spacesState.updateSpaceItem(space);
  }

  function handleDeleteSpace(spaceId: string): boolean {
    const { success, affectsReading } = spacesState.deleteSpaceItem(spaceId);
    if (!success) return false;

    const hasCardsInReading = deckState.hasAnyCardFromSpaceInReading(
      spaceId,
      divinationState.readingCardIds
    );

    deckState.deleteCardsBySpaceId(spaceId);

    const readingCleared = divinationState.handleSpaceDeletion(spaceId, deckState.customCards);

    if (hasCardsInReading || readingCleared) {
      setShowSpaceManager(false);
    }

    return true;
  }

  function handleSpaceChange(spaceId: string) {
    spacesState.changeCurrentSpace(spaceId);
  }

  function handleAddSpread(spread: Parameters<typeof spreadsState.addSpreadItem>[0]) {
    spreadsState.addSpreadItem(spread);
  }

  function handleUpdateSpread(spread: Parameters<typeof spreadsState.updateSpreadItem>[0]) {
    spreadsState.updateSpreadItem(spread);
  }

  function handleDeleteSpread(spreadId: string): boolean {
    const activeReadingSpreadId = divinationState.reading?.spreadId;
    const { success, resetReading } = spreadsState.deleteSpreadItem(
      spreadId,
      activeReadingSpreadId
    );
    if (resetReading) {
      divinationState.handleSpreadDeletionReset();
    }
    return success;
  }

  async function handleGenerateShare(config: ShareConfig): Promise<string> {
    setIsGeneratingShare(true);
    try {
      return generateShareImage(
        selectedCards,
        currentPositions,
        currentSpread.name,
        currentSpread.icon,
        divinationState.reading?.question,
        divinationState.reading?.date ?? todayKey(),
        config,
        readingSpace?.name ?? currentSpace?.name,
        readingSpace?.icon ?? currentSpace?.icon
      );
    } finally {
      setIsGeneratingShare(false);
    }
  }

  function handleShareClick() {
    if (!divinationState.reading || !divinationState.isComplete) return;
    setShowShareModal(true);
  }

  function dismissArchiveNotice() {
    historyState.dismissArchiveNotice();
  }

  const readingCardIds = divinationState.readingCardIds;

  return (
    <main className="booth">
      <ThemeSwitcher currentTheme={theme} onThemeChange={handleThemeChange} />

      {historyState.archiveNotice && (
        <div className="archive-notice" onClick={dismissArchiveNotice}>
          <span className="archive-notice-icon">📋</span>
          <span>{historyState.archiveNotice.message}</span>
          <span className="archive-notice-close">×</span>
        </div>
      )}

      <ReadingSection
        selectedSpreadId={spreadsState.selectedSpreadId}
        selectedSpaceId={spacesState.currentSpaceId}
        spaces={spacesState.spaces}
        customSpreads={spreadsState.customSpreads}
        question={divinationState.question}
        hasReading={!!divinationState.reading}
        isReadingComplete={divinationState.isComplete}
        readingSpaceId={divinationState.reading?.spaceId}
        onSpreadChange={spreadsState.setSelectedSpreadId}
        onSpaceChange={handleSpaceChange}
        onQuestionChange={divinationState.setQuestion}
        onStartReading={handleStartReading}
        onRestartReading={handleRestartReading}
        onManageSpaces={() => setShowSpaceManager(true)}
        onManageSpreads={() => setShowSpreadManager(true)}
      />

      {divinationState.reading && (
        <CardReveal
          cards={selectedCards}
          positions={currentPositions}
          revealed={divinationState.reading.revealed}
          totalCards={totalCards}
          onReveal={handleRevealCard}
          readingDate={divinationState.reading.date}
        />
      )}

      {divinationState.reading &&
        divinationState.isComplete &&
        selectedCards.length === totalCards && (
          <section className="share-section">
            <button
              className="share-button"
              onClick={handleShareClick}
              disabled={isGeneratingShare}
            >
              {isGeneratingShare ? "生成中..." : "✨ 生成分享图"}
            </button>
          </section>
        )}

      <DeckSection
        allCards={allCardsForCurrentSpace}
        currentSpace={currentSpace}
        onManageClick={() => setShowDeckManager(true)}
      />

      <HistoryPanel
        history={historyState.history}
        spaces={spacesState.spaces}
        customSpreads={spreadsState.customSpreads}
        isOpen={showHistory}
        onToggle={() => setShowHistory(!showHistory)}
        onClearHistory={handleClearHistory}
      />

      <DeckManager
        customCards={deckState.customCards}
        spaces={spacesState.spaces}
        readingCardIds={readingCardIds}
        isOpen={showDeckManager}
        onClose={() => setShowDeckManager(false)}
        onAddCard={handleAddCard}
        onUpdateCard={handleUpdateCard}
        onDeleteCard={handleDeleteCard}
        onDuplicateCard={handleDuplicateCard}
        onBatchDelete={handleBatchDeleteCards}
        onBatchMove={handleBatchMoveCards}
        onBatchCopy={handleBatchCopyCards}
      />

      <SpaceManager
        spaces={spacesState.spaces}
        customCards={deckState.customCards}
        history={historyState.history}
        reading={divinationState.reading}
        customSpreads={spreadsState.customSpreads}
        isOpen={showSpaceManager}
        onClose={() => setShowSpaceManager(false)}
        onAddSpace={handleAddSpace}
        onUpdateSpace={handleUpdateSpace}
        onDeleteSpace={handleDeleteSpace}
      />

      <SpreadManager
        customSpreads={spreadsState.customSpreads}
        isOpen={showSpreadManager}
        onClose={() => setShowSpreadManager(false)}
        onAddSpread={handleAddSpread}
        onUpdateSpread={handleUpdateSpread}
        onDeleteSpread={handleDeleteSpread}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        cards={selectedCards}
        positions={currentPositions}
        spreadName={currentSpread.name}
        spreadIcon={currentSpread.icon}
        question={divinationState.reading?.question}
        dateStr={divinationState.reading?.date}
        spaceName={readingSpace?.name ?? currentSpace?.name}
        spaceIcon={readingSpace?.icon ?? currentSpace?.icon}
        isGenerating={isGeneratingShare}
        onGenerate={handleGenerateShare}
      />
    </main>
  );
}
