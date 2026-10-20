import { PageGuide } from '@/components/place/PageGuide';
import type { Metadata } from 'next';
import { shareMeta } from '@/lib/share';
import Image from 'next/image';
import { Hero, NextPlace, PlacePage, Photo, Quote, Section, Stats, Story } from '@/components/place/kit';
import { Reveal } from '@/components/place/reveal';
import { ArenaFilm } from '@/components/place/film/ArenaFilmLazy';
import { PosterPair } from '@/components/place/Designs';

export const metadata: Metadata = shareMeta('The Arena', 'Roll ball on skates at BITS Pilani: I captained the team to its first-ever team gold at InterBITS.', '/og/arena.jpg');

export default function ArenaPage() {
  return (
    <PlacePage place="arena">
      <Hero
        place="arena"
        title={
          <>
            Captain,
            <br />
            <em>#5</em>
          </>
        }
        lede={
          <>
            I have been on skates since I was a kid. At BITS I captained the skating and roll ball team, and at InterBITS 2025 in Hyderabad we brought home the{' '}
            <strong>first-ever team gold at InterBITS</strong>.
          </>
        }
        meta={[
          { label: 'Role', value: 'Captain, April 2025 – April 2026' },
          { label: 'Team', value: 'BITS Pilani Skating & Roll Ball' },
          { label: 'Jersey', value: '5' },
        ]}
        aside={<Photo src="/me/rollball-drive.webp" alt="Devansh driving past a defender with the ball on quad skates" ratio="4 / 5" priority position="42% 50%" />}
      />

      <Section num="01" label="Replay" title={<>Roll ball, <em>in motion</em></>} intro="Roll ball on quad skates, cut like an anime opening: read the play, wait for the gap, strike. Best with sound.">
        <ArenaFilm />
      </Section>

      <Section num="02" label="The game" title={<>Roll ball, in one line</>} tone="deep">
        <Story
          side={<>Roll ball was invented in India, in Pune, in 2003. Most people at a match are watching it for the first time.</>}
        >
          <p>
            <strong>Basketball’s hands, handball’s goals, played on roller skates.</strong> Two teams, a ball you dribble and pass by hand, and goals at each end of the
            court. You have to keep your balance, read the play and shoot, all at speed and all at once.
          </p>
          <p>
            It is a game that punishes anyone who only does one thing well. That is most of why I love it.
          </p>
        </Story>
      </Section>

      <Section num="03" label="Captaincy" title={<>What I was really trying to win</>}>
        <div className="p-split p-split--wide-left">
          <div>
            <Story>
              <p>
                Medals are the part people see, and I won my share. The part I cared about more was the team itself. When I took over, roll ball on campus had
                talent but little structure, and a fair amount of chaos.
              </p>
              <p>
                For the first time since the sport started on campus, we fielded a <strong>girls’ team and three boys’ teams</strong>. I brought in a coach for
                BOSM, ran the selection trials and training camps, and captained the team at BOSM and at InterBITS in Hyderabad.
              </p>
              <p>
                I set up a system for how the team runs, so the order stays and the old chaos doesn’t come back, and chose the next captain through a proper
                process rather than a quick handover. Above all I wanted a team that plays with sportsmanship and shares a spirit, not one that just turns up for
                a sport.
              </p>
              <p>
                The worst moments were injuries right before games that mattered. It hurts, and you play around it. You keep going.
              </p>
            </Story>
          </div>
          <Photo src="/me/rollball-practice.webp" alt="Devansh dribbling during a practice session" ratio="3 / 2" />
        </div>
        <Quote by="Me, on what captaincy was for">I wanted the new players to love the game itself, not just the results.</Quote>
      </Section>

      <Section num="04" label="The record" title="The record, newest first" tone="deep">
        <Stats
          items={[
            { value: 'Gold', label: 'Roll ball, InterBITS 2025', note: 'First-ever team gold for BITS Pilani' },
            { value: 'Silver', label: 'BOSM 2025', note: 'Silver in roll ball and mixed relay · bronze in inline speed skating' },
            { value: 'Bronze', label: 'BOSM 2024', note: 'Roll ball · speed skating & relay' },
            { value: 'Silver', label: 'Roll ball, BOSM 2023' },
            { value: 'Silver', label: 'Rajasthan district skating championship, 2016' },
            { value: 'Competed', label: 'National Championships, 2017' },
          ]}
        />
      </Section>

      <Section num="05" label="Off the court" title={<>I also made the posters</>} intro="The team’s camps and trials needed people to show up, so I designed the calls: one for August, one for January.">
        <Reveal className="p-split">
          <PosterPair
            items={[
              { src: '/opt/design/posters/Skating poster (4).webp', alt: 'Skating camp and trials, August 2024, poster', w: 1273, h: 1800 },
              { src: '/opt/design/posters/Skating Camp and Trials.webp', alt: 'Skating camp and trials, January, poster', w: 1080, h: 1350 },
            ]}
          />
          <figure className="p-photo">
            <div className="p-photo__frame" style={{ aspectRatio: '1 / 1' }}>
              <Image src="/me/rollball-jersey-5.webp" alt="Devansh in the number 5 jersey holding the ball" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: 'cover', objectPosition: '45% 50%' }} />
            </div>
            <figcaption>The #5 on the back.</figcaption>
          </figure>
        </Reveal>
      </Section>

      <NextPlace current="arena" />
      <PageGuide
        lines={{
          hero: "This is the Arena: my sport, roll ball. Scroll, and I’ll walk you through it.",
          sections: {
            '01': "Press play: roll ball, told like an anime opening. Turn the sound on.",
            '02': "Roll ball in one line: basketball’s hands and handball’s goals, played on roller skates.",
            '03': "As captain I built the team: a girls’ team and three boys’ teams for the first time, a coach, and a system that keeps the order.",
            '04': "Our results, newest first, starting with BITS Pilani’s first-ever team gold.",
            '05': "I also designed the posters for our camps and trials.",
          },
          end: "That’s everything on this page. Scroll a bit more to visit the next place.",
          kit: 'medal',
        }}
      />
    </PlacePage>
  );
}
