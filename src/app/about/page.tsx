import type { Metadata } from 'next';
import { shareMeta } from '@/lib/share';
import { PlacePage, Section } from '@/components/place/kit';
import { AboutOpening } from '@/components/about/AboutOpening';
import { AboutCourtyard } from '@/components/about/AboutCourtyard';
import '@/components/about/about.css';
import { Dossier } from '@/components/place/Dossier';
import { Reveal } from '@/components/place/reveal';

export const metadata: Metadata = shareMeta('About', 'Devansh Sureka: civil engineering student at BITS Pilani from Jaipur. Builder, former NSS Secretary and roll ball captain, and someone who writes everything down.', '/og/about.jpg');

const TIMELINE = [
  { t: '2016', d: ['Silver at the Rajasthan district skating championship.', 'National Championships the year after.'] },
  { t: '2019 – 21', d: ['NCC cadet, 1 Raj Boys Battalion.'] },
  { t: '2021', d: ['Class 10 at DPS Jaipur, 93.6%. School topper in mathematics.'] },
  { t: '2023', d: ['Class 12, 89.4%, school topper in maths and chemistry.', 'Cleared JEE Advanced, which got me IIT (ISM) Dhanbad. BITSAT, and my gut, took me to BITS Pilani’s Pilani campus for civil engineering.'] },
  { t: '2024', d: ['First remote internship: product at House of Fandom, from one country to three.', 'Design and marketing intern at IIT Bombay Techfest.', 'Spotify go-to-market study.'] },
  { t: '2025', d: ['Operations analyst intern at Akshaya Patra: the water project.', 'Captain of skating and roll ball.', 'Head of social media and design at CEA.', 'Editor-in-Chief of L.I.T.E., the department magazine.', 'NSS Secretary.', 'InterBITS gold with the roll ball team.'] },
  { t: '2026', d: ['Eco-brick research funded.', 'AI Automation Intern at Univest.'] },
];

export default function AboutPage() {
  return (
    <PlacePage place="about">
      <AboutOpening />
      <AboutCourtyard />

      <Dossier />

      <Section num="02" label="What I’m made of" title="Four things I try to bring everywhere" tone="deep">
        <Reveal className="about-values">
          <div>
            <h3>Discipline</h3>
            <p>NCC in school, years of training on skates, and a habit of finishing what I start.</p>
          </div>
          <div>
            <h3>Variety</h3>
            <p>Civil engineering, finance, product, AI, design and sport. Each one keeps lending tricks to the others.</p>
          </div>
          <div>
            <h3>Craft</h3>
            <p>If my name is on it, it should be done properly. A template the next team never has to ask about. A brick that holds.</p>
          </div>
          <div>
            <h3>Calm under pressure</h3>
            <p>A final in Hyderabad, as captain. A year of NSS through a funding freeze. Panic doesn’t fix anything.</p>
          </div>
        </Reveal>
      </Section>

      <Section num="03" label="Outside the work" title={<>The things that don’t go on a résumé</>}>
        <Reveal as="dl" className="about-shelf">
          <div>
            <dt>On repeat</dt>
            <dd>
              Arijit Singh, Shreya Ghoshal
              <small>Legends. The kind of songs that stay.</small>
            </dd>
          </div>
          <div>
            <dt>Fuel</dt>
            <dd>
              Coffee
              <small>Always coffee.</small>
            </dd>
          </div>
          <div>
            <dt>On my desk</dt>
            <dd>
              A pen stand full of pens, notebooks, laptop
              <small>And a stack of self-help books I keep but don’t really read.</small>
            </dd>
          </div>
          <div>
            <dt>Daily rhythm</dt>
            <dd>
              Days for long-term goals, nights for creative work
              <small>The notebook mostly fills after dark.</small>
            </dd>
          </div>
          <div>
            <dt>Home</dt>
            <dd>
              Jaipur, and family first
              <small>I’m a family person.</small>
            </dd>
          </div>
          <div>
            <dt>Learning right now</dt>
            <dd>
              AI and automation, at industry level
              <small>The Studio is where it shows.</small>
            </dd>
          </div>
          <div>
            <dt>Food</dt>
            <dd>
              I eat a lot, nothing fancy
              <small>Always up for trying something new.</small>
            </dd>
          </div>
          <div>
            <dt>Next</dt>
            <dd>
              Travel
              <small>I haven’t seen much of the world yet. I want to.</small>
            </dd>
          </div>
        </Reveal>
      </Section>

      <Section num="04" label="So far" title="A short timeline" tone="deep">
        <Reveal as="ol" className="about-timeline about-timeline--wide">
          {TIMELINE.map((it) => (
            <li key={it.t}>
              <time>{it.t}</time>
              <ul>
                {it.d.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </li>
          ))}
        </Reveal>
      </Section>

    </PlacePage>
  );
}
