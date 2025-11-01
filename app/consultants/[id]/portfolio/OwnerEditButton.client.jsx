"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function OwnerEditButton({ consultantId }) {
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const sb = supabaseBrowser();
        const { data: auth } = await sb.auth.getUser();
        const userId = auth?.user?.id;
        if (!userId) return;

        // Fetch claimed_by with the user's session (client-side); RLS should allow reading this row.
        const { data: c } = await sb
          .from("consultants")
          .select("id, claimed_by")
          .eq("id", consultantId)
          .maybeSingle();

        if (mounted && c?.claimed_by === userId) setCanEdit(true);
      } catch {
        // ignore
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [consultantId]);

  if (!canEdit) return null;

  return (
    <Link
      href={`/consultants/${consultantId}/portfolio/edit`}
      className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-100 hover:border-sky-300 hover:bg-sky-500/20"
      prefetch
    >
      Edit portfolio
    </Link>
  );
}