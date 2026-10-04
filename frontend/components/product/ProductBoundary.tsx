"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Keep application tokens isolated from the established marketing experience. */
export default function ProductBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return pathname === "/" ? children : <div className="cw-product">{children}</div>;
}
