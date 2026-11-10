import { useState, type ReactNode } from "react";
import { DIFFICULTY_BLURBS, DIFFICULTY_LABELS } from "../chess/ai";
import type { Difficulty, GameSettings, Opponent } from "../chess/types";
import menuBg from "../assets/menu-bg.jpg?inline";
import ChessPiece from "./ChessPiece";
import { cn } from "../utils/cn";

interface Props {
  onStart: (settings: GameSettings) => void;
}

const TIME_PRESETS = [
  { minutes: 1, increment: 0, label: "1+0" },
  { minutes: 3, increment: 0, label: "3+0" },
  { minutes: 5, increment: 0, label: "5+0" },
  { minutes: 10, increment: 0, label: "10+0" },
  { minutes: 15, increment: 10, label: "15+10" },
  { minutes: 30, increment: 0, label: "30+0" },
];

export default function GameMenu({ onStart }: Props) {
  const [opponent, setOpponent] = useState<Opponent>("ai");
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [minutes, setMinutes] = useState(10);
  const [increment, setIncrement] = useState(0);
  const [playerColor, setPlayerColor] = useState<"w" | "b" | "random">("w");
  const [flipEachTurn, setFlipEachTurn] = useState(true);

  const start = () => {
    onStart({
      opponent,
      difficulty,
      timerEnabled,
      minutes,
      increment,
      playerColor,
      flipEachTurn,
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url(${menuBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_70%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 text-center" style={{ animation: "fade-up 0.7s ease both" }}>
          <div className="mb-3 flex items-center justify-center gap-3 text-amber-200/80">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-amber-200/70" />
            <ChessPiece type="k" color="w" className="h-8 w-8" />
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-amber-200/70" />
          </div>
          <h1 className="font-display gold-text text-5xl tracking-[0.28em] sm:text-7xl">CHESS</h1>
          <p className="mt-3 text-sm uppercase tracking-[0.42em] text-amber-100/60">
            A game of kings
          </p>
        </div>

        <div
          className="panel-card w-full max-w-2xl rounded-2xl p-5 sm:p-8"
          style={{ animation: "fade-up 0.8s ease 0.1s both" }}
        >
          <Section title="Opponent">
            <div className="grid grid-cols-2 gap-3">
              <Choice
                active={opponent === "human"}
                onClick={() => setOpponent("human")}
                title="Pass & Play"
                subtitle="Two players, one device"
              />
              <Choice
                active={opponent === "ai"}
                onClick={() => setOpponent("ai")}
                title="Computer"
                subtitle="Adjustable strength"
              />
            </div>
          </Section>

          {opponent === "ai" && (
            <>
              <Section title="Difficulty">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="font-display text-xl text-amber-200">
                      {DIFFICULTY_LABELS[difficulty]}
                    </div>
                    <p className="mt-1 text-sm text-stone-400">{DIFFICULTY_BLURBS[difficulty]}</p>
                  </div>
                  <span className="text-xs uppercase tracking-widest text-stone-500">
                    {difficulty}/6
                  </span>
                </div>
                <input
                  className="range-gold mt-4 w-full"
                  type="range"
                  min={1}
                  max={6}
                  step={1}
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value) as Difficulty)}
                />
                <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-stone-500">
                  <span>Easiest</span>
                  <span>Impossible</span>
                </div>
              </Section>

              <Section title="Play as">
                <div className="grid grid-cols-3 gap-3">
                  <Choice
                    active={playerColor === "w"}
                    onClick={() => setPlayerColor("w")}
                    title="White"
                    subtitle="Move first"
                  />
                  <Choice
                    active={playerColor === "b"}
                    onClick={() => setPlayerColor("b")}
                    title="Black"
                    subtitle="Move second"
                  />
                  <Choice
                    active={playerColor === "random"}
                    onClick={() => setPlayerColor("random")}
                    title="Random"
                    subtitle="Coin toss"
                  />
                </div>
              </Section>
            </>
          )}

          {opponent === "human" && (
            <Section title="Board">
              <Toggle
                label="Flip board each turn"
                hint="So each player sees their army at the bottom"
                value={flipEachTurn}
                onChange={setFlipEachTurn}
              />
            </Section>
          )}

          <Section title="Tournament clock">
            <Toggle
              label="Enable timer"
              hint="Each side gets a chess clock"
              value={timerEnabled}
              onChange={setTimerEnabled}
            />
            {timerEnabled && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {TIME_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setMinutes(p.minutes);
                        setIncrement(p.increment);
                      }}
                      className={cn(
                        "rounded-lg border px-2 py-2 font-display text-sm tracking-wide transition",
                        minutes === p.minutes && increment === p.increment
                          ? "border-amber-400 bg-amber-400/15 text-amber-200"
                          : "border-white/10 bg-black/20 text-stone-300 hover:border-amber-300/40",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <NumberField
                    label="Minutes"
                    value={minutes}
                    min={1}
                    max={60}
                    onChange={setMinutes}
                  />
                  <NumberField
                    label="Increment (sec)"
                    value={increment}
                    min={0}
                    max={30}
                    onChange={setIncrement}
                  />
                </div>
              </div>
            )}
          </Section>

          <button
            type="button"
            onClick={start}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 py-3.5 font-display text-lg tracking-[0.28em] text-stone-950 shadow-[0_10px_30px_rgba(201,162,39,0.28)] transition hover:brightness-110"
          >
            START MATCH
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <h2 className="mb-3 font-display text-xs uppercase tracking-[0.28em] text-amber-200/70">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Choice({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-3 text-left transition",
        active
          ? "border-amber-400 bg-amber-400/12 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.25)]"
          : "border-white/10 bg-black/25 hover:border-amber-200/30",
      )}
    >
      <div className={cn("font-display tracking-wide", active ? "text-amber-200" : "text-stone-100")}>
        {title}
      </div>
      <div className="mt-0.5 text-xs text-stone-400">{subtitle}</div>
    </button>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="flex w-full items-center justify-between gap-4">
      <div className="text-left">
        <div className="text-stone-100">{label}</div>
        <div className="text-xs text-stone-500">{hint}</div>
      </div>
      <span
        className={cn(
          "toggle-track relative h-7 w-12 rounded-full",
          value ? "bg-amber-500" : "bg-stone-700",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all",
            value ? "left-5" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-stone-500">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-stone-100 outline-none focus:border-amber-400/60"
      />
    </label>
  );
}
