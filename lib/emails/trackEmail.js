import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function shouldSendEmail({ recipient, emailType, relatedId }) {
  try {
    const sb = await supabaseServerClient();
    const { data, error } = await sb
      .from("email_logs")
      .select("id, status")
      .eq("recipient", recipient)
      .eq("email_type", emailType)
      .eq("related_id", relatedId)
      .single();

    // No record found = never sent, safe to send
    if (error?.code === "PGRST116") {
      return true;
    }

    if (error) {
      console.error("[shouldSendEmail] query error:", error);
      return true; // fail open — send if unsure
    }

    // Already sent successfully — don't send again
    if (data?.status === "sent") {
      console.log("[shouldSendEmail] already sent:", { recipient, emailType, relatedId });
      return false;
    }

    // Failed before — safe to retry
    return true;
  } catch (err) {
    console.error("[shouldSendEmail] error:", err);
    return true; // fail open
  }
}

export async function logEmailSent({ recipient, subject, emailType, relatedId, error }) {
  try {
    const sb = await supabaseServerClient();
    const status = error ? "failed" : "sent";

    const { error: logError } = await sb.from("email_logs").insert([
      {
        recipient,
        subject,
        email_type: emailType,
        related_id: relatedId,
        status,
        error_message: error?.message || null,
        sent_at: status === "sent" ? new Date().toISOString() : null,
      },
    ]);

    if (logError) {
      console.error("[logEmailSent] insert error:", logError);
    }
  } catch (err) {
    console.error("[logEmailSent] error:", err);
  }
}