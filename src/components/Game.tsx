import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chooseAiMove, DIFFICULTY_LABELS } from "../chess/ai";
import {
  applyMove,
  collectPieces,
  createInitialState,
  findMove,
  getGameResult,
  getLegalMovesFrom,
  isInCheck,
  moveToNotation,
  opposite,
} from "../chess/engine";
import type {
  Color,
  GameResult,
  GameSettings,
  GameState,
  HistoryEntry,
  Move,
  Piece,
  PieceType,
  Square,
} from "../chess/types";
import menuBg from "../assets/menu-bg.jpg?inline";
import ChessBoard from "./ChessBoard";
import ChessPiece from "./ChessPiece";
import PromotionDialog from "./PromotionDialog";
import { cn } from "../utils/cn";

interface Props {
  settings: GameSettings;
  onExit: () => void;
}

const PIECE_VAL: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  if (clamped < 10000) {
    const t = clamped / 1000;
    return t.toFixed(1);
  }
  const total = Math.ceil(clamped / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Game({ settings, onExit }: Props) {
  const humanColor = useMemo<Color>(() => {
    if (settings.opponent === "human") return "w";
    if (settings.playerColor === "random") return Math.random() < 0.5 ? "w" : "b";
    return settings.playerColor;
  }, [settings]);

  const [state, setState] = useState<GameState>(() => createInitialState());
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [captured, setCaptured] = useState<{ w: Piece[]; b: Piece[] }>({ w: [], b: [] });
  const [result, setResult] = useState<GameResult>({ type: "playing" });
  const [promotion, setPromotion] = useState<{ from: Square; to: Square; moves: Move[] } | null>(null);
  const [flipped, setFlipped] = useState(settings.opponent === "ai" && humanColor === "b");
  const [animating, setAnimating] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [clock, setClock] = useState({ w: settings.minutes * 60_000, b: settings.minutes * 60_000 });
  const [confirmResign, setConfirmResign] = useState(false);

  const stateRef = useRef(state);
  const resultRef = useRef(result);
  const aiTimer = useRef<number | null>(null);
  const flipTimer = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  const checkedColor = isInCheck(state, state.turn) ? state.turn : null;
  const playing = result.type === "playing";

  const isHumanTurn = useMemo(() => {
    if (!playing) return false;
    if (settings.opponent === "human") return true;
    return state.turn === humanColor;
  }, [playing, settings.opponent, state.turn, humanColor]);

  const playMove = useCallback(
    (move: Move, current: GameState) => {
      const notation = moveToNotation(current, move);
      const capturedPiece = move.enPassant
        ? current.board[move.from.row][move.to.col]
        : current.board[move.to.row][move.to.col];
      const next = applyMove(current, move);
      const nextResult = getGameResult(next);

      setState(next);
      setLastMove(move);
      setSelected(null);
      setLegalMoves([]);
      setHistory((h) => [...h, { move, notation, captured: capturedPiece }]);
      if (capturedPiece) {
        setCaptured((c) => ({
          ...c,
          [capturedPiece.color]: [...c[capturedPiece.color], capturedPiece],
        }));
      }
      if (settings.timerEnabled) {
        setClock((cl) => ({
          ...cl,
          [current.turn]: cl[current.turn] + settings.increment * 1000,
        }));
      }
      setResult(nextResult);

      if (
        settings.opponent === "human" &&
        settings.flipEachTurn &&
        nextResult.type === "playing"
      ) {
        if (flipTimer.current) window.clearTimeout(flipTimer.current);
        flipTimer.current = window.setTimeout(() => {
          setAnimating(false);
          setFlipped(next.turn === "b");
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setAnimating(true));
          });
        }, 420);
      }

      return next;
    },
    [settings],
  );

  useEffect(() => {
    if (!playing) return;
    if (settings.opponent !== "ai") return;
    if (state.turn === humanColor) return;

    let cancelled = false;
    setThinking(true);
    const snapshot = state;
    aiTimer.current = window.setTimeout(() => {
      if (cancelled) return;
      const move = chooseAiMove(snapshot, settings.difficulty);
      setThinking(false);
      if (!move || cancelled) return;
      if (resultRef.current.type !== "playing") return;
      playMove(move, snapshot);
    }, 380);

    return () => {
      cancelled = true;
      if (aiTimer.current) window.clearTimeout(aiTimer.current);
    };
  }, [state, playing, settings, humanColor, playMove]);

  useEffect(() => {
    if (!settings.timerEnabled || !playing) return;
    const id = window.setInterval(() => {
      setClock((cl) => {
        const key = stateRef.current.turn;
        const nextVal = cl[key] - 100;
        if (nextVal <= 0) {
          setResult({ type: "timeout", winner: opposite(key) });
          return { ...cl, [key]: 0 };
        }
        return { ...cl, [key]: nextVal };
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [settings.timerEnabled, playing, state.turn]);

  useEffect(() => {
    return () => {
      if (aiTimer.current) window.clearTimeout(aiTimer.current);
      if (flipTimer.current) window.clearTimeout(flipTimer.current);
    };
  }, []);

  const onSquareClick = (sq: Square) => {
    if (!playing || !isHumanTurn || thinking || promotion) return;
    const piece = state.board[sq.row][sq.col];

    if (selected) {
      const destMoves = legalMoves.filter((m) => m.to.row === sq.row && m.to.col === sq.col);
      if (destMoves.length) {
        const promoMoves = destMoves.filter((m) => m.promotion);
        if (promoMoves.length > 1) {
          setPromotion({ from: selected, to: sq, moves: promoMoves });
          return;
        }
        const move = destMoves[0];
        playMove(move, state);
        return;
      }
    }

    if (piece && piece.color === state.turn) {
      if (selected && selected.row === sq.row && selected.col === sq.col) {
        setSelected(null);
        setLegalMoves([]);
        return;
      }
      setSelected(sq);
      setLegalMoves(getLegalMovesFrom(state, sq));
      return;
    }

    setSelected(null);
    setLegalMoves([]);
  };

  const onPromote = (type: PieceType) => {
    if (!promotion) return;
    const move = findMove(promotion.moves, promotion.from, promotion.to, type);
    setPromotion(null);
    if (move) playMove(move, state);
  };

  const resign = () => {
    if (!playing) return;
    const loser = settings.opponent === "ai" ? humanColor : state.turn;
    setResult({ type: "resign", winner: opposite(loser) });
    setConfirmResign(false);
  };

  const material = useMemo(() => {
    let w = 0;
    let b = 0;
    for (const p of collectPieces(state)) {
      if (p.color === "w") w += PIECE_VAL[p.type];
      else b += PIECE_VAL[p.type];
    }
    return { w, b, diff: w - b };
  }, [state]);

  const statusText = (() => {
    if (thinking) return "Computer is thinking…";
    if (result.type === "playing") {
      if (checkedColor) return `${checkedColor === "w" ? "White" : "Black"} is in check`;
      return `${state.turn === "w" ? "White" : "Black"} to move`;
    }
    return "";
  })();

  const rematch = () => {
    setState(createInitialState());
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setHistory([]);
    setCaptured({ w: [], b: [] });
    setResult({ type: "playing" });
    setPromotion(null);
    setFlipped(settings.opponent === "ai" && humanColor === "b");
    setAnimating(true);
    setThinking(false);
    setClock({ w: settings.minutes * 60_000, b: settings.minutes * 60_000 });
    setConfirmResign(false);
  };

  const nameFor = (color: Color) => {
    if (settings.opponent === "ai") {
      return color === humanColor ? "You" : `Computer · ${DIFFICULTY_LABELS[settings.difficulty]}`;
    }
    return color === "w" ? "White" : "Black";
  };

  const topColor: Color = flipped ? "w" : "b";
  const bottomColor: Color = flipped ? "b" : "w";

  const cardProps = (color: Color) => ({
    name: nameFor(color),
    color,
    active: playing && state.turn === color,
    clock: settings.timerEnabled ? clock[color] : null,
    captured: color === "w" ? captured.b : captured.w,
    advantage: color === "w" ? Math.max(0, material.diff) : Math.max(0, -material.diff),
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0907] text-stone-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url(${menuBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(8px) saturate(0.7)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#0b0907]/90 to-black" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col gap-4 px-3 py-4 lg:flex-row lg:items-center lg:justify-center lg:gap-8 lg:px-6">
        <div className="mx-auto flex w-full max-w-[min(94vw,820px)] flex-col gap-3 lg:max-w-[min(58vw,780px)]">
          <PlayerCard {...cardProps(topColor)} />

          {statusText && (
            <div
              className="text-center font-display text-sm uppercase tracking-[0.28em] text-amber-200/80"
              style={{ animation: "banner-in 0.35s ease" }}
            >
              {statusText}
              {thinking && (
                <span
                  className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-400"
                  style={{ animation: "soft-pulse 1s infinite" }}
                />
              )}
            </div>
          )}

          <div className="relative">
            <ChessBoard
              state={state}
              flipped={flipped}
              selected={selected}
              legalMoves={legalMoves}
              lastMove={lastMove}
              checkedColor={checkedColor}
              disabled={!playing || !isHumanTurn || !!promotion}
              animating={animating}
              onSquareClick={onSquareClick}
            />
            {promotion && <PromotionDialog color={state.turn} onChoose={onPromote} />}
            {result.type !== "playing" && (
              <GameOverCard result={result} onExit={onExit} onRematch={rematch} />
            )}
          </div>

          <PlayerCard {...cardProps(bottomColor)} />

          <div className="flex flex-wrap items-center justify-center gap-2">
            <GhostButton onClick={onExit}>Menu</GhostButton>
            <GhostButton
              onClick={() => {
                setAnimating(false);
                setFlipped((f) => !f);
                requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)));
              }}
            >
              Flip board
            </GhostButton>
            {playing && (
              <GhostButton onClick={() => setConfirmResign(true)} danger>
                Resign
              </GhostButton>
            )}
          </div>
        </div>

        <aside className="mx-auto w-full max-w-[min(94vw,820px)] lg:mx-0 lg:w-72">
          <div className="panel-card rounded-xl p-3">
            <h3 className="font-display text-xs uppercase tracking-[0.25em] text-amber-200/70">
              Moves
            </h3>
            <ol className="history-scroll mt-2 max-h-40 overflow-y-auto text-sm lg:max-h-[28rem]">
              {history.length === 0 && (
                <li className="text-stone-500">The match has not begun.</li>
              )}
              {Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => {
                const w = history[i * 2];
                const b = history[i * 2 + 1];
                return (
                  <li key={i} className="grid grid-cols-[2rem_1fr_1fr] gap-2 py-0.5">
                    <span className="text-stone-500">{i + 1}.</span>
                    <span className={cn(lastMove === w?.move && "text-amber-200")}>{w?.notation}</span>
                    <span className={cn(lastMove === b?.move && "text-amber-200")}>{b?.notation}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </div>

      {confirmResign && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="panel-card max-w-sm rounded-2xl p-6 text-center">
            <h3 className="font-display text-xl text-amber-200">Resign the match?</h3>
            <p className="mt-2 text-sm text-stone-400">This will count as a loss.</p>
            <div className="mt-5 flex justify-center gap-3">
              <GhostButton onClick={() => setConfirmResign(false)}>Cancel</GhostButton>
              <GhostButton danger onClick={resign}>
                Resign
              </GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerCard({
  name,
  color,
  active,
  clock,
  captured,
  advantage,
}: {
  name: string;
  color: Color;
  active: boolean;
  clock: number | null;
  captured: Piece[];
  advantage: number;
}) {
  return (
    <div
      className={cn(
        "panel-card rounded-xl p-3",
        active && "border-amber-400/60 shadow-[0_0_24px_rgba(201,162,39,0.15)]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-3 w-3 rounded-full border",
              color === "w" ? "bg-[#f4efe6] border-stone-500" : "bg-[#1a1a1e] border-stone-500",
            )}
          />
          <div>
            <div className="font-display text-sm tracking-wide">{name}</div>
            <div className="text-[11px] uppercase tracking-widest text-stone-500">
              {color === "w" ? "White" : "Black"}
            </div>
          </div>
        </div>
        {clock !== null && (
          <div
            className={cn(
              "rounded-lg px-3 py-1 font-display text-2xl tabular-nums",
              clock < 10000 ? "bg-red-900/50 text-red-300" : "bg-black/30 text-amber-100",
              active && clock >= 10000 && "text-amber-300",
            )}
          >
            {formatClock(clock)}
          </div>
        )}
      </div>
      <div className="mt-2 flex min-h-8 flex-wrap items-center gap-0.5">
        {captured
          .slice()
          .sort((a, b) => PIECE_VAL[b.type] - PIECE_VAL[a.type])
          .map((p) => (
            <div key={p.id} className="h-7 w-7">
              <ChessPiece type={p.type} color={p.color} className="h-full w-full opacity-90" />
            </div>
          ))}
        {advantage > 0 && (
          <span className="ml-1 text-xs text-amber-200/80">+{advantage}</span>
        )}
      </div>
    </div>
  );
}

function GhostButton({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-sm tracking-wide transition",
        danger
          ? "border-red-500/40 text-red-300 hover:bg-red-500/10"
          : "border-amber-400/25 text-amber-100/80 hover:border-amber-300/50 hover:bg-amber-400/10",
      )}
    >
      {children}
    </button>
  );
}

function GameOverCard({
  result,
  onExit,
  onRematch,
}: {
  result: GameResult;
  onExit: () => void;
  onRematch: () => void;
}) {
  let title = "";
  let sub = "";
  let pieceColor: Color = "w";
  if (result.type === "checkmate") {
    title = "Checkmate";
    sub = `${result.winner === "w" ? "White" : "Black"} wins`;
    pieceColor = result.winner;
  } else if (result.type === "nomoves") {
    title = "No legal moves";
    sub = `${result.winner === "w" ? "White" : "Black"} wins`;
    pieceColor = result.winner;
  } else if (result.type === "draw") {
    title = "Draw";
    sub = "Only two kings remain";
  } else if (result.type === "timeout") {
    title = "Time expired";
    sub = `${result.winner === "w" ? "White" : "Black"} wins on time`;
    pieceColor = result.winner;
  } else if (result.type === "resign") {
    title = "Resignation";
    sub = `${result.winner === "w" ? "White" : "Black"} wins`;
    pieceColor = result.winner;
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
      <div className="panel-card mx-4 max-w-sm rounded-2xl p-7 text-center" style={{ animation: "fade-up 0.35s ease" }}>
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center">
          <ChessPiece type="k" color={pieceColor} className="h-14 w-14" />
        </div>
        <h2 className="font-display gold-text text-3xl tracking-[0.18em]">{title}</h2>
        <p className="mt-2 text-stone-300">{sub}</p>
        <div className="mt-6 flex justify-center gap-3">
          <GhostButton onClick={onExit}>Menu</GhostButton>
          <button
            type="button"
            onClick={onRematch}
            className="rounded-lg bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 px-4 py-1.5 font-display tracking-widest text-stone-950"
          >
            Rematch
          </button>
        </div>
      </div>
    </div>
  );
}
