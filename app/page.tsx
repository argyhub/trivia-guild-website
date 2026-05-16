import Image from "next/image";
import Link from "next/link";
import ContactForm from "./components/ContactForm";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="relative flex flex-col flex-1">
      {/* Background Texture - Radial Gradient for the whole page */}
      <div 
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background: "radial-gradient(circle at center, #1a1612 0%, var(--color-brand-dark) 70%)"
        }}
      />

      {/* Hero Section */}
      <main className="w-full min-h-[70vh] flex items-center justify-center relative">
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-20">
          {/* Logo */}
          <div className="w-[200px] mb-8 flex items-center justify-center">
            <Image
              src="/images/triviaguildlogonobackground.png"
              alt="Trivia Guild Logo"
              width={200}
              height={200}
              priority
              className="w-full h-auto drop-shadow-[0_0_25px_var(--color-brand-amber)]"
            />
          </div>
          
          {/* Title */}
          <h1 className="text-5xl sm:text-7xl font-heading font-bold text-brand-amber mb-4 tracking-wide">
            Trivia Guild
          </h1>
          
          {/* Tagline */}
          <p className="text-xl sm:text-2xl font-heading text-brand-amber mb-10 font-medium tracking-wide">
            🎯 Quiz Nights &nbsp;&nbsp;📍 The Pub
          </p>
          
          {/* CTA Button */}
          <Link
            href="/events"
            className="bg-brand-dark text-brand-amber font-bold font-body text-lg px-8 py-4 rounded-full transition-all drop-shadow-[0_0_18px_var(--color-brand-amber)] hover:drop-shadow-[0_0_28px_var(--color-brand-amber)] hover:scale-105 active:scale-95"
          >
            Δηλώστε Συμμετοχή ✍️
          </Link>
        </div>
      </main>

      {/* About Section */}
      <section id="about" className="py-24 lg:py-32 flex items-center justify-center">
        <h2 className="text-3xl font-heading text-brand-amber/30">Σχετικά &mdash; Coming Soon</h2>
      </section>

      {/* Media Section */}
      <section id="media" className="py-24 lg:py-32 flex items-center justify-center">
        <h2 className="text-3xl font-heading text-brand-amber/30">Media &mdash; Coming Soon</h2>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 lg:py-32 flex flex-col items-center justify-center px-6">
        <h2 className="text-4xl sm:text-5xl font-heading font-bold text-brand-amber mb-4 text-center">
          Επικοινωνία
        </h2>
        <p className="text-brand-cream/70 text-center mb-12 max-w-lg font-body">
          Θέλεις να μάθεις περισσότερα ή να συνεργαστούμε; Στείλε μας μήνυμα!
        </p>
        <ContactForm />
      </section>

      <Footer />
    </div>
  );
}
