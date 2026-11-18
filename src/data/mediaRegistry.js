/**
 * CENTRALIZED MARVEL MULTIVERSE MEDIA REGISTRY
 * -------------------------------------------------------------
 * Strict separation of:
 * 1. Movie & Series Posters (from verified https://mcu-timelines.vercel.app/photos/{id}.jpg?v=2)
 * 2. Character Portraits (from verified Marvel Superhero CDN + canonical solo film stills)
 * 3. Multiverse Branch Artwork (from https://mcu-timelines.vercel.app/branch {1-7}.webp)
 * 4. Infinity Stone Assets (from https://mcu-timelines.vercel.app/{color}.webp)
 * 5. Studio Intro & Easter Egg Assets
 *
 * ZERO Unsplash URLs. ZERO AI-generated placeholders. ZERO nature/landscape photos.
 */

export const VERCEL_ASSET_BASE = 'https://mcu-timelines.vercel.app';
export const SUPERHERO_CDN_BASE = 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/lg';

export const STUDIO_ASSETS = {
  introRedBg: `${VERCEL_ASSET_BASE}/marvel_cinematic_red_bg_full.webp`,
  introLogo: `${VERCEL_ASSET_BASE}/marvel_logo_pristine_2x.webp`,
  heroTreeDesktop: `${VERCEL_ASSET_BASE}/tree.webp`,
  heroTreeMobile: `${VERCEL_ASSET_BASE}/tree%20mob.webp`,
  doomsdayHero: `${VERCEL_ASSET_BASE}/doomsday.webp`,
  thanosGauntlet: `${VERCEL_ASSET_BASE}/thanos-removebg-preview.webp`,
  thanosSnapAudio: `${VERCEL_ASSET_BASE}/thanos-snap-sound-effect.mp3`,
  ironManArcReactor: `${VERCEL_ASSET_BASE}/jarvis.jpg`,
  originMaxLogo: `${VERCEL_ASSET_BASE}/ox.png`
};

export const STONE_MEDIA = {
  reality: `${VERCEL_ASSET_BASE}/red.webp`,
  space: `${VERCEL_ASSET_BASE}/blue.webp`,
  time: `${VERCEL_ASSET_BASE}/green.webp`,
  mind: `${VERCEL_ASSET_BASE}/yellow.webp`,
  power: `${VERCEL_ASSET_BASE}/purple.webp`,
  soul: `${VERCEL_ASSET_BASE}/orange.webp`
};

export const BRANCH_MEDIA = {
  1: {
    desktop: `${VERCEL_ASSET_BASE}/branch%201.webp`,
    mobile: `${VERCEL_ASSET_BASE}/branch%201%20mob.webp`
  },
  2: {
    desktop: `${VERCEL_ASSET_BASE}/branch%202.webp`,
    mobile: `${VERCEL_ASSET_BASE}/branch%202%20mob.webp`
  },
  3: {
    desktop: `${VERCEL_ASSET_BASE}/branch%203.webp`,
    mobile: `${VERCEL_ASSET_BASE}/branch%203%20mob.webp`
  },
  4: {
    desktop: `${VERCEL_ASSET_BASE}/branch%204.webp`,
    mobile: `${VERCEL_ASSET_BASE}/branch%204.webp`
  },
  5: {
    desktop: `${VERCEL_ASSET_BASE}/branch%205.webp`,
    mobile: `${VERCEL_ASSET_BASE}/branch%205%20mob.webp`
  },
  6: {
    desktop: `${VERCEL_ASSET_BASE}/branch%206.webp`,
    mobile: `${VERCEL_ASSET_BASE}/branch%206%20mob.webp`
  },
  7: {
    desktop: `${VERCEL_ASSET_BASE}/branch%207.webp`,
    mobile: `${VERCEL_ASSET_BASE}/branch%207%20mob.webp`
  }
};

export const CHARACTER_PORTRAIT_REGISTRY = {
  'iron-man': {
    portrait: `${SUPERHERO_CDN_BASE}/346-iron-man.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/5.jpg?v=2`,
    name: 'Iron Man',
    universe: 'MCU Canon (Earth-616)'
  },
  'captain-america': {
    portrait: `${SUPERHERO_CDN_BASE}/149-captain-america.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/1.jpg?v=2`,
    name: 'Captain America',
    universe: 'MCU Canon (Earth-616)'
  },
  'thor': {
    portrait: `${SUPERHERO_CDN_BASE}/659-thor.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/8.jpg?v=2`,
    name: 'Thor',
    universe: 'MCU Canon (Earth-616)'
  },
  'black-widow': {
    portrait: `${SUPERHERO_CDN_BASE}/107-black-widow.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/23.jpg?v=2`,
    name: 'Black Widow',
    universe: 'MCU Canon (Earth-616)'
  },
  'hulk': {
    portrait: `${SUPERHERO_CDN_BASE}/332-hulk.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/7.jpg?v=2`,
    name: 'Hulk',
    universe: 'MCU Canon (Earth-616)'
  },
  'spider-man': {
    portrait: `${SUPERHERO_CDN_BASE}/620-spider-man.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/24.jpg?v=2`,
    name: 'Spider-Man',
    universe: 'MCU Canon (Earth-616)'
  },
  'wolverine': {
    portrait: `${SUPERHERO_CDN_BASE}/717-wolverine.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/64.jpg?v=2`,
    name: 'Wolverine',
    universe: 'Fox Mutant Universe (Earth-10005)'
  },
  'deadpool': {
    portrait: `${SUPERHERO_CDN_BASE}/213-deadpool.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/64.jpg?v=2`,
    name: 'Deadpool',
    universe: 'Fox Mutant Universe (Earth-10005) & Earth-616'
  },
  'black-panther': {
    portrait: `${SUPERHERO_CDN_BASE}/106-black-panther.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/29.jpg?v=2`,
    name: 'Black Panther',
    universe: 'MCU Canon (Earth-616)'
  },
  'doctor-strange': {
    portrait: `${SUPERHERO_CDN_BASE}/226-doctor-strange.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/26.jpg?v=2`,
    name: 'Doctor Strange',
    universe: 'MCU Canon (Earth-616)'
  },
  'ant-man': {
    portrait: `${SUPERHERO_CDN_BASE}/31-ant-man-ii.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/19.jpg?v=2`,
    name: 'Ant-Man',
    universe: 'MCU Canon (Earth-616)'
  },
  'scarlet-witch': {
    portrait: `${SUPERHERO_CDN_BASE}/579-scarlet-witch.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/39.jpg?v=2`,
    name: 'Scarlet Witch',
    universe: 'MCU Canon (Earth-616)'
  },
  'vision': {
    portrait: `${SUPERHERO_CDN_BASE}/697-vision.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/77.jpg?v=2`,
    name: 'Vision',
    universe: 'MCU Canon (Earth-616)'
  },
  'daredevil': {
    portrait: `${SUPERHERO_CDN_BASE}/201-daredevil.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/15.jpg?v=2`,
    name: 'Daredevil',
    universe: 'MCU Canon (Earth-616)'
  },
  'luke-cage': {
    portrait: `${SUPERHERO_CDN_BASE}/416-luke-cage.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/20.jpg?v=2`,
    name: 'Luke Cage',
    universe: 'MCU Canon (Earth-616)'
  },
  'gamora': {
    portrait: `${SUPERHERO_CDN_BASE}/275-gamora.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/13.jpg?v=2`,
    name: 'Gamora',
    universe: 'MCU Canon (Earth-616)'
  },
  'star-lord': {
    portrait: `${SUPERHERO_CDN_BASE}/630-star-lord.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/14.jpg?v=2`,
    name: 'Star-Lord',
    universe: 'MCU Canon (Earth-616)'
  },
  'rocket-raccoon': {
    portrait: `${SUPERHERO_CDN_BASE}/566-rocket-raccoon.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/57.jpg?v=2`,
    name: 'Rocket',
    universe: 'MCU Canon (Earth-616)'
  },
  'thanos': {
    portrait: `${SUPERHERO_CDN_BASE}/655-thanos.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/35.jpg?v=2`,
    name: 'Thanos',
    universe: 'MCU Canon (Earth-616)'
  },
  'doctor-doom': {
    portrait: `${SUPERHERO_CDN_BASE}/222-doctor-doom.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/75.jpg?v=2`,
    name: 'Doctor Doom',
    universe: 'Marvel Multiverse / Doomsday Lead-In'
  },
  'green-goblin': {
    portrait: `${SUPERHERO_CDN_BASE}/299-green-goblin.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/47.jpg?v=2`,
    name: 'Green Goblin',
    universe: 'Sony Spider-Verse / Earth-616 Incursion'
  },
  'loki': {
    portrait: `${SUPERHERO_CDN_BASE}/414-loki.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/41.jpg?v=2`,
    name: 'Loki',
    universe: 'MCU Canon (Earth-616) & TVA Multiverse'
  },
  'hawkeye': {
    portrait: `${SUPERHERO_CDN_BASE}/313-hawkeye.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/45.jpg?v=2`,
    name: 'Hawkeye',
    universe: 'MCU Canon (Earth-616)'
  },
  'bucky-barnes': {
    portrait: `${SUPERHERO_CDN_BASE}/714-winter-soldier.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/12.jpg?v=2`,
    name: 'Winter Soldier',
    universe: 'MCU Canon (Earth-616)'
  },
  'falcon': {
    portrait: `${SUPERHERO_CDN_BASE}/251-falcon.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/68.jpg?v=2`,
    name: 'Falcon / Captain America',
    universe: 'MCU Canon (Earth-616)'
  },
  'shang-chi': {
    portrait: `${SUPERHERO_CDN_BASE}/587-shang-chi.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/43.jpg?v=2`,
    name: 'Shang-Chi',
    universe: 'MCU Canon (Earth-616)'
  },
  'moon-knight': {
    portrait: `${SUPERHERO_CDN_BASE}/470-moon-knight.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/48.jpg?v=2`,
    name: 'Moon Knight',
    universe: 'MCU Canon (Earth-616)'
  },
  'mister-fantastic': {
    portrait: `${SUPERHERO_CDN_BASE}/456-mister-fantastic.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/72.jpg?v=2`,
    name: 'Mister Fantastic',
    universe: 'Retro-Futuristic Earth (First Steps) & Earth-838'
  },
  'invisible-woman': {
    portrait: `${SUPERHERO_CDN_BASE}/344-invisible-woman.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/72.jpg?v=2`,
    name: 'Invisible Woman',
    universe: 'Retro-Futuristic Earth (First Steps)'
  },
  'human-torch': {
    portrait: `${SUPERHERO_CDN_BASE}/333-human-torch.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/72.jpg?v=2`,
    name: 'Human Torch',
    universe: 'Retro-Futuristic Earth & Void Cameo'
  },
  'thing': {
    portrait: `${SUPERHERO_CDN_BASE}/658-thing.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/72.jpg?v=2`,
    name: 'The Thing',
    universe: 'Retro-Futuristic Earth (First Steps)'
  },
  'doctor-octopus': {
    portrait: `${SUPERHERO_CDN_BASE}/225-doctor-octopus.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/47.jpg?v=2`,
    name: 'Doctor Octopus',
    universe: 'Sony Raimi Universe & MCU No Way Home'
  },
  'mysterio': {
    portrait: `${SUPERHERO_CDN_BASE}/479-mysterio.jpg`,
    fallbackPoster: `/images/spiderman-far-from-home.jpg`,
    name: 'Mysterio',
    universe: 'MCU Canon (Earth-616)'
  },
  'rhino': {
    portrait: `${SUPERHERO_CDN_BASE}/556-rhino.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/47.jpg?v=2`,
    name: 'Rhino',
    universe: 'Sony Amazing Spider-Man & Kraven Universe'
  },
  'venom': {
    portrait: `${SUPERHERO_CDN_BASE}/687-venom.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/47.jpg?v=2`,
    name: 'Venom',
    universe: 'Sony Marvel Universe & MCU Post-Credit Cameo'
  },
  'captain-marvel': {
    portrait: `${SUPERHERO_CDN_BASE}/157-captain-marvel.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/4.jpg?v=2`,
    name: 'Captain Marvel',
    universe: 'MCU Canon (Earth-616)'
  },
  'red-skull': {
    portrait: `${SUPERHERO_CDN_BASE}/550-red-skull.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/1.jpg?v=2`,
    name: 'Red Skull',
    universe: 'MCU Canon (Earth-616)'
  },
  'ultron': {
    portrait: `${SUPERHERO_CDN_BASE}/680-ultron.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/18.jpg?v=2`,
    name: 'Ultron',
    universe: 'MCU Canon (Earth-616)'
  },
  'hela': {
    portrait: `${SUPERHERO_CDN_BASE}/321-hela.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/30.jpg?v=2`,
    name: 'Hela',
    universe: 'MCU Canon (Earth-616)'
  },
  'black-bolt': {
    portrait: `${SUPERHERO_CDN_BASE}/96-black-bolt.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/49.jpg?v=2`,
    name: 'Black Bolt',
    universe: 'Multiverse (Earth-838) & Inhumans'
  },
  'silver-surfer': {
    portrait: `${SUPERHERO_CDN_BASE}/598-silver-surfer.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/72.jpg?v=2`,
    name: 'Silver Surfer',
    universe: 'Marvel Multiverse & Fantastic Four'
  },
  'valkyrie': {
    portrait: `${VERCEL_ASSET_BASE}/photos/52.jpg?v=2`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/30.jpg?v=2`,
    name: 'King Valkyrie',
    universe: 'MCU Canon (Earth-616)'
  },
  'mantis': {
    portrait: `${SUPERHERO_CDN_BASE}/431-mantis.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/55.jpg?v=2`,
    name: 'Mantis',
    universe: 'MCU Canon (Earth-616)'
  },
  'elektra': {
    portrait: `${SUPERHERO_CDN_BASE}/238-elektra.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/27.jpg?v=2`,
    name: 'Elektra',
    universe: 'MCU Canon (Earth-616)'
  },
  'speed-tommy-shepherd': {
    portrait: `${VERCEL_ASSET_BASE}/photos/77.jpg?v=2`,
    fallbackPoster: `${SUPERHERO_CDN_BASE}/536-quicksilver.jpg`,
    name: 'Speed (Tommy Shepherd)',
    universe: 'MCU Canon (Earth-616 • VisionQuest)'
  },
  'punisher': {
    portrait: `${SUPERHERO_CDN_BASE}/530-punisher.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/25.jpg?v=2`,
    name: 'The Punisher',
    universe: 'MCU Canon (Earth-616)'
  },
  'jean-grey': {
    portrait: `${SUPERHERO_CDN_BASE}/356-jean-grey.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/101.jpg?v=2`,
    name: 'Jean Grey / Phoenix',
    universe: 'Fox Mutant Universe (Earth-10005)'
  },
  'professor-x': {
    portrait: `${SUPERHERO_CDN_BASE}/527-professor-x.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/101.jpg?v=2`,
    name: 'Professor X',
    universe: 'Fox Mutant Universe (Earth-10005) & Earth-838'
  },
  'magneto': {
    portrait: `${SUPERHERO_CDN_BASE}/423-magneto.jpg`,
    fallbackPoster: `${VERCEL_ASSET_BASE}/photos/102.jpg?v=2`,
    name: 'Magneto',
    universe: 'Fox Mutant Universe (Earth-10005)'
  }
};

export function getMoviePosterUrl(id) {
  return `${VERCEL_ASSET_BASE}/photos/${id}.jpg?v=2`;
}

export function getCharacterPortraitUrl(charId) {
  return CHARACTER_PORTRAIT_REGISTRY[charId]?.portrait || '';
}
