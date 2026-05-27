export const RESOURCES = {
  SANDWICH: { id: 'sandwich', name: 'Sandwich', icon: '🥪', hasPortions: true, maxPortions: 3 },
  EAU: { id: 'eau', name: 'Eau', icon: '💧', hasPortions: true, maxPortions: 3 },
  MATELAS: { id: 'matelas', name: 'Matelas', icon: '🛏️', hasPortions: false },
  CORDE: { id: 'corde', name: 'Corde', icon: '🪢', hasPortions: false, consumable: true },
  BOUSSOLE: { id: 'boussole', name: 'Boussole', icon: '🧭', hasPortions: false },
  CHAUFFERETTE: { id: 'chaufferette', name: 'Chaufferette', icon: '🔥', hasPortions: false, consumable: true },
  LAMPE: { id: 'lampe', name: 'Lampe Torche', icon: '🔦', hasPortions: false },
  CARTE: { id: 'carte', name: 'Carte', icon: '🗺️', hasPortions: false, consumable: true },
  THERMOS: { id: 'thermos', name: 'Thermos', icon: '☕', hasPortions: false, consumable: true },
  BONUS_MORAL: { id: 'bonus_moral', name: 'Bénédiction', icon: '🙏', hasPortions: false, noSlot: true },
};

export const CHAPTERS = {
  1: {
    id: 1,
    title: 'Chapitre 1 — Le Camp de Base',
    altitude: 0,
    day: 1,
    weather: '☀️ Soleil',
    weatherKey: 'soleil',
    narrative: `Le soleil se lève sur le camp de base du Kilimontferrier. L'air frais du matin porte les promesses d'une grande aventure. Vous êtes réunis autour du feu de camp, sacs à dos prêts, regards tournés vers les sommets enneigés qui vous attendent.

Le village local s'éveille doucement. Des habitants curieux vous observent. C'est le moment de prendre une décision avant de vous élancer vers les hauteurs.`,
    d18Events: {
      low: { // 1-6
        id: 'warning',
        description: 'Un local vous avertit d\'une tempête à venir sur la route habituelle.',
        effect: 'flag_tempete',
        narratorText: '(1-6) Un vieux montagnard vous intercepte : "Attention, une tempête se prépare sur les hauteurs !"'
      },
      mid: { // 7-12
        id: 'nothing',
        description: 'Rien de particulier. Départ serein.',
        effect: null,
        narratorText: '(7-12) Le départ se passe sans incident particulier.'
      },
      high: { // 13-18
        id: 'thermos',
        description: 'Un sherpa vous offre un Thermos rempli de thé chaud.',
        effect: 'give_thermos',
        narratorText: '(13-18) Un sherpa souriant vous tend un Thermos : "Pour le voyage, mes amis !"'
      }
    },
    choices: [
      {
        id: 1,
        label: 'Partir léger et vite',
        description: 'Vous vous élancez sans cérémonie, économisant vos forces.',
        effects: [],
        alwaysAvailable: true,
      },
      {
        id: 2,
        label: 'Cérémonie de départ',
        description: 'Vous effectuez une cérémonie de bénédiction avec les locaux.',
        effects: [{ type: 'add_bonus_moral_all' }],
        alwaysAvailable: true,
      },
      {
        id: 3,
        label: 'Consulter la carte',
        description: 'Vous étudiez soigneusement la carte du terrain avant de partir.',
        effects: [
          { type: 'energy_all', value: -5 },
          { type: 'give_carte_one' },
          { type: 'flag_carte_consulted' },
        ],
        alwaysAvailable: true,
      }
    ],
    consumption: [],
    nextChapter: 2,
  },
  2: {
    id: 2,
    title: 'Chapitre 2 — La Forêt S\'Épaissit',
    altitude: 500,
    day: 2,
    weather: '🌧️ Pluie',
    weatherKey: 'pluie',
    narrative: `La forêt se referme sur vous comme un manteau vert et humide. La pluie commence à tomber, d'abord légère, puis plus insistante. Les sentiers se transforment en ruisseaux boueux, et vos pas s'alourdissent.

La végétation dense cache le ciel, et vous devez vous frayer un chemin parmi les fougères géantes et les racines noueuses. Malgré la fatigue, la beauté sauvage de cet endroit est indéniable.`,
    d18Events: {
      low: {
        id: 'chamois',
        description: 'Un chamois surgit des buissons, vous faisant tous sursauter.',
        effect: 'moral_minus5_all',
        narratorText: '(1-6) BOUH ! Un chamois surgit brusquement des fourrés. Tout le monde perd 5 de Moral !'
      },
      mid: {
        id: 'rain_surprise',
        description: 'La pluie s\'intensifie brusquement. Vous n\'étiez pas préparés.',
        effect: 'moral_minus10_if_no_warning',
        narratorText: '(7-12) La pluie redouble d\'intensité — personne n\'avait prévu ça !'
      },
      high: {
        id: 'grotte',
        description: 'Vous découvrez une grotte qui vous offre un abri temporaire et une lampe torche oubliée.',
        effect: 'energy_plus5_all_give_lampe',
        narratorText: '(13-18) Une grotte ! Vous trouvez même une lampe torche à l\'intérieur. +5 Énergie à tous !'
      }
    },
    choices: [
      {
        id: 1,
        label: 'Continuer droit',
        description: 'Vous poussez de l\'avant sans vous arrêter.',
        effects: [],
        alwaysAvailable: true,
      },
      {
        id: 2,
        label: 'Trouver un abri',
        description: 'Vous cherchez un abri pour passer la nuit, mais perdrez du temps.',
        effects: [{ type: 'flag_abri_ch2' }],
        alwaysAvailable: true,
      }
    ],
    consumption: [{ resource: 'sandwich', portions: 1, perPlayer: true }],
    fatigue: -5,
    nextChapter: 3,
  },
  3: {
    id: 3,
    title: 'Chapitre 3 — La Forêt Révèle ses Secrets',
    altitude: 1000,
    day: 3,
    weather: '☁️ Nuageux',
    weatherKey: 'nuageux',
    narrative: `La forêt prend une dimension mystérieuse dans la lumière grise du matin. Les arbres s'élèvent comme des colonnes de cathédrale, et vos voix résonnent étrangement dans ce silence habité.

La montée devient plus prononcée. Vos mollets brûlent, votre souffle se fait plus court. Mais quelque chose dans cette forêt vous attire, comme si elle avait des secrets à vous révéler...`,
    d18Events: {
      low: {
        id: 'marmottes',
        description: 'Les marmottes sifflent pour se moquer de vous.',
        effect: 'moral_minus5_one',
        narratorText: '(1-6) Les marmottes font des bruits moqueurs... Celui qui fait la blague la plus nulle perd 5 Moral !'
      },
      mid: {
        id: 'nothing',
        description: 'Rien de particulier.',
        effect: null,
        narratorText: '(7-12) La montée continue sans surprise.'
      },
      high: {
        id: 'refuge',
        description: 'Vous trouvez un passage vers un refuge secret. Qui tente sa chance ?',
        effect: 'refuge_choice',
        narratorText: '(13-18) Un passage étroit dans les rochers mène à ce qui semble être un refuge ! Un joueur peut tenter de s\'y faufiler...'
      }
    },
    choices: [
      {
        id: 1,
        label: 'Continuer vers les hauteurs',
        description: 'Vous gardez le cap.',
        effects: [],
        alwaysAvailable: true,
      },
      {
        id: 2,
        label: 'Explorer les alentours',
        description: 'Vous fouillezla forêt et trouvez des provisions cachées.',
        effects: [
          { type: 'energy_all', value: -5 },
          { type: 'give_sandwiches_3' },
        ],
        alwaysAvailable: true,
      },
      {
        id: 3,
        label: 'Accélérer le pas',
        description: 'Un joueur prend la tête du groupe, les autres peinent à suivre.',
        effects: [{ type: 'energy_others', value: -5, note: 'Choisir le Meneur' }],
        alwaysAvailable: true,
      }
    ],
    consumption: [{ resource: 'sandwich', portions: 1, perPlayer: true }],
    fatigue: -8,
    fatigueAbri: -10,
    nextChapter: 4,
  },
  4: {
    id: 4,
    title: 'Chapitre 4 — La Traversée du Torrent',
    altitude: 1300,
    day: 4,
    weather: '☀️ Soleil',
    weatherKey: 'soleil',
    narrative: `Vous entendez le torrent avant de le voir — un grondement sourd qui enfle à mesure que vous approchez. Puis il apparaît : une rivière tumultueuse, les eaux glaciales bondissant sur les rochers.

La traversée est inévitable. Le Kilimontferrier vous attend de l'autre côté. Comment allez-vous franchir cet obstacle ?`,
    d18Events: {
      low: {
        id: 'glissade',
        description: 'L\'un de vous glisse sur les pierres mouillées. Une ressource est perdue dans le torrent.',
        effect: 'moral_minus5_one_lose_resource',
        narratorText: '(1-6) Attention ! Une glissade... et une ressource tombe dans le torrent !'
      },
      mid: {
        id: 'nothing',
        description: 'La traversée se passe sans encombre.',
        effect: null,
        narratorText: '(7-12) La traversée se fait sans incident particulier.'
      },
      high: {
        id: 'truites',
        description: 'Des truites magnifiques bondissent hors de l\'eau — un spectacle enchanteur !',
        effect: 'moral_plus10_all_give_boussole',
        narratorText: '(13-18) Des truites arc-en-ciel bondissent à vos pieds ! +10 Moral à tous, et vous trouvez une Boussole dans les rochers !'
      }
    },
    choices: [
      {
        id: 1,
        label: 'Traverser en ligne directe',
        description: 'Cap droit devant ! Vous traversez le torrent à gué.',
        effects: [],
        alwaysAvailable: true,
        nextChapter: 5,
      },
      {
        id: 2,
        label: 'Point de traversée sûr',
        description: 'Vous cherchez un passage plus calme, plus loin en amont.',
        effects: [
          { type: 'energy_all', value: -8 },
          { type: 'moral_all', value: 5 },
        ],
        alwaysAvailable: true,
        nextChapter: 5,
      },
      {
        id: 3,
        label: 'Utiliser la Corde',
        description: 'Vous tendez une corde pour sécuriser le passage. La corde sera usée.',
        effects: [
          { type: 'energy_all', value: -5 },
          { type: 'moral_all', value: 10 },
          { type: 'consume_corde' },
        ],
        requiresResource: 'corde',
        nextChapter: 5,
      },
      {
        id: 4,
        label: 'Chemin de l\'Ouest (Carte)',
        description: 'Vous contournez par l\'Ouest. Un ours rôde... Combat D6 !',
        effects: [{ type: 'bear_fight' }],
        requiresResource: 'carte',
        requiresFlag: 'flag_carte_consulted',
        nextChapter: 6,
      }
    ],
    consumption: [{ resource: 'sandwich', portions: 1, perPlayer: true }],
    fatigue: -12,
    nextChapter: 5,
  },
};

export const INITIAL_PLAYER_RESOURCES = [
  { resourceId: 'sandwich', portions: 3 },
  { resourceId: 'eau', portions: 3 },
  { resourceId: 'matelas', portions: null },
];

export const MAX_INVENTORY_SLOTS = 6;
