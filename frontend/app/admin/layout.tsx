import { Suspense, type ReactNode } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="p-8" role="status" aria-label="Preparing review workspace"><LoadingSkeleton count={3} /></div>}>{children}</Suspense>;
}
