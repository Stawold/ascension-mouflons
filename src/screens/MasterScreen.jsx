import { useState } from 'react';
import { CHAPTERS, RESOURCES, MAX_INVENTORY_SLOTS } from '../data/gameData';

export default function MasterScreen({ gameState, updateState, onReset, onSwitchToPlayer }) {
  const [d18Input, setD18Input] = useState('');
  const [d6Input, setD6Input] = useState('');
  const [d18Result, setD18Result] = useState(null);
  const [d6Result, setD6Result] = useState(null);
  const [showInventoryModal, setShowInventoryModal] = useState(null); // playerId
  const [narratorLog, setNarratorLog] = useState([]);
  const [bearScores, setBearScores] = useState({});
  const [bearOursScore, setBearOursScore] = useState('');
  const [showBearFight, setShowBearFight] = useState(false);

  const chapter = CHAPTERS[gameState.currentChapter];
  const activePlayers = gameState.players.filter(p => !p.isKO);

  const addLog = (msg) => setNarratorLog(prev => [`[Ch.${gameState.currentChapter}] ${msg}`, ...prev].slice(0, 20));

  const applyD18Event = (roll) => {
    const evt = roll <= 6 ? chapter.d18Events.low : roll <= 12 ? chapter.d18Events.mid : chapter.d18Events.high;
    addLog(evt.narratorText);

    updateState(prev => {
      let next = { ...prev, d18EventApplied: true, lastD18Result: roll };
      const players = prev.players.map(p => ({ ...p }));

      if (chapter.id === 1) {
        if (evt.effect === 'flag_tempete') next.flags = { ...next.flags, tempete: true };
        if (evt.effect === 'give_thermos') {
          // Give thermos to first player with space
          const target = players.find(p => !p.isKO && getUsedSlots(p.inventory) < MAX_INVENTORY_SLOTS);
          if (target) target.inventory = [...target.inventory, { resourceId: 'thermos', portions: null, wet: false }];
        }
      }
      if (chapter.id === 2) {
        if (evt.effect === 'moral_minus5_all') players.forEach(p => { if (!p.isKO) p.moral = Math.max(0, p.moral - 5); });
        if (evt.effect === 'moral_minus10_if_no_warning' && !prev.flags.tempete) players.forEach(p => { if (!p.isKO) p.moral = Math.max(0, p.moral - 10); });
        if (evt.effect === 'energy_plus5_all_give_lampe') {
          players.forEach(p => { if (!p.isKO) p.energy = Math.min(100, p.energy + 5); });
          const target = players.find(p => !p.isKO && getUsedSlots(p.inventory) < MAX_INVENTORY_SLOTS);
          if (target) target.inventory = [...target.inventory, { resourceId: 'lampe', portions: null, wet: false }];
        }
      }
      if (chapter.id === 3) {
        if (evt.effect === 'moral_minus5_one') addLog('Désignez le joueur qui perd 5 Moral (celui avec la blague la plus nulle).');
        if (evt.effect === 'refuge_choice') addLog('Demandez à un joueur s\'il veut entrer dans le refuge. Si oui, lancez D6.');
      }
      if (chapter.id === 4) {
        if (evt.effect === 'moral_minus5_one_lose_resource') addLog('Désignez le joueur qui glisse. Il perd 5 Moral et une ressource spécialisée (hors nourriture/eau).');
        if (evt.effect === 'moral_plus10_all_give_boussole') {
          players.forEach(p => { if (!p.isKO) p.moral = Math.min(100, p.moral + 10); });
          const target = players.find(p => !p.isKO && getUsedSlots(p.inventory) < MAX_INVENTORY_SLOTS);
          if (target) target.inventory = [...target.inventory, { resourceId: 'boussole', portions: null, wet: false }];
        }
      }

      return { ...next, players };
    });
  };

  const applyChoice = (choiceId) => {
    const choice = chapter.choices.find(c => c.id === choiceId);
    if (!choice) return;
    addLog(`Choix ${choiceId} sélectionné : "${choice.label}"`);

    updateState(prev => {
      let next = { ...prev, choiceMade: true, chapterPhase: 'done' };
      const players = prev.players.map(p => ({ ...p, inventory: [...p.inventory] }));

      for (const effect of choice.effects) {
        if (effect.type === 'energy_all') players.forEach(p => { if (!p.isKO) p.energy = Math.max(0, Math.min(100, p.energy + effect.value)); });
        if (effect.type === 'moral_all') players.forEach(p => { if (!p.isKO) p.moral = Math.max(0, Math.min(100, p.moral + effect.value)); });
        if (effect.type === 'add_bonus_moral_all') players.forEach(p => { if (!p.isKO) p.bonusMoral = true; });
        if (effect.type === 'give_carte_one') {
          const target = players.find(p => !p.isKO && getUsedSlots(p.inventory) < MAX_INVENTORY_SLOTS);
          if (target) target.inventory = [...target.inventory, { resourceId: 'carte', portions: null, wet: false }];
        }
        if (effect.type === 'flag_carte_consulted') next.flags = { ...next.flags, flag_carte_consulted: true };
        if (effect.type === 'give_sandwiches_3') {
          let given = 0;
          for (const p of players) {
            if (!p.isKO && given < 3) {
              p.inventory = [...p.inventory, { resourceId: 'sandwich', portions: 1, wet: false }];
              given++;
            }
          }
        }
        if (effect.type === 'consume_corde') {
          for (const p of players) {
            const idx = p.inventory.findIndex(i => i.resourceId === 'corde');
            if (idx !== -1) { p.inventory.splice(idx, 1); break; }
          }
        }
        if (effect.type === 'bear_fight') {
          next.flags = { ...next.flags, bearFight: true };
          setShowBearFight(true);
        }
        if (effect.type === 'flag_abri_ch2') next.flags = { ...next.flags, abri_ch2: true };
      }

      // Check KO
      players.forEach(p => { if (p.energy <= 0) p.isKO = true; });
      const allKO = players.every(p => p.isKO);
      const avgMoral = players.reduce((s, p) => s + p.moral, 0) / players.length;

      return {
        ...next,
        players,
        gameOver: allKO || avgMoral <= 0,
        gameOverReason: allKO ? 'Tous les joueurs sont évanouis !' : avgMoral <= 0 ? 'Le moral collectif est à zéro — abandon !' : null,
      };
    });
  };

  const applyBearFight = () => {
    const oursScore = parseInt(bearOursScore);
    if (isNaN(oursScore)) return;

    updateState(prev => {
      const players = prev.players.map(p => {
        if (p.isKO) return p;
        const playerScore = bearScores[p.id] ? parseInt(bearScores[p.id]) : 0;
        const newEnergy = playerScore < oursScore ? Math.max(0, p.energy - 5) : p.energy;
        return { ...p, energy: newEnergy, isKO: newEnergy <= 0 };
      });
      // Consume carte
      for (const p of players) {
        const idx = p.inventory.findIndex(i => i.resourceId === 'carte');
        if (idx !== -1) { p.inventory.splice(idx, 1); break; }
      }
      return { ...prev, players, chapterPhase: 'done', choiceMade: true, currentChapter: 6 };
    });
    setShowBearFight(false);
    addLog(`Combat ours ! Score ours: ${oursScore}. Résultats appliqués.`);
  };

  const advanceChapter = () => {
    const nextChapterId = gameState.currentChapter + 1;
    if (!CHAPTERS[nextChapterId]) {
      addLog('Fin de la V1 ! Chapitres suivants à venir...');
      return;
    }
    const nextChapter = CHAPTERS[nextChapterId];

    updateState(prev => {
      let players = prev.players.map(p => ({ ...p, inventory: [...p.inventory] }));

      // Apply fatigue
      let fatigue = nextChapter.fatigue || 0;
      if (nextChapterId === 3 && prev.flags.abri_ch2) fatigue += nextChapter.fatigueAbri || 0;
      players.forEach(p => { if (!p.isKO) p.energy = Math.max(0, p.energy + fatigue); });

      // Apply mandatory consumption
      for (const consume of (nextChapter.consumption || [])) {
        if (consume.perPlayer) {
          players.forEach(p => {
            if (p.isKO) return;
            consumeResource(p, consume.resource, consume.portions);
          });
        }
      }

      // Check KO
      players.forEach(p => { if (p.energy <= 0) p.isKO = true; });

      return {
        ...prev,
        currentChapter: nextChapterId,
        currentDay: nextChapter.day,
        currentAltitude: nextChapter.altitude,
        players,
        d18EventApplied: false,
        choiceMade: false,
        chapterPhase: 'narrative',
        lastD18Result: null,
        lastD6Result: null,
      };
    });
    setD18Result(null);
    setD6Result(null);
  };

  const consumeResource = (player, resourceId, portions) => {
    let remaining = portions;
    for (let i = 0; i < player.inventory.length && remaining > 0; i++) {
      const item = player.inventory[i];
      if (item.resourceId === resourceId && !item.wet) {
        if (item.portions !== null) {
          const take = Math.min(item.portions, remaining);
          item.portions -= take;
          remaining -= take;
          if (item.portions <= 0) player.inventory.splice(i, 1);
        } else {
          player.inventory.splice(i, 1);
          remaining--;
        }
      }
    }
  };

  const getUsedSlots = (inventory) => {
    return inventory.filter(i => !RESOURCES[i.resourceId.toUpperCase()]?.noSlot).length;
  };

  const isChoiceAvailable = (choice) => {
    if (!choice.alwaysAvailable && choice.requiresResource) {
      const hasResource = gameState.players.some(p =>
        !p.isKO && p.inventory.some(i => i.resourceId === choice.requiresResource && !i.wet)
      );
      if (!hasResource) return false;
    }
    if (choice.requiresResource) {
      const hasResource = gameState.players.some(p =>
        !p.isKO && p.inventory.some(i => i.resourceId === choice.requiresResource && !i.wet)
      );
      if (!hasResource) return false;
    }
    if (choice.requiresFlag && !gameState.flags[choice.requiresFlag]) return false;
    return true;
  };

  if (gameState.gameOver) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">💀</div>
        <h2 className="text-3xl font-bold text-red-400 mb-4">FIN DE PARTIE</h2>
        <p className="text-white text-xl mb-8">{gameState.gameOverReason}</p>
        <button onClick={onReset} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl">
          Nouvelle Partie
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 bg-slate-800 rounded-xl p-3">
        <h1 className="text-xl font-bold text-blue-300">⛰️ RÉGIE — Kilimontferrier</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="bg-blue-900 px-3 py-1 rounded-lg">Jour {gameState.currentDay}/12</span>
          <span className="bg-green-900 px-3 py-1 rounded-lg">{gameState.currentAltitude}m</span>
          <span className="bg-slate-700 px-3 py-1 rounded-lg">{chapter?.weather}</span>
          <button onClick={onSwitchToPlayer} className="bg-green-700 hover:bg-green-600 px-3 py-1 rounded-lg">👁️ Joueurs</button>
          <button onClick={onReset} className="bg-red-800 hover:bg-red-700 px-3 py-1 rounded-lg">🔄 Reset</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left: Chapter + Narration */}
        <div className="col-span-2 space-y-4">
          {/* Chapter info */}
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-yellow-300">{chapter?.title}</h2>
              <button
                onClick={advanceChapter}
                disabled={!gameState.choiceMade}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${gameState.choiceMade ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              >
                ⏭️ Chapitre Suivant
              </button>
            </div>
            <p className="text-slate-300 text-sm whitespace-pre-line">{chapter?.narrative}</p>
          </div>

          {/* Dice Section */}
          <div className="bg-slate-800 rounded-xl p-4">
            <h3 className="font-bold mb-3 text-purple-300">🎲 Dés</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700 rounded-lg p-3">
                <div className="text-sm font-semibold mb-2 text-purple-200">D18 (Événements)</div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number" min="1" max="18"
                    value={d18Input}
                    onChange={e => setD18Input(e.target.value)}
                    className="flex-1 bg-slate-600 text-white rounded px-2 py-1 text-center"
                    placeholder="1–18"
                  />
                  <button
                    onClick={() => {
                      const roll = parseInt(d18Input);
                      if (roll >= 1 && roll <= 18) { setD18Result(roll); applyD18Event(roll); }
                    }}
                    className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded font-bold"
                  >
                    Appliquer
                  </button>
                </div>
                {d18Result && (
                  <div className="text-center">
                    <span className="text-2xl font-bold text-yellow-300">{d18Result}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      {d18Result <= 6 ? '(Bas)' : d18Result <= 12 ? '(Moyen)' : '(Haut)'}
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-slate-700 rounded-lg p-3">
                <div className="text-sm font-semibold mb-2 text-orange-200">D6 (Combat / Refuge)</div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number" min="1" max="6"
                    value={d6Input}
                    onChange={e => setD6Input(e.target.value)}
                    className="flex-1 bg-slate-600 text-white rounded px-2 py-1 text-center"
                    placeholder="1–6"
                  />
                  <button
                    onClick={() => { const r = parseInt(d6Input); if (r >= 1 && r <= 6) { setD6Result(r); addLog(`D6 : ${r}`); } }}
                    className="bg-orange-600 hover:bg-orange-500 px-3 py-1 rounded font-bold"
                  >
                    Appliquer
                  </button>
                </div>
                {d6Result && (
                  <div className="text-center text-2xl font-bold text-yellow-300">{d6Result}</div>
                )}
              </div>
            </div>
          </div>

          {/* Choices */}
          <div className="bg-slate-800 rounded-xl p-4">
            <h3 className="font-bold mb-3 text-green-300">🎯 Choix du Chapitre</h3>
            <div className="grid grid-cols-2 gap-3">
              {chapter?.choices.map(choice => {
                const available = isChoiceAvailable(choice);
                return (
                  <button
                    key={choice.id}
                    onClick={() => available && applyChoice(choice.id)}
                    disabled={!available || gameState.choiceMade}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      gameState.choiceMade ? 'bg-slate-700 text-slate-500 cursor-not-allowed' :
                      available ? 'bg-green-800 hover:bg-green-700 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="font-bold text-sm">Choix {choice.id}</div>
                    <div className="text-xs mt-1">{choice.label}</div>
                    {!available && (
                      <div className="text-xs text-red-400 mt-1">
                        {choice.requiresResource ? `Nécessite: ${RESOURCES[choice.requiresResource?.toUpperCase()]?.name}` : 'Non disponible'}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Narrator Log */}
          <div className="bg-slate-800 rounded-xl p-4">
            <h3 className="font-bold mb-3 text-slate-400">📜 Journal Narrateur</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {narratorLog.length === 0 ? (
                <p className="text-slate-500 text-sm italic">Aucun événement enregistré.</p>
              ) : narratorLog.map((log, i) => (
                <div key={i} className="text-xs text-slate-300 bg-slate-700 rounded px-2 py-1">{log}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Players */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-300 text-center">👥 Joueurs</h3>
          {gameState.players.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              onEdit={() => setShowInventoryModal(player.id)}
              onStatChange={(stat, delta) => {
                updateState(prev => ({
                  ...prev,
                  players: prev.players.map(p =>
                    p.id === player.id
                      ? { ...p, [stat]: Math.max(0, Math.min(100, p[stat] + delta)) }
                      : p
                  )
                }));
              }}
            />
          ))}
        </div>
      </div>

      {/* Bear Fight Modal */}
      {showBearFight && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-orange-300 mb-4">🐻 Combat contre l'Ours !</h3>
            <div className="mb-4">
              <label className="text-slate-300 text-sm block mb-1">Score de l'Ours (D6)</label>
              <input
                type="number" min="1" max="6"
                value={bearOursScore}
                onChange={e => setBearOursScore(e.target.value)}
                className="bg-slate-700 text-white rounded px-3 py-2 w-24 text-center"
              />
            </div>
            <div className="mb-4 space-y-2">
              {gameState.players.filter(p => !p.isKO).map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-slate-300 text-sm w-24">{p.name}</span>
                  <input
                    type="number" min="1" max="6"
                    value={bearScores[p.id] || ''}
                    onChange={e => setBearScores(prev => ({ ...prev, [p.id]: e.target.value }))}
                    className="bg-slate-700 text-white rounded px-3 py-2 w-20 text-center"
                    placeholder="D6"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBearFight(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg">Annuler</button>
              <button onClick={applyBearFight} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-2 rounded-lg font-bold">Appliquer !</button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventoryModal !== null && (
        <InventoryModal
          player={gameState.players.find(p => p.id === showInventoryModal)}
          onClose={() => setShowInventoryModal(null)}
          onUpdate={(newInventory) => {
            updateState(prev => ({
              ...prev,
              players: prev.players.map(p =>
                p.id === showInventoryModal ? { ...p, inventory: newInventory } : p
              )
            }));
          }}
        />
      )}
    </div>
  );
}

function PlayerCard({ player, onEdit, onStatChange }) {
  const energyColor = player.energy > 60 ? 'bg-green-500' : player.energy > 30 ? 'bg-yellow-500' : 'bg-red-500';
  const moralColor = player.moral > 60 ? 'bg-blue-500' : player.moral > 30 ? 'bg-purple-500' : 'bg-red-500';

  return (
    <div className={`bg-slate-800 rounded-xl p-3 ${player.isKO ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-sm">{player.isKO ? '💀' : '🧑'} {player.name}</div>
        <button onClick={onEdit} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">✏️ Inv.</button>
      </div>

      <div className="space-y-1 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-12">Énergie</span>
          <div className="flex-1 bg-slate-700 rounded-full h-3 relative">
            <div className={`${energyColor} h-3 rounded-full transition-all`} style={{ width: `${player.energy}%` }} />
          </div>
          <div className="flex gap-1">
            <button onClick={() => onStatChange('energy', -5)} className="text-xs bg-red-800 hover:bg-red-700 px-1 rounded">-5</button>
            <span className="text-xs w-8 text-center">{player.energy}</span>
            <button onClick={() => onStatChange('energy', 5)} className="text-xs bg-green-800 hover:bg-green-700 px-1 rounded">+5</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-12">Moral</span>
          <div className="flex-1 bg-slate-700 rounded-full h-3 relative">
            <div className={`${moralColor} h-3 rounded-full transition-all`} style={{ width: `${player.moral}%` }} />
          </div>
          <div className="flex gap-1">
            <button onClick={() => onStatChange('moral', -5)} className="text-xs bg-red-800 hover:bg-red-700 px-1 rounded">-5</button>
            <span className="text-xs w-8 text-center">{player.moral}</span>
            <button onClick={() => onStatChange('moral', 5)} className="text-xs bg-green-800 hover:bg-green-700 px-1 rounded">+5</button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {player.inventory.map((item, idx) => {
          const res = Object.values(RESOURCES).find(r => r.id === item.resourceId);
          return (
            <span key={idx} className={`text-xs px-1 py-0.5 rounded ${item.wet ? 'bg-slate-700 text-slate-500' : 'bg-slate-600 text-white'}`}>
              {res?.icon}{res?.name?.split(' ')[0]}
              {item.portions !== null ? `×${item.portions}` : ''}
              {item.wet ? '💦' : ''}
            </span>
          );
        })}
        {player.bonusMoral && <span className="text-xs px-1 py-0.5 rounded bg-yellow-900 text-yellow-300">🙏</span>}
      </div>
    </div>
  );
}

function InventoryModal({ player, onClose, onUpdate }) {
  const [inventory, setInventory] = useState([...player.inventory]);
  const [addResourceId, setAddResourceId] = useState('sandwich');

  const removeItem = (idx) => {
    setInventory(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleWet = (idx) => {
    setInventory(prev => prev.map((item, i) => i === idx ? { ...item, wet: !item.wet } : item));
  };

  const addItem = () => {
    const res = Object.values(RESOURCES).find(r => r.id === addResourceId);
    if (!res) return;
    const newItem = { resourceId: res.id, portions: res.hasPortions ? 3 : null, wet: false };
    setInventory(prev => [...prev, newItem]);
  };

  const save = () => { onUpdate(inventory); onClose(); };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">📦 Inventaire — {player.name}</h3>
        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {inventory.map((item, idx) => {
            const res = Object.values(RESOURCES).find(r => r.id === item.resourceId);
            return (
              <div key={idx} className="flex items-center gap-2 bg-slate-700 rounded-lg p-2">
                <span className="text-xl">{res?.icon}</span>
                <span className="flex-1 text-sm">{res?.name} {item.portions !== null ? `(${item.portions} portions)` : ''}</span>
                <button onClick={() => toggleWet(idx)} className={`text-xs px-2 py-1 rounded ${item.wet ? 'bg-blue-800 text-blue-200' : 'bg-slate-600'}`}>💧</button>
                <button onClick={() => removeItem(idx)} className="text-xs bg-red-800 hover:bg-red-700 px-2 py-1 rounded">✕</button>
              </div>
            );
          })}
          {inventory.length === 0 && <p className="text-slate-500 text-sm italic text-center">Inventaire vide</p>}
        </div>
        <div className="flex gap-2 mb-4">
          <select
            value={addResourceId}
            onChange={e => setAddResourceId(e.target.value)}
            className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2"
          >
            {Object.values(RESOURCES).map(r => (
              <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
            ))}
          </select>
          <button onClick={addItem} className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg font-bold">+ Ajouter</button>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg">Annuler</button>
          <button onClick={save} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold">Sauvegarder</button>
        </div>
      </div>
    </div>
  );
}
