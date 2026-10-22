import { PageGuide } from '@/components/place/PageGuide';
import type { Metadata } from 'next';
import { shareMeta } from '@/lib/share';
import { Hero, PlacePage, Section, Stats } from '@/components/place/kit';
import { NameStrip } from '@/components/place/NameStrip';
import { Reveal } from '@/components/place/reveal';
import { CaseFiles, type CaseFile } from '@/components/place/CaseFiles';
import { CONTACT } from '@/lib/contact';
import { RoleArchive, type RoleRow } from '@/components/place/RoleArchive';
import { SayHello } from '@/components/SayHello';
import Image from 'next/image';
import '@/components/place/work.css';

export const metadata: Metadata = shareMeta('Work', 'Every role and project in one list, most important first: Univest, NSS, InterBITS gold, Akshaya Patra, House of Fandom and more, each linked to its full story.', '/og/work.jpg');


const ROLES: RoleRow[] = [
  { when: 'Jul 2026 –', what: 'AI Automation Intern, Univest', kind: 'work', detail: 'Event-driven publishing pipeline at India’s No. 1 SEBI-registered investment advisory: 26 article types, a URL model capping each stock at two pages. 11.38M Google impressions and 57,941 clicks, Jul – Oct.', place: 'Studio', href: '/studio', nums: [['11.38M', 'Google impressions'], ['57,941', 'clicks from search']] },
  { when: 'Jul 2026', what: 'Self-hosted AI workspace', kind: 'project', detail: 'Team-wide ChatGPT-style workspace on the OpenAI API with routing, auth, admin and usage tracking.', place: 'Studio', href: '/studio' },
  { when: 'Nov 2025 – Apr 2026', what: 'Eco-composite brick research', kind: 'project', detail: 'Under Prof. Mukund Lahoti, with my teammate Atharv. ₹2L institute funding; parali and plastic bricks, best mix 6.5 MPa. Ongoing.', place: 'Workshop', href: '/workshop', nums: [['6.5 MPa', 'best mix'], ['₹2L', 'funding'], ['5', 'mixes cast']] },
  { when: 'May 2025 – Apr 2026', what: 'Secretary, NSS BITS Pilani', kind: 'lead', detail: 'Responsible for the funds and inventory of 8 departments; 7 villages, 200+ volunteers, 30+ initiatives. Before that, two years in CLP: volunteer, then executive committee.', place: 'Chaupal', href: '/chaupal', nums: [['200+', 'volunteers'], ['7', 'villages'], ['30+', 'initiatives']] },
  { when: 'Apr 2025 – Apr 2026', what: 'Captain, Skating & Roll Ball', kind: 'lead', detail: 'First-ever team gold at InterBITS. Fielded a girls’ team and three boys’ teams for the first time, brought in a coach, and chose the next captain through a proper process.', place: 'Arena', href: '/arena', nums: [['Gold', 'InterBITS 2025'], ['1st', 'team gold ever']] },
  { when: 'May – Jul 2025', what: 'Operations Analyst Intern, Akshaya Patra', kind: 'work', detail: 'Found 20 KL/day of reject water; three costed recovery proposals, ₹35–60L.', place: 'Workshop', href: '/workshop', nums: [['20 KL', 'water a day found'], ['3', 'costed proposals']] },
  { when: 'Aug 2024 – Jan 2025', what: 'Product Management Intern, House of Fandom', kind: 'work', detail: 'Led expansion from the USA to the UK and Australia; 100+ SKU listing migration.', place: 'Studio', href: '/studio', nums: [['1 → 3', 'countries'], ['100+', 'SKUs migrated']] },
  { when: '2025 – 26', what: 'Urban hydrology: Ahmedabad rainfall and flood model', kind: 'project', detail: 'IDF curves from 25 years of NASA satellite rainfall, then a HEC-RAS flood model of a 34 km² corridor.', place: 'Workshop', href: '/workshop', nums: [['25 yrs', 'of rainfall data'], ['112 mm/hr', '1-hour, 100-year storm'], ['34 km²', 'modelled']] },
  { when: 'Oct 2024', what: 'Spotify India: market entry & GTM', kind: 'project', detail: 'Strategy study: dual-track launch, 3-stream revenue model, 4% → 18% share plan.', place: 'Studio', href: '/studio', nums: [['4% → 18%', 'share plan'], ['3', 'revenue streams']] },
  { when: 'Mar 2025 – Apr 2026', what: 'Head of Social Media & Design, CEA · Editor-in-Chief, L.I.T.E.', kind: 'lead', detail: 'Revived the department magazine after five years, to show what BITS Pilani’s civil engineers can do; visual identity and social for CEA.', place: 'Press', href: '/press' , nums: [['5 yrs', 'silent, then revived'], ['L.I.T.E.', 'Editor-in-Chief']] },
  { when: 'May – Dec 2024', what: 'Design & Marketing Intern, IIT Bombay Techfest', kind: 'work', detail: 'Top 20 of 5,000+ campus ambassadors; 10+ posters; invited to IIT Bombay for my design work.', place: 'Press', href: '/press', nums: [['Top 20', 'of 5,000+'], ['10+', 'posters']] },
  { when: 'Jun – Aug 2025', what: 'Venture Scout, LvlUp Ventures', kind: 'work', detail: 'Founder sourcing and due diligence for 15+ partner VCs; selected from 100+ applicants.', place: 'Studio', href: '/studio', nums: [['15+', 'partner VCs'], ['100+', 'applicants, selected']] },
  { when: 'Feb 2025, 2026', what: 'Blood Donation Camp lead, IRCS', kind: 'lead', detail: '669 donations, then 582. Certified IRCS volunteer two years running.', place: 'Chaupal', href: '/chaupal', nums: [['669', 'donations, 2025'], ['582', 'donations, 2026']] },
];

const EDUCATION = [
  { when: 'Aug 2023 – Jul 2027', what: 'B.E. Civil Engineering, minor in Finance', where: 'BITS Pilani, Pilani campus' },
  { when: '2022 – 23', what: 'Class 12, 89.4%', where: 'Delhi Public School, Jaipur · school topper in maths and chemistry' },
  { when: '2020 – 21', what: 'Class 10, 93.6%', where: 'Delhi Public School, Jaipur · school topper in mathematics' },
];

const SKILLS = [
  { group: 'Automation & AI', items: ['n8n', 'APIs', 'OpenAI API', 'Event-driven pipelines'] },
  { group: 'Data & analysis', items: ['Advanced Excel', 'Power BI', 'Google Analytics', 'Google Search Console', 'MATLAB', 'SQL & Python (learning)'] },
  { group: 'Product & design', items: ['Figma', 'JIRA', 'Photoshop', 'Canva', 'Premiere Pro', 'Clipchamp'] },
  { group: 'Engineering', items: ['Blender', 'Enscape', 'HEC-RAS', 'Google Earth Engine'] },
];

const CERTS = [
  { what: 'McKinsey Forward', by: 'McKinsey & Company' },
  { what: 'Digital Product Management', by: 'University of Virginia, on Coursera' },
];
const COURSES = ['Fundamentals of Finance & Accounting', 'Financial Management', 'Derivatives & Risk Management', 'Business Analysis & Valuation'];

// selected work, told as case files: problem → what I did → what came of it
const CASES: CaseFile[] = [
  {
    id: 'univest',
    tag: 'Univest · AI automation',
    title: 'The machine that writes the market',
    problem: 'Market events break all day: results, block deals, 52-week highs, dividends. Writers can’t cover them while they still matter.',
    approach:
      'An event-driven pipeline that spots each event, sorts it into one of 26 article types, drafts it, checks the facts and publishes. A URL model caps each stock at two pages so the site never competes with itself.',
    outcome: [
      { value: '11.38M', label: 'Google impressions' },
      { value: '57,941', label: 'clicks from search' },
      { value: '26', label: 'article types' },
    ],
    detail: 'At India’s No. 1 SEBI-registered investment advisory. Each article is checked before it goes live, cost per article fell by more than half, and a live dashboard tracks every variation. Around it: 550+ new web sign-ups in August and a 10%+ lift in organic traffic and conversions.',
    img: { src: '/opt/places/studio-sm.webp', alt: 'The Systems Studio' },
    href: '/studio',
    place: 'Systems Studio',
    tone: '#2f6f8f',
  },
  {
    id: 'brick',
    tag: 'BITS Pilani · research',
    title: 'A brick made of farm waste and plastic',
    problem: 'Farmers burn crop stubble every year, and plastic waste piles up. Both are problems; together they might be a material.',
    approach:
      'Cast five mixes of parali and plastic with binders and crushed them in a compression test, aiming at pavement bricks villagers could make and sell. A little waste turned out to make them stronger.',
    outcome: [
      { value: '6.5 MPa', label: 'best mix' },
      { value: '₹2L', label: 'institute funding' },
      { value: '5', label: 'mixes cast' },
    ],
    detail: 'Research under Prof. Mukund Lahoti, with my teammate Atharv, funded with ₹2L under the SIRE / KIRTI / SOLVE scheme. We also swapped the sodium hydroxide binder for hydrated lime, so the brick is safer for the people who make it and in the mix itself.',
    img: { src: '/opt/places/workshop-sm.webp', alt: 'The Workshop' },
    href: '/workshop',
    place: 'Workshop',
    tone: '#b5562a',
  },
  {
    id: 'nss',
    tag: 'NSS BITS Pilani · leadership',
    title: 'A volunteer machine the next team can inherit',
    problem: 'A large organisation across many villages was running on memory: money, templates and handovers lived in people’s heads.',
    approach: 'As Secretary, I was responsible for NSS’s funds and inventory across 8 departments, and wrote the guidelines and templates so the work keeps running after my year ended.',
    outcome: [
      { value: '200+', label: 'volunteers' },
      { value: '7', label: 'villages' },
      { value: '30+', label: 'initiatives' },
    ],
    detail: 'Built a finance system (Finance Guidelines, a kacha bill template, a treasurer portal), kept the inventory audited, cleared a three-year certificate backlog, and grew the Umang scholarships to 148 children, all with zero external sponsorship. I came up through CLP, NSS’s computer literacy programme: a volunteer in my first year, on its executive committee in my second.',
    img: { src: '/opt/places/commons-sm.webp', alt: 'The Chaupal' },
    href: '/chaupal',
    place: 'Chaupal',
    tone: '#8e1b2a',
  },
  {
    id: 'final',
    tag: 'Roll ball · captain',
    title: 'Building a team, not just a squad',
    problem: 'Roll ball on campus had talent but little structure: no girls’ team, no clear process, and a fair amount of chaos.',
    approach: 'As captain, fielded a girls’ team and three boys’ teams for the first time since the sport started on campus, brought in a coach for BOSM, and set up a system that kept the team in order.',
    outcome: [
      { value: 'Gold', label: 'InterBITS 2025' },
      { value: '1st', label: 'team gold ever for BITS' },
    ],
    detail: 'Captained the team at BOSM and at InterBITS in Hyderabad, where we won BITS Pilani’s first-ever team gold. I wanted a team that plays with sportsmanship, not one that just turns up for a sport, and chose the next captain through a proper process so it stays that way.',
    img: { src: '/me/rollball-drive.webp', alt: 'Devansh driving past a defender on quad skates' },
    href: '/arena',
    place: 'Arena',
    tone: '#e2622f',
  },
  {
    id: 'water',
    tag: 'Akshaya Patra · operations',
    title: 'Finding the water a kitchen was losing',
    problem: 'A water plant feeding a large kitchen was quietly pouring part of its input away.',
    approach: 'Traced the flows and the reject water, then costed three ways to recover it.',
    outcome: [
      { value: '20 KL', label: 'of water a day found' },
      { value: '3', label: 'costed proposals' },
      { value: '₹35–60L', label: 'proposal range' },
    ],
    detail: 'With my teammate Ansh Jain: three months of plant logs, our own pH, TDS and hardness tests before and after backwashing, then three reuse plans recovering 15–18 KL a day, presented to the administration.',
    img: { src: '/opt/places/workshop-sm.webp', alt: 'The Workshop' },
    href: '/workshop',
    place: 'Workshop',
    tone: '#3f5e6b',
  },
  {
    id: 'lite',
    tag: 'Civil Engineering Association · editor',
    title: 'Bringing a magazine back',
    problem: 'L.I.T.E., the civil department’s magazine, had been silent for five years.',
    approach: 'As Editor-in-Chief, rebuilt the team and the design and brought out the first issue again.',
    outcome: [
      { value: '5 yrs', label: 'gap, then revived' },
      { value: 'L.I.T.E.', label: 'Editor-in-Chief' },
    ],
    detail: 'The point: to show the college and industry what BITS Pilani’s civil engineers, and the professors in our department, are capable of, so the department is seen more and gets more opportunities. I led the team across writing, design and print, aiming for an annual magazine the department keeps making after us.',
    img: { src: '/opt/lite/p01.webp', alt: 'Cover of L.I.T.E.' },
    href: '/press',
    place: 'Press',
    tone: '#c2402a',
  },
];

export default function WorkPage() {
  return (
    <PlacePage place="work">
      <Hero
        kicker="Work · the short version"
        title={
          <>
            Everything,
            <br />
            in <em>one list</em>
          </>
        }
        lede={
          <>
            For when you don’t have time to wander. Every role and project, most important first, each linked to the place in the world where its full story lives.
          </>
        }
        meta={[
          { label: 'Now', value: 'AI Automation Intern, Univest' },
          { label: 'Studying', value: 'B.E. Civil + Finance minor, BITS Pilani ’27' },
          { label: 'From', value: 'Jaipur, Rajasthan' },
        ]}
        aside={
          <div className="w-card">
            <Image src="/me/formal.webp" alt="Devansh Sureka" width={1006} height={1080} sizes="(max-width: 900px) 60vw, 22rem" className="w-card__photo" priority />
            <div className="w-card__body">
              <p className="w-card__name">Devansh Sureka</p>
              <p className="w-card__line">Civil engineering + finance · BITS Pilani ’27</p>
              <div className="w-card__actions">
                <a className="w-card__primary" href={CONTACT.resume} target="_blank" rel="noreferrer">
                  Résumé (PDF) ↓
                </a>
                <SayHello className="w-card__secondary" />
              </div>
            </div>
          </div>
        }
      />


      <Section num="01" label="Skills" title="What I work with">
        <Reveal className="w-skills">
          {SKILLS.map((s) => (
            <div key={s.group}>
              <h3>{s.group}</h3>
              <ul>
                {s.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>
        <div className="w-certs">
          <div>
            <h3>Certifications</h3>
            <ul>
              {CERTS.map((c) => (
                <li key={c.what}>
                  <strong>{c.what}</strong> · {c.by}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Finance coursework</h3>
            <ul>
              {COURSES.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section num="02" label="At a glance" title="The numbers I’d lead with" tone="deep">
        <Stats
          items={[
            { value: '11.38M', label: 'Google impressions on AI-published articles' },
            { value: 'Gold', label: 'InterBITS 2025, BITS Pilani’s first team gold' },
            { value: '200+', label: 'NSS volunteers coordinated' },
            { value: '6.5 MPa', label: 'eco-brick from farm and plastic waste' },
          ]}
        />
      </Section>

      <NameStrip />

      <Section num="03" label="Selected work" title={<>Case files</>} intro="Six pieces of work, each with the problem, what I did and what came of it. Open any one for the full file.">
        <CaseFiles cases={CASES} />
      </Section>

      <Section num="04" label="Career archive" title="Every role, most important first" tone="deep">
        <RoleArchive roles={ROLES} />
        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
          <a className="p-link" href={CONTACT.resume} target="_blank" rel="noreferrer">
            Download the résumé (PDF) ↗
          </a>
          <SayHello className="p-link w-hello" />
        </div>
      </Section>
      <Section num="05" label="Education" title="Where I studied">
        <Reveal as="ol" className="w-edu">
          {EDUCATION.map((e) => (
            <li key={e.what}>
              <p className="w-edu__when">{e.when}</p>
              <div>
                <h3>{e.what}</h3>
                <p>{e.where}</p>
              </div>
            </li>
          ))}
        </Reveal>
      </Section>


      <PageGuide
        lines={{
          hero: "This page puts all my work in one place. Scroll, and I’ll walk you through it.",
          sections: {
            '01': "The tools I work with, and my certifications.",
            '02': "The numbers I’d lead with, at a glance.",
            '03': "Six case files: the problem, what I did and what came of it. Open any one.",
            '04': "Every role I’ve had, most important first. Use the filters to see just the jobs, the leadership or the projects.",
            '05': "Where I studied, from DPS Jaipur to BITS Pilani.",
          },
          end: "That’s everything on this page. Scroll a bit more to visit the next place.",
          kit: 'laptop',
        }}
      />
    </PlacePage>
  );
}
