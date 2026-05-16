"use client";

import Image from "next/image";
import Link from "next/link";
import { FaInstagram, FaFacebookF } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";

export default function Footer() {
  return (
    <footer className="w-full flex flex-col items-center justify-center py-12 px-6 gap-6">
      {/* Logo */}
      <div className="w-[60px] flex items-center justify-center">
        <Image
          src="/images/triviaguildlogonobackground.png"
          alt="Trivia Guild Logo"
          width={60}
          height={60}
          className="w-full h-auto drop-shadow-[0_0_10px_var(--color-brand-amber)] opacity-90"
        />
      </div>

      {/* Social Links */}
      <div className="flex flex-row items-center gap-6 sm:gap-8">
        <Link
          href="https://instagram.com/triviaguild"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-amber hover:text-brand-cream hover:scale-110 transition-all duration-300"
          aria-label="Instagram"
        >
          <FaInstagram size={28} />
        </Link>
        <Link
          href="https://www.facebook.com/profile.php?id=61585516755966"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-amber hover:text-brand-cream hover:scale-110 transition-all duration-300"
          aria-label="Facebook"
        >
          <FaFacebookF size={28} />
        </Link>
        <Link
          href="mailto:triviaguildgr@gmail.com"
          className="text-brand-amber hover:text-brand-cream hover:scale-110 transition-all duration-300"
          aria-label="Email"
        >
          <HiOutlineMail size={28} />
        </Link>
      </div>

      {/* Copyright */}
      <p className="font-body text-brand-cream/40 text-sm mt-4">
        © Trivia Guild {new Date().getFullYear()}
      </p>
    </footer>
  );
}
