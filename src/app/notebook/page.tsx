import { PageGuide } from '@/components/place/PageGuide';
import type { Metadata } from 'next';
import { shareMeta } from '@/lib/share';
import { Hero, NextPlace, PlacePage, Section } from '@/components/place/kit';
import { formatDate, sortedNotes } from '@/content/notebook';
import { NoteAccordion } from '@/components/place/NoteAccordion';
import { zones } from '@/components/world/zones';

export const metadata: Metadata = shareMeta('The Notebook', 'Essays, field notes and build logs, including how this site went from thirty days to build to about three.', '/og/notebook.jpg');

export default function NotebookPage() {
  return (
    <PlacePage place="notebook">
      <Hero
        place="notebook"
        title={
          <>
            When I work,
            <br />I write everything <em>down</em>
          </>
        }
        lede={
          <>
            Long-term goals get the daytime. Writing gets the night. This is where the notebook pages end up: essays, field notes, diary entries, the occasional
            short story. No schedule, no fixed format, any language.
          </>
        }
      />


      <Section num="01" label="Entries" title={`${sortedNotes.length} ${sortedNotes.length === 1 ? 'entry' : 'entries'} so far`}>
        <NoteAccordion
          notes={sortedNotes}
          dates={sortedNotes.map((n) => formatDate(n.date))}
          from={sortedNotes.map((n) => {
            const z = n.place ? zones.find((zz) => zz.id === n.place) : undefined;
            return z ? z.name.replace('The ', 'the ') : null;
          })}
        />
        <p className="note-soon">More pages are being written.</p>
      </Section>

      <NextPlace current="notebook" />
      <PageGuide
        lines={{
          hero: "This is my Notebook: short notes on what I learn and how I build things.",
          sections: {
            '01': "Every entry, newest first. Pick any one to read it.",
          },
          end: "That’s everything on this page. Scroll a bit more to visit the next place.",
          kit: 'pencil',
        }}
      />
    </PlacePage>
  );
}
