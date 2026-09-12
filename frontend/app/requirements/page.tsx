"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RequirementsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/compliance");
  }, [router]);
  return <div className="min-h-screen bg-[#F8FAFC]" />;
}
