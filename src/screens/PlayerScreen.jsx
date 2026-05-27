import { CHAPTERS, RESOURCES, MAX_INVENTORY_SLOTS } from '../data/gameData';

export default function PlayerScreen({ gameState, onBack }) {
  const chapter = CHAPTERS[gameState.currentChapter];
  const activePlayers = gameState.players.filter(p => !p.isKO);
  const avgMoral = gameState.players.reduce((s, p) => s + p.moral, 0) / gameState.players.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur sticky top-0 z-10 px-4 py-3 border-b border-slate-700">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-blue-300">⛰️ Au Sommet du Kilimontferrier</h1>
            <p className="text-slate-400 text-xs">{chapter?.title}</p>
          </div>
          <div className="flex gap-3 text-sm">
            <div className="bg-blue-900/60 px-3 py-1 rounded-lg text-center">
              <div className="text-blue-300 font-bold">Jour</div>
              <div className="font-bold">{gameState.currentDay}/12</div>
            </div>
            <div className="bg-green-900/60 px-3 py-1 rounded-lg text-center">
              <div className="text-green-300 font-bold">Altitude</div>
              <div className="font-bold">{gameState.currentAltitude}m</div>
            </div>
            <div className="bg-slate-800 px-3 py-1 rounded-lg text-center">
              <div className="text-yellow-300 font-bold">Météo</div>
              <div className="font-bold">{chapter?.weather}</div>
            </div>
          </div>
          <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-lg text-sm">← Menu</button>
        </div>
      </div>

      {/* Game Over */}
      {gameState.gameOver && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
          <div className="text-8xl mb-6">💀</div>
          <h2 className="text-4xl font-bold text-red-400 mb-4">FIN DE PARTIE</h2>
          <p className="text-white text-xl mb-8 text-center px-8">{gameState.gameOverReason}</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Illustration Placeholder */}
            <div className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-blue-800/50">
              <div className="text-center">
                <div className="text-8xl mb-4">{getChapterEmoji(gameState.currentChapter)}</div>
                <div className="text-2xl font-bold text-blue-300">{chapter?.title}</div>
                <div className="text-slate-400 mt-2">{chapter?.weather} • {gameState.currentAltitude}m</div>
              </div>
            </div>

            {/* Narrative */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-yellow-300 mb-4">📖 Narration</h3>
              <p className="text-slate-200 leading-relaxed whitespace-pre-line text-sm">{chapter?.narrative}</p>
            </div>

            {/* Choices */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-green-300 mb-4">🎯 Choix</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {chapter?.choices.map(choice => {
                  const available = isChoiceAvailable(choice, gameState);
                  return (
                    <div
                      key={choice.id}
                      className={`rounded-xl p-4 border-2 transition-all ${
                        available
                          ? 'border-green-600 bg-green-900/30 text-white'
                          : 'border-slate-700 bg-slate-800/50 text-slate-500'
                      }`}
                    >
                      <div className="font-bold text-sm mb-1">
                        {available ? '✅' : '🔒'} Choix {choice.id}
                      </div>
                      <div className="font-semibold text-sm mb-1">{choice.label}</div>
                      <div className="text-xs opacity-75">{choice.description}</div>
                      {!available && choice.requiresResource && (
                        <div className="text-xs text-red-400 mt-2">
                          🔒 Nécessite: {Object.values(RESOURCES).find(r => r.id === choice.requiresResource)?.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-slate-500 text-xs mt-3 text-center italic">Le Narrateur annoncera le choix retenu</p>
            </div>
          </div>

          {/* Players Sidebar */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-300 text-center text-lg">👥 Équipe</h3>
            {gameState.players.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerCard({ player }) {
  const isKO = player.isKO;
  const energyColor = player.energy > 60 ? 'bg-green-500' : player.energy > 30 ? 'bg-yellow-500' : 'bg-red-500';
  const moralColor = player.moral > 60 ? 'bg-blue-500' : player.moral > 30 ? 'bg-purple-500' : 'bg-red-500';
  const usedSlots = player.inventory.filter(i => {
    const res = Object.values(RESOURCES).find(r => r.id === i.resourceId);
    return !res?.noSlot;
  }).length;

  return (
    <div className={`rounded-2xl border p-4 transition-all ${isKO ? 'border-red-900 bg-red-950/30 opacity-60' : 'border-slate-700 bg-slate-800/80'}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-2xl">{isKO ? '💀' : '🧑‍🦯'}</div>
        <div>
          <div className="font-bold">{player.name}</div>
          {isKO && <div className="text-red-400 text-xs">Évanoui(e)</div>}
        </div>
      </div>

      {!isKO && (
        <>
          {/* Stats */}
          <div className="space-y-2 mb-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">⚡ Énergie</span>
                <span className="font-bold">{player.energy}/100</span>
              </div>
              <div className="bg-slate-700 rounded-full h-4">
                <div className={`${energyColor} h-4 rounded-full transition-all`} style={{ width: `${player.energy}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">💙 Moral</span>
                <span className="font-bold">{player.moral}/100</span>
              </div>
              <div className="bg-slate-700 rounded-full h-4">
                <div className={`${moralColor} h-4 rounded-full transition-all`} style={{ width: `${player.moral}%` }} />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div>
            <div className="text-xs text-slate-400 mb-2">🎒 Inventaire ({usedSlots}/{MAX_INVENTORY_SLOTS})</div>
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: MAX_INVENTORY_SLOTS }).map((_, slotIdx) => {
                const item = player.inventory.filter(i => {
                  const res = Object.values(RESOURCES).find(r => r.id === i.resourceId);
                  return !res?.noSlot;
                })[slotIdx];
                const res = item ? Object.values(RESOURCES).find(r => r.id === item.resourceId) : null;
                return (
                  <div
                    key={slotIdx}
                    className={`rounded-lg p-1 text-center text-xs border min-h-[48px] flex flex-col items-center justify-center ${
                      item
                        ? item.wet
                          ? 'border-slate-600 bg-slate-700/50 opacity-50'
                          : 'border-slate-500 bg-slate-700'
                        : 'border-slate-800 bg-slate-900/30 border-dashed'
                    }`}
                  >
                    {item ? (
                      <>
                        <div className="text-lg">{res?.icon || '?'}</div>
                        <div className="text-slate-300 leading-tight" style={{ fontSize: '10px' }}>
                          {res?.name?.split(' ')[0]}
                          {item.portions !== null ? ` ×${item.portions}` : ''}
                        </div>
                        {item.wet && <div style={{ fontSize: '9px' }} className="text-blue-400">💧mouillé</div>}
                      </>
                    ) : (
                      <div className="text-slate-700">—</div>
                    )}
                  </div>
                );
              })}
            </div>
            {player.bonusMoral && (
              <div className="mt-2 text-xs bg-yellow-900/50 text-yellow-300 rounded-lg px-2 py-1 text-center">
                🙏 Bénédiction de départ
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function isChoiceAvailable(choice, gameState) {
  if (choice.requiresResource) {
    const hasResource = gameState.players.some(p =>
      !p.isKO && p.inventory.some(i => i.resourceId === choice.requiresResource && !i.wet)
    );
    if (!hasResource) return false;
  }
  if (choice.requiresFlag && !gameState.flags[choice.requiresFlag]) return false;
  return true;
}

function getChapterEmoji(chapter) {
  const emojis = { 1: '🏕️', 2: '🌲', 3: '🌿', 4: '🌊', 5: '🏔️', 6: '🦅' };
  return emojis[chapter] || '⛰️';
}
