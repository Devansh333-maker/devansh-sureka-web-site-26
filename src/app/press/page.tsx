import type { Metadata } from 'next';
import { shareMeta } from '@/lib/share';
import Image from 'next/image';
import { Hero, NextPlace, PlacePage, Section, Story } from '@/components/place/kit';
import { PageGuide } from '@/components/place/PageGuide';
import { Reveal } from '@/components/place/reveal';
import { CONTACT } from '@/lib/contact';
import { CoverFlow } from '@/components/place/CoverFlow';
import { Magazine } from '@/components/place/Magazine';
import { Role } from '@/components/place/Role';
import Link from 'next/link';
import { DesignSheets, InstaCarousel, Showcase } from '@/components/place/Designs';

export const metadata: Metadata = shareMeta('The Press', 'Reviving L.I.T.E., the civil department magazine, after five silent years as Editor-in-Chief; a top-20 IIT Bombay Techfest ambassador; posters and campaigns.', '/og/press.jpg');

// every design piece on the wall (posters, posts, standees, a banner). Contact numbers printed on
// the originals have been taken off, and the skating posters live in the Arena.
const S = '/opt/design/posters/';
const HELIX = [
  { src: S + 'REALPOLTIK (1).webp', alt: 'Realpolitik, event poster', w: 1272, h: 1422 },
  { src: '/opt/Posters/cea CRICKET.webp', alt: 'CEA cricket tournament, poster', w: 1080, h: 1350 },
  { src: '/opt/Instagram Posts/National.webp', alt: 'National Social Media Day, Instagram post', w: 1080, h: 1080 },
  { src: '/opt/Standee/Indias Most Versatile Anchor (1).webp', alt: 'India’s Most Versatile Anchor, standee', w: 900, h: 1800 },
  { src: '/opt/Instagram Posts/Exhibitions (2).webp', alt: 'International exhibitions, Instagram post', w: 1350, h: 1350 },
  { src: S + 'bdc-post.webp', alt: 'Blood donation camp, Instagram post', w: 1080, h: 1080 },
  { src: '/opt/Posters/CEA Farewell.webp', alt: 'CEA farewell, poster', w: 1390, h: 1800 },
  { src: '/opt/Instagram Posts/Aman Malhotra (4).webp', alt: 'Speaker announcement, Instagram post', w: 1800, h: 1800 },
  { src: S + 'REALPOLTIK (2).webp', alt: 'Realpolitik, alternate poster', w: 1272, h: 1521 },
  { src: '/opt/Banner/Sustainability.webp', alt: 'Sustainability, banner', w: 500, h: 280 },
  { src: S + 'Registrations start now (2).webp', alt: 'Esports registrations, poster', w: 1080, h: 1198 },
  { src: '/opt/Instagram Posts/Slice 3.webp', alt: 'Guest speaker reveal, Instagram post', w: 1080, h: 1080 },
];

// Techfest's "Machine Mania" set: four posts on the Hennessey Venom F5
const V = '/opt/design/venom/';
const VENOM = [
  { src: V + 'venom-1-hero.webp', alt: 'Machine Mania: Hennessey Venom F5, the reveal post', caption: 'The reveal', note: 'Name first: the Venom F5 wordmark and its flag stripes lead, the car follows.', w: 689, h: 696 },
  { src: V + 'venom-2-performance.webp', alt: 'Machine Mania: Venom F5 performance figures', caption: 'Performance', note: 'The numbers as a spec sheet: one column, read in a glance.', w: 706, h: 698 },
  { src: V + 'venom-3-interior.webp', alt: 'Machine Mania: Venom F5 interior', caption: 'Interior', note: 'Inside the cabin, with the engineering told in a few lines.', w: 717, h: 718 },
  { src: V + 'venom-4-post.webp', alt: 'Machine Mania: the post as it looked on Instagram', caption: 'On the feed', note: 'How it looked on Techfest’s Instagram.', w: 703, h: 698 },
];

const C = '/opt/design/carousels/';
const SHEETS = [
  { src: '/opt/design/sheets/bits-pilani.webp', alt: 'Design sheet: work for BITS Pilani events', title: 'BITS Pilani', note: 'Oasis, Realpolitik, the cricket tournament and the skating camps.', w: 1440, h: 4859 },
  { src: '/opt/design/sheets/techfest.webp', alt: 'Design sheet: work for IIT Bombay Techfest', title: 'Techfest, IIT Bombay', note: 'Carousels, Machine Mania, standees, posters and posts.', w: 1440, h: 8910 },
  { src: '/opt/design/sheets/nss.webp', alt: 'Design sheet: work for NSS BITS Pilani', title: 'NSS, BITS Pilani', note: 'The blood donation camp set and the AR/VR seminar carousel.', w: 1440, h: 6382 },
];

const enc = (p: string) => encodeURI(p);

export default function PressPage() {
  return (
    <PlacePage place="press">
      <Hero
        place="press"
        title={
          <>
            Ink, type
            <br />& <em>paper</em>
          </>
        }
        lede={
          <>
            The things I make for other people to look at: a department magazine brought back after five years, campaigns for Asia’s largest college tech fest,
            and a lot of posters asking people to show up.
          </>
        }
        meta={[
          { label: 'Role', value: 'Head of Social Media & Design, CEA' },
          { label: 'Magazine', value: 'Editor-in-Chief, L.I.T.E.' },
          { label: 'Tools', value: 'Figma · Photoshop · Canva' },
        ]}
        aside={
          <div className="lite-cover" aria-label="L.I.T.E. magazine cover, typographic rendering">
            <span className="lite-cover__top">Civil Engineering Association · BITS Pilani</span>
            <span className="lite-cover__name">L.I.T.E.</span>
            <span className="lite-cover__line" />
            <span className="lite-cover__issue">Revived after five years</span>
            <span className="lite-cover__ed">Editor-in-Chief: Devansh Sureka</span>
          </div>
        }
      />


      <Section num="01" label="L.I.T.E." title={<>A magazine that had <em>stopped</em></>}>
        <Story>
          <p>
            When I joined, the civil engineering department’s student body had stalled for about five years, and its magazine with it. With a group of friends I
            helped get the association running again, then took on the magazine as <strong>Editor-in-Chief</strong>.
          </p>
          <p>
            The reason was bigger than the magazine: to show the college and industry what BITS Pilani’s civil engineering students, and the professors in our
            department, are capable of, so the department is seen more and more opportunities come our way.
          </p>
          <p>
            I led the team across writing, design and print. The point was not one good issue. It was to leave behind an annual magazine that the department keeps
            making long after us: a small legacy at a big institute.
          </p>
        </Story>
        <Magazine />
      </Section>

      <Section num="02" label="IIT Bombay Techfest" title={<>Chosen from 5,000+</>} tone="deep">
        <Role
          org="IIT Bombay Techfest"
          role="Design & Marketing Intern"
          facts={['May – Dec 2024', 'Design + marketing', 'Top 20 of 5,000+ ambassadors']}
          brief={
            <p>
              Techfest is Asia’s largest student-run science and technology festival. Out of 5,000+ campus ambassadors across India, I was picked in the top 20,
              and offered two internships at once: design and marketing.
            </p>
          }
          did={[
            {
              title: 'Designed inside their identity',
              body: (
                <>
                  <strong>10+ posters</strong>, posts, standees and carousels, plus branding templates, all inside Techfest’s visual identity.
                </>
              ),
            },
            {
              title: 'Planned the marketing',
              body: (
                <>
                  Student-focused campaigns and an SEO plan for the festival. Both are in the Studio:{' '}
                  <Link href="/studies/techfest-seo">the SEO strategy</Link> and <Link href="/studies/techfest-social-media">the social media campaign</Link>.
                </>
              ),
            },
            {
              title: 'Invited to IIT Bombay',
              body: <>My design work stood out in the cohort, and it earned me an invitation to the festival at IIT Bombay.</>,
            },
          ]}
          numbers={[
            { value: 'Top 20', label: 'of 5,000+ campus ambassadors' },
            { value: '10+', label: 'posters and templates' },
            { value: 'Invited', label: 'to IIT Bombay for the festival' },
          ]}
        />
        <h3 className="p-sub">One series I liked making: Machine Mania</h3>
        <p className="p-lede-small">Four posts on the Hennessey Venom F5. Big type for the scroll, and one idea per post: the reveal, the numbers, the cabin, the feed.</p>
        <Showcase items={VENOM} label="Machine Mania, an Instagram series for Techfest" />
      </Section>

      <Section num="03" label="The mascot" title={<>Designing a campus mascot</>}>
        <Reveal className="p-split">
          <Story>
            <p>
              When BITS Pilani called for mascot designs, I submitted original concepts. The final mascot wasn’t mine, but ideas from my concepts made it into it.
            </p>
            <p>
              <a href="/pdfs/Mascot.pdf" target="_blank" rel="noreferrer">
                See the full mascot sheet ↗
              </a>
            </p>
          </Story>
          <div className="p-photo__frame" style={{ aspectRatio: '4 / 3' }}>
            <Image src="/opt/Cover.webp" alt="Mascot design cover" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: 'contain', background: 'var(--bg-2)' }} />
          </div>
        </Reveal>
      </Section>

      <Section num="04" label="The wall" title="Posters, posts and standees" intro="Event work for the Civil Engineering Association, NSS, Oasis and Techfest." tone="deep">
        <CoverFlow items={HELIX} />
      </Section>

      <Section num="05" label="Carousels" title={<>Made to be <em>swiped</em></>} intro="An Instagram carousel is one long picture cut into slides, so each swipe carries on from the last. Swipe through them, then join the slides to see the picture they make.">
        <div style={{ display: 'grid', gap: 'clamp(3rem, 7vw, 5rem)' }}>
          <InstaCarousel
            slides={[1, 2, 3, 4].map((i) => `${C}apollo-${i}.webp`)}
            handle="techfest_iitbombay"
            title="Apollo 11, for Techfest"
            note="Four slides on the first Moon landing: the landing, the crew, what the mission built. A timeline runs across every slide, so the story pulls you on to the next one."
            ratio="4 / 5"
          />
          <InstaCarousel
            slides={[1, 2, 3].map((i) => `${C}arvr-${i}.webp`)}
            handle="nss_bitspilani"
            title="AR & VR seminar, for NSS"
            note="Three slides for the AR/VR seminar NSS ran at Ceeri Vidya Mandir: the event, photos from the day, and who ran it."
            ratio="1 / 1"
          />
        </div>
      </Section>

      <Section num="06" label="Full sheets" title="The complete design sheets" intro="Everything for each organisation on one long page, with the thinking behind each piece. Open one and scroll; ← and → switch sheets." tone="deep">
        <DesignSheets sheets={SHEETS} />
        <p style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <a className="p-link" href={enc('/Portfolio/Design Portfolio.pdf')} target="_blank" rel="noreferrer">
            Full design portfolio (PDF) ↗
          </a>
          <a className="p-link" href={CONTACT.behance} target="_blank" rel="noreferrer">
            Behance ↗
          </a>
        </p>
      </Section>

      <NextPlace current="press" />
      <PageGuide
        lines={{
          hero: 'Hi! This page is my design and writing work. Scroll down and I’ll walk along with you and explain each part.',
          sections: {
            '01': 'Our department magazine had stopped for five years. As Editor-in-Chief I restarted it: the team, the stories and the design.',
            '02': 'Out of 5,000+ students, IIT Bombay’s Techfest picked me as a top-20 ambassador. My posters for them were rated the best.',
            '03': 'BITS Pilani wanted a campus mascot. My design wasn’t picked, but ideas from it were used in the final one.',
            '04': 'A collection of my posters and social posts. Use the arrows or swipe, and tap the middle card to see it full size.',
            '05': 'Carousels are one long picture cut into slides. Swipe through, then join the slides to see the picture they make.',
            '06': 'The full sheets: everything I made for each organisation, on one long page.',
          },
          end: 'That’s everything on this page. Scroll a bit more to visit the next place.',
          kits: { '01': 'magazine', '02': 'badge', '03': 'pencil', '04': 'poster', '05': 'poster', '06': 'magazine' },
        }}
      />
    </PlacePage>
  );
}
