import type { Color, PieceType } from "../chess/types";
import ChessPiece from "./ChessPiece";

const OPTIONS: PieceType[] = ["q", "r", "b", "n"];

interface Props {
  color: Color;
  onChoose: (type: PieceType) => void;
}

export default function PromotionDialog({ color, onChoose }: Props) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
      <div className="panel-card rounded-2xl p-5 text-center shadow-2xl">
        <h3 className="font-display text-sm uppercase tracking-[0.28em] text-amber-200/80">
          Promote pawn
        </h3>
        <p className="mt-1 text-xs text-stone-400">Choose any piece except the king</p>
        <div className="mt-4 flex gap-3">
          {OPTIONS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChoose(type)}
              className="flex h-20 w-20 items-center justify-center rounded-xl border border-amber-400/30 bg-black/30 transition hover:border-amber-300 hover:bg-amber-400/10"
            >
              <ChessPiece type={type} color={color} className="h-16 w-16" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
