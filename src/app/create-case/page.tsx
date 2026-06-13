"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { StampButton } from "@/components/StampButton";
import { TxStatus } from "@/components/TxStatus";
import { createCaseSchema } from "@/lib/genlayer/validate";
import { FN } from "@/lib/genlayer/contract";
import { useVeriflectTx } from "@/hooks/useVeriflectTx";
import { useVeriflect } from "@/lib/store";
import { saveDraft, loadDraft, clearDraft } from "@/lib/idb";

type FormVals = z.infer<typeof createCaseSchema>;
const DRAFT_KEY = "create-case-draft";

export default function CreateCasePage() {
  return (
    <AuthGuard>
      <CreateCaseInner />
    </AuthGuard>
  );
}

function CreateCaseInner() {
  const router = useRouter();
  const addKnown = useVeriflect((s) => s.addKnownCase);
  const { send, txState, txHash, txError, label, reset } = useVeriflectTx();

  const { register, handleSubmit, watch, reset: resetForm, formState: { errors } } = useForm<FormVals>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: { rating: 5 },
  });

  useEffect(() => {
    loadDraft<FormVals>(DRAFT_KEY).then((draft) => { if (draft) resetForm(draft); });
  }, [resetForm]);

  useEffect(() => {
    const sub = watch((vals) => { saveDraft(DRAFT_KEY, vals); });
    return () => sub.unsubscribe();
  }, [watch]);

  const onSubmit = async (vals: FormVals) => {
    const caseId = `case_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const hash = await send(FN.CREATE_CASE, [caseId, JSON.stringify(vals)]);
    if (hash) {
      addKnown(caseId);
      await clearDraft(DRAFT_KEY);
      setTimeout(() => router.push(`/cases/${caseId}`), 600);
    }
  };

  const busy = txState === "preparing" || txState === "submitting";

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-4xl">Open Authenticity Case</h1>
      <p className="text-sm opacity-80 mt-1">Submit a review or review cluster for GenLayer authenticity judgement.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5 border-2 border-ink-cocoa bg-white p-6">

        <section>
          <div className="font-heading text-lg border-b border-ink-cocoa/20 pb-2 mb-4">Product + seller</div>
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Product title" error={errors.product_title?.message}>
              <input className={inputCls} {...register("product_title")} placeholder="Acme Widget Pro" />
            </Field>
            <Field label="Seller identifier" error={errors.seller_identifier?.message}>
              <input className={inputCls} {...register("seller_identifier")} placeholder="seller_xyz or Acme Corp" />
            </Field>
          </div>
          <Field label="Product URL or marketplace reference" error={errors.product_url?.message}>
            <input className={inputCls} {...register("product_url")} placeholder="https://… or marketplace ref" />
          </Field>
        </section>

        <section>
          <div className="font-heading text-lg border-b border-ink-cocoa/20 pb-2 mb-4">Review details</div>
          <Field label="Review text (or leave blank and use reference below)" error={errors.review_text?.message}>
            <textarea className={`${inputCls} min-h-[100px]`} {...register("review_text")} />
          </Field>
          <Field label="Review reference (ID, hash, URL)" error={errors.review_reference?.message}>
            <input className={inputCls} {...register("review_reference")} placeholder="rev_12345 or 0x…" />
          </Field>
          <div className="grid md:grid-cols-2 gap-5 mt-4">
            <Field label="Rating (0–5)" error={errors.rating?.message}>
              <input type="number" step="0.5" min={0} max={5} className={inputCls} {...register("rating")} />
            </Field>
            <Field label="Review date" error={errors.review_date?.message}>
              <input type="date" className={inputCls} {...register("review_date")} />
            </Field>
          </div>
        </section>

        <section>
          <div className="font-heading text-lg border-b border-ink-cocoa/20 pb-2 mb-4">Context + suspicion</div>
          <Field label="Reason for suspicion" error={errors.reason_for_suspicion?.message}>
            <textarea className={`${inputCls} min-h-[80px]`} {...register("reason_for_suspicion")} placeholder="Why does this review or cluster look suspicious?" />
          </Field>
          <Field label="Reviewer profile summary (optional)">
            <input className={inputCls} {...register("reviewer_profile_summary")} placeholder="Account age, review history summary…" />
          </Field>
          <Field label="Purchase evidence summary (optional)">
            <input className={inputCls} {...register("purchase_evidence_summary")} placeholder="Verified purchase status, order reference…" />
          </Field>
          <Field label="Evidence refs (hashes, CIDs, optional)">
            <input className={inputCls} {...register("evidence_refs")} placeholder="0x… bafy…" />
          </Field>
          <Field label="Redaction note (optional)">
            <input className={inputCls} {...register("redaction_note")} placeholder="What has been redacted for privacy?" />
          </Field>
        </section>

        <TxStatus state={txState} label={label} hash={txHash} error={txError} />

        <div className="flex gap-3">
          <StampButton type="submit" variant="primary" disabled={busy}>
            {busy ? label : "◆ Open Authenticity Case"}
          </StampButton>
          {txState === "failed" && (
            <StampButton type="button" variant="secondary" onClick={reset}>Reset</StampButton>
          )}
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full border border-ink-cocoa bg-bazaar-cream px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-trust-turquoise";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block mt-3">
      <span className="text-xs font-mono uppercase text-pattern-indigo">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="text-xs text-suspicion-berry">{error}</span>}
    </label>
  );
}
