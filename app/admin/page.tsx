"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

// Admin password loaded from server-side env var via .env.local
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "tgadmin2025";

interface Registration {
  id: number;
  team_name: string;
  team_size: number;
  phone: string;
  social: string;
  event_name: string;
  created_at: string;
}

interface PastEvent {
  id: number;
  event_title: string;
  event_date: string;
  event_time: string;
  event_venue: string;
  registrations_data: Registration[];
  total_teams: number;
  created_at: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  // Event config state
  const [eventTitle, setEventTitle] = useState("Quiz Night");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventVenue, setEventVenue] = useState("The Pub");
  const [eventStatus, setEventStatus] = useState<"open" | "sold_out">("open");
  const [configSaved, setConfigSaved] = useState(false);
  const [configError, setConfigError] = useState("");

  // Error states for delete operations
  const [deleteRegError, setDeleteRegError] = useState("");
  const [deletePastError, setDeletePastError] = useState("");

  // Registrations state
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  // Archive state
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveMessage, setArchiveMessage] = useState("");

  // Past events state
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
  const [loadingPastEvents, setLoadingPastEvents] = useState(false);
  const [expandedPastEvent, setExpandedPastEvent] = useState<number | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
  };

  // Load config from Supabase event_config table on auth
  const fetchEventConfig = useCallback(async () => {
    const { data, error } = await supabase
      .from("event_config")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .single();

    if (!error && data) {
      setEventTitle(data.event_title || "Quiz Night");
      setEventDate(data.event_date || "");
      setEventTime(data.event_time || "");
      setEventVenue(data.event_venue || "The Pub");
      setEventStatus((data.event_status as "open" | "sold_out") || "open");
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEventConfig();
    }
  }, [isAuthenticated, fetchEventConfig]);

  const saveConfig = async () => {
    setConfigError("");
    try {
      const { error } = await supabase.from("event_config").upsert({
        id: 1,
        event_title: eventTitle,
        event_date: eventDate,
        event_time: eventTime,
        event_venue: eventVenue,
        event_status: eventStatus,
      });
      if (error) throw error;
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2000);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("Config save failed:", errMsg);
      setConfigError("Αποτυχία αποθήκευσης. Δοκίμασε ξανά.");
      setTimeout(() => setConfigError(""), 4000);
    }
  };

  const fetchRegistrations = useCallback(async () => {
    setLoadingRegs(true);
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRegistrations(data as Registration[]);
    }
    setLoadingRegs(false);
  }, []);

  const fetchPastEvents = useCallback(async () => {
    setLoadingPastEvents(true);
    const { data, error } = await supabase
      .from("past_events")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPastEvents(data as PastEvent[]);
    }
    setLoadingPastEvents(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRegistrations();
      fetchPastEvents();
    }
  }, [isAuthenticated, fetchRegistrations, fetchPastEvents]);

  const deleteRegistration = async (id: number) => {
    const confirmed = window.confirm(
      "Σίγουρα θέλεις να διαγράψεις αυτή την εγγραφή;"
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("registrations")
      .delete()
      .eq("id", id);

    if (!error) {
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      setDeleteRegError("");
    } else {
      setDeleteRegError("Αποτυχία διαγραφής. Δοκίμασε ξανά.");
      setTimeout(() => setDeleteRegError(""), 4000);
    }
  };

  const archiveEvent = async () => {
    const confirmed = window.confirm(
      "Είσαι σίγουρος; Αυτό θα αρχειοθετήσει το τρέχον event και θα διαγράψει όλες τις εγγραφές."
    );
    if (!confirmed) return;

    setIsArchiving(true);
    setArchiveMessage("");

    try {
      // 1. Fetch ALL current registrations
      const { data: allRegs, error: fetchError } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Use current state values (loaded from Supabase event_config)
      const currentTitle = eventTitle;
      const currentDate = eventDate;
      const currentTime = eventTime;
      const currentVenue = eventVenue;

      // 2. Save to past_events
      const { error: insertError } = await supabase
        .from("past_events")
        .insert({
          event_title: currentTitle,
          event_date: currentDate,
          event_time: currentTime,
          event_venue: currentVenue,
          registrations_data: allRegs || [],
          total_teams: allRegs ? allRegs.length : 0,
        });

      if (insertError) throw insertError;

      // 3. Delete ALL registrations
      // Deletes all rows — Supabase requires a filter, gte("id", 0) matches all valid IDs
      const { error: deleteError } = await supabase
        .from("registrations")
        .delete()
        .gte("id", 0);

      if (deleteError) throw deleteError;

      // 4. Clear date and time in Supabase config (keep title and venue)
      await supabase.from("event_config").upsert({
        id: 1,
        event_title: currentTitle,
        event_date: "",
        event_time: "",
        event_venue: currentVenue,
        event_status: "open",
      });
      setEventDate("");
      setEventTime("");

      // 5. Refresh registrations (now empty)
      setRegistrations([]);

      // 6. Refresh past events list
      await fetchPastEvents();

      // 7. Show success message
      setArchiveMessage("Το event αρχειοθετήθηκε επιτυχώς ✅");
      setTimeout(() => setArchiveMessage(""), 4000);
    } catch (err) {
      console.error("Archive failed:", err);
      setArchiveMessage("Σφάλμα κατά την αρχειοθέτηση ❌");
      setTimeout(() => setArchiveMessage(""), 4000);
    } finally {
      setIsArchiving(false);
    }
  };

  const deletePastEvent = async (id: number) => {
    const confirmed = window.confirm(
      "Σίγουρα θέλεις να διαγράψεις μόνιμα αυτό το αρχειοθετημένο event;"
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("past_events")
      .delete()
      .eq("id", id);

    if (!error) {
      setPastEvents((prev) => prev.filter((e) => e.id !== id));
      if (expandedPastEvent === id) setExpandedPastEvent(null);
      setDeletePastError("");
    } else {
      setDeletePastError("Αποτυχία διαγραφής. Δοκίμασε ξανά.");
      setTimeout(() => setDeletePastError(""), 4000);
    }
  };

  const exportPastEventCSV = (pastEvent: PastEvent) => {
    const regs = pastEvent.registrations_data || [];
    if (regs.length === 0) return;

    const headers = ["Team Name", "Team Size", "Phone", "Social"];
    const rows = regs.map((r) => [
      r.team_name,
      r.team_size,
      r.phone || "",
      r.social || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pastEvent.event_title}-${pastEvent.event_date || "archive"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (registrations.length === 0) return;
    const headers = [
      "Team Name",
      "Team Size",
      "Phone",
      "Social",
      "Event",
      "Date",
    ];
    const rows = registrations.map((r) => [
      r.team_name,
      r.team_size,
      r.phone,
      r.social || "",
      r.event_name || "",
      new Date(r.created_at).toLocaleString("el-GR"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `registrations-${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── PASSWORD GATE ───
  if (!isAuthenticated) {
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
              Admin
            </h1>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                }}
                placeholder="Κωδικός..."
                className="w-full h-12 bg-brand-dark border border-brand-bronze/30 rounded-lg px-4 text-brand-cream font-body focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-colors"
              />
              {passwordError && (
                <p className="text-brand-red text-sm font-body text-center">
                  Λάθος κωδικός
                </p>
              )}
              <button
                type="submit"
                className="w-full bg-brand-dark text-brand-amber font-bold font-body text-lg px-8 py-3 rounded-full transition-all drop-shadow-[0_0_18px_var(--color-brand-amber)] hover:drop-shadow-[0_0_28px_var(--color-brand-amber)] hover:scale-105 active:scale-95"
              >
                Είσοδος
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── DASHBOARD ───
  return (
    <div className="relative flex flex-col flex-1 w-full min-h-screen">
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(circle at center, #1a1612 0%, var(--color-brand-dark) 70%)",
        }}
      />

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 flex flex-col gap-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-brand-amber">
            Admin Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="text-brand-cream/60 hover:text-brand-red font-body text-sm font-medium transition-colors"
          >
            Έξοδος
          </button>
        </div>

        {/* SECTION A — Event Configuration */}
        <div className="bg-[#2A2A33] border border-brand-bronze/30 rounded-2xl p-6 sm:p-8 shadow-xl">
          <h2 className="text-xl font-heading font-bold text-brand-amber mb-6">
            Ρυθμίσεις Event
          </h2>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="font-body text-brand-cream text-sm">
                Τίτλος Event
              </label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full h-12 bg-brand-dark border border-brand-bronze/30 rounded-lg px-4 text-brand-cream font-body focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-body text-brand-cream text-sm">
                Ημερομηνία
              </label>
              <input
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="π.χ. Δευτέρα 01/06"
                className="w-full h-12 bg-brand-dark border border-brand-bronze/30 rounded-lg px-4 text-brand-cream font-body focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-body text-brand-cream text-sm">Ώρα</label>
              <input
                type="text"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                placeholder="π.χ. 20:00"
                className="w-full h-12 bg-brand-dark border border-brand-bronze/30 rounded-lg px-4 text-brand-cream font-body focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-body text-brand-cream text-sm">
                Τοποθεσία
              </label>
              <input
                type="text"
                value={eventVenue}
                onChange={(e) => setEventVenue(e.target.value)}
                className="w-full h-12 bg-brand-dark border border-brand-bronze/30 rounded-lg px-4 text-brand-cream font-body focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-colors"
              />
            </div>

            {/* Status Toggle */}
            <div className="flex flex-col gap-2">
              <label className="font-body text-brand-cream text-sm">
                Κατάσταση
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEventStatus("open")}
                  className={`flex-1 py-3 rounded-lg font-body font-bold text-sm transition-all ${
                    eventStatus === "open"
                      ? "bg-[#2D6A4F] text-brand-cream"
                      : "bg-transparent border border-[#2D6A4F] text-[#2D6A4F]"
                  }`}
                >
                  OPEN
                </button>
                <button
                  type="button"
                  onClick={() => setEventStatus("sold_out")}
                  className={`flex-1 py-3 rounded-lg font-body font-bold text-sm transition-all ${
                    eventStatus === "sold_out"
                      ? "bg-[#C0271A] text-brand-cream"
                      : "bg-transparent border border-[#C0271A] text-[#C0271A]"
                  }`}
                >
                  SOLD OUT
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={saveConfig}
                className="bg-brand-dark text-brand-amber font-bold font-body px-6 py-3 rounded-full transition-all drop-shadow-[0_0_18px_var(--color-brand-amber)] hover:drop-shadow-[0_0_28px_var(--color-brand-amber)] hover:scale-105 active:scale-95"
              >
                Αποθήκευση
              </button>
              {configSaved && (
                <span className="text-brand-amber font-body text-sm animate-pulse">
                  Αποθηκεύτηκε ✅
                </span>
              )}
              {configError && (
                <span className="text-brand-red font-body text-sm">
                  {configError}
                </span>
              )}
            </div>

            {/* Archive Button */}
            <div className="flex items-center gap-4 pt-1">
              <button
                onClick={archiveEvent}
                disabled={isArchiving}
                className="bg-transparent border-2 border-brand-bronze text-brand-amber font-bold font-body px-6 py-3 rounded-full transition-all hover:bg-brand-bronze/10 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isArchiving ? "Αρχειοθέτηση..." : "Αρχειοθέτηση Event 📦"}
              </button>
              {archiveMessage && (
                <span className="text-brand-amber font-body text-sm animate-pulse">
                  {archiveMessage}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION B — Registrations */}
        <div className="bg-[#2A2A33] border border-brand-bronze/30 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-heading font-bold text-brand-amber">
              Εγγραφές{" "}
              <span className="text-brand-cream/50 text-base font-normal">
                ({registrations.length} ομάδες)
              </span>
            </h2>
            <div className="flex gap-3">
              <button
                onClick={exportCSV}
                disabled={registrations.length === 0}
                className="text-sm font-body font-medium text-brand-cream/70 hover:text-brand-amber border border-brand-bronze/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                Εξαγωγή CSV
              </button>
              <button
                onClick={fetchRegistrations}
                disabled={loadingRegs}
                className="text-sm font-body font-medium text-brand-cream/70 hover:text-brand-amber border border-brand-bronze/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingRegs ? "..." : "Ανανέωση"}
              </button>
            </div>
          </div>

          {registrations.length === 0 ? (
            <p className="text-brand-cream/40 font-body text-center py-8">
              Δεν υπάρχουν εγγραφές ακόμα.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="bg-brand-dark/60 border border-brand-bronze/20 rounded-xl p-5"
                >
                  <p className="text-brand-amber font-heading font-bold text-lg mb-3">
                    {reg.team_name}
                  </p>
                  <div className="flex flex-col gap-1 text-sm font-body text-brand-cream/70 mb-4">
                    <span>
                      Παίκτες:{" "}
                      <span className="text-brand-cream">{reg.team_size}</span>
                    </span>
                    <span>
                      Τηλέφωνο:{" "}
                      <span className="text-brand-cream">
                        {reg.phone || "—"}
                      </span>
                    </span>
                    <span>
                      Social:{" "}
                      <span className="text-brand-cream">
                        {reg.social || "—"}
                      </span>
                    </span>
                    <span>
                      Ημερομηνία:{" "}
                      <span className="text-brand-cream">
                        {new Date(reg.created_at).toLocaleString("el-GR")}
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={() => deleteRegistration(reg.id)}
                    className="text-sm font-body font-medium text-brand-red/70 hover:text-brand-red transition-colors"
                  >
                    Διαγραφή
                  </button>
                </div>
              ))}
            </div>
          )}
          {deleteRegError && (
            <p className="text-brand-red font-body text-sm text-center mt-4">{deleteRegError}</p>
          )}
        </div>

        {/* SECTION C — Past Events History */}
        <div className="bg-[#2A2A33] border border-brand-bronze/30 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-heading font-bold text-brand-amber">
              Ιστορικό Events
            </h2>
            <button
              onClick={fetchPastEvents}
              disabled={loadingPastEvents}
              className="text-sm font-body font-medium text-brand-cream/70 hover:text-brand-amber border border-brand-bronze/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loadingPastEvents ? "..." : "Ανανέωση"}
            </button>
          </div>

          {pastEvents.length === 0 ? (
            <p className="text-brand-cream/40 font-body text-center py-8">
              Δεν υπάρχουν αρχειοθετημένα events ακόμα.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {pastEvents.map((pe) => (
                <div
                  key={pe.id}
                  className="bg-brand-dark/60 border border-brand-bronze/20 rounded-xl overflow-hidden"
                >
                  {/* Collapsible Header — div to avoid nested <button> HTML violation */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setExpandedPastEvent(
                        expandedPastEvent === pe.id ? null : pe.id
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpandedPastEvent(
                          expandedPastEvent === pe.id ? null : pe.id
                        );
                      }
                    }}
                    className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 text-left hover:bg-brand-dark/40 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-brand-amber font-heading font-bold text-lg">
                        {pe.event_title}
                      </span>
                      <span className="text-brand-cream/50 font-body text-sm">
                        {pe.event_date} · {pe.event_venue} · {pe.total_teams}{" "}
                        ομάδες
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportPastEventCSV(pe);
                        }}
                        className="text-sm font-body font-medium text-brand-cream/70 hover:text-brand-amber border border-brand-bronze/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Λήψη CSV
                      </button>
                      <span className="text-brand-cream/40 text-lg">
                        {expandedPastEvent === pe.id ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedPastEvent === pe.id && (
                    <div className="border-t border-brand-bronze/20 p-5">
                      {pe.registrations_data &&
                      pe.registrations_data.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm font-body">
                            <thead>
                              <tr className="text-left text-brand-cream/50 border-b border-brand-bronze/20">
                                <th className="pb-2 pr-4">Ομάδα</th>
                                <th className="pb-2 pr-4">Μέγεθος</th>
                                <th className="pb-2 pr-4">Τηλέφωνο</th>
                                <th className="pb-2">Social</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pe.registrations_data.map(
                                (reg, idx) => (
                                  <tr
                                    key={idx}
                                    className="border-b border-brand-bronze/10 last:border-b-0"
                                  >
                                    <td className="py-2 pr-4 text-brand-amber font-medium">
                                      {reg.team_name}
                                    </td>
                                    <td className="py-2 pr-4 text-brand-cream">
                                      {reg.team_size}
                                    </td>
                                    <td className="py-2 pr-4 text-brand-cream">
                                      {reg.phone || "—"}
                                    </td>
                                    <td className="py-2 text-brand-cream">
                                      {reg.social || "—"}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-brand-cream/40 font-body text-sm text-center py-4">
                          Δεν υπάρχουν δεδομένα εγγραφών.
                        </p>
                      )}

                      <div className="flex justify-end mt-4 pt-3 border-t border-brand-bronze/10">
                        <button
                          onClick={() => deletePastEvent(pe.id)}
                          className="text-sm font-body font-medium text-brand-red/70 hover:text-brand-red transition-colors"
                        >
                          Διαγραφή
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {deletePastError && (
            <p className="text-brand-red font-body text-sm text-center mt-4">{deletePastError}</p>
          )}
        </div>
      </main>
    </div>
  );
}
