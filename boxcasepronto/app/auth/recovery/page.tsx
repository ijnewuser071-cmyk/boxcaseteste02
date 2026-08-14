import Link from "next/link";
import { Suspense } from "react";
import { RecoveryCallback } from "@/components/auth/RecoveryCallback";

export default function RecoveryPage() {
  return <main className="recovery-page"><Link href="/" className="logo"><span>B</span><strong className="display">BOX</strong></Link><Suspense fallback={<p>Preparando recuperação...</p>}><RecoveryCallback /></Suspense></main>;
}
