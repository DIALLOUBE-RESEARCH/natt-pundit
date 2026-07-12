"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePresent } from "@/components/present/PresentProvider";
import { docsContent, type DocBlock } from "@/lib/docs";
import { StitchPanelFooter } from "@/components/stitch/StitchPanelFooter";

function pickDocsActiveSection(
  root: HTMLElement,
  sections: { id: string }[],
): string {
  const rootRect = root.getBoundingClientRect();
  const probeY = rootRect.top + Math.min(120, root.clientHeight * 0.2);

  let active = sections[0]?.id ?? "introduction";
  for (const section of sections) {
    const el = document.getElementById(`stitch-doc-${section.id}`);
    if (!el) continue;
    if (el.getBoundingClientRect().top <= probeY) {
      active = section.id;
    } else {
      break;
    }
  }

  const last = sections[sections.length - 1];
  if (!last || active === last.id) return active;

  const lastEl = document.getElementById(`stitch-doc-${last.id}`);
  if (!lastEl) return active;

  const lastRect = lastEl.getBoundingClientRect();
  const lastOnScreen =
    lastRect.bottom > rootRect.top + 32 && lastRect.top < rootRect.bottom - 16;
  if (!lastOnScreen || lastRect.top <= probeY) return active;

  const prev = sections[sections.length - 2];
  const prevEl = prev ? document.getElementById(`stitch-doc-${prev.id}`) : null;
  if (prevEl && prevEl.getBoundingClientRect().top < rootRect.top + 72) {
    return last.id;
  }

  const maxScroll = Math.max(0, root.scrollHeight - root.clientHeight);
  if (maxScroll > 0 && root.scrollTop >= maxScroll - 16) {
    return last.id;
  }

  return active;
}

function renderBlock(block: DocBlock, index: number) {
  switch (block.type) {
    case "paragraph":
      return (
        <p key={index} className="stitch-doc-p">
          {block.text}
        </p>
      );
    case "heading3":
      return (
        <h3 key={index} className="stitch-doc-h3">
          {block.text}
        </h3>
      );
    case "list":
      return (
        <ul key={index} className="stitch-doc-ul">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "alert":
      return (
        <div key={index} className="stitch-doc-alert" role="note">
          {block.text}
        </div>
      );
    case "code":
      return (
        <pre key={index} className="stitch-doc-code">
          <code>{block.text}</code>
        </pre>
      );
    case "link":
      return (
        <p key={index} className="stitch-doc-link-row">
          <a href={block.href} className="stitch-doc-link" target="_blank" rel="noopener noreferrer">
            {block.label}
          </a>
        </p>
      );
    default:
      return null;
  }
}

export function StitchDocsPanel() {
  const { lang } = usePresent();
  const pack = useMemo(() => docsContent(lang), [lang]);
  const sections = pack.sections;
  const [active, setActive] = useState(sections[0]?.id ?? "introduction");
  const panelRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const scrollEl = panelRef.current?.closest(".stitch-tab-content");
    if (scrollEl instanceof HTMLElement) scrollEl.scrollTop = 0;
    setActive(sections[0]?.id ?? "introduction");
  }, [lang, sections]);

  useEffect(() => {
    const root = panelRef.current?.closest(".stitch-tab-content");
    if (!(root instanceof HTMLElement)) return;

    const pickActiveSection = () => pickDocsActiveSection(root, sections);

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setActive(pickActiveSection());
        ticking = false;
      });
    };

    onScroll();
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activeBtn = nav.querySelector<HTMLButtonElement>(".stitch-docs-nav-item--active");
    if (!activeBtn) return;

    const navTop = nav.scrollTop;
    const navHeight = nav.clientHeight;
    const btnTop = activeBtn.offsetTop;
    const btnBottom = btnTop + activeBtn.offsetHeight;
    const padding = 8;

    if (btnTop < navTop + padding) {
      nav.scrollTo({ top: Math.max(0, btnTop - padding), behavior: "smooth" });
    } else if (btnBottom > navTop + navHeight - padding) {
      nav.scrollTo({
        top: btnBottom - navHeight + padding,
        behavior: "smooth",
      });
    }
  }, [active]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(`stitch-doc-${id}`);
    const scrollEl = panelRef.current?.closest(".stitch-tab-content");
    if (!el || !(scrollEl instanceof HTMLElement)) return;
    const rootRect = scrollEl.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const y = scrollEl.scrollTop + (elRect.top - rootRect.top) - 12;
    scrollEl.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    setActive(id);
  };

  return (
    <div ref={panelRef} className="stitch-panel stitch-panel--docs">
      <nav ref={navRef} className="stitch-docs-nav" aria-label={pack.navAria}>
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`stitch-docs-nav-item${active === s.id ? " stitch-docs-nav-item--active" : ""}`}
            onClick={() => scrollTo(s.id)}
          >
            {s.title}
          </button>
        ))}
      </nav>

      <div className="stitch-docs-scroll">
        <header className="stitch-docs-intro">
          <h1 className="stitch-home-title">{pack.title}</h1>
          <p className="stitch-home-lead">{pack.lead}</p>
        </header>

        {sections.map((section) => (
          <section key={section.id} id={`stitch-doc-${section.id}`} className="stitch-doc-section">
            <h2 className="stitch-doc-h2">{section.title}</h2>
            {section.blocks.map((block, i) => renderBlock(block, i))}
          </section>
        ))}

        <StitchPanelFooter />
      </div>
    </div>
  );
}
