"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function LandingNavbar() {
  return (
    <nav className="sticky top-0 z-50 flex justify-between px-6 py-4 bg-black/60 text-white backdrop-blur">

      <div className="font-semibold text-lg">
        StoreFlow
      </div>

      <div className="flex items-center gap-3">
        <Link href="/signin">
          <Button variant="ghost">Sign In</Button>
        </Link>

        <Link href="/signup">
          <Button>Sign Up</Button>
        </Link>
      </div>

    </nav>
  );
}