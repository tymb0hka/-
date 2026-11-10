import { useMemo } from "react";
import { FILES, RANKS, squaresEqual } from "../chess/engine";
import type { Color, GameState, Move, Square } from "../chess/types";
import darkSquare from "../assets/dark-square.jpg?inline";
import lightSquare from "../assets/light-square.jpg?inline";
import ChessPiece from "./ChessPiece";
import { cn } from "../utils/cn";

interface Props {
  state: GameState;
  flipped: boolean;
  selected: Square | null;
  legalMoves: Move[];
  lastMove: Move | null;
  checkedColor: Color | null;
  disabled: boolean;
  animating: boolean;
  onSquareClick: (sq: Square) => void;
}

export default function ChessBoard({
  state,
  flipped,
  selected,
  legalMoves,
  lastMove,
  checkedColor,
  disabled,
  animating,
  onSquareClick,
}: Props) {
  const pieces = useMemo(() => {
    const list: { id: number; row: number; col: number; type: GameState["board"][0][0] }[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const p = state.board[row][col];
        if (p) list.push({ id: p.id, row, col, type: p });
      }
    }
    return list;
  }, [state]);

  const legalSet = useMemo(() => {
    const map = new Map<string, Move>();
    for (const m of legalMoves) map.set(`${m.to.row}-${m.to.col}`, m);
    return map;
  }, [legalMoves]);

  const display = (row: number, col: number) => {
    const r = flipped ? 7 - row : row;
    const c = flipped ? 7 - col : col;
    return { r, c };
  };

  return (
    <div className="wood-frame relative select-none rounded-[18px] p-2 sm:p-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-[10px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)]">
        <div className="grid h-full w-full grid-cols-8 grid-rows-8">
          {Array.from({ length: 64 }, (_, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const boardRow = flipped ? 7 - row : row;
            const boardCol = flipped ? 7 - col : col;
            const light = (boardRow + boardCol) % 2 === 0;
            const sq = { row: boardRow, col: boardCol };
            const isSelected = squaresEqual(selected, sq);
            const legal = legalSet.get(`${boardRow}-${boardCol}`);
            const isLast =
              lastMove &&
              ((lastMove.from.row === boardRow && lastMove.from.col === boardCol) ||
                (lastMove.to.row === boardRow && lastMove.to.col === boardCol));
            const kingHere = state.board[boardRow][boardCol];
            const inCheck =
              checkedColor && kingHere?.type === "k" && kingHere.color === checkedColor;

            return (
              <button
                key={`${row}-${col}`}
                type="button"
                disabled={disabled}
                onClick={() => onSquareClick(sq)}
                className={cn(
                  "relative h-full w-full cursor-pointer",
                  inCheck && "check-square",
                )}
                style={{
                  backgroundImage: `url(${light ? lightSquare : darkSquare})`,
                  backgroundSize: "cover",
                }}
              >
                {isLast && !inCheck && (
                  <span
                    className={cn(
                      "absolute inset-0",
                      light ? "bg-yellow-400/28" : "bg-yellow-500/32",
                    )}
                  />
                )}
                {isSelected && (
                  <span className="absolute inset-0 bg-amber-400/40" />
                )}
                {legal && !state.board[boardRow][boardCol] && (
                  <span className="legal-dot absolute left-1/2 top-1/2 h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/35" />
                )}
                {legal && state.board[boardRow][boardCol] && (
                  <span className="absolute inset-[6%] rounded-sm border-[3px] border-red-700/70 sm:inset-[10%]" />
                )}
                {boardCol === (flipped ? 7 : 0) && (
                  <span
                    className={cn(
                      "absolute left-0.5 top-0.5 text-[10px] font-semibold sm:text-xs",
                      light ? "text-[#6b4423]" : "text-[#f0d9b5]",
                    )}
                  >
                    {RANKS[boardRow]}
                  </span>
                )}
                {boardRow === (flipped ? 0 : 7) && (
                  <span
                    className={cn(
                      "absolute bottom-0.5 right-1 text-[10px] font-semibold sm:text-xs",
                      light ? "text-[#6b4423]" : "text-[#f0d9b5]",
                    )}
                  >
                    {FILES[boardCol]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="pointer-events-none absolute inset-0">
          {pieces.map(({ id, row, col, type: piece }) => {
            if (!piece) return null;
            const { r, c } = display(row, col);
            const isSel = squaresEqual(selected, { row, col });
            return (
              <div
                key={id}
                className={cn("piece-layer absolute h-[12.5%] w-[12.5%]", !animating && "no-anim")}
                style={{ left: `${c * 12.5}%`, top: `${r * 12.5}%` }}
              >
                <div
                  className={cn(
                    "flex h-full w-full items-center justify-center p-[6%]",
                    isSel && "piece-selected",
                  )}
                >
                  <ChessPiece type={piece.type} color={piece.color} className="h-full w-full" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
