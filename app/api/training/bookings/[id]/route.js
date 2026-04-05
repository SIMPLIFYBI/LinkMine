import { NextResponse } from "next/server";
import { sendTrainingBookingEmail } from "@/lib/emails/trainingBooking";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  getConfirmedTrainingBookingCount,
  getTrainingSessionContext,
  userCanManageTrainingSession,
} from "@/lib/trainingBookings";

export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set(["pending", "confirmed", "cancelled", "waitlisted"]);

function mapBookingMutationError(error) {
  if (!error) return "Unable to update booking.";
  if (error.code === "23514" && error.message?.includes("training_session_bookings_status_check")) {
    return "Training booking statuses are out of date in the database. Apply migration 20260405_training_booking_requests.sql and try again.";
  }
  return error.message || "Unable to update booking.";
}

export async function PATCH(req, { params }) {
  try {
    const p = await params;
    const bookingId = p?.id;
    if (!bookingId) return NextResponse.json({ error: "Missing booking id" }, { status: 400 });

    const authz = req.headers.get("authorization") || undefined;
    const sb = await supabaseServerClient(authz ? { headers: { Authorization: authz } } : undefined);
    const { data: auth } = await sb.auth.getUser();
    const user = auth?.user || null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: booking, error: bookingError } = await sb
      .from("training_session_bookings")
      .select("id, session_id, user_id, status")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) return NextResponse.json({ error: bookingError.message }, { status: 400 });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const { allowed: canManageSession, session } = await userCanManageTrainingSession(sb, user.id, booking.session_id);
    const isOwnBooking = booking.user_id === user.id;

    if (!isOwnBooking && !canManageSession) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const requestedStatus = typeof body.status === "string" ? body.status : null;
    if (!requestedStatus || !ALLOWED_STATUSES.has(requestedStatus)) {
      return NextResponse.json({ error: "Invalid booking status" }, { status: 400 });
    }

    if (isOwnBooking && !canManageSession && requestedStatus !== "cancelled") {
      return NextResponse.json({ error: "You can only cancel your own booking." }, { status: 403 });
    }

    let sessionContext = session;
    if (!sessionContext) {
      const { data: freshSession, error: sessionError } = await getTrainingSessionContext(sb, booking.session_id);
      if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 400 });
      if (!freshSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });
      sessionContext = freshSession;
    }

    if (requestedStatus === "confirmed") {
      const confirmedCount = await getConfirmedTrainingBookingCount(sb, booking.session_id, booking.id);
      const capacity = Number.isFinite(Number(sessionContext?.capacity)) ? Number(sessionContext.capacity) : null;
      if (capacity != null && confirmedCount >= capacity) {
        return NextResponse.json({ error: "Session is already at capacity." }, { status: 409 });
      }
    }

    const patch = {
      status: requestedStatus,
      updated_at: new Date().toISOString(),
      cancelled_at: requestedStatus === "cancelled" ? new Date().toISOString() : null,
    };

    if (canManageSession && body.notes !== undefined) {
      patch.notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
    }

    const { data: updated, error: updateError } = await sb
      .from("training_session_bookings")
      .update(patch)
      .eq("id", bookingId)
      .select("id, session_id, user_id, booking_name, booking_email, booking_phone, status, notes, booked_at, cancelled_at, updated_at")
      .single();

    if (updateError) return NextResponse.json({ error: mapBookingMutationError(updateError) }, { status: 400 });

    if (requestedStatus !== booking.status) {
      sendTrainingBookingEmail({
        kind: requestedStatus,
        booking: updated,
        session: sessionContext,
        course: sessionContext?.course,
        consultant: sessionContext?.course?.consultant,
        req,
      }).catch((mailError) => {
        console.error("[training-bookings] status email failed:", mailError);
      });
    }

    return NextResponse.json({ booking: updated });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}