"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { StampButton } from "@/components/StampButton";
import { TxStatus } from "@/components/TxStatus";
import { evidenceSchema, EVIDENCE_TYPES } from "@/lib/genlayer/validate";
import { FN } from "@/lib/genlayer/contract";
import { useVeriflectTx } from "@/hooks/useVeriflectTx";

type EForm = z.infer<typeof evidenceSchema>;

export default function EvidencePage() {
  return <AuthGuard><EvidenceInner /></AuthGuard>;
}

function EvidenceInner() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  const { send, txState, txHash, txError, label } = useVeriflectTx();

  const { register, handleSubmit, formState: { errors } } = useForm<EForm>({
    resolver: zodResolver(evidenceSchema),
    defaultValues: { evidence_type: "VERIFIED_PURCHASE_PROOF" },
  });

  const onSubmit = async (vals: EForm) => {
    const id = `ev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const hash = await send(FN.ADD_EVIDENCE, [id, caseId, JSON.stringify(vals)]);
    if (hash) setTimeout(() => router.push(`/cases/${caseId}`), 600);
  };

  const busy = txState === "preparing" || txState === "submitting";

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-4xl">Add Signal Evidence</h1>
      <p className="font-mono text-xs opacity-70 mt-1">case · {caseId}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 border-2 border-ink-cocoa bg-white p-6 space-y-4">
        <label className="block">
          <span className="text-xs font-mono uppercase text-pattern-indigo">Evidence type</span>
          <select className={inputCls} {...register("evidence_type")}>
            {EVIDENCE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-mono uppercase text-pattern-indigo">Description</span>
          <textarea className={`${inputCls} min-h-[100px]`} {...register("description")} />
          {errors.description && <span className="text-xs text-suspicion-berry">{errors.description.message}</span>}
        </label>
        <label className="block">
          <span className="text-xs font-mono uppercase text-pattern-indigo">Hash or CID</span>
          <input className={inputCls} {...register("hash_or_cid")} placeholder="0x... or bafy..." />
        </label>
        <label className="block">
          <span className="text-xs font-mono uppercase text-pattern-indigo">Private link (optional)</span>
          <input className={inputCls} {...register("link")} placeholder="https://..." />
        </label>
        <TxStatus state={txState} label={label} hash={txHash} error={txError} />
        <StampButton type="submit" variant="evidence" disabled={busy}>
          {busy ? label : "Add evidence"}
        </StampButton>
      </form>
    </div>
  );
}

const inputCls = "mt-1 w-full border border-ink-cocoa bg-bazaar-cream px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-trust-turquoise";
