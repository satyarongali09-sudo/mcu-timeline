/**
 * THE SIX INFINITY STONES SPECIFICATION
 * -------------------------------------------------------------
 * Primordial singularities forged into ingots by the Cosmic Entities
 * (Death, Entropy, Infinity, and Eternity) before the universe began.
 */

export const INFINITY_STONES = [
  {
    id: "space",
    name: "Space Stone",
    aspect: "Space & Teleportation",
    color: "#3C8DFF",
    glowColor: "rgba(60, 141, 255, 0.4)",
    containment: "The Tesseract (Cosmic Cube)",
    originalKeeper: "Red Skull / Mar-Vell / Loki",
    keyEvents: "Powered WWII weapons for HYDRA; opened Chitauri portal over NYC; weaponized by Thanos to shatter planets.",
    cinematicQuote: "The Tesseract has awakened. It is on a little world. A human world.",
    pathSvg: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
  },
  {
    id: "mind",
    name: "Mind Stone",
    aspect: "Consciousness & Psionics",
    color: "#FACC15",
    glowColor: "rgba(250, 204, 21, 0.4)",
    containment: "Loki's Scepter / Vision's Forehead",
    originalKeeper: "Loki / Hydra / Vision",
    keyEvents: "Unleashed Wanda & Pietro's powers in Sokovia; breathed sentient life into Vision; ripped from Vision's skull in Wakanda.",
    cinematicQuote: "I am not what you are, and not what you intended. But I am on the side of life.",
    pathSvg: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V17h-2v-.07A6 6 0 0 1 7 11h2a4 4 0 0 0 8 0h2a6 6 0 0 1-6 5.93z"
  },
  {
    id: "reality",
    name: "Reality Stone",
    aspect: "Matter & Probability",
    color: "#E84B4B",
    glowColor: "rgba(232, 75, 75, 0.4)",
    containment: "The Aether (Fluid Symbiote)",
    originalKeeper: "Malekith the Dark Elf / The Collector",
    keyEvents: "Infected Jane Foster in the Dark World; turned Drax into stone blocks and Star-Lord's blaster into bubbles on Knowhere.",
    cinematicQuote: "Reality is often disappointing. Now, reality can be whatever I want.",
    pathSvg: "M21 16.5c0 2.5-3 4.5-9 4.5s-9-2-9-4.5c0-1.8 1.6-3.3 4.5-4.1-.3-.6-.5-1.3-.5-2 0-3.3 2.2-6 5-6s5 2.7 5 6c0 .7-.2 1.4-.5 2 2.9.8 4.5 2.3 4.5 4.1z"
  },
  {
    id: "power",
    name: "Power Stone",
    aspect: "Destruction & Kinetic Energy",
    color: "#8257FF",
    glowColor: "rgba(130, 87, 255, 0.4)",
    containment: "The Orb of Morag",
    originalKeeper: "Ronan the Accuser / Nova Corps",
    keyEvents: "Decimated the Celestial Eson the Searcher's foes; held collectively by the Guardians on Xandar; pulverized the planet Xandar off-screen.",
    cinematicQuote: "I will bathe the star-ways in your blood.",
    pathSvg: "M13 2L3 14h9l-1 8 10-12h-9l1-8z"
  },
  {
    id: "time",
    name: "Time Stone",
    aspect: "Temporal Manipulation",
    color: "#00E676",
    glowColor: "rgba(0, 230, 118, 0.4)",
    containment: "The Eye of Agamotto",
    originalKeeper: "Agamotto / The Ancient One / Doctor Strange",
    keyEvents: "Trapped Dormammu in an infinite temporal loop; unraveled 14,000,605 future realities to chart the sole victorious outcome.",
    cinematicQuote: "Dormammu, I've come to bargain.",
    pathSvg: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
  },
  {
    id: "soul",
    name: "Soul Stone",
    aspect: "Sentience & Spirit Realm",
    color: "#FF8A00",
    glowColor: "rgba(255, 138, 0, 0.4)",
    containment: "The Altar of Vormir",
    originalKeeper: "Red Skull (Stonekeeper)",
    keyEvents: "Demanded the sacrifice of what one loves most: Gamora by Thanos, Natasha Romanoff by the Avengers; allowed communication with the Soul World.",
    cinematicQuote: "A soul for a soul. In order to take the stone, you must lose that which you love.",
    pathSvg: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z"
  }
];

export const stonesData = INFINITY_STONES.map(s => ({
  ...s,
  glow: s.glowColor,
  lore: s.keyEvents,
  quote: s.cinematicQuote,
  vessels: [s.containment],
  wielders: s.originalKeeper.split(' / ').map(w => w.trim()),
  firstAppearance: s.id === 'space' ? 'Captain America: The First Avenger' :
                   s.id === 'mind' ? "Marvel's The Avengers" :
                   s.id === 'reality' ? 'Thor: The Dark World' :
                   s.id === 'power' ? 'Guardians of the Galaxy' :
                   s.id === 'time' ? 'Doctor Strange' : 'Avengers: Infinity War',
  yearIntroduced: s.id === 'space' ? 2011 :
                  s.id === 'mind' ? 2012 :
                  s.id === 'reality' ? 2013 :
                  s.id === 'power' ? 2014 :
                  s.id === 'time' ? 2016 : 2018,
  status: 'Reduced to atoms in 2018 (Earth-616); preserved across multiverse branches'
}));

