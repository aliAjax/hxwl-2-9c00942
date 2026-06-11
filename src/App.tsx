import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { ReadingSection } from "./components/ReadingSection";
import { CardReveal } from "./components/CardReveal";
import { DeckSection } from "./components/DeckSection";
import { DeckManager } from "./components/DeckManager";
import { HistoryPanel } from "./components/HistoryPanel";
import { ShareModal } from "./components/ShareModal";
import { generateShareImage } from "./components/ShareModal";
import { SpaceManager } from "./components/SpaceSelector";
import { SpreadManager } from "./components/SpreadManager";
import { loadTheme, saveTheme, applyTheme } from "./data/themeStore";
import {
  loadCustomCards,
  saveCustomCards,
  getAllCards,
  getCardById,
  addCustomCard,
  updateCustomCard,
  deleteCustomCard,
  isCardInReading,
  getCardsForSpace,
  deleteCustomCardsBySpaceId,
  hasAnyCardInReading,
  duplicateCustomCard,
  batchDeleteCards,
  batchMoveCards,
  batchDuplicateCards,
  checkStorageCapacity,
} from "./data/cardStore";
import {
  loadReading,
  saveReading,
  clearReading,
  createReading,
  revealNextCard,
  isReadingComplete,
  clearReadingIfFromSpace,
} from "./data/readingStore";
import {
  loadHistory,
  saveHistory,
  clearHistory,
  addReadingToHistory,
} from "./data/historyStore";
import {
  getSpreadById,
  getPositions,
  getPositionCount,
  getAllSpreads,
  loadCustomSpreads,
  saveCustomSpreads,
  addCustomSpread,
  updateCustomSpread,
  deleteCustomSpread,
  isPresetSpread,
  getSnapshot,
} from "./data/spreadStore";
import {
  loadSpaces,
  saveSpaces,
  loadCurrentSpaceId,
  saveCurrentSpaceId,
  createSpace,
  addSpace,
  updateSpace,
  deleteSpace,
  getSpaceById,
} from "./data/spaceStore";
import { checkAndArchive } from "./data/archiveService";
import { todayKey } from "./data/dateUtils";
import { DEFAULT_SPREAD_ID, DEFAULT_SPACE_ID, DELETED_CARD_PLACEHOLDER } from "./data/constants";
import type { ThemeId, Reading, Card, HistoryRecord, ArchiveResult, Space, Spread } from "./types";

export default function App() {
  const [theme, setTheme] = useState<ThemeId>(loadTheme);
  const [reading, setReading] = useState<Reading | null>(loadReading);
  const [customCards, setCustomCards] = useState<Card[]>(loadCustomCards);
  const [history, setHistory] = useState<HistoryRecord[]>(loadHistory);
  const [spaces, setSpaces] = useState<Space[]>(loadSpaces);
  const [currentSpaceId, setCurrentSpaceId] = useState<string>(loadCurrentSpaceId);
  const [customSpreads, setCustomSpreads] = useState<Spread[]>(loadCustomSpreads);

  const [showDeckManager, setShowDeckManager] = useState(false);
  const [showSpaceManager, setShowSpaceManager] = useState(false);
  const [showSpreadManager, setShowSpreadManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [question, setQuestion] = useState(reading?.question ?? "");
  const [selectedSpreadId, setSelectedSpreadId] = useState<string>(
    reading?.spreadId ?? DEFAULT_SPREAD_ID
  );
  const [archiveNotice, setArchiveNotice] = useState<ArchiveResult | null>(null);
  const archivedReadingRef = useRef<string | null>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const result = checkAndArchive();
    if (result.archived.length > 0 || result.discarded > 0) {
      setArchiveNotice(result);
      setHistory(loadHistory());
      setReading(loadReading());
    }
  }, []);

  useEffect(() => {
    saveSpaces(spaces);
  }, [spaces]);

  useEffect(() => {
    saveCurrentSpaceId(currentSpaceId);
  }, [currentSpaceId]);

  useEffect(() => {
    saveCustomSpreads(customSpreads);
  }, [customSpreads]);

  useEffect(() => {
    const allSpreadIds = getAllSpreads(customSpreads).map((s) => s.id);
    if (!allSpreadIds.includes(selectedSpreadId)) {
      setSelectedSpreadId(DEFAULT_SPREAD_ID);
    }
  }, [customSpreads, selectedSpreadId]);

  const handleThemeChange = useCallback((themeId: ThemeId) => {
    setTheme(themeId);
    applyTheme(themeId);
    saveTheme(themeId);
  }, []);

  const currentSpread = getSpreadById(
    reading?.spreadId ?? selectedSpreadId,
    customSpreads
  );
  const currentPositions = currentSpread.positions;
  const totalCards = currentPositions.length;
  const currentSpace = getSpaceById(spaces, currentSpaceId) ?? spaces[0];
  const readingSpace = reading?.spaceId
    ? getSpaceById(spaces, reading.spaceId)
    : undefined;

  const allCardsForCurrentSpace = useMemo(
    () => getCardsForSpace(customCards, currentSpaceId),
    [customCards, currentSpaceId]
  );

  const allCards = useMemo(() => getAllCards(customCards), [customCards]);
  const selectedCards = useMemo(() => {
    if (!reading) return [];
    const cardsToUse = reading.spaceId
      ? getCardsForSpace(customCards, reading.spaceId)
      : allCards;
    return reading.cardIds
      .map((id) => {
        const card = getCardById(id, cardsToUse);
        return card ?? (DELETED_CARD_PLACEHOLDER as Card);
      })
      .filter((card): card is Card => card !== undefined);
  }, [reading, customCards, allCards]);

  useEffect(() => {
    saveCustomCards(customCards);
  }, [customCards]);

  useEffect(() => {
    if (reading) {
      saveReading(reading);
    }
  }, [reading]);

  useEffect(() => {
    if (
      reading &&
      isReadingComplete(reading, totalCards) &&
      selectedCards.length === totalCards &&
      archivedReadingRef.current !== reading.date
    ) {
      archivedReadingRef.current = reading.date;
      const positions = getPositions(reading.spreadId, customSpreads);
      const spreadForHistory = getSpreadById(reading.spreadId, customSpreads);
      const spaceForHistory = reading.spaceId
        ? getSpaceById(spaces, reading.spaceId)
        : undefined;
      const cardsToUse = reading.spaceId
        ? getCardsForSpace(customCards, reading.spaceId)
        : allCards;
      setHistory((prevHistory) => {
        const updatedHistory = addReadingToHistory(
          prevHistory,
          reading,
          cardsToUse,
          positions,
          spreadForHistory,
          spaceForHistory
        );
        saveHistory(updatedHistory);
        return updatedHistory;
      });
    }
  }, [reading, selectedCards, totalCards, customCards, allCards, spaces, customSpreads]);

  function handleStartReading() {
    archivedReadingRef.current = null;
    const positionsCount = getPositionCount(selectedSpreadId, customSpreads);
    const cardsForSpace = getCardsForSpace(customCards, currentSpaceId);
    const selectedSpread = getSpreadById(selectedSpreadId, customSpreads);
    const spreadSnapshot = getSnapshot(selectedSpread);
    const next = createReading(
      cardsForSpace,
      positionsCount,
      selectedSpreadId,
      currentSpaceId,
      question,
      spreadSnapshot
    );
    setReading(next);
    setQuestion(next.question ?? "");
    saveReading(next);
  }

  function handleRevealCard(index: number) {
    if (!reading) return;
    const updated = revealNextCard(reading, index);
    setReading(updated);
  }

  function handleClearReading() {
    archivedReadingRef.current = null;
    setReading(null);
    clearReading();
  }

  function handleRestartReading() {
    archivedReadingRef.current = null;
    setReading(null);
    clearReading();
  }

  function handleAddCard(card: Card) {
    setCustomCards((prev) => addCustomCard(prev, card));
  }

  function handleUpdateCard(card: Card) {
    setCustomCards((prev) => updateCustomCard(prev, card));
  }

  function handleDeleteCard(cardId: string) {
    const isInTodayReading = reading ? isCardInReading(cardId, reading.cardIds) : false;
    setCustomCards((prev) => deleteCustomCard(prev, cardId));
    if (isInTodayReading) {
      handleClearReading();
    }
  }

  function handleDuplicateCard(card: Card, targetSpaceId: string) {
    const newCard = duplicateCustomCard(card, targetSpaceId);
    setCustomCards((prev) => addCustomCard(prev, newCard));
  }

  function handleBatchDeleteCards(cardIds: string[], willResetReading: boolean) {
    setCustomCards((prev) => batchDeleteCards(prev, cardIds));
    if (willResetReading) {
      handleClearReading();
    }
  }

  function handleBatchMoveCards(cardIds: string[], targetSpaceId: string) {
    setCustomCards((prev) => batchMoveCards(prev, cardIds, targetSpaceId));
  }

  function handleBatchCopyCards(cardIds: string[], targetSpaceId: string) {
    const updated = batchDuplicateCards(customCards, cardIds, targetSpaceId);
    const testData = JSON.stringify(updated);
    if (!checkStorageCapacity(testData)) {
      alert("存储空间不足，批量复制后可能超出限制。请删除部分牌或移除图片后重试。");
      return;
    }
    setCustomCards(updated);
  }

  function handleClearHistory() {
    clearHistory();
    setHistory([]);
  }

  function handleAddSpace(name: string, icon: string) {
    const space = createSpace(name, icon);
    setSpaces((prev) => addSpace(prev, space));
    setCurrentSpaceId(space.id);
  }

  function handleUpdateSpace(space: Space) {
    setSpaces((prev) => updateSpace(prev, space));
  }

  function handleDeleteSpace(spaceId: string): boolean {
    if (spaceId === DEFAULT_SPACE_ID) {
      return false;
    }
    const hasCardsInReading = reading
      ? hasAnyCardInReading(spaceId, customCards, reading.cardIds)
      : false;
    setCustomCards((prev) => deleteCustomCardsBySpaceId(prev, spaceId));
    setSpaces((prev) => deleteSpace(prev, spaceId));

    if (reading) {
      const updatedReading = clearReadingIfFromSpace(reading, spaceId);
      if (updatedReading === null) {
        archivedReadingRef.current = null;
        setReading(null);
      }
    }

    if (currentSpaceId === spaceId) {
      setCurrentSpaceId(DEFAULT_SPACE_ID);
    }

    if (hasCardsInReading) {
      setShowSpaceManager(false);
    }

    return true;
  }

  function handleSpaceChange(spaceId: string) {
    setCurrentSpaceId(spaceId);
  }

  function handleAddSpread(spread: Spread) {
    setCustomSpreads((prev) => addCustomSpread(prev, spread));
    setSelectedSpreadId(spread.id);
  }

  function handleUpdateSpread(spread: Spread) {
    setCustomSpreads((prev) => updateCustomSpread(prev, spread));
  }

  function handleDeleteSpread(spreadId: string): boolean {
    if (isPresetSpread(spreadId)) {
      return false;
    }
    setCustomSpreads((prev) => deleteCustomSpread(prev, spreadId));
    if (selectedSpreadId === spreadId) {
      setSelectedSpreadId(DEFAULT_SPREAD_ID);
    }
    if (reading?.spreadId === spreadId) {
      handleClearReading();
    }
    return true;
  }

  async function handleGenerateShare(): Promise<string> {
    setIsGeneratingShare(true);
    try {
      return generateShareImage(
        selectedCards,
        currentPositions,
        currentSpread.name,
        currentSpread.icon,
        reading?.question,
        reading?.date ?? todayKey()
      );
    } finally {
      setIsGeneratingShare(false);
    }
  }

  function handleShareClick() {
    if (!reading || !isReadingComplete(reading, totalCards)) return;
    setShowShareModal(true);
  }

  function dismissArchiveNotice() {
    setArchiveNotice(null);
  }

  const readingCardIds = reading?.cardIds ?? [];

  return (
    <main className="booth">
      <ThemeSwitcher currentTheme={theme} onThemeChange={handleThemeChange} />

      {archiveNotice && (
        <div className="archive-notice" onClick={dismissArchiveNotice}>
          <span className="archive-notice-icon">📋</span>
          <span>{archiveNotice.message}</span>
          <span className="archive-notice-close">×</span>
        </div>
      )}

      <ReadingSection
        selectedSpreadId={selectedSpreadId}
        selectedSpaceId={currentSpaceId}
        spaces={spaces}
        customSpreads={customSpreads}
        question={question}
        hasReading={!!reading}
        isReadingComplete={reading ? isReadingComplete(reading, totalCards) : false}
        readingSpaceId={reading?.spaceId}
        onSpreadChange={setSelectedSpreadId}
        onSpaceChange={handleSpaceChange}
        onQuestionChange={setQuestion}
        onStartReading={handleStartReading}
        onRestartReading={handleRestartReading}
        onManageSpaces={() => setShowSpaceManager(true)}
        onManageSpreads={() => setShowSpreadManager(true)}
      />

      {reading && (
        <CardReveal
          cards={selectedCards}
          positions={currentPositions}
          revealed={reading.revealed}
          totalCards={totalCards}
          onReveal={handleRevealCard}
          readingDate={reading.date}
        />
      )}

      {reading &&
        isReadingComplete(reading, totalCards) &&
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
        history={history}
        spaces={spaces}
        customSpreads={customSpreads}
        isOpen={showHistory}
        onToggle={() => setShowHistory(!showHistory)}
        onClearHistory={handleClearHistory}
      />

      <DeckManager
        customCards={customCards}
        spaces={spaces}
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
        spaces={spaces}
        customCards={customCards}
        history={history}
        reading={reading}
        customSpreads={customSpreads}
        isOpen={showSpaceManager}
        onClose={() => setShowSpaceManager(false)}
        onAddSpace={handleAddSpace}
        onUpdateSpace={handleUpdateSpace}
        onDeleteSpace={handleDeleteSpace}
      />

      <SpreadManager
        customSpreads={customSpreads}
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
        question={reading?.question}
        dateStr={reading?.date}
        isGenerating={isGeneratingShare}
        onGenerate={handleGenerateShare}
      />
    </main>
  );
}
