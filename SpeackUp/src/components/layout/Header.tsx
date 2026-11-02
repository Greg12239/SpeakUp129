"use client";

import { useEffect, useState } from "react";
import { AdaptiveWordmark } from "@/components/brand/AdaptiveWordmark";
import { Button } from "@/components/ui/Button";
import { joinFormUrl, siteConfig } from "@/content/site";

type NavTheme = "paper" | "ink" | "media";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="menu-icon" aria-hidden="true" data-open={open}>
      <span />
      <span />
    </span>
  );
}

export function Header() {
  const [theme, setTheme] = useState<NavTheme>("paper");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-nav-theme]"),
    );
    const sentinel = document.querySelector<HTMLElement>(
      "[data-header-sentinel]",
    );

    const resolveThemeAtActivationLine = () => {
      const activationLine = window.innerHeight * 0.17;
      const active = sections.find((section) => {
        const bounds = section.getBoundingClientRect();
        return bounds.top <= activationLine && bounds.bottom >= activationLine;
      });
      const nextTheme = active?.dataset.navTheme;

      if (
        nextTheme === "paper" ||
        nextTheme === "ink" ||
        nextTheme === "media"
      ) {
        setTheme((current) => (current === nextTheme ? current : nextTheme));
      }
    };

    const activeEntries = new Map<Element, IntersectionObserverEntry>();
    const themeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activeEntries.set(entry.target, entry);
          } else {
            activeEntries.delete(entry.target);
          }
        });

        const active = Array.from(activeEntries.values()).sort(
          (a, b) =>
            Math.abs(a.boundingClientRect.top) -
            Math.abs(b.boundingClientRect.top),
        )[0]?.target as HTMLElement | undefined;
        const nextTheme = active?.dataset.navTheme;
        if (
          nextTheme === "paper" ||
          nextTheme === "ink" ||
          nextTheme === "media"
        ) {
          setTheme((current) => (current === nextTheme ? current : nextTheme));
        }
      },
      { rootMargin: "-17% 0px -82% 0px", threshold: 0 },
    );

    sections.forEach((section) => themeObserver.observe(section));

    const sentinelObserver = new IntersectionObserver(([entry]) => {
      const nextScrolled = !(entry?.isIntersecting ?? true);
      setScrolled((current) =>
        current === nextScrolled ? current : nextScrolled,
      );
    });

    if (sentinel) sentinelObserver.observe(sentinel);

    const initialFrame = window.requestAnimationFrame(resolveThemeAtActivationLine);
    const resolveAfterHashNavigation = () => {
      window.requestAnimationFrame(resolveThemeAtActivationLine);
    };
    window.addEventListener("hashchange", resolveAfterHashNavigation);

    return () => {
      themeObserver.disconnect();
      sentinelObserver.disconnect();
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("hashchange", resolveAfterHashNavigation);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const headerTheme = menuOpen ? "ink" : theme;

  return (
    <header
      className="site-header"
      data-theme={headerTheme}
      data-scrolled={scrolled}
      data-menu-open={menuOpen}
    >
      <nav className="header-inner" aria-label="Primary navigation">
        <a
          className="header-wordmark"
          href="#home"
          aria-label="SpeakUp home"
          onClick={closeMenu}
        >
          <AdaptiveWordmark priority theme={headerTheme} />
        </a>

        <div className="desktop-nav">
          {siteConfig.nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
          <Button
            href={joinFormUrl}
            rel="noopener noreferrer"
            target="_blank"
            variant="nav"
          >
            Join Us
          </Button>
        </div>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <MenuIcon open={menuOpen} />
        </button>
      </nav>

      <div
        className="mobile-navigation"
        id="mobile-navigation"
        aria-hidden={!menuOpen}
      >
        <div className="mobile-nav-links">
          {siteConfig.nav.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              tabIndex={menuOpen ? 0 : -1}
            >
              <span aria-hidden="true">0{index + 1}</span>
              {item.label}
            </a>
          ))}
          <a
            href={joinFormUrl}
            onClick={closeMenu}
            rel="noopener noreferrer"
            tabIndex={menuOpen ? 0 : -1}
            target="_blank"
          >
            <span aria-hidden="true">04</span>
            Join Us
          </a>
        </div>
      </div>
    </header>
  );
}
