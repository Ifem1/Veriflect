"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { StampButton } from "@/components/StampButton";
import { TxStatus } from "@/components/TxStatus";
import { appealSchema, APPEAL_REASONS } from "@/lib/genlayer/validate";
import { FN } from "@/lib/genlayer/contract";
import { useVeriflectTx } from "@/hooks/useVeriflectTx";

type AForm = z.infer<typeof appealSchema>;

export default function AppealPage() {
  return <AuthGuard><AppealInner /></AuthGuard>;
}

function AppealInner() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  const { send, txState, txHash, txError, label } = useVeriflectTx();

  const { register, handleSubmit, formState: { errors } } = useForm<AForm>({
    resolver: zodResolver(appealSchema),
    defaultValues: { appeal_reason: "GENUINE_PURCHASE" },
  });

  const onSubmit = async (vals: AForm) => {
    const id = `appeal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const hash = await send(FN.OPEN_APPEAL, [id, caseId, JSON.stringify(vals)]);
    if (hash) setTimeout(() => router.push(`/cases/${caseId}`), 600);
  };

  const busy = txState === "preparing" || txState === "submitting";

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-4xl">Open Review Appeal</h1>
      <p className="font-mono text-xs opacity-70 mt-1">case · {caseId}</p>
      <p className="text-sm mt-2 opacity-80">Appeals must include new evidence. GenLayer validators will reconsider the verdict.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 border-2 border-suspicion-berry bg-white p-6 space-y-4">
        <label className="block">
          <span className="text-xs font-mono uppercase text-suspicion-berry">Appeal reason</span>
          <select className={inputCls} {...register("appeal_reason")}>
            {APPEAL_REASONS.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-mono uppercase text-suspicion-berry">New evidence summary</span>
          <textarea className={`${inputCls} min-h-[100px]`} {...register("new_evidence_summary")} />
          {errors.new_evidence_summary && <span className="text-xs text-suspicion-berry">{errors.new_evidence_summary.message}</span>}
        </label>
        <label className="block">
          <span className="text-xs font-mono uppercase text-suspicion-berry">New document refs (hashes / CIDs)</span>
          <input className={inputCls} {...register("new_document_refs")} placeholder="0x... bafy..." />
        </label>
        <label className="block">
          <span className="text-xs font-mono uppercase text-suspicion-berry">Explanation</span>
          <textarea className={`${inputCls} min-h-[120px]`} {...register("explanation")} />
          {errors.explanation && <span className="text-xs text-suspicion-berry">{errors.explanation.message}</span>}
        </label>
        <TxStatus state={txState} label={label} hash={txHash} error={txError} />
        <StampButton type="submit" variant="appeal" disabled={busy}>
          {busy ? label : "Open appeal"}
        </StampButton>
      </form>
    </div>
  );
}

const inputCls = "mt-1 w-full border border-ink-cocoa bg-bazaar-cream px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-suspicion-berry";
