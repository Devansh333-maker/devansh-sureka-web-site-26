import { Role } from '@/components/place/Role';
import Link from 'next/link';
import { archive } from '@/content/studies';
import '@/components/place/study.css';
import { PageGuide } from '@/components/place/PageGuide';
import type { Metadata } from 'next';
import { shareMeta } from '@/lib/share';
import { Hero, NextPlace, PlacePage, Photo, Quote, Section, Steps, Story } from '@/components/place/kit';
import { CitySequence } from '@/components/place/figures';
import { BeforeAfter, Growth, Reach, TamFunnel } from '@/components/place/StudioFigs';
import { Reveal } from '@/components/place/reveal';

export const metadata: Metadata = shareMeta('The Systems Studio', 'The AI publishing pipeline I built at Univest, India’s No. 1 SEBI-registered investment advisory (11.38M Google impressions), a self-hosted AI workspace, and go-to-market strategy for Spotify and House of Fandom.', '/og/studio.jpg');

export default function StudioPage() {
  return (
    <PlacePage place="studio">
      <Hero
        place="studio"
        title={
          <>
            I think in <em>systems</em>
          </>
        }
        lede={
          <>
            Most problems I enjoy are really plumbing problems: something should happen on its own, and it doesn’t. At Univest that meant building the machine
            that writes the market: from about <strong>200 hand-written articles a day to 800+ automated ones</strong>, each live two or three minutes after the
            market moves, and seen <strong>11.38 million times on Google</strong>.
          </>
        }
        meta={[
          { label: 'Now', value: 'AI Automation Intern, Growth & SEO, Univest' },
          { label: 'Tools', value: 'n8n · OpenAI · Python · WordPress' },
          { label: 'Since', value: 'July 2026' },
        ]}
        aside={<Photo src="/me/white-shirt.webp" alt="Devansh in a white shirt" ratio="1 / 1" priority />}
      />


      <Section
        num="01"
        label="Univest"
        title={<>The machine that writes the market</>}
        intro="Univest is India’s No. 1 SEBI-registered investment advisory. Every time a stock hits a 52-week high, trips a circuit or posts results, someone searches for it. Between July and October I built the systems that have the article ready, and this is what changed."
      >
        <BeforeAfter />
      </Section>

      <Section num="02" label="Growth" tone="deep" title={<>Six times the output in three months</>} intro="From a team writing by hand to a set of systems that publish on their own, and what it took to build them.">
        <Growth />
      </Section>

      <Section num="03" label="What it did" title={<>Found by Google, read by people</>}>
        <Reach />
      </Section>

      <Section num="04" label="The hard part" title={<>When scale became the problem</>} tone="deep">
        <Story side={<>Before: one new URL per event. After: at most two URLs per stock, kept fresh.</>}>
          <p>
            Volume created its own problem. When the same stock moved again and again, every event produced a fresh page, and the pages began competing with each
            other in search. That is called keyword cannibalisation, and at this scale it threatened rankings across the whole domain.
          </p>
          <p>
            I designed a <strong>three-state URL model</strong>: an original page, one consecutive page, and after that <strong>update-in-place</strong> with
            revalidation. Each stock is capped at two URLs, and the content stays current across four search engines.
          </p>
          <p>
            The cost came down the same way, by design rather than luck: banners composited from a branded asset library instead of drawn by AI (about 90% cheaper),
            prompts cut from 9,000 to 5,500 tokens, and the writing moved to a smaller model once the checks could prove it was good enough.
          </p>
          <p>
            Around it: <strong>550+ new web sign-ups in August</strong> (about 15% of the month’s 3,500), a <strong>10%+ lift in organic traffic and conversions</strong> from July to August, a live dashboard tracking every variation, and automated
            replies to Play Store reviews for the support team.
          </p>
        </Story>
      </Section>

      <Section num="05" label="AI workspace" title={<>A ChatGPT for the whole team, without the seats</>}>
        <Steps
          items={[
            { title: 'The problem', body: 'Per-seat AI subscriptions for everyone on a team get expensive fast, and nobody can see who is using what.' },
            { title: 'What I built', body: 'A self-hosted workspace on the OpenAI API with multi-model routing and image generation, paid per use instead of per seat.' },
            { title: 'Made it safe to share', body: 'Per-user sign-in, admin controls and token-usage tracking, so the team could use it freely and it could be managed centrally.' },
          ]}
        />
      </Section>

      <Section num="06" label="Spotify, a strategy study" title={<>What if Spotify sold the concert ticket?</>} tone="deep">
        <Story
          side={
            <>
              A strategy project, not work done for Spotify. Every revenue and share figure here is my projection.
            </>
          }
        >
          <p>
            India’s concert boom has a supply problem, not an audience problem. BookMyShow holds 60–70% of ticketing. Spotify already knows who listens to whom, city
            by city, so my bet was that its edge would be <strong>predictive</strong>: book the artist where the streams say the demand already is.
          </p>
          <p>
            I proposed a dual track: partner with BookMyShow on day one for infrastructure, while buying two or three regional ticketing platforms, so the dependence on BookMyShow falls from 60% to 20% by year three. Revenue from three streams:
            commission, Premium upsell and a BookMyShow share. <strong>Projected ₹190M in year one, ₹2.07B by year three.</strong>
          </p>
          <p>
            The part I’m proudest of is a number I cut. I first modelled 15% market share in year one and 45% by year three. Paytm took years to reach 10–15%, so I
            threw that out and planned for <strong>4% rising to 18%</strong>.
          </p>
        </Story>
        <div style={{ marginTop: '3rem' }}>
          <TamFunnel />
        </div>
        <div style={{ marginTop: '3rem' }}>
          <CitySequence />
        </div>
        <Quote by="From the study">Spotify’s moat is predictive, not reactive.</Quote>
        <p style={{ marginTop: '2rem' }}>
          <Link className="p-link" href="/studies/spotify-live-ticketing">
            Read the full study →
          </Link>
        </p>
      </Section>

      <Section num="07" label="House of Fandom" title={<>Taking a small store from one country to three</>}>
        <Role
          org="House of Fandom"
          role="Product Management Intern"
          facts={['Aug 2024 – Jan 2025', 'Remote', 'My first remote role']}
          brief={
            <p>
              House of Fandom sells anime and pop-culture merchandise online. When I joined, it sold only in the USA. My job was to take it abroad, and to make sure
              people in the new markets could actually find it.
            </p>
          }
          did={[
            {
              title: 'Took the store abroad',
              body: (
                <>
                  Led the move from the USA into the <strong>UK and Australia</strong>, and owned the listing migration end to end: <strong>100+ products</strong> across
                  eBay and Amazon.
                </>
              ),
            },
            {
              title: 'Wrote listings people search for',
              body: (
                <>
                  A keyword-gap analysis for each market, then rewritten titles, tags and categories, so the products showed up in local search from day one.
                </>
              ),
            },
            {
              title: 'Let research pick the shelf',
              body: (
                <>
                  Researched what fans in each market were buying and turned it into <strong>which categories to lead with</strong> and how to list them. Alongside,
                  I planned and made short-form videos so new buyers would discover the products.
                </>
              ),
            },
          ]}
          numbers={[
            { value: '1 → 3', label: 'countries it sold in' },
            { value: '100+', label: 'products migrated' },
            { value: '2', label: 'marketplaces: eBay and Amazon' },
          ]}
        />
      </Section>

      <Section num="08" label="Venture Scout" title={<>On the other side of the pitch</>} tone="deep">
        <Role
          org="LvlUp Ventures"
          role="Venture Scout, VC-in-Residence"
          facts={['Jun – Aug 2025', 'Remote', 'Selected from 100+ applicants']}
          brief={
            <p>
              A VC-in-Residence programme that connects student talent with India’s leading venture capital firms, to help them scout startups and research
              investments. I was selected from more than 100 applicants.
            </p>
          }
          did={[
            {
              title: 'Found the founders',
              body: (
                <>
                  Sourced startups with <strong>Apollo.io and PitchBook</strong>, and reached out to <strong>50–100+ founders</strong> to see which opportunities were
                  worth a closer look.
                </>
              ),
            },
            {
              title: 'Checked the deals',
              body: (
                <>
                  Due diligence and deal-flow work for <strong>15+ partner VCs</strong>: what the company does, whether the market is real, and what could go wrong.
                </>
              ),
            },
            {
              title: 'Thought like an investor',
              body: (
                <>
                  In the programme’s Discord VC communities I assessed pitches, helped build investment theses and wrote <strong>scouting reports</strong>.
                </>
              ),
            },
          ]}
          numbers={[
            { value: '100+', label: 'applicants, I was selected' },
            { value: '15+', label: 'partner VCs' },
            { value: '50–100+', label: 'founders reached' },
          ]}
        />
      </Section>

      <Section id="archive" num="09" label="Archive" title="Earlier studies" intro="Strategy, product and operations work from before, all readable right here, in one format. Each opens on screen; save any of them as a PDF from there.">
        <Reveal className="st-cards">
          {archive.map((s) => (
            <Link key={s.slug} className="st-card" href={`/studies/${s.slug}`}>
              <span className="st-card__kind">{s.kind}</span>
              <h3>{s.title}</h3>
              <p>{s.summary.split('. ')[0].replace(/\.$/, '')}.</p>
              <span className="st-card__foot">
                <span>{s.mode === 'deck' ? `Deck · ${s.pages?.length ?? 0} slides` : s.mode === 'pages' ? `Report · ${s.pages?.length ?? 0} pages` : 'Study'}</span>
                <b>Read →</b>
              </span>
            </Link>
          ))}
        </Reveal>
      </Section>

      <NextPlace current="studio" />
      <PageGuide
        lines={{
          hero: "This is my Studio: AI, product and strategy work. Scroll, and I’ll explain each piece.",
          sections: {
            '01': "At Univest, India’s No. 1 SEBI-registered investment advisory, I built systems that write a stock-market article on their own. Here’s what changed from July to October.",
            '02': "Output grew six times in three months. On the right is what I built to make that happen.",
            '03': "What it did for Univest: 11.38 million Google impressions and 57,941 clicks from the automated pages.",
            '04': "The hard part: too many pages for one stock started competing, so I capped it at two.",
            '05': "A shared AI workspace, so a whole team can use ChatGPT-style tools without paying for every seat.",
            '06': "A strategy study: what if Spotify also sold the concert tickets?",
            '07': "At House of Fandom I helped take a small online store from one country to three, and made sure people could find it.",
            '08': "As a venture scout I sat on the investor’s side: finding founders, checking deals and writing scouting reports.",
            '09': "My earlier strategy and research work. Each card opens the study right here, in the same format.",
          },
          end: "That’s everything on this page. Scroll a bit more to visit the next place.",
          kit: 'laptop',
        }}
      />
    </PlacePage>
  );
}
