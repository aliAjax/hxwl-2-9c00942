import { useState } from "react";
import type { Card } from "../types";
import { formatShareDate } from "../data/dateUtils";

type ShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  positions: string[];
  spreadName: string;
  spreadIcon: string;
  question?: string;
  dateStr?: string;
  isGenerating?: boolean;
  onGenerate: () => Promise<string>;
};

export function ShareModal({
  isOpen,
  onClose,
  cards,
  positions,
  spreadName,
  spreadIcon,
  question,
  dateStr,
  isGenerating = false,
  onGenerate,
}: ShareModalProps) {
  const [shareImageUrl, setShareImageUrl] = useState<string>("");
  const [isGenerated, setIsGenerated] = useState(false);

  const handleGenerate = async () => {
    const url = await onGenerate();
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

  const handleClose = () => {
    setShareImageUrl("");
    setIsGenerated(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content share-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>今日牌面分享图</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>
        <div className="share-modal-body">
          {!isGenerated ? (
            <div className="share-generate-section">
              <p>点击下方按钮生成精美的分享图</p>
              <button
                className="share-button"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? "生成中..." : "✨ 生成分享图"}
              </button>
            </div>
          ) : (
            <>
              <div className="share-image-preview">
                <img src={shareImageUrl} alt="今日牌面分享图" />
              </div>
              <div className="share-modal-actions">
                <button className="cancel-button" onClick={handleClose}>
                  关闭
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

export function generateShareImage(
  cards: Card[],
  positions: string[],
  spreadName: string,
  spreadIcon: string,
  question?: string,
  dateStr?: string
): string {
  const canvas = document.createElement("canvas");
  const W = 1080;
  const cardCount = positions.length;
  const cardGap = cardCount <= 3 ? 40 : 28;
  const cardHeight = cardCount <= 3
    ? 320
    : Math.max(180, Math.floor(900 / cardCount));
  const shareTitle = cardCount === 1 ? "今日一签" : "今日牌面";
  const footerText =
    cardCount === 1 ? "—— 一张牌的指引 ——" : `—— ${cardCount}张牌展开 ——`;
  const H = Math.max(1440, 400 + cardCount * (cardHeight + cardGap) + 100);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
  bgGradient.addColorStop(0, "#201b24");
  bgGradient.addColorStop(0.48, "#3a2830");
  bgGradient.addColorStop(1, "#1b2430");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(224, 93, 93, 0.2)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#f0bd68";
  ctx.font =
    "800 32px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText("夜市占卜摊", W / 2, 100);

  ctx.fillStyle = "#f7f0df";
  ctx.font =
    "900 64px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText(shareTitle, W / 2, 180);

  ctx.fillStyle = "#d7c7b8";
  ctx.font =
    "600 28px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText(formatShareDate(dateStr || new Date().toISOString()), W / 2, 230);

  ctx.fillStyle = "rgba(240, 189, 104, 0.7)";
  ctx.font =
    "700 24px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText(`${spreadIcon} ${spreadName}`, W / 2, 270);

  let cardStartY = 320;
  if (question) {
    ctx.fillStyle = "rgba(240, 189, 104, 0.85)";
    ctx.font =
      "700 30px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif";
    const questionLines = wrapText(ctx, `「${question}」`, W - 160);
    questionLines.forEach((line, idx) => {
      ctx.fillText(line, W / 2, cardStartY + idx * 42);
    });
    cardStartY = cardStartY + questionLines.length * 42 + 30;
  }

  const cardWidth = W - 120;
  const cardX = 60;
  const glyphRatio = cardCount <= 3 ? 0.78 : 0.85;
  const glyphSize = cardCount <= 3 ? 200 : Math.floor(cardHeight * 0.8);
  const fontScale =
    cardCount <= 3 ? 1 : Math.max(0.55, 1 - (cardCount - 3) * 0.15);

  for (let i = 0; i < cardCount; i++) {
    const card = cards[i];
    const position = positions[i];
    const y = cardStartY + i * (cardHeight + cardGap);

    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    drawRoundedRect(ctx, cardX, y, cardWidth, cardHeight, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(240, 189, 104, 0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const glyphX = cardX + 50;
    const glyphY = y + (cardHeight - glyphSize) / 2;

    ctx.fillStyle = card.hue;
    drawRoundedRect(ctx, glyphX, glyphY, glyphSize, glyphSize * glyphRatio, 16);
    ctx.fill();

    ctx.fillStyle = "#fffaf0";
    ctx.font = `900 ${Math.floor(120 * fontScale)}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      card.glyph,
      glyphX + glyphSize / 2,
      glyphY + (glyphSize * glyphRatio) / 2
    );
    ctx.textBaseline = "alphabetic";

    const infoX = glyphX + glyphSize + 40;
    const infoWidth = cardWidth - (glyphSize + 90);
    const meaningLineCount = cardCount <= 3 ? 3 : 2;
    const titleFontSize = Math.floor(44 * fontScale);
    const keywordFontSize = Math.floor(30 * fontScale);
    const textFontSize = Math.floor(26 * fontScale);
    const topPadding = cardCount <= 3 ? 65 : Math.floor(cardHeight * 0.22);

    ctx.textAlign = "left";
    ctx.fillStyle = "#8a7a6d";
    ctx.font = `700 ${Math.floor(26 * fontScale)}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
    ctx.fillText(position, infoX, y + topPadding);

    ctx.fillStyle = "#f7f0df";
    ctx.font = `900 ${titleFontSize}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
    ctx.fillText(card.name, infoX, y + topPadding + titleFontSize + 8);

    ctx.fillStyle = card.hue;
    ctx.font = `800 ${keywordFontSize}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
    ctx.fillText(
      card.keyword,
      infoX,
      y + topPadding + titleFontSize + keywordFontSize + 16
    );

    ctx.fillStyle = "#d7c7b8";
    ctx.font = `500 ${textFontSize}px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif`;
    const meaningLines = wrapText(ctx, card.meaning, infoWidth);
    meaningLines.slice(0, meaningLineCount).forEach((line, idx) => {
      ctx.fillText(
        line,
        infoX,
        y +
          topPadding +
          titleFontSize +
          keywordFontSize +
          textFontSize +
          24 +
          idx * (textFontSize + 14)
      );
    });
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(240, 189, 104, 0.6)";
  ctx.font =
    "600 24px Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText(footerText, W / 2, H - 80);

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
