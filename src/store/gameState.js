const STORAGE_KEY = 'kilimontferrier_state';

export const createInitialState = (playerNames) => ({
  screen: 'game',
  currentChapter: 1,
  currentDay: 1,
  currentAltitude: 0,
  flags: {},
  diceHistory: [],
  lastD18Result: null,
  lastD6Result: null,
  d18EventApplied: false,
  choiceMade: false,
  chapterPhase: 'narrative', // 'narrative' | 'dice' | 'choice' | 'done'
  players: playerNames.map((name, index) => ({
    id: index,
    name,
    energy: 100,
    moral: 100,
    isKO: false,
    inventory: [
      { resourceId: 'sandwich', portions: 3, wet: false },
      { resourceId: 'eau', portions: 3, wet: false },
      { resourceId: 'matelas', portions: null, wet: false },
    ],
    bonusMoral: false, // bonus from cérémonie
  })),
  gameOver: false,
  gameOverReason: null,
  victory: false,
});

export const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Also update a timestamp to signal changes to other tabs
    localStorage.setItem(STORAGE_KEY + '_ts', Date.now().toString());
  } catch (e) {
    console.error('Failed to save state', e);
  }
};

export const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const clearState = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY + '_ts');
};
