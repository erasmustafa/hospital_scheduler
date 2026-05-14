"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Filter,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { apiClient } from "@/lib/api";

type StaffRow = {
  id: number;
  fullName: string;
  photoUrl?: string | null;
  role: string;
  employeeNo: string | null;
  title: string;
  profession: string;
  departmentName: string | null;
  weeklyLimitHours: number;
  gender?: "female" | "male" | "other" | "unspecified";
  isActive: boolean;
};

const titleBadgeColors: Record<string, { bg: string; text: string }> = {
  Hemşire: { bg: "#e8f4ff", text: "#246bd2" },
  Teknisyen: { bg: "#fff2df", text: "#ef7d18" },
  Doktor: { bg: "#eaf8ef", text: "#15803d" },
  Uzman: { bg: "#f2eaff", text: "#6d28d9" },
  Yönetici: { bg: "#f2eaff", text: "#6d28d9" },
};

const professionBadgeColors: Record<string, { bg: string; text: string }> = {
  Hemşire: { bg: "#e8f4ff", text: "#246bd2" },
  "Anestezi Teknikeri": { bg: "#f2f5fa", text: "#475569" },
  Teknisyen: { bg: "#f2f5fa", text: "#475569" },
  Doktor: { bg: "#eaf8ef", text: "#15803d" },
};

const departmentBadgeColors: Record<string, { bg: string; text: string; icon: typeof Building2 }> = {
  Anestezi: { bg: "#f2eaff", text: "#5b45d8", icon: Stethoscope },
  Ameliyathane: { bg: "#e6fbf8", text: "#0f766e", icon: BriefcaseBusiness },
  "Acil Servis": { bg: "#ffeaf1", text: "#be123c", icon: Building2 },
  Dahiliye: { bg: "#eef9e8", text: "#4d7c0f", icon: Building2 },
  Radyoloji: { bg: "#fff7db", text: "#b45309", icon: Building2 },
  Kardiyoloji: { bg: "#fff0eb", text: "#c2410c", icon: Building2 },
};

const roleLabelTr: Record<string, string> = {
  doctor: "Doktor",
  nurse: "Hemşire",
  technician: "Teknisyen",
  admin: "Yönetici",
};

const pageSize = 10;

function getBadgeColor(map: Record<string, { bg: string; text: string }>, key: string) {
  return map[key] ?? { bg: "#f2f5fa", text: "#475569" };
}

function getDefaultAvatarSrc(gender?: StaffRow["gender"]) {
  if (gender === "female") {
    return "/images/staff-avatar-female.svg";
  }
  return "/images/staff-avatar-male.svg";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase("tr-TR");
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toLocaleUpperCase("tr-TR");
}

function getAvatarTone(index: number) {
  const tones = [
    "linear-gradient(135deg, #eef2ff 0%, #ddd6fe 100%)",
    "linear-gradient(135deg, #fce7f3 0%, #fae8ff 100%)",
    "linear-gradient(135deg, #ffedd5 0%, #fef3c7 100%)",
    "linear-gradient(135deg, #ccfbf1 0%, #e0f2fe 100%)",
    "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
  ];
  return tones[index % tones.length];
}

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("Tümü");
  const [filterOpen, setFilterOpen] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.get<{ staff: StaffRow[] }>("/staff/");
        setStaff(data.staff);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Personel yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const departments = useMemo(() => {
    return Array.from(new Set(staff.map((s) => s.departmentName).filter((n): n is string => Boolean(n))));
  }, [staff]);

  const filteredStaff = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("tr-TR");
    return staff.filter((s) => {
      const matchesDepartment = departmentFilter === "Tümü" || s.departmentName === departmentFilter;
      const matchesSearch =
        normalized.length === 0 ||
        s.fullName.toLocaleLowerCase("tr-TR").includes(normalized) ||
          (s.departmentName ?? "").toLocaleLowerCase("tr-TR").includes(normalized) ||
          s.role.toLocaleLowerCase("tr-TR").includes(normalized) ||
          (s.title ?? "").toLocaleLowerCase("tr-TR").includes(normalized) ||
          (s.profession ?? "").toLocaleLowerCase("tr-TR").includes(normalized);

      return matchesDepartment && matchesSearch;
    });
  }, [departmentFilter, search, staff]);

  useEffect(() => {
    setCurrentPage(1);
  }, [departmentFilter, search]);

  const totalStaff = staff.length;
  const activeStaff = staff.filter((s) => s.isActive).length;
  const visibleDepartments = useMemo(() => {
    return Array.from(
      new Set(filteredStaff.map((s) => s.departmentName).filter((n): n is string => Boolean(n)))
    );
  }, [filteredStaff]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedStaff = filteredStaff.slice((safePage - 1) * pageSize, safePage * pageSize);
  const visibleStart = filteredStaff.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const visibleEnd = Math.min(safePage * pageSize, filteredStaff.length);

  const statCards = [
    {
      label: "Toplam Personel",
      value: totalStaff,
      desc: "Listede görüntülenen toplam personel",
      icon: UsersRound,
      color: "#6366f1",
      bg: "linear-gradient(135deg, #f0f1ff 0%, #ebe9ff 100%)",
      actionIcon: UsersRound,
    },
    {
      label: "Aktif Kadro",
      value: activeStaff,
      desc: "Aktif görünen çalışanlardan oluşan kadro",
      icon: UserRoundCheck,
      color: "#10b981",
      bg: "linear-gradient(135deg, #ecfdf5 0%, #ddfbe9 100%)",
      actionIcon: ShieldCheck,
    },
    {
      label: "Görünen Birimler",
      value: visibleDepartments.length,
      desc:
        visibleDepartments.length > 0
          ? `${visibleDepartments.slice(0, 2).join(" ve ").toLocaleLowerCase("tr-TR")} dağılımı`
          : "Birim bilgisi yok",
      icon: Building2,
      color: "#4f73ff",
      bg: "linear-gradient(135deg, #eff6ff 0%, #e8f0ff 100%)",
      actionIcon: BriefcaseBusiness,
    },
  ];

  return (
    <main style={styles.main}>
      <style>{`
        .staff-action-button:hover,
        .staff-icon-button:hover,
        .staff-filter-button:hover,
        .staff-row-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 24px rgba(63, 81, 181, 0.14);
        }

        .staff-action-button:active,
        .staff-icon-button:active,
        .staff-filter-button:active,
        .staff-row-action:active {
          transform: translateY(0) scale(0.98);
          filter: brightness(0.98);
        }

        .staff-table-row {
          transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }

        .staff-table-row:hover {
          transform: translateY(-1px);
          box-shadow: inset 0 0 0 1px rgba(191, 219, 254, 0.7), 0 18px 36px -32px rgba(37, 99, 235, 0.5);
        }

        .staff-table-row:hover td {
          background: linear-gradient(90deg, rgba(248, 251, 255, 0.98) 0%, rgba(255,255,255,0.98) 100%);
        }

        .staff-input-wrap:focus-within {
          border-color: #9bb5ff;
          box-shadow: 0 0 0 4px rgba(79, 115, 255, 0.10);
        }

        .staff-dropdown-menu {
          animation: staffDropdownIn 160ms ease both;
          transform-origin: top right;
        }

        @keyframes staffDropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <header style={styles.pageHeader}>
        <div style={styles.titleGroup}>
          <span style={styles.titleIcon}>
            <UsersRound size={24} />
          </span>
          <div>
            <h1 style={styles.pageTitle}>Personel Yönetimi</h1>
            <p style={styles.pageSubtitle}>Kadro listenizi yönetin, personel bilgilerini görüntüleyin ve güncelleyin.</p>
          </div>
        </div>
        <button type="button" className="staff-action-button" style={styles.addButton}>
          <Plus size={17} />
          Yeni Personel
        </button>
      </header>

      <section style={styles.summaryGrid}>
        <div style={styles.searchCard}>
          <h2 style={styles.cardTitle}>Personel Ara</h2>
          <div style={styles.searchRow}>
            <label className="staff-input-wrap" style={styles.searchInputWrap}>
              <Search size={17} style={{ color: "#8190aa", flexShrink: 0 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ad, ünvan, meslek, birim ara..."
                style={styles.searchInput}
              />
            </label>
            <button type="button" className="staff-icon-button" style={styles.squareButton}>
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        {statCards.map((card) => {
          const Icon = card.icon;
          const ActionIcon = card.actionIcon;
          return (
            <article key={card.label} style={styles.statCard}>
              <span style={{ ...styles.statIcon, color: card.color, background: card.bg }}>
                <Icon size={24} />
              </span>
              <div style={styles.statText}>
                <p style={styles.statLabel}>{card.label}</p>
                <strong style={styles.statValue}>{card.value}</strong>
                <span style={styles.statDesc}>{card.desc}</span>
              </div>
              <span style={{ ...styles.statActionIcon, color: card.color }}>
                <ActionIcon size={20} />
              </span>
            </article>
          );
        })}
      </section>

      <section style={styles.tableSection}>
        <div style={styles.tableHeader}>
          <div>
            <h2 style={styles.tableTitle}>Personel Tablosu</h2>
            <p style={styles.tableSubtitle}>
              Kadro listesini ad, ünvan, meslek, birim ve aktiflik durumu ile birlikte inceleyin.
            </p>
          </div>

          <div style={styles.tableActions}>
            <div style={styles.dropdownWrap}>
              <button
                type="button"
                className="staff-filter-button"
                style={styles.filterButton}
                onClick={() => setFilterOpen((value) => !value)}
              >
                <Filter size={16} />
                Filtrele
                <ChevronDown size={15} />
              </button>
              {filterOpen ? (
                <div className="staff-dropdown-menu" style={styles.simpleMenu}>
                  <button type="button" style={styles.menuItem} onClick={() => setFilterOpen(false)}>
                    Aktif personel
                  </button>
                  <button type="button" style={styles.menuItem} onClick={() => setFilterOpen(false)}>
                    Pasif personel
                  </button>
                  <button type="button" style={styles.menuItem} onClick={() => setFilterOpen(false)}>
                    Tüm kayıtlar
                  </button>
                </div>
              ) : null}
            </div>

            <div style={styles.dropdownWrap}>
              <button
                type="button"
                className="staff-filter-button"
                style={styles.departmentButton}
                onClick={() => setDepartmentOpen((value) => !value)}
              >
                <span>Birim: {departmentFilter}</span>
                <ChevronDown size={16} />
              </button>
              {departmentOpen ? (
                <div className="staff-dropdown-menu" style={styles.departmentMenu}>
                  {["Tümü", ...departments].map((department) => (
                    <button
                      key={department}
                      type="button"
                      style={{
                        ...styles.menuItem,
                        ...(departmentFilter === department ? styles.menuItemActive : {}),
                      }}
                      onClick={() => {
                        setDepartmentFilter(department);
                        setDepartmentOpen(false);
                      }}
                    >
                      {department}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button type="button" className="staff-icon-button" style={styles.squareButton}>
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        {loading && <p style={styles.stateText}>Yükleniyor...</p>}
        {error && <p style={{ ...styles.stateText, color: "#dc2626" }}>{error}</p>}

        {!loading && !error && (
          <>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: 34 }}>
                      <input type="checkbox" aria-label="Tüm personeli seç" style={styles.checkbox} />
                    </th>
                    <th style={styles.th}>Ad Soyad</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>
                      <span style={styles.thSort}>Personel No <ChevronsUpDown size={13} /></span>
                    </th>
                    <th style={styles.th}>
                      <span style={styles.thSort}>Unvan <ChevronsUpDown size={13} /></span>
                    </th>
                    <th style={styles.th}>
                      <span style={styles.thSort}>Meslek <ChevronsUpDown size={13} /></span>
                    </th>
                    <th style={styles.th}>
                      <span style={styles.thSort}>Birim <ChevronsUpDown size={13} /></span>
                    </th>
                    <th style={styles.th}>
                      <span style={styles.thSort}>Durum <ChevronsUpDown size={13} /></span>
                    </th>
                    <th style={{ ...styles.th, textAlign: "center" }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStaff.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ ...styles.td, textAlign: "center", color: "#94a3b8" }}>
                        Filtreye uygun personel bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    paginatedStaff.map((row, index) => {
                      const titleLabel = row.title || (roleLabelTr[row.role] ?? row.role);
                      const professionLabel = row.profession || (roleLabelTr[row.role] ?? row.role);
                      const dept = row.departmentName ?? "Tanımsız";
                      const titleColor = getBadgeColor(titleBadgeColors, titleLabel);
                      const profColor = getBadgeColor(professionBadgeColors, professionLabel);
                      const deptColor = departmentBadgeColors[dept] ?? {
                        bg: "#f2f5fa",
                        text: "#475569",
                        icon: Building2,
                      };
                      const DepartmentIcon = deptColor.icon;

                      return (
                        <tr key={row.id} className="staff-table-row" style={styles.tableRow}>
                          <td style={styles.td}>
                            <input type="checkbox" aria-label={`${row.fullName} seç`} style={styles.checkbox} />
                          </td>
                          <td
                            style={styles.td}
                            onClick={() => router.push(`/staff/${row.id}`)}
                          >
                            <div style={styles.nameCell}>
                              <span
                                style={{
                                  ...styles.avatar,
                                  background: row.photoUrl ? "#eef2ff" : getAvatarTone(index),
                                }}
                              >
                                {row.photoUrl ? (
                                  <img src={row.photoUrl} alt={row.fullName} style={styles.avatarImage} />
                                ) : (
                                  getInitials(row.fullName)
                                )}
                                <span style={styles.avatarStatus} />
                              </span>
                              <div>
                                <p style={styles.nameText}>{row.fullName}</p>
                                <p style={styles.nameSubtext}>Personel kartı ve kimlik bilgisi</p>
                              </div>
                            </div>
                          </td>

                          <td style={{ ...styles.td, textAlign: "center" }}>
                            <span style={styles.employeeNoBadge}>{row.employeeNo ?? row.id}</span>
                          </td>

                          <td style={styles.td}>
                            <span style={{ ...styles.badge, backgroundColor: titleColor.bg, color: titleColor.text }}>
                              {titleLabel}
                            </span>
                          </td>

                          <td style={styles.td}>
                            <span style={{ ...styles.badge, backgroundColor: profColor.bg, color: profColor.text }}>
                              {professionLabel}
                            </span>
                          </td>

                          <td style={styles.td}>
                            <span style={{ ...styles.badge, backgroundColor: deptColor.bg, color: deptColor.text }}>
                              <DepartmentIcon size={14} />
                              {dept}
                            </span>
                          </td>

                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.statusBadge,
                                ...(row.isActive ? { color: "#059669" } : { color: "#dc2626" }),
                              }}
                            >
                              <span
                                style={{
                                  ...styles.statusDot,
                                  backgroundColor: row.isActive ? "#10b981" : "#ef4444",
                                }}
                              />
                              {row.isActive ? "Aktif" : "Pasif"}
                            </span>
                          </td>

                          <td style={{ ...styles.td, textAlign: "center" }}>
                            <div style={styles.rowActions}>
                              <button
                                type="button"
                                className="staff-row-action"
                                style={styles.editButton}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  router.push(`/staff/${row.id}`);
                                }}
                              >
                                <Pencil size={15} />
                                Düzenle
                              </button>
                              <button
                                type="button"
                                className="staff-row-action"
                                style={styles.moreButton}
                                onClick={(event) => event.stopPropagation()}
                                aria-label={`${row.fullName} işlemleri`}
                              >
                                <MoreVertical size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <footer style={styles.tableFooter}>
              <div style={styles.footerLeft}>
                <span>{filteredStaff.length} kayıt</span>
                <button type="button" style={styles.pageSizeButton}>
                  10 / sayfa
                  <ChevronDown size={14} />
                </button>
              </div>
              <div style={styles.pagination}>
                <button
                  type="button"
                  style={styles.paginationButton}
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(totalPages, 3) }, (_, pageIndex) => pageIndex + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    style={{
                      ...styles.paginationNumber,
                      ...(safePage === page ? styles.paginationNumberActive : {}),
                    }}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  style={styles.paginationButton}
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <span style={styles.footerRange}>
                {visibleStart} - {visibleEnd} arası gösteriliyor
              </span>
            </footer>
          </>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100%",
    height: "100%",
    minWidth: 0,
    overflow: "hidden",
    boxSizing: "border-box",
    padding: "26px 32px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 22,
    fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    background: "linear-gradient(135deg, #f7fbff 0%, #f1f6ff 48%, #f8fbff 100%)",
    color: "#101a36",
  },
  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    flexShrink: 0,
  },
  titleGroup: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    minWidth: 0,
  },
  titleIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#5b5cf6",
    background: "linear-gradient(135deg, #eef2ff 0%, #e9e5ff 100%)",
    boxShadow: "0 12px 26px rgba(99,102,241,0.12)",
    flexShrink: 0,
  },
  pageTitle: {
    margin: 0,
    fontSize: 25,
    lineHeight: 1.15,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    color: "#101a36",
  },
  pageSubtitle: {
    margin: "7px 0 0",
    fontSize: 14,
    fontWeight: 500,
    color: "#52617d",
  },
  addButton: {
    height: 50,
    minWidth: 166,
    border: "0",
    borderRadius: 14,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    color: "#ffffff",
    background: "linear-gradient(135deg, #6558f5 0%, #4f46e5 100%)",
    boxShadow: "0 18px 34px rgba(79,70,229,0.28)",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    transition: "transform 180ms ease, box-shadow 180ms ease, filter 180ms ease",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(300px, 1.25fr) repeat(3, minmax(210px, 1fr))",
    gap: 14,
    flexShrink: 0,
  },
  searchCard: {
    minHeight: 102,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 14,
    padding: "18px 22px",
    borderRadius: 18,
    border: "1px solid rgba(218,226,244,0.96)",
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 14px 36px rgba(23,37,84,0.07)",
  },
  cardTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
    color: "#111b38",
  },
  searchRow: {
    display: "grid",
    gridTemplateColumns: "1fr 44px",
    gap: 12,
    alignItems: "center",
  },
  searchInputWrap: {
    height: 44,
    display: "flex",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    border: "1px solid #d9e3f3",
    background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
    padding: "0 14px",
    transition: "border-color 180ms ease, box-shadow 180ms ease",
  },
  searchInput: {
    width: "100%",
    minWidth: 0,
    height: "100%",
    border: "0",
    outline: "0",
    background: "transparent",
    color: "#263754",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "inherit",
  },
  squareButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#4f63d7",
    border: "1px solid #d9e3f3",
    background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
    cursor: "pointer",
    transition: "transform 180ms ease, box-shadow 180ms ease, filter 180ms ease",
  },
  statCard: {
    position: "relative",
    minHeight: 102,
    display: "grid",
    gridTemplateColumns: "56px 1fr",
    alignItems: "center",
    gap: 14,
    padding: "18px 22px",
    borderRadius: 18,
    border: "1px solid rgba(218,226,244,0.96)",
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 14px 36px rgba(23,37,84,0.07)",
    overflow: "hidden",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statText: {
    minWidth: 0,
  },
  statLabel: {
    margin: "0 0 6px",
    fontSize: 11,
    fontWeight: 700,
    color: "#71809e",
  },
  statValue: {
    display: "block",
    marginBottom: 7,
    color: "#111b38",
    fontSize: 25,
    lineHeight: 1,
    fontWeight: 700,
  },
  statDesc: {
    display: "block",
    color: "#7583a2",
    fontSize: 11,
    lineHeight: 1.35,
    fontWeight: 600,
  },
  statActionIcon: {
    position: "absolute",
    top: 28,
    right: 22,
    opacity: 0.95,
  },
  tableSection: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: 18,
    border: "1px solid rgba(218,226,244,0.96)",
    background: "rgba(255,255,255,0.95)",
    boxShadow: "0 18px 42px rgba(23,37,84,0.08)",
  },
  tableHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    padding: "24px 26px 20px",
    borderBottom: "1px solid #e7edf7",
    flexShrink: 0,
  },
  tableTitle: {
    margin: 0,
    color: "#111b38",
    fontSize: 19,
    lineHeight: 1.2,
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  tableSubtitle: {
    margin: "9px 0 0",
    color: "#7583a2",
    fontSize: 13,
    fontWeight: 600,
  },
  tableActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },
  dropdownWrap: {
    position: "relative",
  },
  filterButton: {
    height: 43,
    minWidth: 122,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    border: "1px solid #d9e3f3",
    background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
    color: "#4f46e5",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform 180ms ease, box-shadow 180ms ease, filter 180ms ease",
  },
  departmentButton: {
    height: 43,
    minWidth: 184,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 12,
    border: "1px solid #d9e3f3",
    background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
    color: "#465773",
    padding: "0 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform 180ms ease, box-shadow 180ms ease, filter 180ms ease",
  },
  simpleMenu: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    zIndex: 20,
    minWidth: 170,
    padding: 6,
    borderRadius: 14,
    border: "1px solid #d9e3f3",
    background: "rgba(255,255,255,0.98)",
    boxShadow: "0 20px 42px rgba(23,37,84,0.16)",
  },
  departmentMenu: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    zIndex: 20,
    minWidth: 190,
    padding: 6,
    borderRadius: 14,
    border: "1px solid #d9e3f3",
    background: "rgba(255,255,255,0.98)",
    boxShadow: "0 20px 42px rgba(23,37,84,0.16)",
  },
  menuItem: {
    width: "100%",
    minHeight: 34,
    border: "0",
    borderRadius: 10,
    background: "transparent",
    color: "#465773",
    cursor: "pointer",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 700,
  },
  menuItemActive: {
    color: "#4f46e5",
    background: "#eef2ff",
  },
  stateText: {
    padding: 24,
    margin: 0,
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
  },
  tableWrap: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    background: "linear-gradient(180deg, #fbfdff 0%, #f7faff 100%)",
    padding: "14px 20px",
    color: "#667391",
    fontSize: 12,
    fontWeight: 700,
    textAlign: "left",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #e7edf7",
  },
  thSort: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  },
  td: {
    padding: "13px 20px",
    color: "#263754",
    fontSize: 13,
    fontWeight: 600,
    verticalAlign: "middle",
    borderBottom: "1px solid #edf2f8",
    background: "#ffffff",
  },
  tableRow: {
    cursor: "default",
  },
  checkbox: {
    width: 15,
    height: 15,
    accentColor: "#5b5cf6",
    cursor: "pointer",
  },
  nameCell: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
  },
  avatar: {
    position: "relative",
    width: 42,
    height: 42,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#3636b7",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.75)",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "50%",
  },
  avatarStatus: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 9,
    height: 9,
    borderRadius: 999,
    background: "#10b981",
    border: "2px solid #ffffff",
  },
  nameText: {
    margin: 0,
    color: "#101a36",
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.25,
  },
  nameSubtext: {
    margin: "4px 0 0",
    color: "#71809e",
    fontSize: 11,
    fontWeight: 600,
  },
  employeeNoBadge: {
    width: 43,
    height: 34,
    borderRadius: 11,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #e0e8f4",
    background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
    color: "#101a36",
    fontSize: 13,
    fontWeight: 700,
    boxShadow: "0 6px 14px rgba(23,37,84,0.04)",
  },
  badge: {
    minHeight: 28,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "0 12px",
    borderRadius: 9,
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontSize: 13,
    fontWeight: 700,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  rowActions: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  editButton: {
    height: 40,
    minWidth: 112,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 11,
    border: "1px solid #dce5f4",
    background: "#ffffff",
    color: "#5047c9",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    transition: "transform 180ms ease, box-shadow 180ms ease, filter 180ms ease",
  },
  moreButton: {
    width: 40,
    height: 40,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    border: "1px solid #dce5f4",
    background: "#ffffff",
    color: "#334155",
    cursor: "pointer",
    transition: "transform 180ms ease, box-shadow 180ms ease, filter 180ms ease",
  },
  tableFooter: {
    flexShrink: 0,
    minHeight: 58,
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: 16,
    padding: "10px 22px",
    borderTop: "1px solid #e7edf7",
    background: "rgba(255,255,255,0.94)",
  },
  footerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    color: "#62718f",
    fontSize: 13,
    fontWeight: 700,
  },
  pageSizeButton: {
    height: 40,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    border: "1px solid #dce5f4",
    background: "#ffffff",
    color: "#475569",
    padding: "0 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  pagination: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  paginationButton: {
    width: 38,
    height: 38,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    border: "1px solid #dce5f4",
    background: "#ffffff",
    color: "#7a88a5",
    cursor: "pointer",
  },
  paginationNumber: {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: "1px solid #dce5f4",
    background: "#ffffff",
    color: "#475569",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
  paginationNumberActive: {
    border: "0",
    background: "linear-gradient(135deg, #715cff 0%, #4f46e5 100%)",
    color: "#ffffff",
    boxShadow: "0 12px 22px rgba(79,70,229,0.24)",
  },
  footerRange: {
    justifySelf: "end",
    color: "#7a88a5",
    fontSize: 12,
    fontWeight: 700,
  },
};
