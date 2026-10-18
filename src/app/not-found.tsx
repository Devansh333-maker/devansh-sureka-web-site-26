import Link from 'next/link';
import { zones } from '@/components/world/zones';
import { Survey } from '@/components/world/Survey';
import { PortraitMark } from '@/components/brand';
import '@/components/world/world.css';
import './not-found.css';

// A wrong turn lands on an empty square of the survey sheet, with the way back.
export default function NotFound() {
  return (
    <main className="lost">
      <Survey />
      <div className="lost__inner">
        <p className="lost__kicker">404 · Off the map</p>
        <h1 className="lost__title">
          This square of the survey is <em>blank.</em>
        </h1>
        <div className="lost__say">
          <PortraitMark size={44} />
          <p>
            <span>Devansh</span>
            Wrong turn. Nothing’s been built here yet. The island is this way.
          </p>
        </div>
        <Link href="/" className="lost__home">
          Back to the island →
        </Link>
        <ul className="lost__places">
          {zones.map((z) => (
            <li key={z.id}>
              <Link href={z.href}>
                <span>{z.index}</span>
                {z.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
