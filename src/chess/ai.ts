import {
  applyMove,
  getAllLegalMoves,
  isCaptureMove,
  isInCheck,
  onlyTwoKings,
} from "./engine";
import type { Color, Difficulty, GameState, Move, PieceType } from "./types";

const PIECE_VALUE: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

const PAWN_PST = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 27, 27, 10, 5, 5],
  [0, 0, 0, 25, 25, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_PST = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_PST = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_PST = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

const QUEEN_PST = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_MID = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

const KING_END = [
  [-50, -40, -30, -20, -20, -30, -40, -50],
  [-30, -20, -10, 0, 0, -10, -20, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -30, 0, 0, 0, 0, -30, -30],
  [-50, -30, -30, -30, -30, -30, -30, -50],
];

function pst(table: number[][], row: number, col: number, color: Color): number {
  return color === "w" ? table[row][col] : table[7 - row][col];
}

function evaluate(state: GameState): number {
  let white = 0;
  let black = 0;
  let whiteNonPawn = 0;
  let blackNonPawn = 0;
  let whiteBishops = 0;
  let blackBishops = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const p = state.board[row][col];
      if (!p) continue;
      const val = PIECE_VALUE[p.type];
      if (p.color === "w") {
        white += val;
        if (p.type !== "p" && p.type !== "k") whiteNonPawn += val;
        if (p.type === "b") whiteBishops++;
      } else {
        black += val;
        if (p.type !== "p" && p.type !== "k") blackNonPawn += val;
        if (p.type === "b") blackBishops++;
      }
    }
  }

  const endgame = whiteNonPawn + blackNonPawn < 1300;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const p = state.board[row][col];
      if (!p) continue;
      let s = 0;
      switch (p.type) {
        case "p":
          s = pst(PAWN_PST, row, col, p.color);
          break;
        case "n":
          s = pst(KNIGHT_PST, row, col, p.color);
          break;
        case "b":
          s = pst(BISHOP_PST, row, col, p.color);
          break;
        case "r":
          s = pst(ROOK_PST, row, col, p.color);
          break;
        case "q":
          s = pst(QUEEN_PST, row, col, p.color);
          break;
        case "k":
          s = pst(endgame ? KING_END : KING_MID, row, col, p.color);
          break;
      }
      if (p.color === "w") white += s;
      else black += s;
    }
  }

  if (whiteBishops >= 2) white += 30;
  if (blackBishops >= 2) black += 30;

  const score = white - black;
  return state.turn === "w" ? score : -score;
}

interface SearchStats {
  nodes: number;
  aborted: boolean;
  deadline: number;
}

function timedOut(stats: SearchStats): boolean {
  if ((stats.nodes & 255) !== 0) return stats.aborted;
  if (Date.now() > stats.deadline) {
    stats.aborted = true;
    return true;
  }
  return false;
}

function moveOrderKey(state: GameState, move: Move): number {
  let score = 0;
  if (move.promotion === "q") score += 800;
  if (move.castle) score += 40;
  const victim = move.enPassant ? 100 : PIECE_VALUE[state.board[move.to.row][move.to.col]?.type ?? "k"];
  if (victim) {
    const attacker = PIECE_VALUE[state.board[move.from.row][move.from.col]?.type ?? "p"];
    score += 10 * victim - attacker;
  }
  return score;
}

function orderedMoves(state: GameState, capturesOnly = false): Move[] {
  const moves = getAllLegalMoves(state);
  const filtered = capturesOnly
    ? moves.filter((m) => isCaptureMove(state, m) || m.promotion)
    : moves;
  filtered.sort((a, b) => moveOrderKey(state, b) - moveOrderKey(state, a));
  return filtered;
}

function quiescence(
  state: GameState,
  alpha: number,
  beta: number,
  ply: number,
  stats: SearchStats,
  qDepth: number,
): number {
  stats.nodes++;
  if (timedOut(stats) || qDepth <= 0) return evaluate(state);
  if (onlyTwoKings(state)) return 0;

  const standPat = evaluate(state);
  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;

  const moves = orderedMoves(state, true);
  for (const move of moves) {
    const next = applyMove(state, move);
    const score = -quiescence(next, -beta, -alpha, ply + 1, stats, qDepth - 1);
    if (stats.aborted) return 0;
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function negamax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  stats: SearchStats,
  useQuiescence: boolean,
): number {
  stats.nodes++;
  if (timedOut(stats)) return 0;
  if (onlyTwoKings(state)) return 0;

  const moves = orderedMoves(state, false);
  if (moves.length === 0) {
    if (isInCheck(state, state.turn)) return -100000 + ply;
    return -100000 + ply;
  }

  if (depth <= 0) {
    if (useQuiescence) return quiescence(state, alpha, beta, ply, stats, 6);
    return evaluate(state);
  }

  let best = -Infinity;
  for (const move of moves) {
    const next = applyMove(state, move);
    const score = -negamax(next, depth - 1, -beta, -alpha, ply + 1, stats, useQuiescence);
    if (stats.aborted) return 0;
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

const DIFFICULTY: Record<
  Difficulty,
  { depth: number; time: number; random: number; blunder: number; quiescence: boolean }
> = {
  1: { depth: 1, time: 60, random: 1, blunder: 0.55, quiescence: false },
  2: { depth: 1, time: 120, random: 0.28, blunder: 0.18, quiescence: false },
  3: { depth: 2, time: 280, random: 0.06, blunder: 0.04, quiescence: false },
  4: { depth: 3, time: 450, random: 0, blunder: 0, quiescence: false },
  5: { depth: 3, time: 700, random: 0, blunder: 0, quiescence: true },
  6: { depth: 4, time: 1100, random: 0, blunder: 0, quiescence: true },
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function chooseAiMove(state: GameState, difficulty: Difficulty): Move | null {
  const cfg = DIFFICULTY[difficulty];
  const moves = getAllLegalMoves(state);
  if (!moves.length) return null;

  if (cfg.random >= 1 || Math.random() < cfg.random) {
    return pickRandom(moves);
  }

  const stats: SearchStats = {
    nodes: 0,
    aborted: false,
    deadline: Date.now() + cfg.time,
  };

  let bestMove = moves[0];
  let bestScore = -Infinity;
  const scored: { move: Move; score: number }[] = [];

  const maxDepth = cfg.depth;
  for (let depth = 1; depth <= maxDepth; depth++) {
    let iterBest = bestMove;
    let iterScore = -Infinity;
    const ordered = [...moves].sort((a, b) => moveOrderKey(state, b) - moveOrderKey(state, a));
    if (bestMove) {
      ordered.sort((a, b) => {
        const aBest = a.from.row === bestMove.from.row && a.from.col === bestMove.from.col && a.to.row === bestMove.to.row && a.to.col === bestMove.to.col ? 1 : 0;
        const bBest = b.from.row === bestMove.from.row && b.from.col === bestMove.from.col && b.to.row === bestMove.to.row && b.to.col === bestMove.to.col ? 1 : 0;
        return bBest - aBest;
      });
    }

    const layer: { move: Move; score: number }[] = [];
    for (const move of ordered) {
      const next = applyMove(state, move);
      const score = -negamax(next, depth - 1, -Infinity, Infinity, 1, stats, cfg.quiescence);
      if (stats.aborted) break;
      layer.push({ move, score });
      if (score > iterScore) {
        iterScore = score;
        iterBest = move;
      }
    }

    if (!stats.aborted && layer.length) {
      bestMove = iterBest;
      bestScore = iterScore;
      scored.length = 0;
      scored.push(...layer);
    } else {
      break;
    }
  }

  if (cfg.blunder > 0 && scored.length > 1 && Math.random() < cfg.blunder) {
    const sorted = [...scored].sort((a, b) => b.score - a.score);
    const pool = sorted.slice(0, Math.min(4, sorted.length));
    return pickRandom(pool).move;
  }

  if (difficulty < 6 && scored.length > 1) {
    const near = scored.filter((s) => s.score >= bestScore - 15);
    if (near.length) return pickRandom(near).move;
  }

  return bestMove;
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: "Beginner",
  2: "Easy",
  3: "Intermediate",
  4: "Advanced",
  5: "Master",
  6: "Impossible",
};

export const DIFFICULTY_BLURBS: Record<Difficulty, string> = {
  1: "Plays almost at random — perfect for learning.",
  2: "Sees one move ahead, still makes mistakes.",
  3: "Solid club-level tactics.",
  4: "Looks several moves deep.",
  5: "Strong positional play and tactics.",
  6: "Full calculation. Do not expect mercy.",
};
