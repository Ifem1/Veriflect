"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { StampButton } from "@/components/StampButton";
import { TxStatus } from "@/components/TxStatus";
import { signalProfileSchema, contextSchema } from "@/lib/genlayer/validate";
import { FN } from "@/lib/genlayer/contract";
import { useVeriflectTx } from "@/hooks/useVeriflectTx";

type SForm = z.infer<typeof signalProfileSchema>;
type CForm = z.infer<typeof contextSchema>;

export default function ContextPage() {
  return <AuthGuard><ContextInner /></AuthGuard>;
}

function ContextInner() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  const sigTx = useVeriflectTx();
  const ctxTx = useVeriflectTx();

  const sigForm = useForm<SForm>({ resolver: zodResolver(signalProfileSchema) });
  const ctxForm = useForm<CForm>({ resolver: zodResolver(contextSchema) });

  const onSignals = async (vals: SForm) => {
    await sigTx.send(FN.ADD_SIGNAL_PROFILE, [caseId, JSON.stringify(vals)]);
  };

  const onContext = async (vals: CForm) => {
    const hash = await ctxTx.send(FN.ADD_CONTEXT, [caseId, JSON.stringify(vals)]);
    if (hash) setTimeout(() => router.push(`/cases/${caseId}`), 600);
  };

  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <h1 className="font-heading text-4xl">Signals + Context</h1>
        <p className="text-xs font-mono opacity-70 mt-1">case · {caseId}</p>
        <p className="text-sm mt-2 opacity-80">Pattern signals are not the verdict — they give GenLayer the signal layer to interpret.</p>
      </header>

      {/* Signal profile */}
      <form onSubmit={sigForm.handleSubmit(onSignals)} className="border-2 border-ink-cocoa bg-white p-6 space-y-4">
        <div className="font-heading text-xl">Signal profile</div>
        <Field label="Review timing pattern" error={sigForm.formState.errors.review_timing_pattern?.message}>
          <textarea className={inputCls} {...sigForm.register("review_timing_pattern")} placeholder="e.g. 80% of reviews arrived within 72h of product launch" />
        </Field>
        <Field label="Rating anomaly" error={sigForm.formState.errors.rating_anomaly?.message}>
          <textarea className={inputCls} {...sigForm.register("rating_anomaly")} placeholder="e.g. 95% five-star ratings, no mid-range scores" />
        </Field>
        <Field label="Repeated wording pattern" error={sigForm.formState.errors.repeated_wording_pattern?.message}>
          <textarea className={inputCls} {...sigForm.register("repeated_wording_pattern")} placeholder="e.g. 7 reviews share the phrase 'outstanding quality and fast delivery'" />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Reviewer account age summary">
            <input className={inputCls} {...sigForm.register("reviewer_account_age_summary")} placeholder="e.g. 4 of 6 accounts under 30 days" />
          </Field>
          <Field label="Purchase verification summary">
            <input className={inputCls} {...sigForm.register("purchase_verification_summary")} placeholder="e.g. 2 of 6 marked verified" />
          </Field>
          <Field label="Seller history summary">
            <input className={inputCls} {...sigForm.register("seller_history_summary")} />
          </Field>
          <Field label="Cluster similarity summary">
            <input className={inputCls} {...sigForm.register("cluster_similarity_summary")} />
          </Field>
          <Field label="External marketplace signal summary">
            <input className={inputCls} {...sigForm.register("external_signal_summary")} />
          </Field>
          <Field label="Evidence confidence" error={sigForm.formState.errors.evidence_confidence?.message}>
            <input className={inputCls} {...sigForm.register("evidence_confidence")} placeholder="e.g. MODERATE — verified purchase ratio low" />
          </Field>
        </div>
        <TxStatus state={sigTx.txState} label={sigTx.label} hash={sigTx.txHash} error={sigTx.txError} />
        <StampButton type="submit" variant="secondary" disabled={sigTx.txState === "submitting" || sigTx.txState === "preparing"}>
          Save signal profile
        </StampButton>
      </form>

      {/* Context */}
      <form onSubmit={ctxForm.handleSubmit(onContext)} className="border-2 border-ink-cocoa bg-context-sand p-6 space-y-4">
        <div className="font-heading text-xl">Seller / reviewer context</div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Seller explanation">
            <textarea className={inputCls} {...ctxForm.register("seller_explanation")} />
          </Field>
          <Field label="Reviewer explanation">
            <textarea className={inputCls} {...ctxForm.register("reviewer_explanation")} />
          </Field>
          <Field label="Purchase proof summary">
            <input className={inputCls} {...ctxForm.register("purchase_proof_summary")} />
          </Field>
          <Field label="Promotion / incentive disclosure">
            <input className={inputCls} {...ctxForm.register("promotion_disclosure")} />
          </Field>
          <Field label="Marketplace policy context">
            <input className={inputCls} {...ctxForm.register("marketplace_policy_context")} />
          </Field>
          <Field label="Related dispute history">
            <input className={inputCls} {...ctxForm.register("related_dispute_history")} />
          </Field>
        </div>
        <Field label="Correction / removal request">
          <input className={inputCls} {...ctxForm.register("correction_request")} />
        </Field>
        <TxStatus state={ctxTx.txState} label={ctxTx.label} hash={ctxTx.txHash} error={ctxTx.txError} />
        <StampButton type="submit" variant="primary" disabled={ctxTx.txState === "submitting" || ctxTx.txState === "preparing"}>
          Submit context
        </StampButton>
      </form>
    </div>
  );
}

const inputCls = "w-full border border-ink-cocoa bg-bazaar-cream px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-trust-turquoise";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase text-pattern-indigo">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="text-xs text-suspicion-berry">{error}</span>}
    </label>
  );
}
