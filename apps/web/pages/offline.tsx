import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-natt-gold">Hors ligne</h1>
      <p className="mt-4 text-white/70">
        Pas de faux scores. Reconnecte-toi pour suivre le match live.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-xl bg-natt-cyan px-6 py-3 font-semibold text-black"
      >
        Retour
      </Link>
    </div>
  );
}
