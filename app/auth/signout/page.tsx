"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/auth/session", { method: "DELETE", credentials: "include" }).then(() => {
      router.replace("/");
    });
  }, [router]);
  return (
    <main style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui" }}>
      <p>Saindo…</p>
    </main>
  );
}
