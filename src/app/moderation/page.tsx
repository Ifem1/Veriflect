"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ModerationRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/moderator"); }, [router]);
  return null;
}
