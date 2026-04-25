import { Clock3, MoonStar, SunMedium } from "lucide-react";
import type { ShiftCardItem } from "@/types/chat";

type ShiftMiniCardProps = {
  shift: ShiftCardItem;
};

export default function ShiftMiniCard({ shift }: ShiftMiniCardProps) {
  const isNight = shift.shiftLabel.toLocaleLowerCase("tr-TR").includes("gece");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{shift.staffName}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{shift.shiftLabel}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
          {isNight ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
        </div>
      </div>
      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        <Clock3 className="h-3.5 w-3.5" />
        {shift.start} - {shift.end}
      </div>
    </div>
  );
}
