"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCase, getReview } from "@/lib/genlayer/contract";
import type { AuthenticityReview, CaseRecord } from "@/lib/types";

const POLL_INTERVAL_MS = 10_000;
const MAX_POLLS = 90; // 15 minutes

interface PollResult {
  caseData: CaseRecord | null;
  review: AuthenticityReview | null;
  polling: boolean;
  pollCount: number;
  startPolling: (caseId: string) => void;
  stopPolling: () => void;
  refresh: (caseId: string) => void;
}

export function usePollCase(initialCaseId?: string): PollResult {
  const [caseData, setCaseData] = useState<CaseRecord | null>(null);
  const [review, setReview] = useState<AuthenticityReview | null>(null);
  const [polling, setPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const caseIdRef = useRef<string | null>(initialCaseId ?? null);
  const countRef = useRef(0);

  const fetchOnce = useCallback(async (caseId: string) => {
    try {
      const [c, r] = await Promise.all([getCase(caseId), getReview(caseId)]);
      setCaseData(c);
      setReview(r);
      return c;
    } catch {
      return null;
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPolling(false);
  }, []);

  const startPolling = useCallback(
    (caseId: string) => {
      caseIdRef.current = caseId;
      countRef.current = 0;
      setPolling(true);
      setPollCount(0);

      fetchOnce(caseId);

      timerRef.current = setInterval(async () => {
        countRef.current += 1;
        setPollCount(countRef.current);

        const c = await fetchOnce(caseId);

        const done =
          c?.status === "REVIEWED" ||
          c?.status === "FINALIZED" ||
          countRef.current >= MAX_POLLS;

        if (done) stopPolling();
      }, POLL_INTERVAL_MS);
    },
    [fetchOnce, stopPolling]
  );

  const refresh = useCallback(
    (caseId: string) => {
      fetchOnce(caseId);
    },
    [fetchOnce]
  );

  // Initial load
  useEffect(() => {
    if (initialCaseId) fetchOnce(initialCaseId);
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { caseData, review, polling, pollCount, startPolling, stopPolling, refresh };
}
