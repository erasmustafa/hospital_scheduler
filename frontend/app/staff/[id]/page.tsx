"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  Heart,
  Mail,
  MoonStar,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import StaffPreferenceCalendar, {
  type StaffShiftPreference,
  type StaffShiftType,
} from "@/components/staff/staff-preference-calendar";

type StaffDetail = {
  id: number;
  fullName: string;
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

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatEmploymentType(value: string) {
  const map: Record<string, string> = {
    permanent: "Kadrolu",
    contract: "Sözleşmeli",
    intern: "Stajyer",
  };
  return map[value] ?? value;
}

function formatGender(value: StaffDetail["gender"]) {
  const map: Record<StaffDetail["gender"], string> = {
    female: "Kadın",
    male: "Erkek",
    other: "Diğer",
    unspecified: "Belirtilmedi",
  };
  return map[value];
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
  });

  const loadAvailability = useCallback(async (targetMonth: Date) => {
    if (!staffId) {
      return;
    }
    const { date_from, date_to } = getMonthRange(targetMonth);
    const response = await apiClient.get<AvailabilityResponse>(
      `/availability/?staffProfileId=${staffId}&date_from=${date_from}&date_to=${date_to}`
    );
    setPreferences(response.availability ?? []);
  }, [staffId]);

  const loadPage = useCallback(async () => {
    if (!staffId) {
      setError("Geçersiz personel kaydı.");
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
      return "Yeni anne profili: 08:00-12:00 çalışma çerçevesi";
    }
    if (profileForm.cannotTakeNightShifts) {
      return "Gece / nöbet mesaileri hariç planlanmalı";
    }
    return "Standart vardiya çerçevesi";
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
      };
      const response = await apiClient.patch<StaffDetail>(`/staff/${staff.id}/`, payload);
      setStaff(response);
      setProfileForm({
        gender: response.gender,
        cannotTakeNightShifts: response.cannotTakeNightShifts,
        isNewMother: response.isNewMother,
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
    <main className="h-full overflow-auto bg-[radial-gradient(circle_at_top,#eff5ff,transparent_42%),linear-gradient(180deg,#f8fbff_0%,#f1f5f9_100%)] px-7 py-6">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            href="/staff"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">
              Personel Profil
            </p>
            <h1 className="mt-1 text-[28px] font-black tracking-[-0.05em] text-slate-900">
              {staff.fullName}
            </h1>
          </div>
        </div>

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

        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <aside className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-[0_30px_90px_-54px_rgba(37,99,235,0.35)]">
            <div className="rounded-[28px] bg-[linear-gradient(180deg,#eef4ff_0%,#ffffff_100%)] px-5 pb-6 pt-7 text-center">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4A6CF7_0%,#3151d8_100%)] text-3xl font-black text-white shadow-[0_18px_38px_-22px_rgba(37,99,235,0.65)]">
                {getInitials(staff.fullName)}
              </div>
              <h2 className="mt-5 text-[32px] font-black tracking-[-0.04em] text-slate-900">
                {staff.fullName}
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {staff.departmentName ?? "Birim atanmadı"} · {staff.title || staff.profession || "Personel"}
              </p>
              <div className="mt-5 inline-flex rounded-full bg-[linear-gradient(135deg,#4A6CF7_0%,#3B5BDB_100%)] px-5 py-2 text-sm font-bold text-white shadow-[0_18px_38px_-24px_rgba(37,99,235,0.55)]">
                {staff.canManageDepartment ? "Birim yetkilisi" : "Operasyon personeli"}
              </div>
            </div>

            <div className="mt-6 space-y-4 rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <span className="text-sm font-semibold text-slate-600">Personel durumu</span>
                <span
                  className={[
                    "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                    staff.isActive
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-600"
                      : "border border-slate-200 bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  {staff.isActive ? "Aktif personel" : "Pasif personel"}
                </span>
              </div>
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
            </div>
          </aside>

          <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.4)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div className="mt-5 text-4xl font-black tracking-[-0.05em] text-slate-900">
                  {staff.weeklyLimitHours}
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-500">Haftalık limit saat</p>
              </article>

              <article className="rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.4)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                  <MoonStar className="h-5 w-5" />
                </div>
                <div className="mt-5 text-lg font-black tracking-[-0.03em] text-slate-900">
                  {profileForm.cannotTakeNightShifts || profileForm.isNewMother ? "Kısıtlı" : "Uygun"}
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-500">Gece / nöbet planlaması</p>
              </article>

              <article className="rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.4)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="mt-5 text-lg font-black tracking-[-0.03em] text-slate-900">{workingModelLabel}</div>
                <p className="mt-2 text-sm font-semibold text-slate-500">Aktif çalışma modeli</p>
              </article>
            </div>

            <StaffPreferenceCalendar
              monthDate={monthDate}
              selectedDate={selectedDate}
              shiftTypes={shiftTypes}
              preferences={preferences}
              savingShiftIds={savingShiftIds}
              onPrevMonth={() =>
                setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
              }
              onNextMonth={() =>
                setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
              }
              onToday={() => setMonthDate(new Date())}
              onSelectDate={setSelectedDate}
              onToggleShift={handleToggleShift}
            />
          </div>

          <aside className="space-y-6">
            <section className="rounded-[30px] border border-slate-200 bg-white/95 p-6 shadow-[0_28px_80px_-56px_rgba(15,23,42,0.38)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
                    Çalışma Kuralları
                  </p>
                  <h2 className="mt-1 text-[24px] font-black tracking-[-0.04em] text-slate-900">
                    Profil Kısıtları
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    Cinsiyet
                  </span>
                  <select
                    value={profileForm.gender}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        gender: event.target.value as StaffDetail["gender"],
                        isNewMother:
                          event.target.value === "female" ? current.isNewMother : false,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
                  >
                    <option value="unspecified">Belirtilmedi</option>
                    <option value="female">Kadın</option>
                    <option value="male">Erkek</option>
                    <option value="other">Diğer</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setProfileForm((current) => ({
                      ...current,
                      cannotTakeNightShifts: !current.cannotTakeNightShifts,
                    }))
                  }
                  className={[
                    "flex w-full items-center justify-between rounded-[22px] border px-4 py-4 text-left transition",
                    profileForm.cannotTakeNightShifts
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/60",
                  ].join(" ")}
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">Nöbet tutamaz</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                      Gece veya nöbet kategorisindeki mesailerde planlama dışı tutulur.
                    </p>
                  </div>
                  <span
                    className={[
                      "relative flex h-7 w-12 rounded-full transition",
                      profileForm.cannotTakeNightShifts ? "bg-blue-600" : "bg-slate-300",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute top-1 h-5 w-5 rounded-full bg-white transition",
                        profileForm.cannotTakeNightShifts ? "left-6" : "left-1",
                      ].join(" ")}
                    />
                  </span>
                </button>

                {profileForm.gender === "female" ? (
                  <button
                    type="button"
                    onClick={() =>
                      setProfileForm((current) => ({
                        ...current,
                        isNewMother: !current.isNewMother,
                        cannotTakeNightShifts: !current.isNewMother ? true : current.cannotTakeNightShifts,
                      }))
                    }
                    className={[
                      "flex w-full items-center justify-between rounded-[22px] border px-4 py-4 text-left transition",
                      profileForm.isNewMother
                        ? "border-pink-200 bg-pink-50"
                        : "border-slate-200 bg-slate-50 hover:border-pink-200 hover:bg-pink-50/60",
                    ].join(" ")}
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900">Yeni anne</p>
                      <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                        Bu profil 08:00-12:00 arasında günlük çalışma çerçevesiyle işaretlenir.
                      </p>
                    </div>
                    <span
                      className={[
                        "relative flex h-7 w-12 rounded-full transition",
                        profileForm.isNewMother ? "bg-pink-500" : "bg-slate-300",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "absolute top-1 h-5 w-5 rounded-full bg-white transition",
                          profileForm.isNewMother ? "left-6" : "left-1",
                        ].join(" ")}
                      />
                    </span>
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={saveProfileSettings}
                disabled={savingProfile}
                className="mt-6 w-full rounded-2xl bg-[linear-gradient(135deg,#4A6CF7_0%,#3B5BDB_100%)] px-4 py-3 text-sm font-bold text-white shadow-[0_18px_38px_-24px_rgba(37,99,235,0.52)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? "Kaydediliyor..." : "Profil Kurallarını Kaydet"}
              </button>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white/95 p-6 shadow-[0_28px_80px_-56px_rgba(15,23,42,0.38)]">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Özet
              </p>
              <h2 className="mt-2 text-[24px] font-black tracking-[-0.04em] text-slate-900">
                Profil Detayları
              </h2>

              <div className="mt-5 space-y-3">
                {[
                  ["Birim", staff.departmentName ?? "Tanımsız"],
                  ["Unvan", staff.title || "Belirtilmedi"],
                  ["Meslek", staff.profession || "Belirtilmedi"],
                  ["İstihdam", formatEmploymentType(staff.employmentType)],
                  ["Cinsiyet", formatGender(profileForm.gender)],
                  ["Dahili", staff.phoneInternal || "Belirtilmedi"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      {label}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{value}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
