"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAuthenticated } from "./auth";

// Helper to ensure route is protected
async function requireAuth() {
  const isAuth = await isAuthenticated();
  if (!isAuth) {
    throw new Error("Unauthorized");
  }
}

export async function saveEventConfig(formData: {
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventStatus: "open" | "sold_out";
}) {
  await requireAuth();

  const { error } = await supabaseAdmin.from("event_config").upsert({
    id: 1,
    event_title: formData.eventTitle,
    event_date: formData.eventDate,
    event_time: formData.eventTime,
    event_venue: formData.eventVenue,
    event_status: formData.eventStatus,
  });

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteRegistration(id: number) {
  await requireAuth();

  const { error } = await supabaseAdmin
    .from("registrations")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deletePastEvent(id: number) {
  await requireAuth();

  const { error } = await supabaseAdmin
    .from("past_events")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function archiveEvent(currentConfig: {
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
}) {
  await requireAuth();

  // 1. Fetch ALL current registrations
  const { data: allRegs, error: fetchError } = await supabaseAdmin
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (fetchError) throw new Error("Failed to fetch registrations: " + fetchError.message);

  // 2. Save to past_events
  const { error: insertError } = await supabaseAdmin
    .from("past_events")
    .insert({
      event_title: currentConfig.eventTitle,
      event_date: currentConfig.eventDate,
      event_time: currentConfig.eventTime,
      event_venue: currentConfig.eventVenue,
      registrations_data: allRegs || [],
      total_teams: allRegs ? allRegs.length : 0,
    });

  if (insertError) throw new Error("Failed to save past event: " + insertError.message);

  // 3. Delete ALL registrations
  const { error: deleteError } = await supabaseAdmin
    .from("registrations")
    .delete()
    .gte("id", 0); // matches all valid IDs

  if (deleteError) throw new Error("Failed to clear registrations: " + deleteError.message);

  // 4. Clear date and time in Supabase config
  const { error: configError } = await supabaseAdmin.from("event_config").upsert({
    id: 1,
    event_title: currentConfig.eventTitle,
    event_date: "",
    event_time: "",
    event_venue: currentConfig.eventVenue,
    event_status: "open",
  });

  if (configError) throw new Error("Failed to reset config: " + configError.message);

  return { success: true };
}
