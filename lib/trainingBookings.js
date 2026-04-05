export async function getTrainingSessionContext(sb, sessionId) {
  return sb
    .from("training_sessions")
    .select(`
      id,
      course_id,
      starts_at,
      ends_at,
      status,
      capacity,
      bookings_enabled,
      availability_display,
      booking_url,
      course:training_courses!inner (
        id,
        title,
        status,
        consultant_id,
        consultant:consultants!inner (
          id,
          display_name,
          slug,
          contact_email
        )
      )
    `)
    .eq("id", sessionId)
    .maybeSingle();
}

export async function userCanManageTrainingConsultant(sb, userId, consultantId) {
  if (!userId || !consultantId) return false;

  const [{ data: adminRow, error: adminError }, { data: ownerRow, error: ownerError }] = await Promise.all([
    sb.from("app_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    sb
      .from("consultants")
      .select("id")
      .eq("id", consultantId)
      .or(`user_id.eq.${userId},claimed_by.eq.${userId}`)
      .maybeSingle(),
  ]);

  if (adminError) throw new Error(adminError.message);
  if (ownerError) throw new Error(ownerError.message);

  return Boolean(adminRow) || Boolean(ownerRow);
}

export async function userCanManageTrainingSession(sb, userId, sessionId) {
  const { data: session, error } = await getTrainingSessionContext(sb, sessionId);
  if (error) throw new Error(error.message);
  if (!session) return { allowed: false, session: null };

  const allowed = await userCanManageTrainingConsultant(sb, userId, session.course?.consultant_id);
  return { allowed, session };
}

export async function getConfirmedTrainingBookingCount(sb, sessionId, excludeBookingId = null) {
  let query = sb
    .from("training_session_bookings")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "confirmed");

  if (excludeBookingId) {
    query = query.neq("id", excludeBookingId);
  }

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count || 0;
}

export function computeTrainingAvailability(session, confirmedCount) {
  const capacity = Number.isFinite(Number(session?.capacity)) ? Number(session.capacity) : null;
  const safeConfirmedCount = Number.isFinite(Number(confirmedCount)) ? Number(confirmedCount) : null;

  if (capacity == null || safeConfirmedCount == null) {
    return {
      hasAvailability: true,
      remainingPlaces: null,
      displayMode: session?.availability_display || "remaining_places",
    };
  }

  const remainingPlaces = Math.max(0, capacity - safeConfirmedCount);
  return {
    hasAvailability: remainingPlaces > 0,
    remainingPlaces,
    displayMode: session?.availability_display || "remaining_places",
  };
}