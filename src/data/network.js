/**
 * MARVEL SOCIAL NETWORK ARCHITECTURE
 * -------------------------------------------------------------
 * Grounded in network science calculations from `marvel-network-universe.ipynb`.
 * 
 * Centrality metrics from the 574,467-edge social graph computed in the notebook:
 * - Degree Centrality: Quantifies immediate connection breadth (Top: Captain America 0.30, Spider-Man 0.27, Iron Man 0.24)
 * - Eigenvector Centrality: Quantifies connection to high-influence hubs (Top: Captain America 0.1168, Iron Man 0.1025, Wanda 0.1008)
 * - Betweenness Centrality: Quantifies bridging power across disparate clusters (Top: Spider-Man 0.0735, Captain America 0.0570, Iron Man 0.0372)
 */

export const NETWORK_METRICS = {
  degree: [
    { name: "Captain America", score: 0.30, role: "Avengers Anchor" },
    { name: "Spider-Man", score: 0.27, role: "Street & Multiverse Bridge" },
    { name: "Iron Man", score: 0.24, role: "Tech & Initiative Focal" },
    { name: "The Thing", score: 0.22, role: "Fantastic Four Anchor" },
    { name: "Mister Fantastic", score: 0.21, role: "Scientific Keystone" },
    { name: "Wolverine", score: 0.21, role: "Mutant & Avenger Cross-Node" },
    { name: "Human Torch", score: 0.21, role: "Cosmic & Street Node" },
    { name: "Scarlet Witch", score: 0.21, role: "Mystic & Nexus Node" },
    { name: "Thor", score: 0.20, role: "Cosmic Realm Anchor" }
  ],
  eigenvector: [
    { name: "Captain America", score: 0.1168, role: "Core Leader Node" },
    { name: "Iron Man", score: 0.1025, role: "High-Influence Nexus" },
    { name: "Scarlet Witch", score: 0.1008, role: "Reality & Magic Hub" },
    { name: "The Thing", score: 0.1008, role: "Deep Team Cluster Anchor" },
    { name: "Spider-Man", score: 0.1002, role: "Universal High-Eigen Bridge" },
    { name: "Mister Fantastic", score: 0.0997, role: "Multiverse Nexus" },
    { name: "Vision", score: 0.0985, role: "Synthezoid Link" },
    { name: "Human Torch", score: 0.0985, role: "Kinetic Hub" },
    { name: "Wolverine", score: 0.0984, role: "Cross-Franchise Nexus" }
  ],
  betweenness: [
    { name: "Spider-Man", score: 0.0735, role: "Supreme Multiverse & Street Bridge" },
    { name: "Captain America", score: 0.0570, role: "Military & Cosmic Bridge" },
    { name: "Iron Man", score: 0.0372, role: "Global & Extra-Planetary Bridge" },
    { name: "Wolverine", score: 0.0357, role: "Mutant & Human World Bridge" },
    { name: "Doctor Strange", score: 0.0292, role: "Mystic Dimension Bridge" },
    { name: "The Thing", score: 0.0254, role: "Brawler & Family Bridge" },
    { name: "Hulk", score: 0.0239, role: "Terrestrial & Sakaar Bridge" }
  ]
};

export const NETWORK_NODES = [
  { id: "iron-man", label: "Iron Man", group: "Avengers", x: 280, y: 220, r: 24, color: "#E8392B", degree: 0.24 },
  { id: "captain-america", label: "Captain America", group: "Avengers", x: 340, y: 310, r: 28, color: "#2980B9", degree: 0.30 },
  { id: "thor", label: "Thor", group: "Avengers", x: 440, y: 170, r: 22, color: "#3C8DFF", degree: 0.20 },
  { id: "black-widow", label: "Black Widow", group: "Avengers", x: 260, y: 340, r: 18, color: "#E84B4B", degree: 0.19 },
  { id: "hulk", label: "Hulk", group: "Avengers", x: 420, y: 260, r: 22, color: "#00E676", degree: 0.19 },
  { id: "hawkeye", label: "Hawkeye", group: "Avengers", x: 200, y: 310, r: 16, color: "#8B5CF6", degree: 0.17 },
  { id: "spider-man", label: "Spider-Man", group: "Street", x: 330, y: 440, r: 26, color: "#E8392B", degree: 0.27 },
  { id: "doctor-strange", label: "Doctor Strange", group: "Mystic", x: 490, y: 360, r: 22, color: "#EAB308", degree: 0.18 },
  { id: "scarlet-witch", label: "Scarlet Witch", group: "Mystic", x: 390, y: 390, r: 24, color: "#E84B4B", degree: 0.21 },
  { id: "vision", label: "Vision", group: "Avengers", x: 330, y: 200, r: 18, color: "#00F0FF", degree: 0.17 },
  { id: "wolverine", label: "Wolverine", group: "Mutants", x: 190, y: 460, r: 24, color: "#FACC15", degree: 0.21 },
  { id: "deadpool", label: "Deadpool", group: "Mutants", x: 120, y: 420, r: 18, color: "#E8392B", degree: 0.14 },
  { id: "daredevil", label: "Daredevil", group: "Defenders", x: 260, y: 520, r: 18, color: "#C0392B", degree: 0.13 },
  { id: "luke-cage", label: "Luke Cage", group: "Defenders", x: 330, y: 560, r: 16, color: "#D97706", degree: 0.11 },
  { id: "star-lord", label: "Star-Lord", group: "Guardians", x: 570, y: 150, r: 18, color: "#3B82F6", degree: 0.15 },
  { id: "gamora", label: "Gamora", group: "Guardians", x: 620, y: 220, r: 18, color: "#10B981", degree: 0.14 },
  { id: "rocket-raccoon", label: "Rocket", group: "Guardians", x: 530, y: 230, r: 17, color: "#F59E0B", degree: 0.14 },
  { id: "thanos", label: "Thanos", group: "Cosmic", x: 580, y: 300, r: 22, color: "#8257FF", degree: 0.16 },
  { id: "loki", label: "God Loki", group: "Temporal", x: 450, y: 80, r: 22, color: "#00E676", degree: 0.19 },
  { id: "black-panther", label: "Black Panther", group: "Wakanda", x: 420, y: 470, r: 20, color: "#9333EA", degree: 0.18 },
  { id: "mister-fantastic", label: "Mr. Fantastic", group: "Fantastic4", x: 140, y: 240, r: 22, color: "#2563EB", degree: 0.21 },
  { id: "invisible-woman", label: "Invisible Woman", group: "Fantastic4", x: 100, y: 180, r: 18, color: "#38BDF8", degree: 0.17 },
  { id: "human-torch", label: "Human Torch", group: "Fantastic4", x: 180, y: 150, r: 21, color: "#F97316", degree: 0.21 },
  { id: "thing", label: "The Thing", group: "Fantastic4", x: 90, y: 290, r: 22, color: "#EA580C", degree: 0.22 },
  { id: "doctor-doom", label: "Doctor Doom", group: "Villains", x: 60, y: 100, r: 22, color: "#10B981", degree: 0.18 }
];

export const NETWORK_EDGES = [
  // Core Avengers Triad & Expansion
  { source: "iron-man", target: "captain-america", strength: 0.95, label: "Allies & Civil War Rivalry" },
  { source: "iron-man", target: "thor", strength: 0.85, label: "Founding Trinity" },
  { source: "captain-america", target: "thor", strength: 0.85, label: "Founding Trinity" },
  { source: "captain-america", target: "black-widow", strength: 0.90, label: "Winter Soldier Partnership" },
  { source: "iron-man", target: "black-widow", strength: 0.80, label: "Stark Industries / Avengers" },
  { source: "iron-man", target: "hulk", strength: 0.85, label: "Science Bros / Veronica" },
  { source: "captain-america", target: "hulk", strength: 0.75, label: "Battle of New York" },
  { source: "thor", target: "hulk", strength: 0.90, label: "Contest of Champions / Revengers" },
  { source: "hawkeye", target: "black-widow", strength: 0.95, label: "Budapest / Vormir" },
  { source: "captain-america", target: "hawkeye", strength: 0.80, label: "Secret Avengers" },
  { source: "iron-man", target: "spider-man", strength: 0.95, label: "Mentor / Nanotech Suit" },
  { source: "captain-america", target: "spider-man", strength: 0.75, label: "Queens & Brooklyn Clash" },
  { source: "iron-man", target: "vision", strength: 0.90, label: "JARVIS / Ultron Creation" },
  { source: "scarlet-witch", target: "vision", strength: 0.95, label: "Mind Stone Bond & Westview" },
  { source: "scarlet-witch", target: "doctor-strange", strength: 0.90, label: "Darkhold Multiverse Conflict" },
  { source: "spider-man", target: "doctor-strange", strength: 0.88, label: "Runes of Kof-Kol Spell" },
  { source: "thor", target: "loki", strength: 0.95, label: "Brothers of Asgard" },
  { source: "loki", target: "thanos", strength: 0.85, label: "Tesseract Pact & Death" },
  { source: "thanos", target: "gamora", strength: 0.92, label: "Adopted Daughter / Soul Sacrifice" },
  { source: "star-lord", target: "gamora", strength: 0.95, label: "Guardians Romance" },
  { source: "star-lord", target: "rocket-raccoon", strength: 0.90, label: "Guardians Co-Founders" },
  { source: "iron-man", target: "star-lord", strength: 0.80, label: "Titan Battle Strategy" },
  { source: "thor", target: "rocket-raccoon", strength: 0.88, label: "Nidavellir Forge Forge" },
  { source: "spider-man", target: "daredevil", strength: 0.80, label: "Legal Counsel & NYC Vigilantes" },
  { source: "daredevil", target: "luke-cage", strength: 0.85, label: "The Defenders of NYC" },
  { source: "spider-man", target: "wolverine", strength: 0.78, label: "Comic Alliance & Multiverse" },
  { source: "wolverine", target: "deadpool", strength: 0.95, label: "Anchor Beings & The Void" },
  { source: "captain-america", target: "black-panther", strength: 0.85, label: "Wakanda Defense" },
  { source: "mister-fantastic", target: "invisible-woman", strength: 0.98, label: "Spouses / First Family" },
  { source: "mister-fantastic", target: "human-torch", strength: 0.90, label: "Fantastic Four" },
  { source: "mister-fantastic", target: "thing", strength: 0.95, label: "Lifelong Friendship" },
  { source: "invisible-woman", target: "human-torch", strength: 0.95, label: "Storm Siblings" },
  { source: "human-torch", target: "thing", strength: 0.90, label: "Playful Rivalry" },
  { source: "mister-fantastic", target: "doctor-doom", strength: 0.95, label: "Arch-Nemesis Intellects" },
  { source: "mister-fantastic", target: "doctor-strange", strength: 0.80, label: "Illuminati Council (Earth-838)" }
];

export const networkGraphData = {
  metrics: NETWORK_METRICS,
  nodes: NETWORK_NODES.map(n => {
    const eigen = NETWORK_METRICS.eigenvector.find(m => m.name.toLowerCase() === n.label.toLowerCase() || m.name.toLowerCase() === n.id.toLowerCase())?.score || 0.075;
    const betw = NETWORK_METRICS.betweenness.find(m => m.name.toLowerCase() === n.label.toLowerCase() || m.name.toLowerCase() === n.id.toLowerCase())?.score || 0.018;
    return {
      ...n,
      degreeCentrality: n.degree || 0.15,
      eigenvectorCentrality: eigen,
      betweennessCentrality: betw,
      faction: n.group === 'Avengers' ? 'avengers' : (n.group === 'Street' ? 'spider-verse' : (n.group === 'Mystic' || n.group === 'Cosmic' || n.group === 'Guardians' ? 'mystic' : (n.group === 'Mutants' ? 'mutants' : 'villains'))),
      lore: `${n.label} occupies a critical structural position in the network with ${Math.round((n.degree || 0.15) * 100)}% direct connectivity across Marvel storylines.`
    };
  }),
  edges: NETWORK_EDGES
};

