import { CheckCheck, Pin } from "lucide-react";
import type { PinnedDecision } from "@/types/chat";
import { formatRelativeShort } from "@/components/chat/utils/messageFormatters";

type DecisionCardProps = {
  decision: PinnedDecision;
};

export default function DecisionCard({ decision }: DecisionCardProps) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{decision.title}</p>
          <p className="mt-2 text-xs leading-5 text-slate-600">{decision.summary}</p>
        </div>
        <Pin className="h-4 w-4 shrink-0 text-blue-600" />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
          {decision.ownerName}
        </span>
        <span>{formatRelativeShort(decision.createdAt)}</span>
      </div>
    </div>
  );
}
