import { Ambulance, Baby, Hash, Microscope, Stethoscope } from "lucide-react";

type Department = {
  id: string;
  name: string;
  color: string;
  onlineCount: number;
};

type DepartmentBadgeListProps = {
  departments: Department[];
  activeDepartmentId: string | null;
  onSelectDepartment: (id: string | null) => void;
};

function toneFromColor(color: string) {
  if (color.includes("rose")) return "bg-rose-500 text-white";
  if (color.includes("violet")) return "bg-violet-500 text-white";
  if (color.includes("sky")) return "bg-sky-500 text-white";
  if (color.includes("emerald")) return "bg-emerald-500 text-white";
  return "bg-blue-500 text-white";
}

function departmentIcon(id: string) {
  if (id === "er") return <Ambulance className="h-3.5 w-3.5" />;
  if (id === "icu") return <Stethoscope className="h-3.5 w-3.5" />;
  if (id === "clinic") return <Baby className="h-3.5 w-3.5" />;
  if (id === "surgery") return <Microscope className="h-3.5 w-3.5" />;
  return <Hash className="h-3.5 w-3.5" />;
}

export default function DepartmentBadgeList({
  departments,
  activeDepartmentId,
  onSelectDepartment,
}: DepartmentBadgeListProps) {
  const totalOnline = departments.reduce((sum, item) => sum + item.onlineCount, 0);

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => onSelectDepartment(null)}
        className={`flex w-full items-center justify-between rounded-[13px] border px-3 py-2 text-left transition duration-200 active:scale-[0.985] ${
          !activeDepartmentId
            ? "border-blue-100 bg-blue-50 text-slate-900"
            : "border-transparent bg-white text-slate-700 hover:border-blue-100 hover:bg-blue-50/70"
        }`}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Hash className="h-4 w-4" />
          </span>
          <span className="text-[13px] font-semibold">Tüm Birimler</span>
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
          {totalOnline}
        </span>
      </button>

      {departments.map((department) => {
        const active = department.id === activeDepartmentId;

        return (
          <button
            key={department.id}
            type="button"
            onClick={() => onSelectDepartment(active ? null : department.id)}
            className={`flex w-full items-center justify-between rounded-[13px] border px-3 py-2 text-left transition duration-200 active:scale-[0.985] ${
              active
                ? "border-blue-100 bg-blue-50 text-slate-900"
                : "border-transparent bg-white text-slate-700 hover:border-blue-100 hover:bg-blue-50/70"
            }`}
          >
            <span className="flex items-center gap-3">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${toneFromColor(department.color)}`}>
                {departmentIcon(department.id)}
              </span>
              <span className="text-[13px] font-semibold">{department.name}</span>
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
              {department.onlineCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
