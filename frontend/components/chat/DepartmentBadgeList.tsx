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
  if (color.includes("rose")) return "bg-rose-500";
  if (color.includes("violet")) return "bg-violet-500";
  if (color.includes("sky")) return "bg-sky-500";
  if (color.includes("emerald")) return "bg-emerald-500";
  return "bg-blue-500";
}

export default function DepartmentBadgeList({
  departments,
  activeDepartmentId,
  onSelectDepartment,
}: DepartmentBadgeListProps) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onSelectDepartment(null)}
        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
          !activeDepartmentId
            ? "border-blue-200 bg-blue-50 text-slate-900"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-50 text-sm font-bold text-blue-700">
            *
          </span>
          <span className="text-sm font-semibold">Tum Birimler</span>
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
          {departments.reduce((sum, item) => sum + item.onlineCount, 0)}
        </span>
      </button>

      {departments.map((department) => {
        const active = department.id === activeDepartmentId;
        return (
          <button
            key={department.id}
            type="button"
            onClick={() => onSelectDepartment(active ? null : department.id)}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
              active
                ? "border-blue-200 bg-blue-50 text-slate-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${toneFromColor(department.color)}`} />
              <span className="text-sm font-semibold">{department.name}</span>
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
              {department.onlineCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
