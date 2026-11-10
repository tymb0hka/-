import { useId } from "react";
import type { Color, PieceType } from "../chess/types";

interface Props {
  type: PieceType;
  color: Color;
  className?: string;
}

export default function ChessPiece({ type, color, className = "" }: Props) {
  const isWhite = color === "w";
  const fill = isWhite ? "#f7f1e3" : "#1f1d22";
  const stroke = isWhite ? "#2c2416" : "#070709";
  const accent = isWhite ? "#c9a227" : "#a8a8b3";
  const inner = isWhite ? "#d9c9a3" : "#3a3a44";
  const uid = useId().replace(/:/g, "");
  const gid = `g-${uid}`;

  return (
    <svg
      viewBox="0 0 45 45"
      className={className}
      aria-hidden
      style={{ filter: "drop-shadow(0 3px 2px rgba(0,0,0,0.35))" }}
    >
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={isWhite ? "#fffdf6" : "#3c3c46"} />
          <stop offset="100%" stopColor={fill} />
        </linearGradient>
      </defs>
      {type === "k" && <King fill={`url(#${gid})`} stroke={stroke} accent={accent} />}
      {type === "q" && <Queen fill={`url(#${gid})`} stroke={stroke} accent={accent} />}
      {type === "r" && <Rook fill={`url(#${gid})`} stroke={stroke} inner={inner} />}
      {type === "b" && <Bishop fill={`url(#${gid})`} stroke={stroke} accent={accent} />}
      {type === "n" && <Knight fill={`url(#${gid})`} stroke={stroke} isWhite={isWhite} />}
      {type === "p" && <Pawn fill={`url(#${gid})`} stroke={stroke} />}
    </svg>
  );
}

function King({ fill, stroke, accent }: { fill: string; stroke: string; accent: string }) {
  return (
    <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.5 11.63V6M20 8h5" stroke={accent} strokeWidth="2" fill="none" />
      <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" />
      <path d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" />
      <path d="M12.5 30c5.5-3 14.5-3 20 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0" fill="none" />
    </g>
  );
}

function Queen({ fill, stroke, accent }: { fill: string; stroke: string; accent: string }) {
  return (
    <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="12" r="2.75" fill={accent} />
      <circle cx="14" cy="9" r="2.75" fill={accent} />
      <circle cx="22.5" cy="8" r="2.75" fill={accent} />
      <circle cx="31" cy="9" r="2.75" fill={accent} />
      <circle cx="39" cy="12" r="2.75" fill={accent} />
      <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-16.5-3.2 16.5-5.3-13.6L12 25 6.5 13.5 9 26z" />
      <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" />
      <path d="M11.5 38.5a35 35 1 0 0 22 0" fill="none" />
      <path
        d="M11 29a35 35 1 0 1 23 0M11.5 31.5h22M11 34.5a35 35 1 0 0 23 0"
        fill="none"
        strokeLinecap="butt"
      />
    </g>
  );
}

function Rook({ fill, stroke, inner }: { fill: string; stroke: string; inner: string }) {
  return (
    <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 39h27v-3H9v3zM12.5 32h20v4h-20v-4zM12 36v-4h21v4H12z" />
      <path d="M11 14V9h4v2h5V9h5v2h5V9h4v5" />
      <path d="M34 14l-3 3H14l-3-3" />
      <path d="M31 17v12.5H14V17" fill={inner} />
      <path d="M31 29.5L32.5 32H12.5L14 29.5" />
      <path d="M11 14h23" fill="none" />
    </g>
  );
}

function Bishop({ fill, stroke, accent }: { fill: string; stroke: string; accent: string }) {
  return (
    <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="22.5" cy="8" r="2.5" fill={accent} />
      <path d="M17.5 39h10M15 37h15M30 37c0-6-3-10.5-7.5-16.5-4.5 6-7.5 10.5-7.5 16.5" />
      <path d="M15 32c3-4 7.5-8.5 7.5-16 0 7.5 4.5 12 7.5 16" />
      <path d="M22.5 16c3.5 0 6 1.5 7.5 5-3-1.5-6-1.5-7.5 0-1.5-1.5-4.5-1.5-7.5 0 1.5-3.5 4-5 7.5-5z" />
      <path d="M20 18.5l5.5 8.5" stroke={accent} fill="none" />
    </g>
  );
}

function Knight({ fill, stroke, isWhite }: { fill: string; stroke: string; isWhite: boolean }) {
  return (
    <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10c-5 1-8.5 4.5-10 10-1 4 0 8 3 11 2 2 3 4 3 7h15v-6c0-3 1.5-6 4-8 2-2 3-5 2-9-2-5-8-7-12-7-1-3-3-4-5 2z" />
      <path d="M11.5 15.5c1-2 2.5-3 4.5-3 .5-2 1.5-3.5 3.5-4" fill="none" />
      <path d="M24.5 11.5c2 .5 4 2 5 4" fill="none" />
      <circle cx="14.5" cy="20" r="1.15" fill={isWhite ? "#1a140c" : "#e8e4d8"} stroke="none" />
      <path d="M13 28c2 1.5 5 2 8 0" fill="none" />
      <path d="M12 37.5h21v3.5H12z" />
    </g>
  );
}

function Pawn({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5h23c0-7.92-4.41-12.41-7.41-13.47C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
    </g>
  );
}

export const PIECE_NAMES: Record<PieceType, string> = {
  k: "King",
  q: "Queen",
  r: "Rook",
  b: "Bishop",
  n: "Knight",
  p: "Pawn",
};
