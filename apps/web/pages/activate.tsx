import dynamic from "next/dynamic";

const ActivateTxline = dynamic(
  () => import("@/components/ActivateTxline").then((m) => m.ActivateTxline),
  { ssr: false },
);

export default function ActivatePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold text-natt-gold">Activer TxLINE</h1>
      <p className="mt-2 text-sm text-white/70">
        Connecte ton wallet Solana (MetaMask Solana ou Phantom), abonne-toi au tier WC
        gratuit, recupere ton token API.
      </p>
      <div className="mt-8">
        <ActivateTxline />
      </div>
    </div>
  );
}
