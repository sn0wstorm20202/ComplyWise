"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/auth/signin?mode=register");
  }, [router]);
  return <div className="min-h-screen bg-[#08080a]" />;
}
