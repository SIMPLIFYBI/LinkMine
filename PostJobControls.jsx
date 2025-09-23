"use client";
import { useState } from "react";
import PostJobModal from "@/app/components/PostJobModal";

export default function PostJobControls() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-medium"
      >
        Post a job
      </button>
      <PostJobModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}