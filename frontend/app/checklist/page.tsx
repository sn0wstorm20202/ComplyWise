"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChecklistPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/documents");
  }, [router]);
  return <div className="min-h-screen bg-[#F8FAFC]" />;
}
