import type {
  CastlingRights,
  Color,
  GameResult,
  GameState,
  Move,
  Piece,
  PieceType,
  Square,
} from "./types";

let nextPieceId = 1;

export function opposite(color: Color): Color {
  return color === "w" ? "b" : "w";
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

export function squaresEqual(a: Square | null | undefined, b: Square | null | undefined): boolean {
  if (!a || !b) return false;
  return a.row === b.row && a.col === b.col;
}

function createPiece(type: PieceType, color: Color): Piece {
  return { type, color, id: nextPieceId++ };
}

const BACK_RANK: PieceType[] = ["r", "n", "b", "q", "k", "b", "n", "r"];

export function createInitialState(): GameState {
  const board: (Piece | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));

  for (let col = 0; col < 8; col++) {
    board[0][col] = createPiece(BACK_RANK[col], "b");
    board[1][col] = createPiece("p", "b");
    board[6][col] = createPiece("p", "w");
    board[7][col] = createPiece(BACK_RANK[col], "w");
  }

  return {
    board,
    turn: "w",
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    enPassant: null,
    kings: { w: { row: 7, col: 4 }, b: { row: 0, col: 4 } },
  };
}

export function cloneState(state: GameState): GameState {
  return {
    board: state.board.map((row) => row.map((p) => (p ? { ...p } : null))),
    turn: state.turn,
    castling: { ...state.castling },
    enPassant: state.enPassant ? { ...state.enPassant } : null,
    kings: {
      w: { ...state.kings.w },
      b: { ...state.kings.b },
    },
  };
}

const KNIGHT_OFFS = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
] as const;

const KING_OFFS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const;

const BISHOP_DIRS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const;

const ROOK_DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

export function isSquareAttacked(
  board: (Piece | null)[][],
  row: number,
  col: number,
  byColor: Color,
): boolean {
  const pawnDir = byColor === "w" ? 1 : -1;
  for (const dc of [-1, 1]) {
    const r = row + pawnDir;
    const c = col + dc;
    if (inBounds(r, c)) {
      const p = board[r][c];
      if (p && p.color === byColor && p.type === "p") return true;
    }
  }

  for (const [dr, dc] of KNIGHT_OFFS) {
    const r = row + dr;
    const c = col + dc;
    if (inBounds(r, c)) {
      const p = board[r][c];
      if (p && p.color === byColor && p.type === "n") return true;
    }
  }

  for (const [dr, dc] of KING_OFFS) {
    const r = row + dr;
    const c = col + dc;
    if (inBounds(r, c)) {
      const p = board[r][c];
      if (p && p.color === byColor && p.type === "k") return true;
    }
  }

  const scan = (dirs: readonly (readonly [number, number])[], types: PieceType[]) => {
    for (const [dr, dc] of dirs) {
      let r = row + dr;
      let c = col + dc;
      while (inBounds(r, c)) {
        const p = board[r][c];
        if (p) {
          if (p.color === byColor && types.includes(p.type)) return true;
          break;
        }
        r += dr;
        c += dc;
      }
    }
    return false;
  };

  if (scan(BISHOP_DIRS, ["b", "q"])) return true;
  if (scan(ROOK_DIRS, ["r", "q"])) return true;
  return false;
}

export function isInCheck(state: GameState, color: Color): boolean {
  const king = state.kings[color];
  return isSquareAttacked(state.board, king.row, king.col, opposite(color));
}

function addSlide(
  board: (Piece | null)[][],
  from: Square,
  color: Color,
  dirs: readonly (readonly [number, number])[],
  moves: Move[],
) {
  for (const [dr, dc] of dirs) {
    let r = from.row + dr;
    let c = from.col + dc;
    while (inBounds(r, c)) {
      const target = board[r][c];
      if (!target) {
        moves.push({ from, to: { row: r, col: c } });
      } else {
        if (target.color !== color) {
          moves.push({ from, to: { row: r, col: c } });
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }
}

function pawnMoves(state: GameState, from: Square, piece: Piece, moves: Move[]) {
  const dir = piece.color === "w" ? -1 : 1;
  const startRow = piece.color === "w" ? 6 : 1;
  const promoRow = piece.color === "w" ? 0 : 7;
  const { board } = state;

  const oneRow = from.row + dir;
  if (inBounds(oneRow, from.col) && !board[oneRow][from.col]) {
    pushPawnTo(from, oneRow, from.col, promoRow, moves);
    const twoRow = from.row + dir * 2;
    if (from.row === startRow && inBounds(twoRow, from.col) && !board[twoRow][from.col]) {
      moves.push({ from, to: { row: twoRow, col: from.col } });
    }
  }

  for (const dc of [-1, 1]) {
    const r = from.row + dir;
    const c = from.col + dc;
    if (!inBounds(r, c)) continue;
    const target = board[r][c];
    if (target && target.color !== piece.color) {
      pushPawnTo(from, r, c, promoRow, moves);
    } else if (state.enPassant && state.enPassant.row === r && state.enPassant.col === c) {
      moves.push({ from, to: { row: r, col: c }, enPassant: true });
    }
  }
}

function pushPawnTo(from: Square, row: number, col: number, promoRow: number, moves: Move[]) {
  if (row === promoRow) {
    for (const promotion of ["q", "r", "b", "n"] as PieceType[]) {
      moves.push({ from, to: { row, col }, promotion });
    }
  } else {
    moves.push({ from, to: { row, col } });
  }
}

function castleMoves(state: GameState, color: Color, moves: Move[]) {
  const row = color === "w" ? 7 : 0;
  const rights = state.castling;
  const kingFrom: Square = { row, col: 4 };
  const opp = opposite(color);
  if (isSquareAttacked(state.board, row, 4, opp)) return;

  const trySide = (kind: "k" | "q") => {
    const allowed = color === "w" ? (kind === "k" ? rights.wK : rights.wQ) : kind === "k" ? rights.bK : rights.bQ;
    if (!allowed) return;
    const rookCol = kind === "k" ? 7 : 0;
    const rook = state.board[row][rookCol];
    if (!rook || rook.type !== "r" || rook.color !== color) return;

    const path = kind === "k" ? [5, 6] : [1, 2, 3];
    for (const col of path) {
      if (state.board[row][col]) return;
    }
    const kingPath = kind === "k" ? [5, 6] : [3, 2];
    for (const col of kingPath) {
      if (isSquareAttacked(state.board, row, col, opp)) return;
    }
    moves.push({
      from: kingFrom,
      to: { row, col: kind === "k" ? 6 : 2 },
      castle: kind,
    });
  };

  trySide("k");
  trySide("q");
}

export function getPseudoLegalMoves(state: GameState, from: Square): Move[] {
  const piece = state.board[from.row][from.col];
  if (!piece || piece.color !== state.turn) return [];
  const moves: Move[] = [];

  switch (piece.type) {
    case "p":
      pawnMoves(state, from, piece, moves);
      break;
    case "n":
      for (const [dr, dc] of KNIGHT_OFFS) {
        const r = from.row + dr;
        const c = from.col + dc;
        if (!inBounds(r, c)) continue;
        const t = state.board[r][c];
        if (!t || t.color !== piece.color) moves.push({ from, to: { row: r, col: c } });
      }
      break;
    case "b":
      addSlide(state.board, from, piece.color, BISHOP_DIRS, moves);
      break;
    case "r":
      addSlide(state.board, from, piece.color, ROOK_DIRS, moves);
      break;
    case "q":
      addSlide(state.board, from, piece.color, BISHOP_DIRS, moves);
      addSlide(state.board, from, piece.color, ROOK_DIRS, moves);
      break;
    case "k":
      for (const [dr, dc] of KING_OFFS) {
        const r = from.row + dr;
        const c = from.col + dc;
        if (!inBounds(r, c)) continue;
        const t = state.board[r][c];
        if (!t || t.color !== piece.color) moves.push({ from, to: { row: r, col: c } });
      }
      castleMoves(state, piece.color, moves);
      break;
  }

  return moves;
}

export function applyMove(state: GameState, move: Move): GameState {
  const next = cloneState(state);
  const piece = next.board[move.from.row][move.from.col];
  if (!piece) return next;

  const moving = { ...piece };
  next.board[move.from.row][move.from.col] = null;

  if (move.enPassant) {
    const capRow = move.from.row;
    next.board[capRow][move.to.col] = null;
  }

  if (move.castle) {
    const row = move.from.row;
    if (move.castle === "k") {
      const rook = next.board[row][7];
      next.board[row][7] = null;
      next.board[row][5] = rook;
    } else {
      const rook = next.board[row][0];
      next.board[row][0] = null;
      next.board[row][3] = rook;
    }
  }

  if (move.promotion) {
    moving.type = move.promotion;
  }

  next.board[move.to.row][move.to.col] = moving;

  if (moving.type === "k") {
    next.kings[moving.color] = { row: move.to.row, col: move.to.col };
  }

  next.enPassant = null;
  if (moving.type === "p" && Math.abs(move.to.row - move.from.row) === 2) {
    next.enPassant = { row: (move.from.row + move.to.row) / 2, col: move.from.col };
  }

  next.castling = updateCastling(next.castling, move, piece);

  next.turn = opposite(state.turn);
  return next;
}

function updateCastling(rights: CastlingRights, move: Move, piece: Piece): CastlingRights {
  const next = { ...rights };
  if (piece.type === "k") {
    if (piece.color === "w") {
      next.wK = false;
      next.wQ = false;
    } else {
      next.bK = false;
      next.bQ = false;
    }
  }
  const clearRook = (row: number, col: number) => {
    if (row === 7 && col === 7) next.wK = false;
    if (row === 7 && col === 0) next.wQ = false;
    if (row === 0 && col === 7) next.bK = false;
    if (row === 0 && col === 0) next.bQ = false;
  };
  if (piece.type === "r") clearRook(move.from.row, move.from.col);
  clearRook(move.to.row, move.to.col);
  return next;
}

export function getLegalMovesFrom(state: GameState, from: Square): Move[] {
  const piece = state.board[from.row][from.col];
  if (!piece || piece.color !== state.turn) return [];
  return getPseudoLegalMoves(state, from).filter((move) => {
    const next = applyMove(state, move);
    return !isInCheck(next, piece.color);
  });
}

export function getAllLegalMoves(state: GameState): Move[] {
  const moves: Move[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      if (piece && piece.color === state.turn) {
        moves.push(...getLegalMovesFrom(state, { row, col }));
      }
    }
  }
  return moves;
}

export function onlyTwoKings(state: GameState): boolean {
  let count = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (state.board[row][col]) {
        count++;
        if (count > 2) return false;
      }
    }
  }
  return count === 2;
}

export function getGameResult(state: GameState): GameResult {
  if (onlyTwoKings(state)) return { type: "draw" };
  const moves = getAllLegalMoves(state);
  if (moves.length === 0) {
    const winner = opposite(state.turn);
    if (isInCheck(state, state.turn)) return { type: "checkmate", winner };
    return { type: "nomoves", winner };
  }
  return { type: "playing" };
}

export function isCaptureMove(state: GameState, move: Move): boolean {
  if (move.enPassant) return true;
  return state.board[move.to.row][move.to.col] !== null;
}

export function squareName(sq: Square): string {
  return `${"abcdefgh"[sq.col]}${8 - sq.row}`;
}

export function moveToNotation(state: GameState, move: Move): string {
  if (move.castle === "k") return "O-O";
  if (move.castle === "q") return "O-O-O";

  const piece = state.board[move.from.row][move.from.col];
  if (!piece) return squareName(move.to);

  const captured = isCaptureMove(state, move);
  const next = applyMove(state, move);
  const check = isInCheck(next, next.turn);
  const result = getGameResult(next);
  const mate = result.type === "checkmate" || result.type === "nomoves";

  let san = "";
  if (piece.type === "p") {
    if (captured) san += `${"abcdefgh"[move.from.col]}x${squareName(move.to)}`;
    else san += squareName(move.to);
    if (move.promotion) san += `=${move.promotion.toUpperCase()}`;
  } else {
    san += piece.type.toUpperCase();
    const others = getAllLegalMoves(state).filter(
      (m) =>
        !(m.from.row === move.from.row && m.from.col === move.from.col) &&
        m.to.row === move.to.row &&
        m.to.col === move.to.col &&
        state.board[m.from.row][m.from.col]?.type === piece.type,
    );
    if (others.length) {
      const sameFile = others.some((m) => m.from.col === move.from.col);
      const sameRank = others.some((m) => m.from.row === move.from.row);
      if (!sameFile) san += "abcdefgh"[move.from.col];
      else if (!sameRank) san += `${8 - move.from.row}`;
      else san += squareName(move.from);
    }
    if (captured) san += "x";
    san += squareName(move.to);
  }

  if (mate) san += "#";
  else if (check) san += "+";
  return san;
}

export function findMove(
  legal: Move[],
  from: Square,
  to: Square,
  promotion?: PieceType,
): Move | undefined {
  return legal.find((m) => {
    if (m.from.row !== from.row || m.from.col !== from.col) return false;
    if (m.to.row !== to.row || m.to.col !== to.col) return false;
    if (promotion) return m.promotion === promotion;
    if (m.promotion) return m.promotion === "q";
    return true;
  });
}

export function collectPieces(state: GameState): Piece[] {
  const pieces: Piece[] = [];
  for (const row of state.board) {
    for (const p of row) {
      if (p) pieces.push(p);
    }
  }
  return pieces;
}

export function pieceAt(state: GameState, id: number): { piece: Piece; square: Square } | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const p = state.board[row][col];
      if (p && p.id === id) return { piece: p, square: { row, col } };
    }
  }
  return null;
}

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
export const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];
