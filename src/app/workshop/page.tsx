import { PageGuide } from '@/components/place/PageGuide';
import type { Metadata } from 'next';
import { shareMeta } from '@/lib/share';
import Image from 'next/image';
import { Hero, NextPlace, PlacePage, Section, Stats, Steps, Story } from '@/components/place/kit';
import { Hardness, MixBars, StrengthChart } from '@/components/place/figures';
import { WaterSankey } from '@/components/place/WaterSankey';
import { InfoStack } from '@/components/place/InfoStack';
import { IdfChart } from '@/components/place/Hydro';
import { DesignGrid } from '@/components/place/Designs';
import { Reveal } from '@/components/place/reveal';

export const metadata: Metadata = shareMeta('The Workshop', 'Bricks from parali and plastic waste (6.5 MPa, ₹2L funded), 20 KL a day of wasted water found at Akshaya Patra, and 3D models: civil engineering at BITS Pilani.', '/og/workshop.jpg');

// web-ready copies of the renders (ffmpeg, H.264 with fast start): a few MB instead of hundreds
const video = (p: string) => encodeURI(`/opt/3D modelling/${p}`);

export default function WorkshopPage() {
  return (
    <PlacePage place="workshop">
      <Hero
        place="workshop"
        title={
          <>
            Things you can <em>hold</em>
          </>
        }
        lede={
          <>
            I study civil engineering at BITS Pilani, with a minor in finance. This is the physical side of what I make: a brick that turns farm waste into income,
            a water plant that was quietly pouring a fifth of its input away, and buildings I modelled and walked through on screen.
          </>
        }
        meta={[
          { label: 'Degree', value: 'B.E. Civil Engineering, minor in Finance' },
          { label: 'Where', value: 'BITS Pilani, 2023 – 2027' },
          { label: 'From', value: 'Jaipur, Rajasthan' },
        ]}
        aside={
          <figure className="p-photo">
            <div className="p-photo__frame" style={{ aspectRatio: '4 / 3' }}>
              <Image src={encodeURI('/opt/3D modelling/cottage.webp')} alt="3D render of a cottage modelled in Blender" fill priority sizes="(max-width: 900px) 100vw, 45vw" style={{ objectFit: 'cover' }} />
            </div>
            <figcaption>A cottage I modelled, textured and lit myself in Blender.</figcaption>
          </figure>
        }
      />


      <Section
        num="01"
        label="Eco-composite bricks"
        title={
          <>
            A brick made of <em>what farms burn</em>
          </>
        }
        intro="Every October and November, stubble (parali) is burned across North India, and plastic waste has nowhere to go. The idea: bind both into a brick that villagers can make and sell, strong enough for pavements. Research under Prof. Mukund Lahoti, with my teammate Atharv."
      >
        <Stats
          items={[
            { value: '₹2L', label: 'institute research funding', note: 'SIRE / KIRTI / SOLVE scheme, BITS Pilani' },
            { value: '6.5 MPa', label: 'strongest mix so far', note: 'M2: 1% plastic, 2% parali' },
            { value: '5', label: 'mix designs cast and tested' },
            { value: 'Ongoing', label: 'status', note: 'Still pushing the strength up' },
          ]}
        />
      </Section>

      <Section num="02" label="The result" title={<>A little waste made it <em>stronger</em></>} tone="deep">
        <StrengthChart />
        <div className="p-split" style={{ marginTop: '4rem' }}>
          <div>
            <MixBars />
          </div>
          <Story>
            <p>
              We expected strength to drop as waste went up. Mostly it did. The surprise was <strong>M2</strong>: with 1% plastic and 2% parali it beat the base
              mix. A small amount of fibre and plastic seems to pack the matrix better. Push the waste higher and strength drops fast.
            </p>
            <p>
              We also switched the binder from sodium hydroxide to <strong>calcium hydroxide (hydrated lime)</strong>. NaOH brought complications, and
              the brick had to be safe at both ends: for the people producing it, and in the mixture itself. Hydrated lime is far gentler on both counts.
            </p>
          </Story>
        </div>
      </Section>

      <Section num="03" label="How it is made" title="From field to mould">
        <Steps
          items={[
            { title: 'Prepare', body: 'Sieve the fly ash, cut the parali, clean and shred the plastic.' },
            { title: 'Mix dry', body: 'Fly ash with 20% Ca(OH)₂, then fold in parali and plastic.' },
            { title: 'Add water slowly', body: 'A little at a time so the mix doesn’t lump.' },
            { title: 'Mould and compact', body: 'Fill, compact by hand, level the top, demould after the initial set.' },
            { title: 'Cure and test', body: 'Cure, then crush in a compression test and log the strength.' },
          ]}
        />
      </Section>

      <Section
        num="04"
        label="Akshaya Patra, Jaipur"
        title={
          <>
            The water nobody was <em>counting</em>
          </>
        }
        intro="Akshaya Patra’s Jaipur kitchen cooks mid-day meals for over a lakh children a day, and all of it starts with clean water. I spent two months there as an operations analyst intern, on that water."
        tone="deep"
      >
        <Story side={<>With my teammate Ansh Jain · May – July 2025</>}>
          <p>
            <strong>The problem.</strong> Every litre the kitchen uses passes through a two-stage RO plant. An RO plant always throws some water away: the
            concentrated “reject” it can’t clean. Nobody was measuring how much. Our brief: find out how much was being lost, what that water was like, and whether
            it could be used again.
          </p>
        </Story>
        <div style={{ marginTop: '2.5rem' }}>
          <WaterSankey />
        </div>
        <h3 className="p-sub">What we did</h3>
        <Steps
          items={[
            {
              title: 'Read the plant’s own numbers',
              body: (
                <>
                  Three months of logs showed the second stage rejecting about <strong>20 KL every day</strong>, running or not: <strong>a fifth of everything that
                  went in</strong>.
                </>
              ),
            },
            {
              title: 'Tested the water ourselves',
              body: (
                <>
                  We took samples before and after the filters were backwashed and measured pH, TDS and hardness. The raw water was extremely hard, and backwashing
                  nearly <strong>doubled the hardness</strong> of the reject. That decides what any reuse plan has to remove.
                </>
              ),
            },
            {
              title: 'Designed three ways to get it back',
              body: <>Each one sized for the kitchen’s real demand and costed, from the quickest win to the best long-term fix.</>,
            },
          ]}
        />
        <div className="p-split" style={{ marginTop: '3.5rem' }}>
          <Story>
            <p>
              <strong>Why the reject was so bad.</strong> Hard water means calcium and magnesium. The RO membranes push them into the reject, and every backwash
              flushes even more in. So the water being thrown away wasn’t just a lot of water: it was water that needs softening before it can be used anywhere.
            </p>
          </Story>
          <Hardness />
        </div>
        <h3 className="p-sub">The solutions</h3>
        <div className="p-table-wrap" style={{ marginTop: '3.5rem' }}>
          <table className="p-table">
            <thead>
              <tr>
                <th>Proposal</th>
                <th>Use</th>
                <th>Recovery</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>P1 · best right now</td>
                <td>Non-potable: flushing, gardening. Little treatment, no clearances.</td>
                <td className="num">85–90%</td>
                <td className="num">₹41–60L</td>
              </tr>
              <tr>
                <td>P2</td>
                <td>Potable: softening, dual-pass RO and advanced oxidation. Highest quality, needs clearances.</td>
                <td className="num">75–80%</td>
                <td className="num">₹37–57L</td>
              </tr>
              <tr>
                <td>P3 · best long-term</td>
                <td>Potable: effluent treatment and dual-pass RO. The balanced option, with value for years.</td>
                <td className="num">80–85%</td>
                <td className="num">₹35–50L</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Story>
          <p>
            We presented all three, costed, to the kitchen’s administration: about <strong>15–18 KL a day back</strong> for ₹35–60 lakh, depending on the route. One
            condition came with it. We could only afford to test pH, TDS and hardness, so before any of this water is used for cooking or drinking, it needs full
            testing for microbes, heavy metals and chemicals.
          </p>
        </Story>
      </Section>

      <Section
        id="hydrology"
        num="05"
        label="Urban hydrology"
        title={
          <>
            How hard it rains, and where it <em>floods</em>
          </>
        }
        intro="Two projects for my Urban Hydrology course (CE F422), on Ahmedabad: first, how intense its storms get; then, where that water goes when it can’t drain."
      >
        <Stats
          items={[
            { value: '25 yrs', label: 'of NASA satellite rainfall', note: 'GPM IMERG V07, 2000–2025' },
            { value: '112 mm/hr', label: 'a 1-hour, 100-year storm', note: 'from my IDF curves' },
            { value: '34 km²', label: 'of the city modelled', note: 'HEC-RAS 6.5, 11 cross sections' },
          ]}
        />
        <div className="p-split" style={{ marginTop: '3rem' }}>
          <Story>
            <p>
              <strong>Project 1: how hard can it rain?</strong> Drains, culverts and flood plans are all designed against one curve: how intense a storm of a given
              length gets, and how often. I built Ahmedabad’s from 25 years of NASA satellite rainfall, processed in Google Earth Engine and MATLAB, and checked it
              against published values. A longer record matters: five years of data underestimates the rare storms.
            </p>
            <p>
              <strong>Project 2: where does it flood?</strong> I then fed those storms into a HEC-RAS model of a 34 km² drainage corridor, on NASA terrain data, and
              tested how much the answer moves with the modeller’s own choices.
            </p>
          </Story>
          <IdfChart />
        </div>
        <h3 className="p-sub">The same channel, a 1-year storm and a 100-year storm</h3>
        <DesignGrid
          label="Flood depth maps from the HEC-RAS model"
          pair
          items={[
            { src: '/opt/hydro/flood-1yr.webp', alt: 'Flood depth map, 1-year storm: the water stays in the channel', caption: '1-year storm · stays in the channel, 1–1.5 ft deep', w: 678, h: 918 },
            { src: '/opt/hydro/flood-100yr.webp', alt: 'Flood depth map, 100-year storm: the water spills across the floodplain', caption: '100-year storm · over the banks, 5–6 ft deep', w: 665, h: 907 },
          ]}
        />
      </Section>

      <Section num="06" label="3D" title={<>Buildings before they exist</>} intro="Models, light and animation I made myself in Blender, and a full building walkthrough rendered in Enscape.">
        <Reveal className="p-split">
          <figure className="p-photo">
            <div className="p-photo__frame" style={{ aspectRatio: '16 / 9' }}>
              <Image src={encodeURI('/opt/3D modelling/cottage.webp')} alt="3D render of a cottage modelled in Blender" fill sizes="(max-width: 900px) 100vw, 45vw" style={{ objectFit: 'cover' }} />
            </div>
            <figcaption>
              <b className="p-tag">Blender</b> A cottage I modelled, textured and lit from scratch.
            </figcaption>
          </figure>
          <figure className="p-photo">
            <video className="p-video" src={video('car vid.mp4')} controls preload="metadata" playsInline muted loop />
            <figcaption>
              <b className="p-tag">Blender</b> A car animation I made: movement, light and reflections.
            </figcaption>
          </figure>
        </Reveal>
        <Reveal as="figure" className="p-photo p-photo--wide">
          <video className="p-video" src={video('Avinya Walkthrough/CPT Final video - Made with Clipchamp.mp4')} controls preload="none" playsInline poster={video('Avinya Walkthrough/CPT Final video - Made with Clipchamp.webp')} />
          <figcaption>
            <b className="p-tag">Enscape</b> Avinya: the full walkthrough of a building, from a construction planning course project.
          </figcaption>
        </Reveal>
      </Section>

      <Section num="07" label="Explainers" title="Civil engineering, made readable" intro="A series of infographics I designed to explain civil engineering ideas in one scroll." tone="deep">
        <InfoStack />
      </Section>

      <NextPlace current="workshop" />
      <PageGuide
        lines={{
          hero: "This is my Workshop: civil engineering I’ve done with my own hands. Scroll, and I’ll explain each project as we go.",
          sections: {
            '01': "My research: a paving brick made from crop stubble and plastic waste, so villages can turn their waste into something they can sell.",
            '02': "We cast and tested five mixes. Adding a little waste made the brick stronger, up to 6.5 MPa.",
            '03': "How the brick is made, step by step, from the field to the mould.",
            '04': "At Akshaya Patra’s kitchen we found about 20,000 litres of water going to waste every day, worked out why, and designed three ways to get it back.",
            '05': "Two hydrology projects: how hard it can rain on Ahmedabad, and where that rain floods the city.",
            '06': "3D work: a cottage and a car I made myself in Blender, and a building walkthrough in Enscape.",
            '07': "Infographics I designed to explain civil engineering ideas in simple pictures.",
          },
          end: "That’s everything on this page. Scroll a bit more to visit the next place.",
          kit: 'hardhat',
        }}
      />
    </PlacePage>
  );
}
