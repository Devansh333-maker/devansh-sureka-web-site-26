// The organisations I've worked with or for, drifting past in a slow loop.
// Doubled so the loop is seamless; hovering pauses it.
const NAMES = [
  'Univest',
  'Akshaya Patra',
  'House of Fandom',
  'IIT Bombay Techfest',
  'LvlUp Ventures',
  'NSS BITS Pilani',
  'Indian Red Cross Society',
  'Civil Engineering Association, BITS Pilani',
];

export function NameStrip() {
  const row = (hidden: boolean) => (
    <ul className="names__row" aria-hidden={hidden || undefined}>
      {NAMES.map((n) => (
        <li key={n}>
          {n}
          <span aria-hidden="true">✳</span>
        </li>
      ))}
    </ul>
  );
  return (
    <section className="names" aria-label="Organisations I have worked with">
      <p className="names__label">Worked with</p>
      <div className="names__track">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
