"use client";

import { useState } from "react";
import Image from "next/image";
import { login } from "@/app/actions/auth";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await login(password);
      if (result && !result.success) {
        setError(result.error || "Αποτυχία σύνδεσης");
      }
    } catch (err) {
      setError("Σφάλμα σύνδεσης");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col flex-1 w-full min-h-screen">
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(circle at center, #1a1612 0%, var(--color-brand-dark) 70%)",
        }}
      />
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[400px] bg-[#2A2A33] border border-brand-bronze/30 rounded-2xl p-8 shadow-xl">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/triviaguildlogonobackground.png"
              alt="Trivia Guild Logo"
              width={80}
              height={80}
              className="drop-shadow-[0_0_15px_var(--color-brand-amber)]"
            />
          </div>
          <h1 className="text-2xl font-heading font-bold text-brand-amber mb-6 text-center">
            Admin Login
          </h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Κωδικός..."
              className="w-full h-12 bg-brand-dark border border-brand-bronze/30 rounded-lg px-4 text-brand-cream font-body focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-colors"
            />
            {error && (
              <p className="text-brand-red text-sm font-body text-center">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-dark text-brand-amber font-bold font-body text-lg px-8 py-3 rounded-full transition-all drop-shadow-[0_0_18px_var(--color-brand-amber)] hover:drop-shadow-[0_0_28px_var(--color-brand-amber)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? "Είσοδος..." : "Είσοδος"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
