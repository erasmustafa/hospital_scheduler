import type { Department } from "@/types/department";

type DepartmentBadgeListProps = {
  departments: Department[];
  activeDepartmentId: string | null;
  onSelectDepartment: (id: string | null) => void;
};

export default function DepartmentBadgeList({
  departments,
  activeDepartmentId,
  onSelectDepartment,
}: DepartmentBadgeListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelectDepartment(null)}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          !activeDepartmentId
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
        }`}
      >
        Tümü
      </button>
      {departments.map((department) => {
        const active = department.id === activeDepartmentId;
        return (
          <button
            key={department.id}
            type="button"
            onClick={() => onSelectDepartment(active ? null : department.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? `${department.color} border-current`
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {department.name}
            <span className="ml-2 rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-bold">
              {department.onlineCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
