import { Activity, ArrowUpRight, CheckCircle2, Info } from "lucide-react";
import type { ActivityItem } from "@/types/chat";
import { formatRelativeShort } from "@/components/chat/utils/messageFormatters";

type ActivityFeedCardProps = {
  item: ActivityItem;
};

const toneIcon = {
  info: <Info className="h-4 w-4 text-blue-600" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  warning: <Activity className="h-4 w-4 text-amber-600" />,
};

export default function ActivityFeedCard({ item }: ActivityFeedCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-slate-50 p-2">
          {toneIcon[item.tone ?? "info"]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" />
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {formatRelativeShort(item.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
