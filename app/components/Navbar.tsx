"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [contactInView, setContactInView] = useState(false);

  useEffect(() => {
    // Only observe on the landing page
    if (pathname !== "/") {
      setContactInView(false);
      return;
    }

    const handleScroll = () => {
      const contactEl = document.getElementById("contact");
      if (!contactEl) return;

      const rect = contactEl.getBoundingClientRect();
      // If the TOP of the #contact section is ABOVE the middle of the viewport
      if (rect.top < window.innerHeight / 2) {
        setContactInView(true);
      } else {
        setContactInView(false);
      }
    };

    // Run once on mount to set initial state
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);

  const navLinks = [
    { name: "Αρχική", href: "/" },
    { name: "Διοργανώσεις", href: "/events" },
    { name: "Επικοινωνία", href: "/#contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-dark/80 backdrop-blur-md border-b border-brand-bronze/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex justify-between sm:justify-center sm:gap-16 items-center h-[60px]">
          {navLinks.map((link) => {
            const isHash = link.href.includes('#');
            let isActive: boolean;

            if (isHash && link.href === "/#contact") {
              // Επικοινωνία: active when contact section is in view on landing page
              isActive = pathname === "/" && contactInView;
            } else if (link.href === "/") {
              // Αρχική: active on landing page, but NOT when contact is in view
              isActive = pathname === "/" && !contactInView;
            } else {
              // Other pages (e.g. /events): standard prefix match
              isActive = pathname.startsWith(link.href);
            }

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`font-heading text-[14px] sm:text-[16px] flex items-center justify-center h-full min-h-[60px] px-2 transition-all border-b-2
                  ${isActive 
                    ? "text-brand-cream font-bold border-brand-cream" 
                    : "text-brand-amber font-medium border-transparent hover:text-brand-cream hover:border-brand-cream/30"
                  }
                `}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
