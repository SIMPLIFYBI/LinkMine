import Link from "next/link";

export default function Footer() {
  return (
    // removed footer’s own gradient; keep it translucent so the body gradient shows through
    <footer className="w-full border-t border-white/10 bg-white/[0.02] backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="inline-flex items-center gap-2">
              <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 ring-1 ring-white/20" />
              <span className="text-xl font-semibold tracking-tight">MineLink</span>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              Connect mining clients with trusted consultants and contractors.
            </p>
          </div>

          <nav>
            <h4 className="text-sm font-semibold text-slate-100">Explore</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li><Link href="/consultants" className="hover:text-sky-300">Consultants</Link></li>
              <li><Link href="/jobs" className="hover:text-sky-300">Jobs</Link></li>
              <li><Link href="/signup" className="hover:text-sky-300">Create account</Link></li>
            </ul>
          </nav>

          <nav>
            <h4 className="text-sm font-semibold text-slate-100">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li><Link href="/about" className="hover:text-sky-300">About</Link></li>
              <li><a href="mailto:hello@minelink.app" className="hover:text-sky-300">Contact</a></li>
              <li><Link href="/pricing" className="hover:text-sky-300">Pricing</Link></li>
            </ul>
          </nav>

          <nav>
            <h4 className="text-sm font-semibold text-slate-100">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li><Link href="/terms" className="hover:text-sky-300">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-sky-300">Privacy</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-white/10 pt-4 text-xs text-slate-400 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} MineLink. All rights reserved.</span>
          <span className="text-slate-500">Built for the mining industry.</span>
        </div>
      </div>
    </footer>
  );
}