import { useState } from "react";
import type { Card, ShareConfig, ThemeId, ShareImageSize } from "../types";
import { formatShareDate } from "../data/dateUtils";
import { SHARE_THEME_COLORS, THEMES } from "../data/constants";

type ShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  positions: string[];
  spreadName: string;
  spreadIcon: string;
  question?: string;
  dateStr?: string;
  spaceName?: string;
  spaceIcon?: string;
  isGenerating?: boolean;
  onGenerate: (config: ShareConfig) => Promise<string>;
};

const SIZE_OPTIONS: { id: ShareImageSize; name: string; icon: string; desc: string }[] = [
  { id: "long", name: "竖版长图", icon: "📏", desc: "适合分享到朋友圈" },
  { id: "compact", name: "紧凑版", icon: "📱", desc: "适合快速保存" },
];

export function ShareModal({
  isOpen,
  onClose,
  cards,
  positions,
  spreadName,
  spreadIcon,
  question,
  dateStr,
  spaceName,
  spaceIcon,
  isGenerating = false,
  onGenerate,
}: ShareModalProps) {
  const [shareImageUrl, setShareImageUrl] = useState<string>("");
  const [isGenerated, setIsGenerated] = useState(false);
  const [config, setConfig] = useState<ShareConfig>({
    theme: "night-market",
    size: "long",
    showQuestion: true,
    showSpaceName: true,
    showSpreadName: true,
  });

  const canGenerate = cards.length > 0 && positions.length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    const url = await onGenerate(config);
    setShareImageUrl(url);
    setIsGenerated(true);
  };

  const handleDownload = () => {
    if (!shareImageUrl) return;
    const link = document.createElement("a");
    link.download = `今日牌面_${dateStr || "unknown"}.png`;
    link.href = shareImageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerate = () => {
    setShareImageUrl("");
    setIsGenerated(false);
  };

  const handleClose = () => {
    setShareImageUrl("");
    setIsGenerated(false);
    onClose();
  };

  const updateConfig = <K extends keyof ShareConfig>(key: K, value: ShareConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content share-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>分享图设置</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>
        <div className="share-modal-body">
          {!isGenerated ? (
            <div className="share-config-panel">
              <div className="config-section">
                <h3 className="config-section-title">🎨 视觉风格</h3>
                <div className="theme-options">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      className={`theme-option ${config.theme === theme.id ? "active" : ""}`}
                      onClick={() => updateConfig("theme", theme.id as ThemeId)}
                    >
                      <span className="theme-option-icon">{theme.icon}</span>
                      <span className="theme-option-name">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="config-section">
                <h3 className="config-section-title">📐 图片尺寸</h3>
                <div className="size-options">
                  {SIZE_OPTIONS.map((size) => (
                    <button
                      key={size.id}
                      className={`size-option ${config.size === size.id ? "active" : ""}`}
                      onClick={() => updateConfig("size", size.id as ShareImageSize)}
                    >
                      <span className="size-option-icon">{size.icon}</span>
                      <div className="size-option-info">
                        <span className="size-option-name">{size.name}</span>
                        <span className="size-option-desc">{size.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="config-section">
                <h3 className="config-section-title">📝 显示内容</h3>
                <div className="toggle-options">
                  <label className="toggle-option">
                    <div className="toggle-label">
                      <span className="toggle-icon">❓</span>
                      <span className="toggle-text">显示问题</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.showQuestion}
                      onChange={(e) => updateConfig("showQuestion", e.target.checked)}
                      className="toggle-input"
                    />
                    <span className="toggle-slider"></span>
                  </label>

                  <label className="toggle-option">
                    <div className="toggle-label">
                      <span className="toggle-icon">🏷️</span>
                      <span className="toggle-text">显示牌阵名称</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.showSpreadName}
                      onChange={(e) => updateConfig("showSpreadName", e.target.checked)}
                      className="toggle-input"
                    />
                    <span className="toggle-slider"></span>
                  </label>

                  <label className="toggle-option">
                    <div className="toggle-label">
                      <span className="toggle-icon">📂</span>
                      <span className="toggle-text">显示空间名称</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.showSpaceName}
                      onChange={(e) => updateConfig("showSpaceName", e.target.checked)}
                      className="toggle-input"
                      disabled={!spaceName}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="share-generate-section">
                <button
                  className="share-button generate-share-btn"
                  onClick={handleGenerate}
                  disabled={isGenerating || !canGenerate}
                >
                  {isGenerating ? "🖼️ 生成中..." : "✨ 生成分享图"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="share-image-preview">
                <img src={shareImageUrl} alt="今日牌面分享图" />
              </div>
              <div className="share-modal-actions">
                <button className="cancel-button" onClick={handleRegenerate}>
                  重新设置
                </button>
                <button
                  className="save-button download-button"
                  onClick={handleDownload}
                >
                  📥 保存到本地
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export async function generateShareImage(
  cards: Card[],
  positions: string[],
  spreadName: string,
  spreadIcon: string,
  question: string | undefined,
  dateStr: string | undefined,
  config: ShareConfig,
  spaceName?: string,
  spaceIcon?: string
): Promise<string> {
  const { theme, size, showQuestion, showSpaceName, showSpreadName } = config;
  const colors = SHARE_THEME_COLORS[theme];

  const illustrationMap = new Map<number, HTMLImageElement>();
  await Promise.all(
    cards.map((card, i) => {
      if (!card.illustration) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          illustrationMap.set(i, img);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = card.illustration!;
      });
    })
  );

  const canvas = document.createElement("canvas");
  const cardCount = positions.length;

  const isCompact = size === "compact";
  const W = isCompact ? 720 : 1080;

  const baseCardHeight = isCompact ? 200 : 320;
  const baseCardGap = isCompact ? 20 : 40;
  const minCardHeight = isCompact ? 130 : 200;

  const cardGap = cardCount <= 3 ? baseCardGap : Math.floor(baseCardGap * 0.65);

  const targetCardsArea = isCompact
    ? Math.max(450, 900 - cardCount * 30)
    : Math.max(700, 1300 - cardCount * 40);
  const idealCardHeight = Math.floor(
    (targetCardsArea - (cardCount - 1) * cardGap) / cardCount
  );
  const cardHeight = Math.max(minCardHeight, idealCardHeight);

  const shareTitle = cardCount === 1 ? "今日一签" : "今日牌面";
  const footerText =
    cardCount === 1 ? "—— 一张牌的指引 ——" : `—— ${cardCount}张牌展开 ——`;

  const brandFontSize = isCompact ? 22 : 32;
  const titleFontSize = isCompact ? 42 : 64;
  const dateFontSize = isCompact ? 20 : 28;
  const spreadFontSize = isCompact ? 18 : 24;
  const spaceFontSize = isCompact ? 16 : 22;
  const questionFontSize = isCompact ? 22 : 30;
  const footerFontSize = isCompact ? 18 : 24;

  const brandY = isCompact ? 50 : 100;
  const gapAfterBrand = isCompact ? 20 : 30;
  const gapAfterTitle = isCompact ? 12 : 20;
  const gapAfterDate = isCompact ? 15 : 20;
  const gapAfterSpread = isCompact ? 12 : 20;
  const gapAfterSpace = isCompact ? 10 : 15;
  const gapBeforeCards = isCompact ? 25 : 40;
  const gapAfterQuestion = isCompact ? 20 : 30;
  const footerY = isCompact ? 40 : 80;
  const paddingBottom = isCompact ? 20 : 40;

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d")!;

  let layoutY = brandY + brandFontSize;
  layoutY += gapAfterBrand;
  layoutY += titleFontSize;
  layoutY += gapAfterTitle;
  layoutY += dateFontSize;
  layoutY += gapAfterDate;

  if (showSpreadName) {
    layoutY += spreadFontSize;
    layoutY += gapAfterSpread;
  }

  if (showSpaceName && spaceName) {
    layoutY += spaceFontSize;
    layoutY += gapAfterSpace;
  }

  layoutY += gapBeforeCards;

  let questionHeight = 0;
  if (showQuestion && question) {
    measureCtx.font = `700 ${questionFontSize}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
    const questionLines = wrapText(
      measureCtx,
      `「${question}」`,
      W - (isCompact ? 100 : 160)
    );
    const lineHeight = questionFontSize + (isCompact ? 10 : 12);
    questionHeight = questionLines.length * lineHeight + gapAfterQuestion;
  }

  layoutY += questionHeight;

  const cardsAreaHeight = cardCount * (cardHeight + cardGap) - cardGap;
  const contentEndY = layoutY + cardsAreaHeight;
  const footerPositionY = contentEndY + footerY;
  const totalHeight = footerPositionY + paddingBottom;
  const minHeight = isCompact ? 960 : 1440;
  const H = Math.max(minHeight, totalHeight);

  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
  bgGradient.addColorStop(0, colors.bgStart);
  bgGradient.addColorStop(0.48, colors.bgMid);
  bgGradient.addColorStop(1, colors.bgEnd);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = colors.gridLine;
  ctx.lineWidth = 1;
  const gridStep = isCompact ? 28 : 42;
  for (let x = 0; x < W; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  let currentY = brandY + brandFontSize;

  ctx.textAlign = "center";
  ctx.fillStyle = colors.accent;
  ctx.font = `800 ${brandFontSize}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
  ctx.fillText(colors.brandName, W / 2, currentY);

  currentY += gapAfterBrand;
  ctx.fillStyle = colors.textPrimary;
  ctx.font = `900 ${titleFontSize}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
  currentY += titleFontSize;
  ctx.fillText(shareTitle, W / 2, currentY);

  currentY += gapAfterTitle;
  ctx.fillStyle = colors.textSecondary;
  ctx.font = `600 ${dateFontSize}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
  currentY += dateFontSize;
  ctx.fillText(formatShareDate(dateStr || new Date().toISOString()), W / 2, currentY);

  if (showSpreadName) {
    currentY += gapAfterSpread;
    ctx.fillStyle = colors.accent + "cc";
    ctx.font = `700 ${spreadFontSize}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
    currentY += spreadFontSize;
    ctx.fillText(`${spreadIcon} ${spreadName}`, W / 2, currentY);
  }

  if (showSpaceName && spaceName) {
    currentY += gapAfterSpace;
    ctx.fillStyle = colors.textMuted;
    ctx.font = `600 ${spaceFontSize}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
    currentY += spaceFontSize;
    const iconText = spaceIcon ? `${spaceIcon} ` : "";
    ctx.fillText(`${iconText}${spaceName}`, W / 2, currentY);
  }

  let cardStartY = currentY + gapBeforeCards;

  if (showQuestion && question) {
    ctx.fillStyle = colors.accent + "d9";
    ctx.font = `700 ${questionFontSize}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
    const questionLines = wrapText(
      ctx,
      `「${question}」`,
      W - (isCompact ? 100 : 160)
    );
    const lineHeight = questionFontSize + (isCompact ? 10 : 12);
    questionLines.forEach((line, idx) => {
      ctx.fillText(
        line,
        W / 2,
        cardStartY + idx * lineHeight + questionFontSize
      );
    });
    cardStartY = cardStartY + questionLines.length * lineHeight + gapAfterQuestion;
  }

  const cardWidth = W - (isCompact ? 60 : 120);
  const cardX = (W - cardWidth) / 2;
  const glyphPadding = isCompact ? 24 : 50;

  const glyphRatio = cardCount <= 3 ? 0.78 : 0.85;
  const glyphSize = Math.floor(
    cardHeight * (cardCount <= 3 ? 0.62 : 0.76)
  );
  const glyphH = glyphSize * glyphRatio;

  const fontScale = Math.max(
    0.5,
    cardCount <= 3 ? 1 : 1 - (cardCount - 3) * 0.12
  );

  const infoGap = isCompact ? 20 : 40;
  const infoX = glyphPadding * 2 + glyphSize + infoGap;
  const infoWidth = cardWidth - infoX - glyphPadding;

  const posFont = Math.floor((isCompact ? 18 : 26) * fontScale);
  const nameFont = Math.floor((isCompact ? 28 : 44) * fontScale);
  const keywordFont = Math.floor((isCompact ? 20 : 30) * fontScale);
  const meaningFont = Math.floor((isCompact ? 17 : 26) * fontScale);
  const meaningLineCount = cardHeight < 160 ? 1 : cardCount <= 3 ? 3 : 2;

  const contentHeight =
    posFont + 8 + nameFont + 16 + keywordFont + 24 +
    meaningLineCount * (meaningFont + 12);

  let topPadding = Math.floor((cardHeight - contentHeight) / 2);
  if (topPadding < 12) topPadding = 12;

  for (let i = 0; i < cardCount; i++) {
    const card = cards[i];
    const position = positions[i];
    const y = cardStartY + i * (cardHeight + cardGap);

    ctx.fillStyle = colors.cardBg;
    const borderRadius = isCompact ? 12 : 20;
    drawRoundedRect(ctx, cardX, y, cardWidth, cardHeight, borderRadius);
    ctx.fill();
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = isCompact ? 1 : 2;
    ctx.stroke();

    const glyphX = cardX + glyphPadding;
    const glyphY = y + (cardHeight - glyphH) / 2;
    const illustImg = illustrationMap.get(i);

    const glyphRadius = isCompact ? 10 : 16;
    if (illustImg) {
      ctx.save();
      drawRoundedRect(ctx, glyphX, glyphY, glyphSize, glyphH, glyphRadius);
      ctx.clip();
      const imgAspect = illustImg.width / illustImg.height;
      const boxAspect = glyphSize / glyphH;
      let sx = 0,
        sy = 0,
        sw = illustImg.width,
        sh = illustImg.height;
      if (imgAspect > boxAspect) {
        sw = illustImg.height * boxAspect;
        sx = (illustImg.width - sw) / 2;
      } else {
        sh = illustImg.width / boxAspect;
        sy = (illustImg.height - sh) / 2;
      }
      ctx.drawImage(
        illustImg,
        sx,
        sy,
        sw,
        sh,
        glyphX,
        glyphY,
        glyphSize,
        glyphH
      );
      ctx.restore();
    } else {
      ctx.fillStyle = card.hue;
      drawRoundedRect(ctx, glyphX, glyphY, glyphSize, glyphH, glyphRadius);
      ctx.fill();

      ctx.fillStyle = "#fffaf0";
      const glyphFontSize = Math.floor(glyphSize * 0.55);
      ctx.font = `900 ${glyphFontSize}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(card.glyph, glyphX + glyphSize / 2, glyphY + glyphH / 2);
      ctx.textBaseline = "alphabetic";
    }

    const textX = cardX + infoX;

    ctx.textAlign = "left";
    ctx.fillStyle = colors.textMuted;
    ctx.font = `700 ${posFont}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
    ctx.fillText(position, textX, y + topPadding + posFont);

    let textY = y + topPadding + posFont + 8;

    ctx.fillStyle = colors.textPrimary;
    ctx.font = `900 ${nameFont}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
    textY += nameFont;
    ctx.fillText(card.name, textX, textY);

    textY += 16;
    ctx.fillStyle = card.hue;
    ctx.font = `800 ${keywordFont}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
    textY += keywordFont;
    ctx.fillText(card.keyword, textX, textY);

    textY += 24;
    ctx.fillStyle = colors.textSecondary;
    ctx.font = `500 ${meaningFont}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
    const meaningLines = wrapText(ctx, card.meaning, infoWidth);
    meaningLines.slice(0, meaningLineCount).forEach((line, idx) => {
      ctx.fillText(line, textX, textY + idx * (meaningFont + 12));
    });
  }

  ctx.textAlign = "center";
  ctx.fillStyle = colors.accent + "99";
  ctx.font = `600 ${footerFontSize}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
  ctx.fillText(footerText, W / 2, Math.max(contentEndY + footerY, H - footerY));

  return canvas.toDataURL("image/png", 1.0);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  let currentLine = "";
  for (const char of text) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
