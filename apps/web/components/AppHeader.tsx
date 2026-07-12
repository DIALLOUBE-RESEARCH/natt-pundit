import Link from "next/link";
import { ContestLogo } from "@/components/TxOddsLogo";
import { LanguageSelector } from "@/components/LanguageSelector";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { usePresent } from "@/components/present/PresentProvider";
import { shell } from "@/lib/appShellI18n";
import { ui } from "@/lib/i18n";

export function AppHeader() {
  const { lang } = usePresent();
  const t = ui(lang);
  const s = shell(lang);

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="app-brand" aria-label={s.ariaHome}>
          <ContestLogo height={44} className="app-header-contest-logo" />
          <span className="app-brand-divider" aria-hidden />
          <span className="app-brand-copy">
            <span className="app-brand-title">{t.homeTitle}</span>
            <span className="app-brand-kicker">{t.homeEventKicker}</span>
          </span>
        </Link>
        <nav className="app-nav" aria-label={s.ariaMainNav}>
          <Link href="/">{t.navFixtures}</Link>
          <Link href="/datas" className="nav-datas">
            {t.navDatas}
          </Link>
          <Link href="/activate" className="nav-txline">
            {t.navTxline}
          </Link>
          <WalletConnectButton />
          <LanguageSelector />
        </nav>
      </div>
    </header>
  );
}