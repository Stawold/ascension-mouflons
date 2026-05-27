import { useState, useEffect, useCallback } from 'react';
import { loadState, saveState, clearState, createInitialState } from './store/gameState';
import MasterScreen from './screens/MasterScreen';
import PlayerScreen from './screens/PlayerScreen';

export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'setup' | 'master' | 'player'
  const [gameState, setGameState] = useState(null);

  // Listen for localStorage changes (cross-tab sync)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'kilimontferrier_state') {
        const newState = loadState();
        if (newState) setGameState(newState);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Poll for changes (same tab won't get storage events)
  useEffect(() => {
    if (view !== 'player') return;
    const interval = setInterval(() => {
      const saved = loadState();
      if (saved) {
        setGameState(prev => {
          if (!prev || JSON.stringify(saved) !== JSON.stringify(prev)) {
            return saved;
          }
          return prev;
        });
      }
    }, 500);
    return () => clearInterval(interval);
  }, [view]);

  const updateState = useCallback((updater) => {
    setGameState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveState(next);
      return next;
    });
  }, []);

  const startGame = (playerNames) => {
    const initial = createInitialState(playerNames);
    saveState(initial);
    setGameState(initial);
    setView('master');
  };

  const resetGame = () => {
    clearState();
    setGameState(null);
    setView('home');
  };

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">⛰️</div>
          <h1 className="text-4xl font-bold text-white mb-2">Au Sommet du</h1>
          <h1 className="text-5xl font-bold text-blue-300">Kilimontferrier</h1>
          <p className="text-slate-400 mt-4 text-lg">Jeu d'aventure narratif pour 2–6 joueurs</p>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => setView('setup')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl text-xl transition-colors"
          >
            🚀 Nouvelle Partie
          </button>
          <button
            onClick={() => {
              const saved = loadState();
              if (saved) {
                setGameState(saved);
                setView('master');
              } else {
                alert('Aucune partie sauvegardée.');
              }
            }}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-8 rounded-xl text-xl transition-colors"
          >
            📂 Reprendre la Partie
          </button>
          <button
            onClick={() => {
              const saved = loadState();
              if (saved) {
                setGameState(saved);
                setView('player');
              } else {
                alert('Aucune partie en cours.');
              }
            }}
            className="bg-green-700 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-xl text-xl transition-colors"
          >
            🎮 Écran Joueurs
          </button>
        </div>
        <div className="mt-8 text-slate-500 text-sm text-center">
          <p>Ouvrez cet onglet sur l'écran principal (Régie)</p>
          <p>Ouvrez un second onglet et choisissez "Écran Joueurs"</p>
        </div>
      </div>
    );
  }

  if (view === 'setup') {
    return <SetupScreen onStart={startGame} onBack={() => setView('home')} />;
  }

  if (view === 'master' && gameState) {
    return <MasterScreen gameState={gameState} updateState={updateState} onReset={resetGame} onSwitchToPlayer={() => setView('player')} />;
  }

  if (view === 'player' && gameState) {
    return <PlayerScreen gameState={gameState} onBack={() => setView('home')} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-white">Chargement...</div>
    </div>
  );
}

function SetupScreen({ onStart, onBack }) {
  const [playerCount, setPlayerCount] = useState(3);
  const [playerNames, setPlayerNames] = useState(['Joueur 1', 'Joueur 2', 'Joueur 3', '', '', '']);

  const handleCountChange = (count) => {
    setPlayerCount(count);
    setPlayerNames(prev => {
      const next = [...prev];
      for (let i = 0; i < 6; i++) {
        if (!next[i] || next[i] === `Joueur ${i + 1}`) {
          next[i] = i < count ? `Joueur ${i + 1}` : '';
        }
      }
      return next;
    });
  };

  const handleStart = () => {
    const names = playerNames.slice(0, playerCount).map((n, i) => n.trim() || `Joueur ${i + 1}`);
    onStart(names);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-blue-950 flex flex-col items-center justify-center p-6">
      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">⛰️ Configuration de la Partie</h2>

        <div className="mb-6">
          <label className="text-slate-300 text-sm font-semibold mb-2 block">Nombre de joueurs</label>
          <div className="flex gap-2">
            {[2,3,4,5,6].map(n => (
              <button
                key={n}
                onClick={() => handleCountChange(n)}
                className={`flex-1 py-2 rounded-lg font-bold transition-colors ${playerCount === n ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 space-y-3">
          <label className="text-slate-300 text-sm font-semibold block">Noms des joueurs</label>
          {Array.from({ length: playerCount }).map((_, i) => (
            <input
              key={i}
              type="text"
              value={playerNames[i] || ''}
              onChange={(e) => {
                const next = [...playerNames];
                next[i] = e.target.value;
                setPlayerNames(next);
              }}
              placeholder={`Joueur ${i + 1}`}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onBack} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-colors">
            ← Retour
          </button>
          <button onClick={handleStart} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 px-6 rounded-xl font-bold transition-colors">
            🚀 Démarrer !
          </button>
        </div>
      </div>
    </div>
  );
}
