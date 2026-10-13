"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getToken, logout } from "@/lib/api";

const links = [
  { href: "/", label: "Home" },
  { href: "/flights", label: "Flights" },
  { href: "/#assistant", label: "AI Assistant" },
  { href: "/bookings", label: "My Bookings" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSignedIn(Boolean(getToken()));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  function handleLogout() {
    logout();
    setSignedIn(false);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <div className="site-header-inner">
        <Link href="/" className="brand-mark" aria-label="TripPilot AI home">
          <span className="brand-mark-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <path
                d="M3 18.5 29 12.2c.9-.2 1.2.9.4 1.4L18 20.4l-1.6 7.6c-.2.8-1.3.8-1.6 0L12.6 21 6.8 24.2c-.6.3-1.3-.3-1.1-1L7.4 16 3 18.5Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span>
            <span className="brand-name">
              TripPilot<span>AI</span>
            </span>
            <span className="brand-kicker">Travel intelligence</span>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? "nav-link is-active" : "nav-link"}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {signedIn ? (
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              Sign out
            </button>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">
                Sign in
              </Link>
              <Link href="/register" className="btn btn-primary">
                Join TripPilot
              </Link>
            </>
          )}

          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
