import { useState } from "react";
import type { Card } from "../types";

type CardGlyphProps = {
  card: Pick<Card, "glyph" | "hue" | "illustration">;
  className?: string;
  size?: "small" | "normal" | "large";
};

export function CardGlyph({ card, className = "", size = "normal" }: CardGlyphProps) {
  const [imgError, setImgError] = useState(false);
  const hasIllustration = card.illustration && !imgError;

  const sizeClasses = {
    small: "glyph-small",
    normal: "",
    large: "glyph-large",
  };

  if (hasIllustration) {
    return (
      <div
        className={`glyph glyph-illustration ${sizeClasses[size]} ${className}`}
        style={{ background: card.hue }}
      >
        <img
          src={card.illustration}
          alt=""
          onError={() => setImgError(true)}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      className={`glyph ${sizeClasses[size]} ${className}`}
      style={{ background: card.hue }}
    >
      {card.glyph}
    </div>
  );
}
