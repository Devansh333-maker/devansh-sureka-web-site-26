import { PageGuide } from '@/components/place/PageGuide';
import type { Metadata } from 'next';
import { shareMeta } from '@/lib/share';
import { Hero, NextPlace, PlacePage, Photo, Section, Stats, Steps, Story } from '@/components/place/kit';
import { Ladder, UmangBars } from '@/components/place/figures';
import { Reveal } from '@/components/place/reveal';

export const metadata: Metadata = shareMeta('The Chaupal', 'A year as NSS Secretary at BITS Pilani: 7 villages, 200+ volunteers, 30+ initiatives, and the systems the next team inherits.', '/og/chaupal.jpg');

const INITIATIVES = [
  { tag: 'With BOSM · Sep 2025', name: 'Junoon', body: 'A two-day sports meet for specially-abled children from five NGOs: sprints, relays, long jump, art, and a night to close it.', num: '~100 children' },
  { tag: 'With OASIS · Nov 2025', name: 'Shop For a Smile', body: 'NSS stalls at OASIS, with a full audit of the stock afterwards.', num: 'Run with OASIS' },
  { tag: 'May 2025', name: 'Old Notebook Collection Drive', body: 'A separate drive, run independently of the other initiatives: collecting old notebooks across campus.', num: 'Twice last year’s collection' },
  { tag: 'Scholarships', name: 'Project Umang', body: 'Crowdfunded scholarships for children in and around Pilani, with counselling, home and school visits.', num: '148 children in 2025–26' },
  { tag: 'Department · where I started', name: 'CLP', body: 'The Computer Literacy Programme: free computer classes for village students in our lab at PARC, plus coding classes, career counselling and an adult literacy track.', num: 'Daily classes, free' },
  { tag: 'With IRCS', name: 'Blood Donation Camp', body: 'I led BDC end to end two years running, as a certified Indian Red Cross Society volunteer.', num: '669 · then 582 donations' },
  { tag: 'Across the year', name: '30+ initiatives', body: 'Swachhata Pakhwada, FITBITS Run, menstrual-health sessions in villages, tree plantation, and Grub for Volunteers every semester.', num: '8 departments' },
];

const VILLAGES = ['Pilani', 'Harinagar', 'Garinda', 'Jherli', 'Gumansar', 'Rayla', 'Bhas Gaon'];

export default function ChaupalPage() {
  return (
    <PlacePage place="commons">
      <Hero
        place="commons"
        title={
          <>
            Make it easier for
            <br />
            <em>whoever comes next</em>
          </>
        }
        lede={
          <>
            I started in NSS teaching computers to village students. Two years in CLP, first as a volunteer and then on its executive committee, and in 2025–26 I
            became NSS <strong>Secretary</strong>, responsible for the <strong>funds and inventory</strong> of eight departments working across seven villages, in a
            year with no external sponsorship.
          </>
        }
        meta={[
          { label: 'Role', value: 'Secretary, NSS BITS Pilani' },
          { label: 'Tenure', value: 'May 2025 – April 2026' },
          { label: 'Responsible for', value: 'Funds and inventory · 8 departments' },
        ]}
        aside={
          <Photo
            src="/me/with-kumar-mangalam-birla.webp"
            alt="Devansh with Mr Kumar Mangalam Birla at the KRITI inauguration"
            ratio="4 / 5"
            priority
            position="50% 30%"
            caption="With Mr Kumar Mangalam Birla, Chancellor, at the KRITI inauguration, 12 July 2025."
          />
        }
      />


      <Section
        num="01"
        label="My job"
        title={<>Looking after the money and the stock</>}
        intro="As Secretary, my main job was NSS’s funds and inventory: every rupee in and out across eight departments, and everything NSS owns. It’s the part of the year nobody photographs, and the part that decides whether the next Secretary has a good one."
      >
        <Steps
          items={[
            {
              title: 'The funds',
              body: 'NSS had no written rules for its money, so I wrote them: the first Finance Guidelines, the Kacha Bill Template and a reimbursement cover sheet, so every bill from every department is filed the same way. A Treasurer Portal keeps track of it all.',
            },
            {
              title: 'The inventory',
              body: 'Everything NSS owns, kept counted and accounted for, including the stock at stalls like Shop For a Smile, audited after the event.',
            },
            {
              title: 'Through a funding freeze',
              body: 'The year brought the first government funding freeze in over a decade. We compiled the records, kept every department running on what we had, and reimbursed everyone once the funds came through.',
            },
          ]}
        />
        <div className="p-split" style={{ marginTop: '3.5rem' }}>
          <Story>
            <p>
              Around the money, the records: an Umang portal for the scholarships, a leadership database going back eight years, and, with the VP and the core
              team, a <strong>three-year certificate backlog</strong> cleared.
            </p>
            <p>
              None of it makes it to Instagram. All of it is still there for the next team, so they start their year with rules, templates and records instead of
              guesswork.
            </p>
          </Story>
          <Story>
            <p>
              <strong>The Kacha Bill Template</strong> splits fund categories so local vendors get reimbursed correctly. Since it went out, nobody has needed it
              explained in person.
            </p>
          </Story>
        </div>
      </Section>

      <Section num="02" label="How I got here" title="Three years, three roles" tone="deep">
        <Steps
          items={[
            {
              title: 'CLP volunteer · first year',
              body: 'Teaching computers, for free, to students from the villages around Pilani, in the CLP lab at PARC.',
            },
            {
              title: 'CLP executive committee · second year',
              body: 'Promoted to the committee that runs the Computer Literacy Programme: the classes, the volunteers and the lab.',
            },
            {
              title: 'NSS Secretary · 2025–26',
              body: 'Secretary of NSS BITS Pilani, with the funds and inventory of all eight departments as my main responsibility.',
            },
          ]}
        />
      </Section>

      <Section num="03" label="The year in numbers" title="What one year covered">
        <Stats
          items={[
            { value: '7', label: 'villages around Pilani' },
            { value: '200+', label: 'volunteers coordinated' },
            { value: '8', label: 'departments' },
            { value: '30+', label: 'initiatives delivered' },
            { value: 'Zero', label: 'external sponsorship' },
          ]}
        />
        <Reveal className="p-villages">
          {VILLAGES.map((v) => (
            <span key={v}>{v}</span>
          ))}
        </Reveal>
      </Section>

      <Section num="04" label="Initiatives" title="What the year was made of" tone="deep">
        <Reveal className="p-cards p-cards--seven">
          {INITIATIVES.map((it) => (
            <article key={it.name} className="p-card">
              <span className="p-card__tag">{it.tag}</span>
              <h3>{it.name}</h3>
              <p>{it.body}</p>
              <span className="p-card__num">{it.num}</span>
            </article>
          ))}
        </Reveal>
      </Section>

      <Section num="05" label="Umang" title={<>Twice the children, almost three times the schools</>}>
        <UmangBars />
      </Section>

      <Section num="06" label="Pushing a problem upward" title="When a fix needs a bigger signature" intro="The NSS building needed more than we could approve ourselves. So the proposal went up the ladder until it reached someone who could." tone="deep">
        <div className="p-split">
          <Ladder />
          <Story>
            <p>
              I put together an infrastructure proposal for the NSS building: waterproofing, an overhead water tank, and turning a balcony into a classroom, plus
              upgrading the CLP computer lab at PARC, where village students learn for free.
            </p>
          </Story>
        </div>
      </Section>

      <Section num="07" label="12 July 2025" title={<>A conversation with the Chancellor</>}>
        <Story side={<>KRITI: Kakatiya Center for Rural Innovations, Technology and Impact, inaugurated at BITS Pilani’s 2025 convocation.</>}>
          <p>
            At the KRITI inauguration I represented NSS in front of Mr Kumar Mangalam Birla. I spoke about our <strong>Adult Literacy Initiative</strong>, where we
            teach women in the villages around Pilani to read and write in Hindi and English and to use a smartphone, and about our plan to add financial literacy
            and banking.
          </p>
          <p>It caught his interest, and turned into a real discussion about the initiative’s long-term vision for the villages.</p>
        </Story>
        <Reveal className="p-split">
          <Photo src="/opt/birlaji.webp" alt="Presenting NSS initiatives to Mr Kumar Mangalam Birla" ratio="4 / 3" />
          <Photo src="/opt/11.webp" alt="NSS presentation at the KRITI inauguration" ratio="4 / 3" />
        </Reveal>
      </Section>

      <Section num="08" label="Alongside" title="Other teams" tone="deep">
        <Steps
          items={[
            { title: 'Marudhara', body: 'Treasurer of the Rajasthani cultural association. Ran the money for Grub, a 300+ person evening of Rajasthani food, plus dance and drama.' },
            { title: 'Manufacturing Association', body: 'Executive committee. Organised a Honda plant visit for 30+ students and ran events at APOGEE.' },
            { title: 'NCC, 1 Raj Boys Battalion', body: 'Two years of cadet training in school. Where the discipline started.' },
          ]}
        />
      </Section>

      <NextPlace current="commons" />
      <PageGuide
        lines={{
          hero: "This is the Chaupal: my social work with NSS. Scroll, and I’ll walk you through the year.",
          sections: {
            '01': "My main job as Secretary: NSS’s funds and inventory, with rules and templates the next team can keep using.",
            '02': "How I got here: two years teaching computers with CLP, then Secretary.",
            '03': "My year as NSS Secretary in numbers: 7 villages, 200+ volunteers and 30+ initiatives.",
            '04': "The projects we ran through the year, one card each.",
            '05': "Umang, our programme for children: twice the children, and almost three times the schools.",
            '06': "The NSS building needed more than we could approve, so I took the proposal up, step by step, to someone who could.",
            '07': "I spoke about our adult literacy work in front of our Chancellor, Mr Kumar Mangalam Birla.",
            '08': "Other teams I worked with, like Marudhara, where I was Treasurer.",
          },
          end: "That’s everything on this page. Scroll a bit more to visit the next place.",
          kit: 'badge',
        }}
      />
    </PlacePage>
  );
}
