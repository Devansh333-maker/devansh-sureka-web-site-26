// Every place on the island. One story per place, told through the culture that fits it.
// Positions are in world units on the island (x → right-front, z → left-front).

export type ZoneId = 'workshop' | 'studio' | 'commons' | 'arena' | 'press' | 'notebook';

export type Zone = {
  id: ZoneId;
  index: string;
  name: string;
  culture: string;
  // in plain words, for someone who has never seen the site: what kind of work, and the gist
  what: string;
  teaser: string;
  // the one number for the homepage postcard, when the first fact isn't the right one
  proof?: { value: string; label: string };
  native?: { text: string; lang: string; gloss: string };
  story: string;
  facts: { value: string; label: string }[];
  outfit: string;
  href: string;
  linkLabel: string;
  position: [number, number, number];
  labelHeight: number;
  focusZoom: number;
};

export const zones: Zone[] = [
  {
    id: 'workshop',
    index: '01',
    name: 'The Workshop',
    culture: 'Jaipur · sandstone haveli',
    what: 'Civil engineering',
    teaser: "Bricks made from crop and plastic waste, a kitchen’s wasted water, and buildings I modelled in 3D.",
    native: { text: 'हवेली', lang: 'hi', gloss: 'haveli' },
    story:
      'Where I build physical things. My research turns crop stubble and plastic waste into paving bricks that villagers can make and sell, and the waste made them stronger. I also model buildings in Blender and walk through them in Enscape.',
    facts: [
      { value: '6.5 MPa', label: 'best mix strength' },
      { value: '₹2L', label: 'institute funding' },
      { value: '5', label: 'mixes cast' },
    ],
    outfit: 'Hard hat, hi-vis vest, a rolled drawing',
    href: '/workshop',
    linkLabel: 'Open the Workshop',
    position: [-7, 0, -3.5],
    labelHeight: 5.6,
    focusZoom: 2.1,
  },
  {
    id: 'studio',
    index: '02',
    name: 'The Systems Studio',
    culture: 'Modern pavilion · glass and timber',
    what: 'AI and product',
    teaser: "The AI systems I built at Univest, plus product and strategy work.",
    story:
      'Where I think in systems. At Univest, India’s No. 1 SEBI-registered investment advisory, I built systems that spot market moves and publish the article while the market is still moving. Also a self-hosted AI workspace, and go-to-market plans for Spotify and House of Fandom.',
    facts: [
      { value: '11.38M', label: 'Google impressions' },
      { value: '57,941', label: 'clicks from search' },
      { value: '26', label: 'article types' },
    ],
    outfit: 'White shirt, sleeves up, coffee',
    href: '/studio',
    linkLabel: 'Open the Studio',
    position: [1.5, 0, -4.5],
    labelHeight: 5.2,
    focusZoom: 2.1,
  },
  {
    id: 'commons',
    index: '03',
    name: 'The Chaupal',
    culture: 'Rural Rajasthan · neem tree courtyard',
    what: 'Social work · NSS',
    teaser: "My year as NSS Secretary: seven villages, 200+ volunteers and the systems behind them.",
    native: { text: 'चौपाल', lang: 'hi', gloss: 'chaupal' },
    story:
      'Where I work with people and for the people. A year as NSS Secretary across 7 villages: rebuilt the finances, the templates and the way the next team inherits the work.',
    facts: [
      { value: '200+', label: 'volunteers' },
      { value: '7', label: 'villages' },
      { value: '582', label: 'blood donations ’26' },
    ],
    outfit: 'NSS badge and a clipboard',
    href: '/chaupal',
    linkLabel: 'Open the Chaupal',
    position: [8, 0, -2],
    labelHeight: 6.2,
    focusZoom: 2.2,
  },
  {
    id: 'arena',
    index: '04',
    name: 'The Arena',
    culture: 'Court · roll ball and skating',
    what: 'Sport · roll ball',
    teaser: "Roll ball on skates: the InterBITS final, captaincy, and the team behind the first gold.",
    story:
      'Where I compete. I captained the BITS Pilani roll ball team: for the first time we fielded a girls’ team and three boys’ teams, and we brought home BITS Pilani’s first-ever team gold at InterBITS.',
    facts: [
      { value: 'Gold', label: 'InterBITS 2025, a first' },
      { value: 'Captain', label: 'roll ball team' },
      { value: '#5', label: 'jersey' },
    ],
    outfit: 'Jersey #5, knee pads, quad skates',
    href: '/arena',
    linkLabel: 'Open the Arena',
    position: [5, 0, 4.2],
    labelHeight: 3.2,
    focusZoom: 1.9,
  },
  {
    id: 'press',
    index: '05',
    name: 'The Press',
    culture: 'Letterpress · ink and paper',
    what: 'Design and writing',
    teaser: "The magazine I revived, my Techfest work, and a wall of posters.",
    story:
      'Where I make things people see. As Editor-in-Chief, revived L.I.T.E., the civil department’s magazine, after a five-year gap, to show what our civil engineers can do. Posters, campaigns and mascot concepts for BITS Pilani.',
    facts: [
      { value: '5 yrs', label: 'gap, then revived' },
      { value: 'L.I.T.E.', label: 'Editor-in-Chief' },
      { value: 'Top 20', label: 'of 5,000+ Techfest ambassadors' },
    ],
    outfit: 'Printer’s apron, the first issue',
    href: '/press',
    linkLabel: 'Open the Press',
    position: [-7.5, 0, 4],
    labelHeight: 4.6,
    focusZoom: 2.2,
  },
  {
    id: 'notebook',
    index: '06',
    name: 'The Notebook',
    culture: 'Japanese engawa · maple and pond',
    what: 'Blog',
    teaser: "Notes on what I learn and how I build things, including this site.",
    proof: { value: '30 → 3', label: 'days to build this site, a year apart' },
    native: { text: '手帳', lang: 'ja', gloss: 'techō, a notebook' },
    story:
      'Where I write things down. When I work, I write everything down. Essays, diary pages, half-formed ideas. Posted whenever something is worth saying.',
    facts: [
      { value: 'Any', label: 'format' },
      { value: 'Night', label: 'is for writing' },
      { value: 'Every', label: 'project starts on paper' },
    ],
    outfit: 'Maroon hoodie, notebook, it’s late',
    href: '/notebook',
    linkLabel: 'Open the Notebook',
    position: [-1, 0, 4.6],
    labelHeight: 4.4,
    focusZoom: 2.2,
  },
];
