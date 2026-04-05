import { NextResponse } from "next/server";
import { sendTrainingBookingEmail, sendTrainingBookingTrainerAlertEmail } from "@/lib/emails/trainingBooking";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  computeTrainingAvailability,
  getConfirmedTrainingBookingCount,
  getTrainingSessionContext,
  userCanManageTrainingSession,
} from "@/lib/trainingBookings";

export const runtime = "nodejs";

function mapBookingMutationError(error) {
  if (!error) return "Unable to save booking request.";
  if (error.code === "23514" && error.message?.includes("training_session_bookings_status_check")) {
    return "Training booking request status is out of date in the database. Apply migration 20260405_training_booking_requests.sql and try again.";
  }
  return error.message || "Unable to save booking request.";
}

function sessionForClient(session) {
  if (!session) return session;
  return {
    ...session,
    course: session.course
      ? {
          ...session.course,
          consultant: session.course.consultant
            ? {
                id: session.course.consultant.id,
                display_name: session.course.consultant.display_name,
                slug: session.course.consultant.slug,
              }
            : null,
        }
      : null,
  };
}

async function getTrainerEmails(session) {
  const consultant = session?.course?.consultant;
  const email = consultant?.contact_email ? String(consultant.contact_email).trim().toLowerCase() : "";
  return email ? [email] : [];
}

function buildBookingName(profile, user) {
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  if (typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) {
    return user.user_metadata.full_name.trim();
  }
  return user?.email || "Training attendee";
}

export async function GET(req, { params }) {
  try {
    const p = await params;
    const sessionId = p?.id;
    if (!sessionId) return NextResponse.json({ error: "Missing session id" }, { status: 400 });

    const authz = req.headers.get("authorization") || undefined;
    const sb = await supabaseServerClient(authz ? { headers: { Authorization: authz } } : undefined);
    const { data: auth } = await sb.auth.getUser();
    const user = auth?.user || null;

    const { data: session, error: sessionError } = await getTrainingSessionContext(sb, sessionId);
    if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 400 });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const { allowed } = user ? await userCanManageTrainingSession(sb, user.id, sessionId) : { allowed: false };

    if (allowed) {
      const { data: bookings, error } = await sb
        .from("training_session_bookings")
        .select("id, session_id, user_id, booking_name, booking_email, booking_phone, status, notes, booked_at, cancelled_at, updated_at")
        .eq("session_id", sessionId)
        .order("booked_at", { ascending: true });

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      const pendingCount = (bookings || []).filter((booking) => booking.status === "pending").length;
      const confirmedCount = (bookings || []).filter((booking) => booking.status === "confirmed").length;
      const waitlistedCount = (bookings || []).filter((booking) => booking.status === "waitlisted").length;
      const cancelledCount = (bookings || []).filter((booking) => booking.status === "cancelled").length;

      return NextResponse.json({
        session: sessionForClient(session),
        bookings: bookings || [],
        currentBooking: null,
        canManage: true,
        counts: {
          pending: pendingCount,
          confirmed: confirmedCount,
          waitlisted: waitlistedCount,
          cancelled: cancelledCount,
        },
        availability: computeTrainingAvailability(session, confirmedCount),
      });
    }

    const availability = computeTrainingAvailability(session, null);

    if (!user) {
      return NextResponse.json({
        session: sessionForClient(session),
        availability,
        currentBooking: null,
        canManage: false,
      });
    }

    const { data: currentBooking, error: currentBookingError } = await sb
      .from("training_session_bookings")
      .select("id, session_id, user_id, booking_name, booking_email, booking_phone, status, notes, booked_at, cancelled_at, updated_at")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (currentBookingError) {
      return NextResponse.json({ error: currentBookingError.message }, { status: 400 });
    }

    return NextResponse.json({
      session: sessionForClient(session),
      currentBooking: currentBooking || null,
      canManage: false,
      availability,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const p = await params;
    const sessionId = p?.id;
    if (!sessionId) return NextResponse.json({ error: "Missing session id" }, { status: 400 });

    const authz = req.headers.get("authorization") || undefined;
    const sb = await supabaseServerClient(authz ? { headers: { Authorization: authz } } : undefined);
    const { data: auth } = await sb.auth.getUser();
    const user = auth?.user || null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!user.email) return NextResponse.json({ error: "Authenticated user email is required." }, { status: 400 });

    const body = await req.json().catch(() => ({}));

    const { data: session, error: sessionError } = await getTrainingSessionContext(sb, sessionId);
    if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 400 });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    if (session.status !== "scheduled" || session.course?.status !== "published") {
      return NextResponse.json({ error: "This session is not open for bookings." }, { status: 400 });
    }

    if (!session.bookings_enabled) {
      return NextResponse.json({ error: "Bookings are not enabled for this session." }, { status: 400 });
    }

    const { data: existingBooking, error: existingError } = await sb
      .from("training_session_bookings")
      .select("id, status")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError) return NextResponse.json({ error: existingError.message }, { status: 400 });
    if (existingBooking && existingBooking.status !== "cancelled") {
      return NextResponse.json({ error: "You already have a booking for this session." }, { status: 409 });
    }

    const { data: profile } = await sb
      .from("user_profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    const nextStatus = "pending";

    const bookingPayload = {
      session_id: sessionId,
      user_id: user.id,
      booking_name: buildBookingName(profile, user),
      booking_email: String(user.email || "").trim().toLowerCase(),
      booking_phone: typeof body.bookingPhone === "string" && body.bookingPhone.trim() ? body.bookingPhone.trim() : null,
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
      status: nextStatus,
      cancelled_at: null,
      updated_at: new Date().toISOString(),
    };

    let booking;
    let error;

    if (existingBooking) {
      ({ data: booking, error } = await sb
        .from("training_session_bookings")
        .update(bookingPayload)
        .eq("id", existingBooking.id)
        .select("id, session_id, user_id, booking_name, booking_email, booking_phone, status, notes, booked_at, cancelled_at, updated_at")
        .single());
    } else {
      ({ data: booking, error } = await sb
        .from("training_session_bookings")
        .insert(bookingPayload)
        .select("id, session_id, user_id, booking_name, booking_email, booking_phone, status, notes, booked_at, cancelled_at, updated_at")
        .single());
    }

    if (error) return NextResponse.json({ error: mapBookingMutationError(error) }, { status: 400 });

    sendTrainingBookingEmail({
      kind: "request_received",
      booking,
      session,
      course: session.course,
      consultant: session.course?.consultant,
      req,
    }).catch((mailError) => {
      console.error("[training-bookings] booking email failed:", mailError);
    });

    getTrainerEmails(session)
      .then((emails) => Promise.all(
        emails.map((email) => sendTrainingBookingTrainerAlertEmail({
          to: email,
          booking,
          session,
          course: session.course,
          consultant: session.course?.consultant,
          req,
        }))
      ))
      .catch((mailError) => {
        console.error("[training-bookings] trainer alert failed:", mailError);
      });

    return NextResponse.json({
      booking,
      availability: computeTrainingAvailability(session, await getConfirmedTrainingBookingCount(sb, sessionId, null)),
    }, { status: existingBooking ? 200 : 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}