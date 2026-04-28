import { Clock3, MoonStar, SunMedium } from "lucide-react";
import type { ShiftCardItem } from "@/types/chat";

type ShiftMiniCardProps = {
  shift: ShiftCardItem;
};

export default function ShiftMiniCard({ shift }: ShiftMiniCardProps) {
  const isNight = shift.shiftLabel.toLocaleLowerCase("tr-TR").includes("gece");
  const initials = shift.staffName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2);

  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-slate-100 bg-white p-3.5 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[14px] font-bold text-blue-600">
        {initials}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h4 className="truncate text-[13px] font-semibold text-slate-800">{shift.staffName}</h4>
            <p className="truncate text-[11px] text-slate-500">{shift.shiftLabel}</p>
          </div>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
            {isNight ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
          </div>
        </div>

        <div className="mt-2 flex w-fit items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          <Clock3 className="h-3 w-3" />
          {shift.start} - {shift.end}
        </div>
      </div>
    </div>
  );
}
