import { useMemo, useState, useEffect, useCallback } from "react";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { ReadingSection } from "./components/ReadingSection";
import { CardReveal } from "./components/CardReveal";
import { DeckSection } from "./components/DeckSection";
import { DeckManager } from "./components/DeckManager";
import { HistoryPanel } from "./components/HistoryPanel";
import { ShareModal } from "./components/ShareModal";
import { generateShareImage } from "./components/ShareModal";
import { loadTheme, saveTheme, applyTheme } from "./data/themeStore";
import { loadCustomCards, saveCustomCards, getAllCards, getCardById, addCustomCard, updateCustomCard, deleteCustomCard, isCardInReading } from "./data/cardStore";
import { loadReading, saveReading, clearReading, createReading, revealNextCard, isReadingComplete } from "./data/readingStore";
import { loadHistory, saveHistory, clearHistory, addReadingToHistory } from "./data/historyStore";
import { getSpreadById, getPositions, getPositionCount } from "./data/spreadStore";
import { checkAndArchive } from "./data/archiveService";
import { todayKey } from "./data/dateUtils";
import { DEFAULT_SPREAD_ID } from "./data/constants";
import type { ThemeId, Reading, Card, HistoryRecord, ArchiveResult } from "./types";

export default function App() {
  const [theme, setTheme] = useState<ThemeId>(loadTheme);
  const [reading, setReading] = useState<Reading | null>(loadReading);
  const [customCards, setCustomCards] = useState<Card[]>(loadCustomCards);
  const [history, setHistory] = useState<HistoryRecord[]>(loadHistory);
  const [showDeckManager, setShowDeckManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [question, setQuestion] = useState(reading?.question ?? "");
  const [selectedSpreadId, setSelectedSpreadId] = useState<string>(
    reading?.spreadId ?? DEFAULT_SPREAD_ID
  );
  const [archiveNotice, setArchiveNotice] = useState<ArchiveResult | null>(null);

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

  const handleThemeChange = useCallback((themeId: ThemeId) => {
    setTheme(themeId);
    applyTheme(themeId);
    saveTheme(themeId);
  }, []);

  const currentSpread = getSpreadById(reading?.spreadId ?? selectedSpreadId);
  const currentPositions = currentSpread.positions;
  const totalCards = currentPositions.length;

  const allCards = useMemo(() => getAllCards(customCards), [customCards]);
  const selectedCards = useMemo(() => {
    if (!reading) return [];
    return reading.cardIds
      .map((id) => getCardById(id, allCards))
      .filter((card): card is Card => card !== undefined);
  }, [reading, allCards]);

  useEffect(() => {
    saveCustomCards(customCards);
  }, [customCards]);

  useEffect(() => {
    if (reading) {
      saveReading(reading);
    }
  }, [reading]);

  useEffect(() => {
    if (reading && isReadingComplete(reading, totalCards) && selectedCards.length === totalCards) {
      const positions = getPositions(reading.spreadId);
      const updatedHistory = addReadingToHistory(history, reading, selectedCards, positions);
      saveHistory(updatedHistory);
      setHistory(updatedHistory);
    }
  }, [reading?.revealed, reading, selectedCards, totalCards]);

  function handleStartReading() {
    const positionsCount = getPositionCount(selectedSpreadId);
    const next = createReading(allCards, positionsCount, selectedSpreadId, question);
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

  function handleClearHistory() {
    clearHistory();
    setHistory([]);
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
        question={question}
        hasReading={!!reading}
        onSpreadChange={setSelectedSpreadId}
        onQuestionChange={setQuestion}
        onStartReading={handleStartReading}
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

      {reading && isReadingComplete(reading, totalCards) && selectedCards.length === totalCards && (
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

      <DeckSection allCards={allCards} onManageClick={() => setShowDeckManager(true)} />

      <HistoryPanel
        history={history}
        isOpen={showHistory}
        onToggle={() => setShowHistory(!showHistory)}
        onClearHistory={handleClearHistory}
      />

      <DeckManager
        customCards={customCards}
        readingCardIds={readingCardIds}
        isOpen={showDeckManager}
        onClose={() => setShowDeckManager(false)}
        onAddCard={handleAddCard}
        onUpdateCard={handleUpdateCard}
        onDeleteCard={handleDeleteCard}
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
