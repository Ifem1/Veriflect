"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OpenCaseRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/create-case"); }, [router]);
  return null;
}
