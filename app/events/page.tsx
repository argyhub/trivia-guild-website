"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Footer from "@/app/components/Footer";

export default function EventsPage() {
  // Event config from Supabase (set via admin dashboard)
  const [eventTitle, setEventTitle] = useState("Quiz Night");
  const [eventDate, setEventDate] = useState("—");
  const [eventTime, setEventTime] = useState("—");
  const [eventVenue, setEventVenue] = useState("The Pub");
  const [eventStatus, setEventStatus] = useState<"open" | "sold_out">("open");
  const [configLoading, setConfigLoading] = useState(true);

  // Fetch event config from Supabase on mount
  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from("event_config")
        .select("*")
        .order("id", { ascending: true })
        .limit(1)
        .single();

      if (!error && data) {
        setEventTitle(data.event_title || "Quiz Night");
        setEventDate(data.event_date || "—");
        setEventTime(data.event_time || "—");
        setEventVenue(data.event_venue || "The Pub");
        setEventStatus((data.event_status as "open" | "sold_out") || "open");
      }
      setConfigLoading(false);
    };
    fetchConfig();
  }, []);

  // Registration form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [formData, setFormData] = useState({
    teamName: "",
    teamSize: "",
    phone: "",
    social: ""
  });

  // Waitlist form state
  const [isWaitlistSubmitting, setIsWaitlistSubmitting] = useState(false);
  const [isWaitlistSubmitted, setIsWaitlistSubmitted] = useState(false);
  const [waitlistError, setWaitlistError] = useState(false);
  const [waitlistData, setWaitlistData] = useState({
    name: "",
    contact: ""
  });

  const validateRegistration = (): boolean => {
    setValidationError("");

    if (!formData.teamName.trim() || formData.teamName.length > 50) {
      setValidationError("Το όνομα ομάδας πρέπει να είναι 1-50 χαρακτήρες.");
      return false;
    }

    const size = parseInt(formData.teamSize, 10);
    if (isNaN(size) || size < 1 || size > 8) {
      setValidationError("Ο αριθμός παικτών πρέπει να είναι μεταξύ 1 και 8.");
      return false;
    }

    const phoneDigits = formData.phone.replace(/\s/g, "");
    if (!/^\d{10,}$/.test(phoneDigits)) {
      setValidationError("Παρακαλώ εισάγετε έγκυρο τηλέφωνο.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(false);
    setIsSubmitted(false);

    if (!validateRegistration()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("registrations").insert({
        team_name: formData.teamName,
        team_size: parseInt(formData.teamSize, 10),
        phone: formData.phone,
        social: formData.social,
        event_name: eventTitle,
      });

      if (error) throw error;

      setIsSubmitted(true);
      setFormData({ teamName: "", teamSize: "", phone: "", social: "" });
      setValidationError("");

      // Re-enable submit after 5 seconds so user can register another team
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (err) {
      console.error("Registration failed:", err);
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsWaitlistSubmitting(true);
    setWaitlistError(false);

    try {
      // Save to Supabase "waitlist" table
      // NOTE: The "waitlist" table must exist in Supabase with columns: name (text), contact (text), created_at (timestamptz default now())
      const { error } = await supabase.from("waitlist").insert({
        name: waitlistData.name,
        contact: waitlistData.contact,
      });

      if (error) throw error;

      setIsWaitlistSubmitted(true);
      setWaitlistData({ name: "", contact: "" });
    } catch (err) {
      console.error("Waitlist submission failed:", err);
      setWaitlistError(true);
    } finally {
      setIsWaitlistSubmitting(false);
    }
  };

  const handleWaitlistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWaitlistData({
      ...waitlistData,
      [e.target.name]: e.target.value
    });
  };

  // Loading state while fetching config from Supabase
  if (configLoading) {
    return (
      <div className="relative flex flex-col flex-1 w-full min-h-screen">
        <div
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            background: "radial-gradient(circle at center, #1a1612 0%, var(--color-brand-dark) 70%)"
          }}
        />
        <main className="flex-1 w-full flex items-center justify-center">
          <div className="text-brand-amber font-body text-lg animate-pulse">Φόρτωση...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col flex-1 w-full min-h-screen">
      {/* Background Texture - Radial Gradient for the whole page */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background: "radial-gradient(circle at center, #1a1612 0%, var(--color-brand-dark) 70%)"
        }}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 flex flex-col items-center">
        {/* Event Details Card */}
        <div className="relative w-full max-w-[500px] bg-[#2A2A33] border border-brand-bronze/30 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
          {eventStatus === "sold_out" && (
            <div className="absolute -top-3 -right-3 sm:-right-4 bg-[#C0271A] text-brand-cream px-4 py-2 rounded-md text-sm font-bold font-heading uppercase transform rotate-6 shadow-xl border-2 border-brand-dark z-10">
              SOLD OUT
            </div>
          )}

          <div className="flex flex-col gap-4 text-center">
            <span className="text-2xl font-heading font-bold text-brand-amber uppercase tracking-widest">
              {eventTitle}
            </span>
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center justify-center gap-3">
                <span className="text-brand-cream/60 font-medium">Ημερομηνία:</span>
                <span className="text-xl font-body font-normal text-brand-cream not-italic">{eventDate}</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-brand-cream/60 font-medium">Τοποθεσία:</span>
                <span className="text-lg font-heading text-brand-cream">📍 {eventVenue}</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-brand-cream/60 font-medium">Ώρα:</span>
                <span className="text-lg font-heading text-brand-cream">{eventTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Conditional Forms Based on Status */}
        {eventStatus === "open" ? (
          /* Registration Form Card */
          <div className="w-full max-w-[500px] bg-[#2A2A33] border border-brand-bronze/30 rounded-2xl p-6 sm:p-8 shadow-xl mb-12">
            <h2 className="text-2xl font-heading font-bold text-brand-amber mb-8 text-center">
              Δήλωση Συμμετοχής
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="teamName" className="font-body text-brand-cream text-sm">Όνομα Ομάδας</label>
                <input
                  type="text"
                  id="teamName"
                  name="teamName"
                  required
                  maxLength={50}
                  value={formData.teamName}
                  onChange={handleChange}
                  className="w-full h-12 bg-brand-dark border border-brand-bronze/30 rounded-lg px-4 text-brand-cream font-body focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-colors"
                  placeholder="Εισάγετε όνομα ομάδας..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="teamSize" className="font-body text-brand-cream text-sm">Αριθμός Παικτών (1-8)</label>
                <input
                  type="number"
                  id="teamSize"
                  name="teamSize"
                  min="1"
                  max="8"
                  required
                  value={formData.teamSize}
                  onChange={handleChange}
                  className="w-full h-12 bg-brand-dark border border-brand-bronze/30 rounded-lg px-4 text-brand-cream font-body focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-colors"
                  placeholder="Π.χ. 4"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="phone" className="font-body text-brand-cream text-sm">Τηλέφωνο</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full h-12 bg-brand-dark border border-brand-bronze/30 rounded-lg px-4 text-brand-cream font-body focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-colors"
                  placeholder="69XXXXXXXX"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="social" className="font-body text-brand-cream text-sm">Instagram / Facebook</label>
                <input
                  type="text"
                  id="social"
                  name="social"
                  value={formData.social}
                  onChange={handleChange}
                  className="w-full h-12 bg-brand-dark border border-brand-bronze/30 rounded-lg px-4 text-brand-cream font-body focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-colors"
                  placeholder="@username ή σύνδεσμος προφίλ"
                />
              </div>

              {validationError && (
                <div className="text-center p-3 bg-brand-dark/50 border border-brand-red/20 rounded-lg">
                  <p className="text-brand-red font-body font-medium text-sm">{validationError}</p>
                </div>
              )}

              <div className="pt-4 flex flex-col items-center">
                <button
                  type="submit"
                  disabled={isSubmitting || isSubmitted}
                  className="w-full sm:w-auto bg-brand-dark text-brand-amber font-bold font-body text-lg px-8 py-4 rounded-full transition-all drop-shadow-[0_0_18px_var(--color-brand-amber)] hover:drop-shadow-[0_0_28px_var(--color-brand-amber)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100 disabled:drop-shadow-none"
                >
                  {isSubmitting ? "Υποβολή..." : "Υποβολή ✍️"}
                </button>
              </div>

              {isSubmitted && (
                <div className="mt-2 text-center p-4 bg-brand-dark/50 border border-brand-amber/20 rounded-lg">
                  <p className="text-brand-amber font-body font-medium">
                    Η εγγραφή σας ολοκληρώθηκε! Θα επικοινωνήσουμε σύντομα. ✅
                  </p>
                </div>
              )}

              {submitError && (
                <div className="mt-2 text-center p-4 bg-brand-dark/50 border border-brand-red/20 rounded-lg">
                  <p className="text-brand-red font-body font-medium">
                    Κάτι πήγε στραβά. Δοκίμασε ξανά.
                  </p>
                </div>
              )}
            </form>
          </div>
        ) : (
          /* Waitlist Form Card (Sold Out State) */
          <div className="w-full max-w-[500px] bg-[#2A2A33] border border-brand-bronze/30 rounded-2xl p-6 sm:p-8 shadow-xl mb-12 text-center">
            <h2 className="text-2xl font-heading font-bold text-brand-cream mb-4">
              Sold Out! 😔
            </h2>
            <p className="font-body text-brand-cream/80 mb-8">
              Μη χάσεις το επόμενο! Άσε τα στοιχεία σου και θα σε ειδοποιήσουμε.
            </p>

            <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-6 text-left">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="font-body text-brand-cream text-sm">Όνομα</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={waitlistData.name}
                  onChange={handleWaitlistChange}
                  className="w-full h-12 bg-brand-dark border border-brand-bronze/30 rounded-lg px-4 text-brand-cream font-body focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-colors"
                  placeholder="Εισάγετε το όνομά σας..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="contact" className="font-body text-brand-cream text-sm">Τηλέφωνο ή Email</label>
                <input
                  type="text"
                  id="contact"
                  name="contact"
                  required
                  value={waitlistData.contact}
                  onChange={handleWaitlistChange}
                  className="w-full h-12 bg-brand-dark border border-brand-bronze/30 rounded-lg px-4 text-brand-cream font-body focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-colors"
                  placeholder="Στοιχείο επικοινωνίας..."
                />
              </div>

              <div className="pt-4 flex flex-col items-center">
                <button
                  type="submit"
                  disabled={isWaitlistSubmitting || isWaitlistSubmitted}
                  className="w-full sm:w-auto bg-brand-dark text-brand-amber font-bold font-body text-lg px-8 py-4 rounded-full transition-all drop-shadow-[0_0_18px_var(--color-brand-amber)] hover:drop-shadow-[0_0_28px_var(--color-brand-amber)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100 disabled:drop-shadow-none"
                >
                  Ειδοποίησέ με 🔔
                </button>
              </div>

              {isWaitlistSubmitted && (
                <div className="mt-2 text-center p-4 bg-brand-dark/50 border border-brand-amber/20 rounded-lg">
                  <p className="text-brand-amber font-body font-medium">
                    Σε έχουμε καταχωρήσει! Θα σε ειδοποιήσουμε. ✅
                  </p>
                </div>
              )}

              {waitlistError && (
                <div className="mt-2 text-center p-4 bg-brand-dark/50 border border-brand-red/20 rounded-lg">
                  <p className="text-brand-red font-body font-medium">
                    Κάτι πήγε στραβά. Δοκίμασε ξανά.
                  </p>
                </div>
              )}
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
