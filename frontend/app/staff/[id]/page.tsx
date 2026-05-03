"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  Mail,
  MoonStar,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import StaffPreferenceCalendar, {
  StaffPreferenceSelectionPanel,
  type StaffShiftPreference,
  type StaffShiftType,
} from "@/components/staff/staff-preference-calendar";

type StaffDetail = {
  id: number;
  fullName: string;
  photoUrl?: string | null;
  departmentName: string | null;
  employeeNo: string | null;
  title: string;
  profession: string;
  role: string;
  employmentType: string;
  weeklyLimitHours: number;
  phone: string;
  phoneInternal: string;
  email: string;
  gender: "female" | "male" | "other" | "unspecified";
  cannotTakeNightShifts: boolean;
  isNewMother: boolean;
  isActive: boolean;
  canManageDepartment: boolean;
};

type AvailabilityResponse = {
  availability: StaffShiftPreference[];
};

type ShiftTypeResponse = {
  shiftTypes: StaffShiftType[];
};

function getDefaultAvatarSrc(gender: StaffDetail["gender"]) {
  if (gender === "female") {
    return "/images/staff-avatar-female.svg";
  }
  return "/images/staff-avatar-male.svg";
}

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const toIso = (value: Date) => {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  return {
    date_from: toIso(start),
    date_to: toIso(end),
  };
}

export default function StaffDetailPage() {
  const params = useParams<{ id: string }>();
  const staffId = Number(params?.id);
  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [shiftTypes, setShiftTypes] = useState<StaffShiftType[]>([]);
  const [preferences, setPreferences] = useState<StaffShiftPreference[]>([]);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingShiftIds, setSavingShiftIds] = useState<number[]>([]);
  const [profileForm, setProfileForm] = useState({
    gender: "unspecified" as StaffDetail["gender"],
    cannotTakeNightShifts: false,
    isNewMother: false,
    isActive: false,
  });

  const loadAvailability = useCallback(
    async (targetMonth: Date) => {
      if (!staffId) {
        return;
      }
      const { date_from, date_to } = getMonthRange(targetMonth);
      const response = await apiClient.get<AvailabilityResponse>(
        `/availability/?staffProfileId=${staffId}&date_from=${date_from}&date_to=${date_to}`
      );
      setPreferences(response.availability ?? []);
    },
    [staffId]
  );

  const loadPage = useCallback(async () => {
    if (!staffId) {
      setError("Gecersiz personel kaydi.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const initialMonth = new Date();
      const [staffResponse, shiftTypeResponse] = await Promise.all([
        apiClient.get<StaffDetail>(`/staff/${staffId}/`),
        apiClient.get<ShiftTypeResponse>("/shift-types/"),
      ]);

      setStaff(staffResponse);
      setProfileForm({
        gender: staffResponse.gender,
        cannotTakeNightShifts: staffResponse.cannotTakeNightShifts,
        isNewMother: staffResponse.isNewMother,
        isActive: staffResponse.isActive,
      });
      setShiftTypes(shiftTypeResponse.shiftTypes ?? []);
      await loadAvailability(initialMonth);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Personel profili yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [loadAvailability, staffId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (loading || !staffId) {
      return;
    }
    void loadAvailability(monthDate);
  }, [loadAvailability, loading, monthDate, staffId]);

  const selectedPreferences = useMemo(
    () => preferences.filter((item) => item.date === selectedDate),
    [preferences, selectedDate]
  );

  const workingModelLabel = useMemo(() => {
    if (profileForm.isNewMother && profileForm.gender === "female") {
      return "08:00-12:00 yeni anne modeli";
    }
    if (profileForm.cannotTakeNightShifts) {
      return "Gece veya nöbet dışı planlama";
    }
    return "Standart vardiya modeli";
  }, [profileForm]);

  const saveProfileSettings = useCallback(async () => {
    if (!staff) {
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        gender: profileForm.gender,
        cannotTakeNightShifts: profileForm.cannotTakeNightShifts || profileForm.isNewMother,
        isNewMother: profileForm.gender === "female" ? profileForm.isNewMother : false,
        isActive: profileForm.isActive,
      };
      const response = await apiClient.patch<StaffDetail>(`/staff/${staff.id}/`, payload);
      setStaff(response);
      setProfileForm({
        gender: response.gender,
        cannotTakeNightShifts: response.cannotTakeNightShifts,
        isNewMother: response.isNewMother,
        isActive: response.isActive,
      });
      setBanner("Personel çalışma kuralları güncellendi.");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profil ayarları güncellenemedi.");
    } finally {
      setSavingProfile(false);
    }
  }, [profileForm, staff]);

  const handleToggleShift = useCallback(
    async (shiftType: StaffShiftType) => {
      if (!selectedDate || !staff) {
        return;
      }

      const existing = selectedPreferences.find((item) => item.shiftTypeId === shiftType.id);
      setSavingShiftIds((current) => [...current, shiftType.id]);

      try {
        if (existing) {
          await apiClient.delete(`/availability/${existing.id}/`);
          setPreferences((current) => current.filter((item) => item.id !== existing.id));
          setBanner(`${shiftType.name} tercihi kaldırıldı.`);
        } else {
          const created = await apiClient.post<StaffShiftPreference>("/availability/", {
            staffProfileId: staff.id,
            shiftTypeId: shiftType.id,
            date: selectedDate,
            status: "unavailable",
            reason: "Personel profilinden çalışmak istemediği mesai olarak işaretlendi.",
          });
          setPreferences((current) => [created, ...current]);
          setBanner(`${shiftType.name} mesaisi tercih dışı olarak işaretlendi.`);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Mesai tercihi güncellenemedi.");
      } finally {
        setSavingShiftIds((current) => current.filter((value) => value !== shiftType.id));
      }
    },
    [selectedDate, selectedPreferences, staff]
  );

  if (loading) {
    return (
      <main className="flex h-full items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
        Personel profili hazırlanıyor...
      </main>
    );
  }

  if (error && !staff) {
    return (
      <main className="flex h-full items-center justify-center bg-slate-50 px-6">
        <div className="rounded-3xl border border-rose-100 bg-white px-8 py-7 text-center shadow-sm">
          <p className="text-base font-bold text-rose-600">{error}</p>
          <Link
            href="/staff"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Personel listesine dön
          </Link>
        </div>
      </main>
    );
  }

  if (!staff) {
    return null;
  }

  return (
    <main className="h-full overflow-hidden bg-[radial-gradient(circle_at_top,#eff5ff,transparent_42%),linear-gradient(180deg,#f8fbff_0%,#f1f5f9_100%)] px-7 py-6">
      <div className="flex h-full min-h-0 w-full flex-col gap-4">
        {banner ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            {banner}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
            {error}
          </div>
        ) : null}

        <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_336px] xl:items-stretch">
          <aside className="flex h-full min-h-0 flex-col overflow-auto rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-[0_30px_90px_-54px_rgba(37,99,235,0.35)]">
            <div className="rounded-[28px] bg-[linear-gradient(180deg,#eef4ff_0%,#ffffff_100%)] px-5 pb-6 pt-7 text-center">
              <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-[0_18px_38px_-22px_rgba(37,99,235,0.38)]">
                <img
                  src={staff.photoUrl || getDefaultAvatarSrc(staff.gender)}
                  alt={staff.fullName}
                  className="h-full w-full object-cover"
                />
              </div>
              <h2 className="mt-5 text-[32px] font-black tracking-[-0.04em] text-slate-900">
                {staff.fullName}
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {staff.departmentName ?? "Birim atanamadi"} · {staff.title || staff.profession || "Personel"}
              </p>
              <div className="mt-5 flex justify-center">
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-100/90 p-1 shadow-[0_14px_34px_-26px_rgba(15,23,42,0.35)]">
                  <button
                    type="button"
                    onClick={() =>
                      setProfileForm((current) => ({
                        ...current,
                        isActive: true,
                      }))
                    }
                    className={[
                      "rounded-full px-4 py-2 text-sm font-bold transition",
                      profileForm.isActive
                        ? "bg-[#edfdf5] text-emerald-700 shadow-[0_12px_26px_-18px_rgba(16,185,129,0.28)]"
                        : "text-slate-500 hover:text-emerald-700",
                    ].join(" ")}
                  >
                    Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setProfileForm((current) => ({
                        ...current,
                        isActive: false,
                      }))
                    }
                    className={[
                      "rounded-full px-4 py-2 text-sm font-bold transition",
                      !profileForm.isActive
                        ? "bg-[#fff1f3] text-rose-700 shadow-[0_12px_26px_-18px_rgba(244,63,94,0.24)]"
                        : "text-slate-500 hover:text-rose-700",
                    ].join(" ")}
                  >
                    Pasif
                  </button>
                </div>
              </div>
              </div>

            <div className="mt-6 space-y-4 rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <BadgeCheck className="h-4 w-4 text-blue-600" />
                Sicil No: <span className="font-bold text-slate-900">{staff.employeeNo ?? staff.id}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <Phone className="h-4 w-4 text-blue-600" />
                Telefon: <span className="font-bold text-slate-900">{staff.phone || "Belirtilmedi"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <Mail className="h-4 w-4 text-blue-600" />
                E-posta: <span className="font-bold text-slate-900 break-all">{staff.email || "Belirtilmedi"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <BriefcaseBusiness className="h-4 w-4 text-blue-600" />
                Meslek: <span className="font-bold text-slate-900">{staff.profession || "Belirtilmedi"}</span>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                <span className="inline-flex shrink-0 items-center gap-2">
                  <img src="/icons/venus-and-mars.svg" alt="" className="h-4 w-4 object-contain" />
                  Cinsiyet:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setProfileForm((current) => ({
                        ...current,
                        gender: "female",
                      }))
                    }
                    className={[
                      "inline-flex items-center justify-center rounded-2xl border p-2.5 transition",
                      profileForm.gender === "female"
                        ? "border-pink-200 bg-pink-50 shadow-[0_12px_24px_-20px_rgba(236,72,153,0.45)]"
                        : "border-slate-200 bg-white hover:border-pink-200 hover:bg-pink-50/70",
                    ].join(" ")}
                    aria-label="Kad�n"
                    title="Kad�n"
                  >
                    <img src="/icons/venus.svg" alt="" className="h-5 w-5 object-contain" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setProfileForm((current) => ({
                        ...current,
                        gender: "male",
                        isNewMother: false,
                      }))
                    }
                    className={[
                      "inline-flex items-center justify-center rounded-2xl border p-2.5 transition",
                      profileForm.gender === "male"
                        ? "border-blue-200 bg-blue-50 shadow-[0_12px_24px_-20px_rgba(37,99,235,0.42)]"
                        : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/70",
                    ].join(" ")}
                    aria-label="Erkek"
                    title="Erkek"
                  >
                    <img src="/icons/mars.svg" alt="" className="h-5 w-5 object-contain" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setProfileForm((current) => ({
                      ...current,
                      cannotTakeNightShifts: !current.cannotTakeNightShifts,
                    }))
                  }
                  className={[
                    "group relative flex min-h-[140px] w-full flex-col items-center justify-center overflow-hidden rounded-[26px] border px-4 py-4 text-center transition",
                    profileForm.cannotTakeNightShifts
                      ? "border-blue-200 bg-[linear-gradient(135deg,rgba(59,91,219,0.1),rgba(74,108,247,0.08))] shadow-[0_20px_46px_-34px_rgba(37,99,235,0.4)]"
                      : "border-slate-200 bg-white/80 hover:border-blue-200 hover:bg-blue-50/40",
                  ].join(" ")}
                >
                  <div className="mb-4 flex w-full items-start justify-center gap-3">
                    <span
                      className={[
                        "mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border text-[12px] font-black transition",
                        profileForm.cannotTakeNightShifts
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-slate-300 bg-white text-transparent",
                      ].join(" ")}
                    >
                      ✓
                    </span>
                  </div>
                  <div className="pr-0">
                    <p className="text-sm font-bold text-slate-900">Nöbet tutamaz</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                      24 saat çalışamaz
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={profileForm.gender !== "female"}
                  onClick={() => {
                    if (profileForm.gender !== "female") {
                      return;
                    }
                    setProfileForm((current) => ({
                      ...current,
                      isNewMother: !current.isNewMother,
                      cannotTakeNightShifts: !current.isNewMother ? true : current.cannotTakeNightShifts,
                    }));
                  }}
                  className={[
                    "flex min-h-[140px] w-full flex-col items-center justify-center rounded-[24px] border px-4 py-4 text-center transition",
                    profileForm.gender !== "female"
                      ? "cursor-not-allowed border-slate-200 bg-slate-100/90 opacity-60"
                      : profileForm.isNewMother
                        ? "border-pink-200 bg-pink-50"
                        : "border-slate-200 bg-slate-50 hover:border-pink-200 hover:bg-pink-50/60",
                  ].join(" ")}
                >
                  <div className="mb-4 flex w-full items-start justify-center gap-3">
                    <span
                      className={[
                        "mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border text-[12px] font-black transition",
                        profileForm.isNewMother
                          ? "border-pink-500 bg-pink-500 text-white"
                          : "border-slate-300 bg-white text-transparent",
                      ].join(" ")}
                    >
                      ✓
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Yeni anne</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                      08:00-12:00 arasında çalışır
                    </p>
                  </div>
                </button>
            </div>
            <button
              type="button"
              onClick={saveProfileSettings}
              disabled={savingProfile}
              className="mt-6 w-full rounded-2xl bg-[linear-gradient(135deg,#4A6CF7_0%,#3B5BDB_100%)] px-4 py-3 text-sm font-bold text-white shadow-[0_18px_38px_-24px_rgba(37,99,235,0.52)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile ? "Kaydediliyor..." : "Profil kurallarını kaydet"}
            </button>
          </aside>

          <div className="flex h-full min-h-0 flex-col gap-4">
            <StaffPreferenceCalendar
              monthDate={monthDate}
              selectedDate={selectedDate}
              shiftTypes={shiftTypes}
              preferences={preferences}
              onPrevMonth={() =>
                setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
              }
              onNextMonth={() =>
                setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
              }
              onToday={() => setMonthDate(new Date())}
              onSelectDate={setSelectedDate}
            />
          </div>

          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <article className="rounded-[22px] border border-slate-200 bg-white/95 p-3 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.4)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div className="mt-3 text-[28px] font-black leading-none tracking-[-0.05em] text-slate-900">
                  {staff.weeklyLimitHours}
                </div>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">Haftalık limit saat</p>
              </article>

              <article className="rounded-[22px] border border-slate-200 bg-white/95 p-3 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.4)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                  <MoonStar className="h-4 w-4" />
                </div>
                <div className="mt-3 text-sm font-black tracking-[-0.03em] text-slate-900">
                  {profileForm.cannotTakeNightShifts || profileForm.isNewMother ? "Kisitli" : "Uygun"}
                </div>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">Gece / Nöbet planlaması</p>
              </article>

              <article className="rounded-[22px] border border-slate-200 bg-white/95 p-3 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.4)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="mt-3 text-sm font-black leading-5 tracking-[-0.03em] text-slate-900">
                  {workingModelLabel}
                </div>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">Aktif çalışma modeli</p>
              </article>
            </div>

            <div className="min-h-0 flex-1">
              <StaffPreferenceSelectionPanel
                selectedDate={selectedDate}
                shiftTypes={shiftTypes}
                selectedDatePreferences={selectedPreferences}
                savingShiftIds={savingShiftIds}
                onToggleShift={handleToggleShift}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

