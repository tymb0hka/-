import { useState } from "react";
import Game from "./components/Game";
import GameMenu from "./components/GameMenu";
import type { GameSettings } from "./chess/types";

export default function App() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [matchId, setMatchId] = useState(0);

  if (!settings) {
    return (
      <GameMenu
        onStart={(next) => {
          setSettings(next);
          setMatchId((n) => n + 1);
        }}
      />
    );
  }

  return (
    <Game
      key={matchId}
      settings={settings}
      onExit={() => setSettings(null)}
    />
  );
}
