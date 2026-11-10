export type Color = "w" | "b";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export interface Piece {
  type: PieceType;
  color: Color;
  id: number;
}

export interface Square {
  row: number;
  col: number;
}

export interface CastlingRights {
  wK: boolean;
  wQ: boolean;
  bK: boolean;
  bQ: boolean;
}

export interface Move {
  from: Square;
  to: Square;
  promotion?: PieceType;
  castle?: "k" | "q";
  enPassant?: boolean;
}

export interface GameState {
  board: (Piece | null)[][];
  turn: Color;
  castling: CastlingRights;
  enPassant: Square | null;
  kings: { w: Square; b: Square };
}

export type GameResult =
  | { type: "playing" }
  | { type: "checkmate"; winner: Color }
  | { type: "nomoves"; winner: Color }
  | { type: "draw" }
  | { type: "timeout"; winner: Color }
  | { type: "resign"; winner: Color };

export type Opponent = "human" | "ai";
export type Difficulty = 1 | 2 | 3 | 4 | 5 | 6;

export interface GameSettings {
  opponent: Opponent;
  difficulty: Difficulty;
  timerEnabled: boolean;
  minutes: number;
  increment: number;
  playerColor: "w" | "b" | "random";
  flipEachTurn: boolean;
}

export interface HistoryEntry {
  move: Move;
  notation: string;
  captured?: Piece | null;
}
