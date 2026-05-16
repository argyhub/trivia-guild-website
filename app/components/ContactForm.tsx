"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(false);
    setIsSubmitted(false);

    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          from_name: formData.name,
          reply_to: formData.email,
          subject: "Νέο μήνυμα από τη φόρμα επικοινωνίας",
          message: formData.message.trim() === "" ? "Παρακαλώ επικοινωνήστε μαζί μου." : formData.message,
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );

      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        message: ""
      });
    } catch (err) {
      console.error("Failed to send email:", err);
      setError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="w-full max-w-[500px] bg-[#2A2A33] border border-brand-bronze/30 rounded-2xl p-6 sm:p-8 shadow-xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="font-body text-brand-cream text-sm">Όνομα</label>
          <input 
            type="text" 
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full h-12 bg-brand-dark border border-brand-bronze/30 rounded-lg px-4 text-brand-cream font-body focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-colors"
            placeholder="Το όνομά σας..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="font-body text-brand-cream text-sm">Email</label>
          <input 
            type="email" 
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full h-12 bg-brand-dark border border-brand-bronze/30 rounded-lg px-4 text-brand-cream font-body focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-colors"
            placeholder="Το email σας..."
          />
        </div>



        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="font-body text-brand-cream text-sm">Μήνυμα</label>
          <textarea 
            id="message"
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleChange}
            className="w-full min-h-[48px] bg-brand-dark border border-brand-bronze/30 rounded-lg p-4 text-brand-cream font-body focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-colors resize-y"
            placeholder="Πώς μπορούμε να βοηθήσουμε;"
          />
        </div>

        <div className="pt-4 flex flex-col items-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-brand-dark text-brand-amber font-bold font-body text-lg px-8 py-4 rounded-full transition-all drop-shadow-[0_0_18px_var(--color-brand-amber)] hover:drop-shadow-[0_0_28px_var(--color-brand-amber)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100 disabled:drop-shadow-none"
          >
            {isSubmitting ? "Αποστολή..." : "Αποστολή"}
          </button>
        </div>

        {isSubmitted && (
          <div className="mt-2 text-center p-4 bg-brand-dark/50 border border-brand-amber/20 rounded-lg">
            <p className="text-brand-amber font-body font-medium">
              Ευχαριστούμε! Θα επικοινωνήσουμε σύντομα.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-2 text-center p-4 bg-brand-dark/50 border border-brand-red/20 rounded-lg">
            <p className="text-brand-red font-body font-medium">
              Κάτι πήγε στραβά. Δοκίμασε ξανά.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
