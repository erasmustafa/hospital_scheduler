"use client";

import { useState } from "react";
import {
  Bell,
  Bookmark,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Filter,
  LayoutGrid,
  List,
  Moon,
  Plus,
  Repeat,
  Search,
  Store,
  Sun,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowDownUp,
  Clock3,
  Building2,
  X,
} from "lucide-react";

type ShiftMarketApplicant = {
  id: string;
  name: string;
  status: "pending" | "accepted" | "rejected";
  date: string;
};

type ShiftMarketListing = {
  id: string;
  ownerName: string;
  listingType: "shift_transfer" | "overtime_transfer" | "swap_request";
  departmentName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  reason?: string;
  applicants: ShiftMarketApplicant[];
  status: "open" | "pending_acceptance" | "manager_approval" | "completed";
  postDate: string;
};

const INITIAL_LISTINGS: ShiftMarketListing[] = [
  {
    id: "1",
    ownerName: "Mustafa Bedir",
    listingType: "shift_transfer",
    departmentName: "Ameliyathane",
    shiftDate: "28 Nisan 2026",
    startTime: "16:00",
    endTime: "00:00",
    durationHours: 8,
    applicants: [
      { id: "a1", name: "Ayşe Yılmaz", status: "pending", date: "26 Nis 14:00" },
      { id: "a2", name: "Ali Kaya", status: "pending", date: "26 Nis 15:30" },
    ],
    status: "open",
    postDate: "26 Nis 10:30",
  },
  {
    id: "2",
    ownerName: "Elif Ömercik",
    listingType: "overtime_transfer",
    departmentName: "Acil Servis",
    shiftDate: "30 Nisan 2026",
    startTime: "08:00",
    endTime: "16:00",
    durationHours: 8,
    reason: "Yoğunluk nedeniyle",
    applicants: [
      { id: "a3", name: "Hasan Şahin", status: "pending", date: "26 Nis 11:00" },
    ],
    status: "open",
    postDate: "26 Nis 09:15",
  },
  {
    id: "3",
    ownerName: "Hüseyin Özmen",
    listingType: "swap_request",
    departmentName: "Yoğun Bakım",
    shiftDate: "1 Mayıs 2026",
    startTime: "16:00",
    endTime: "00:00",
    durationHours: 8,
    reason: "Takas önerisi",
    applicants: [],
    status: "open",
    postDate: "25 Nis 17:45",
  },
  {
    id: "4",
    ownerName: "Meryem Bingöl Özhan",
    listingType: "shift_transfer",
    departmentName: "Doğumhane",
    shiftDate: "3 Mayıs 2026",
    startTime: "00:00",
    endTime: "08:00",
    durationHours: 8,
    reason: "Kişisel neden",
    applicants: [
      { id: "a4", name: "Zeynep Demir", status: "pending", date: "27 Nis 09:00" },
    ],
    status: "open",
    postDate: "27 Nis 08:20",
  },
  {
    id: "5",
    ownerName: "Ahmet Soylu",
    listingType: "overtime_transfer",
    departmentName: "Poliklinik",
    shiftDate: "4 Mayıs 2026",
    startTime: "08:00",
    endTime: "16:00",
    durationHours: 8,
    reason: "Plan değişikliği",
    applicants: [
      { id: "a5", name: "Fatma Çelik", status: "accepted", date: "26 Nis 16:00" },
    ],
    status: "manager_approval",
    postDate: "24 Nis 11:10",
  },
  {
    id: "6",
    ownerName: "Burak Yılmaz",
    listingType: "shift_transfer",
    departmentName: "Acil Servis",
    shiftDate: "5 Mayıs 2026",
    startTime: "16:00",
    endTime: "00:00",
    durationHours: 8,
    applicants: [],
    status: "open",
    postDate: "27 Nis 14:30",
  },
  {
    id: "7",
    ownerName: "Zeynep Demir",
    listingType: "swap_request",
    departmentName: "Ameliyathane",
    shiftDate: "6 Mayıs 2026",
    startTime: "08:00",
    endTime: "16:00",
    durationHours: 8,
    reason: "Gece nöbetine geçmek istiyorum",
    applicants: [
      { id: "a6", name: "Kemal Arslan", status: "pending", date: "27 Nis 18:00" },
      { id: "a7", name: "Selin Korkmaz", status: "pending", date: "28 Nis 08:15" },
      { id: "a8", name: "Osman Taşkın", status: "pending", date: "28 Nis 09:30" },
    ],
    status: "open",
    postDate: "27 Nis 12:00",
  },
  {
    id: "8",
    ownerName: "Fatma Çelik",
    listingType: "overtime_transfer",
    departmentName: "Yoğun Bakım",
    shiftDate: "7 Mayıs 2026",
    startTime: "16:00",
    endTime: "00:00",
    durationHours: 8,
    reason: "Ek mesai fazlası",
    applicants: [],
    status: "open",
    postDate: "28 Nis 07:45",
  },
];

const TABS = [
  "Tümü",
  "Nöbet Devri",
  "Mesai Devri",
  "Takas İsteği",
  "Benim İlanlarım",
  "Talip Olduklarım",
  "Onay Bekleyenler",
  "Kaydedilenler",
];

const CURRENT_USER = "Mustafa Bedir";

export default function ShiftMarketPage() {
  const [activeTab, setActiveTab] = useState("Tümü");
  const [listings, setListings] = useState<ShiftMarketListing[]>(INITIAL_LISTINGS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ShiftMarketListing | null>(null);

  // MVP 2 & 3 States
  const [isApplying, setIsApplying] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  
  // MVP 3 States
  const [showAiMatches, setShowAiMatches] = useState(false);
  const [swapShiftSelect, setSwapShiftSelect] = useState("");
  const MOCK_AI_MATCHES = [
    { id: "ai1", name: "Burak Yılmaz", role: "Uzman Hemşire", matchScore: 98 },
    { id: "ai2", name: "Zeynep Demir", role: "Hemşire", matchScore: 85 },
  ];

  // Form states
  const [formType, setFormType] = useState<ShiftMarketListing["listingType"]>("shift_transfer");
  const [formDate, setFormDate] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formDept, setFormDept] = useState("Ameliyathane");
  const [formReason, setFormReason] = useState("");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("Tümü");
  const [filterStatus, setFilterStatus] = useState("Tümü");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // View & Bookmark states
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const toggleSave = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const ALL_DEPARTMENTS = ["Tümü", ...Array.from(new Set(listings.map(l => l.departmentName)))];
  const ALL_STATUSES = [
    { value: "Tümü", label: "Tümü" },
    { value: "open", label: "Açık" },
    { value: "manager_approval", label: "Onay Bekliyor" },
    { value: "completed", label: "Tamamlandı" },
  ];

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    const newListing: ShiftMarketListing = {
      id: Math.random().toString(36).substr(2, 9),
      ownerName: CURRENT_USER,
      listingType: formType,
      departmentName: formDept,
      shiftDate: formDate || "Belirtilmedi",
      startTime: formStart || "00:00",
      endTime: formEnd || "00:00",
      durationHours: 8,
      reason: formReason,
      applicants: [],
      status: "open",
      postDate: "Şimdi",
    };
    setListings([newListing, ...listings]);
    setIsCreateModalOpen(false);
  };

  const handleApply = (listingId: string) => {
    setIsApplying(true);
    // Simulate eligibility checks
    setTimeout(() => {
      setIsApplying(false);
      setListings(listings.map(listing => {
        if (listing.id === listingId) {
          return {
            ...listing,
            applicants: [
              ...listing.applicants,
              { id: Math.random().toString(), name: CURRENT_USER, status: "pending", date: "Şimdi" }
            ]
          };
        }
        return listing;
      }));
      setSelectedListing(prev => {
        if (prev?.id === listingId) {
          return {
            ...prev,
            applicants: [
              ...prev.applicants,
              { id: Math.random().toString(), name: CURRENT_USER, status: "pending", date: "Şimdi" }
            ]
          };
        }
        return prev;
      });
      setNotification("Uygunluk doğrulandı! Başvurunuz iletildi.");
      setTimeout(() => setNotification(null), 3000);
    }, 1500);
  };

  const handleAcceptApplicant = (listingId: string, applicantId: string) => {
    setListings(listings.map(listing => {
      if (listing.id === listingId) {
        return {
          ...listing,
          status: "manager_approval",
          applicants: listing.applicants.map(app => 
            app.id === applicantId ? { ...app, status: "accepted" } : { ...app, status: "rejected" }
          )
        };
      }
      return listing;
    }));
    setSelectedListing(prev => {
      if (prev?.id === listingId) {
        return {
          ...prev,
          status: "manager_approval",
          applicants: prev.applicants.map(app => 
            app.id === applicantId ? { ...app, status: "accepted" } : { ...app, status: "rejected" }
          )
        };
      }
      return prev;
    });
    setNotification("Talip onaylandı. Yönetici onayına gönderildi.");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleManagerApprove = (listingId: string) => {
    setListings(listings.map(listing => 
      listing.id === listingId ? { ...listing, status: "completed" } : listing
    ));
    setSelectedListing(prev => prev?.id === listingId ? { ...prev, status: "completed" } : prev);
    setNotification("Vardiya devri tamamlandı ve takvime aktarıldı.");
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredListings = listings
    .filter(listing => {
      // Tab filter
      if (activeTab === "Benim İlanlarım" && listing.ownerName !== CURRENT_USER) return false;
      if (activeTab === "Talip Olduklarım" && !listing.applicants.some(a => a.name === CURRENT_USER)) return false;
      if (activeTab === "Nöbet Devri" && listing.listingType !== "shift_transfer") return false;
      if (activeTab === "Mesai Devri" && listing.listingType !== "overtime_transfer") return false;
      if (activeTab === "Takas İsteği" && listing.listingType !== "swap_request") return false;
      if (activeTab === "Onay Bekleyenler" && listing.status !== "manager_approval") return false;
      if (activeTab === "Kaydedilenler" && !savedIds.has(listing.id)) return false;

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          listing.ownerName.toLowerCase().includes(q) ||
          listing.departmentName.toLowerCase().includes(q) ||
          listing.shiftDate.toLowerCase().includes(q) ||
          (listing.reason || "").toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Department filter
      if (filterDept !== "Tümü" && listing.departmentName !== filterDept) return false;

      // Status filter
      if (filterStatus !== "Tümü" && listing.status !== filterStatus) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "newest") return b.id.localeCompare(a.id);
      return a.id.localeCompare(b.id);
    });

  const getListingIcon = (type: ShiftMarketListing["listingType"]) => {
    switch (type) {
      case "shift_transfer": return <Moon className="h-6 w-6 text-indigo-500" />;
      case "overtime_transfer": return <Sun className="h-6 w-6 text-amber-500" />;
      case "swap_request": return <Repeat className="h-6 w-6 text-emerald-500" />;
    }
  };

  const getListingIconBg = (type: ShiftMarketListing["listingType"]) => {
    switch (type) {
      case "shift_transfer": return "bg-indigo-50";
      case "overtime_transfer": return "bg-amber-50";
      case "swap_request": return "bg-emerald-50";
    }
  };

  const getTypeLabel = (type: ShiftMarketListing["listingType"]) => {
    switch (type) {
      case "shift_transfer": return "NÖBET DEVRİ";
      case "overtime_transfer": return "MESAİ DEVRİ";
      case "swap_request": return "TAKAS İSTEĞİ";
    }
  };

  const getTypeColor = (type: ShiftMarketListing["listingType"]) => {
    switch (type) {
      case "shift_transfer": return "text-indigo-600 bg-indigo-50";
      case "overtime_transfer": return "text-amber-600 bg-amber-50";
      case "swap_request": return "text-emerald-600 bg-emerald-50";
    }
  };

  const getStatusBadge = (status: ShiftMarketListing["status"]) => {
    switch (status) {
      case "open":
        return <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">Açık</span>;
      case "pending_acceptance":
        return <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">Takas</span>;
      case "manager_approval":
        return <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">Onay Bekliyor</span>;
      case "completed":
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Tamamlandı</span>;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 font-sans relative">
      {/* TOAST NOTIFICATION */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-emerald-600 px-6 py-3 text-white shadow-xl animate-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-bold">{notification}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Vardiya Pazarı
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 text-xs text-yellow-600">
                ⭐
              </span>
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Fazla nöbet veya mesailerini devret, ihtiyacı olan personellere ulaş.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Panel içinde ara..."
              className="h-10 w-64 rounded-full border border-slate-200 bg-slate-50 pl-10 pr-12 text-sm text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
              ⌘K
            </div>
          </div>
          <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
            <Bell className="h-5 w-5" />
            <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white p-1 pr-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              M
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight text-slate-800">Mustafa</span>
              <span className="text-[10px] font-semibold text-slate-500">Yönetici</span>
            </div>
            <ChevronRight className="ml-2 h-4 w-4 text-slate-400" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 gap-8 p-8 w-full overflow-hidden">
        {/* LEFT MAIN CONTENT */}
        <div className="flex flex-1 flex-col gap-0.5 min-h-0">
          {/* TABS */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-px">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative whitespace-nowrap px-4 py-3 text-sm font-bold transition-colors ${
                  activeTab === tab
                    ? "text-blue-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* FILTERS — dynamic */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="İlanlarda ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-52 rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>

              {/* Birim Dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setShowDeptDropdown(!showDeptDropdown); setShowStatusDropdown(false); setShowSortDropdown(false); }}
                  className={`flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-sm font-semibold transition ${filterDept !== "Tümü" ? "border-blue-300 bg-blue-50 text-blue-600" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  {filterDept === "Tümü" ? "Birim" : filterDept} <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
                {showDeptDropdown && (
                  <div className="absolute left-0 top-11 z-40 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                    {ALL_DEPARTMENTS.map(dept => (
                      <button
                        key={dept}
                        onClick={() => { setFilterDept(dept); setShowDeptDropdown(false); }}
                        className={`w-full px-4 py-2 text-left text-sm transition ${filterDept === dept ? "bg-blue-50 font-bold text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Durum Dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowDeptDropdown(false); setShowSortDropdown(false); }}
                  className={`flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-sm font-semibold transition ${filterStatus !== "Tümü" ? "border-blue-300 bg-blue-50 text-blue-600" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  {filterStatus === "Tümü" ? "Durum" : ALL_STATUSES.find(s => s.value === filterStatus)?.label} <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
                {showStatusDropdown && (
                  <div className="absolute left-0 top-11 z-40 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                    {ALL_STATUSES.map(st => (
                      <button
                        key={st.value}
                        onClick={() => { setFilterStatus(st.value); setShowStatusDropdown(false); }}
                        className={`w-full px-4 py-2 text-left text-sm transition ${filterStatus === st.value ? "bg-blue-50 font-bold text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Filter Badges */}
              {(filterDept !== "Tümü" || filterStatus !== "Tümü" || searchQuery) && (
                <button
                  onClick={() => { setFilterDept("Tümü"); setFilterStatus("Tümü"); setSearchQuery(""); }}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-red-50 px-3 text-xs font-bold text-red-500 hover:bg-red-100 transition"
                >
                  <X className="h-3.5 w-3.5" /> Temizle
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setShowSortDropdown(!showSortDropdown); setShowDeptDropdown(false); setShowStatusDropdown(false); }}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  <ArrowDownUp className="h-3.5 w-3.5" /> {sortOrder === "newest" ? "En Yeni" : "En Eski"} <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 top-11 z-40 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                    <button
                      onClick={() => { setSortOrder("newest"); setShowSortDropdown(false); }}
                      className={`w-full px-4 py-2 text-left text-sm transition ${sortOrder === "newest" ? "bg-blue-50 font-bold text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      En Yeni
                    </button>
                    <button
                      onClick={() => { setSortOrder("oldest"); setShowSortDropdown(false); }}
                      className={`w-full px-4 py-2 text-left text-sm transition ${sortOrder === "oldest" ? "bg-blue-50 font-bold text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      En Eski
                    </button>
                  </div>
                )}
              </div>
              <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex h-full w-9 items-center justify-center rounded-md transition ${viewMode === "grid" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-50"}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex h-full w-9 items-center justify-center rounded-md transition ${viewMode === "list" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-50"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* LISTINGS */}
          <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 min-h-0 pr-1">
            {filteredListings.length === 0 && (
              <div className="py-12 text-center text-sm font-medium text-slate-500 border border-slate-200 border-dashed rounded-2xl">
                {activeTab === "Kaydedilenler" ? "Henüz kaydedilmiş ilan yok." : "Bu kategoride ilan bulunmuyor."}
              </div>
            )}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredListings.map((listing) => {
                  const isSaved = savedIds.has(listing.id);
                  return (
                    <div
                      key={listing.id}
                      className={`relative rounded-xl border border-slate-100 bg-white p-5 transition hover:shadow-md cursor-pointer ${listing.listingType === "shift_transfer" ? "border-l-[3px] border-l-indigo-400" : listing.listingType === "overtime_transfer" ? "border-l-[3px] border-l-amber-400" : "border-l-[3px] border-l-emerald-400"}`}
                      onClick={() => setSelectedListing(listing)}
                    >
                      <button
                        className="absolute top-4 right-4"
                        onClick={(e) => { e.stopPropagation(); toggleSave(listing.id); }}
                      >
                        <Bookmark className={`h-4 w-4 transition ${isSaved ? "fill-blue-500 text-blue-500" : "text-slate-300 hover:text-blue-400"}`} />
                      </button>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${getListingIconBg(listing.listingType)} mb-3`}>
                        {getListingIcon(listing.listingType)}
                      </div>
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest ${getTypeColor(listing.listingType)}`}>
                        {getTypeLabel(listing.listingType)}
                      </span>
                      <h3 className="mt-1 text-sm font-bold text-slate-900 truncate">
                        {listing.shiftDate.split(" ").slice(0, 2).join(" ")} {listing.listingType === "shift_transfer" ? "Gece Nöbeti" : listing.listingType === "swap_request" ? "Nöbet Takası" : "Gündüz Mesaisi"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{listing.departmentName} · {listing.ownerName}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500">{listing.startTime}-{listing.endTime}</span>
                        {getStatusBadge(listing.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              filteredListings.map((listing) => {
              const borderColor = listing.listingType === "shift_transfer" ? "border-l-indigo-400" : listing.listingType === "overtime_transfer" ? "border-l-amber-400" : "border-l-emerald-400";
              return (
                <div
                  key={listing.id}
                  className={`flex items-center rounded-xl border border-slate-100 ${borderColor} border-l-[3px] bg-white px-6 py-5 transition hover:shadow-md cursor-pointer`}
                  onClick={() => setSelectedListing(listing)}
                >
                  {/* ICON */}
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${getListingIconBg(listing.listingType)}`}>
                    {getListingIcon(listing.listingType)}
                  </div>

                  {/* MAIN INFO */}
                  <div className="ml-5 min-w-0 flex-1">
                    <span className={`inline-block rounded-md px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest ${getTypeColor(listing.listingType)}`}>
                      {getTypeLabel(listing.listingType)}
                    </span>
                    <h3 className="mt-1.5 text-[17px] font-bold text-slate-900 leading-snug">
                      {listing.shiftDate.split(" ").slice(0, 2).join(" ")} {listing.listingType === "shift_transfer" ? "Gece Nöbeti" : listing.listingType === "swap_request" ? "Nöbet Takası" : "Gündüz Mesaisi"}
                    </h3>
                    <div className="mt-2 flex items-center gap-5 text-[13px] text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium"><Building2 className="h-4 w-4 text-slate-400" />{listing.departmentName}</span>
                      <span className="flex items-center gap-1.5 font-medium"><User className="h-4 w-4 text-slate-400" />{listing.ownerName}</span>
                      <span className="flex items-center gap-1.5 text-slate-400"><Clock className="h-4 w-4" />{listing.postDate}</span>
                    </div>
                  </div>

                  {/* DATE & TIME & REASON */}
                  <div className="flex w-52 shrink-0 flex-col gap-1.5 border-l border-slate-100 pl-6">
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {listing.shiftDate}
                    </span>
                    <span className="flex items-center gap-2 text-[13px] text-slate-500">
                      <Clock3 className="h-4 w-4 text-slate-400" />
                      {listing.startTime} - {listing.endTime}
                      <span className="text-slate-400">({listing.durationHours} Saat)</span>
                    </span>
                    <span className="mt-1 inline-block w-fit rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                      {listing.reason || "Sebep belirtilmemiş"}
                    </span>
                  </div>

                  {/* APPLICANTS */}
                  <div className="flex w-16 shrink-0 flex-col items-center justify-center border-l border-slate-100 px-4">
                    <span className="text-2xl font-bold text-slate-800">{listing.applicants.length}</span>
                    <span className="text-xs font-medium text-slate-400">Talip</span>
                  </div>

                  {/* STATUS */}
                  <div className="flex shrink-0 items-center justify-center border-l border-slate-100 px-3">
                    {getStatusBadge(listing.status)}
                  </div>

                  {/* DETAY BUTTON */}
                  <button
                    className="ml-2 shrink-0 rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
                    onClick={(e) => { e.stopPropagation(); setSelectedListing(listing); }}
                  >
                    Detay
                  </button>

                  {/* BOOKMARK */}
                  <button
                    className="ml-2 shrink-0 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 transition hover:bg-slate-50"
                    onClick={(e) => { e.stopPropagation(); toggleSave(listing.id); }}
                  >
                    <Bookmark className={`h-4 w-4 transition ${savedIds.has(listing.id) ? "fill-blue-500 text-blue-500" : "text-slate-400 hover:text-blue-500"}`} />
                  </button>
                </div>
              );
            }))
            }
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="w-80 shrink-0 space-y-6">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
          >
            <Plus className="h-5 w-5" /> İlan Oluştur
          </button>

          {/* Hızlı İşlemler */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <h3 className="mb-2 text-sm font-bold text-slate-900">Hızlı İşlemler</h3>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => setIsCreateModalOpen(true)} className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 transition hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600"><Plus className="h-3.5 w-3.5" /></div>
                <span className="text-[11px] font-bold leading-tight text-slate-600">İlan Oluştur</span>
              </button>
              <button onClick={() => setActiveTab("Benim İlanlarım")} className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 transition hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600"><Store className="h-3.5 w-3.5" /></div>
                <span className="text-[11px] font-bold leading-tight text-slate-600">İlanlarım</span>
              </button>
              <button onClick={() => setActiveTab("Talip Olduklarım")} className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 transition hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-600">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><User className="h-3.5 w-3.5" /></div>
                <span className="text-center text-[11px] font-bold leading-tight text-slate-600">Talip Olduklarım</span>
              </button>
              <button onClick={() => setActiveTab("Onay Bekleyenler")} className="relative flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 transition hover:border-amber-100 hover:bg-amber-50 hover:text-amber-600">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600"><Clock3 className="h-3.5 w-3.5" /></div>
                <span className="text-center text-[11px] font-bold leading-tight text-slate-600">Onay Bekleyenler</span>
              </button>
            </div>
          </div>

          {/* Yaklaşan Vardiyalarım */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-slate-900">Yaklaşan Vardiyalarım</h3>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                  <Moon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">29 Nisan Gece Nöbeti</p>
                  <p className="text-[11px] text-slate-500">Ameliyathane · 16:00-00:00</p>
                </div>
                <span className="shrink-0 rounded-md bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-600 uppercase">Devret</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                  <Sun className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">2 Mayıs Gündüz Mesaisi</p>
                  <p className="text-[11px] text-slate-500">Acil Servis · 08:00-16:00</p>
                </div>
                <span className="shrink-0 rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600 uppercase">Devret</span>
              </div>
            </div>
          </div>

          {/* Nasıl Çalışır */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-slate-900">Nasıl Çalışır?</h3>
            <div className="space-y-0">
              {[
                {
                  icon: Plus,
                  title: "İlan Oluştur",
                  description: "Devretmek istediğin nöbet veya mesai için ilan oluştur.",
                  tone: "bg-blue-50 text-blue-600",
                },
                {
                  icon: User,
                  title: "Talip Bul",
                  description: "Uygun personel ilanına talip olur.",
                  tone: "bg-indigo-50 text-indigo-600",
                },
                {
                  icon: Clock3,
                  title: "Onay Süreci",
                  description: "İlan sahibi ve yönetici onayı ile devir tamamlanır.",
                  tone: "bg-violet-50 text-violet-600",
                },
                {
                  icon: CheckCircle2,
                  title: "Vardiya Aktarılır",
                  description: "Vardiya takvime işlenir, tüm taraflara bildirim gider.",
                  tone: "bg-emerald-50 text-emerald-600",
                },
              ].map((step, index, steps) => {
                const StepIcon = step.icon;

                return (
                  <div key={step.title} className="relative flex gap-3 pb-4 last:pb-0">
                    {index < steps.length - 1 ? (
                      <div className="absolute bottom-0 left-5 top-10 w-px bg-slate-200" />
                    ) : null}
                    <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${step.tone}`}>
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">{index + 1}</span>
                        <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* CREATE LISTING MODAL (MVP 1) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Yeni İlan Oluştur</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateListing} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">İlan Tipi</label>
                <select value={formType} onChange={e => setFormType(e.target.value as any)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="shift_transfer">Nöbet Devri</option>
                  <option value="overtime_transfer">Mesai Devri</option>
                  <option value="swap_request">Takas İsteği</option>
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Tarih</label>
                  <input type="text" placeholder="Örn: 5 Mayıs 2026" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:outline-none" required />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Birim</label>
                  <select value={formDept} onChange={e => setFormDept(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:outline-none">
                    <option>Ameliyathane</option>
                    <option>Acil Servis</option>
                    <option>Poliklinik</option>
                    <option>Yoğun Bakım</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Başlangıç</label>
                  <input type="time" value={formStart} onChange={e => setFormStart(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:outline-none" required />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Bitiş</label>
                  <input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:outline-none" required />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Sebep / Not (Opsiyonel)</label>
                <textarea rows={3} value={formReason} onChange={e => setFormReason(e.target.value)} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:outline-none" placeholder="İlan detayları veya takas şartları..." />
              </div>
              <button type="submit" className="mt-2 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700">
                İlanı Yayınla
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LISTING DETAILS & APPLICANTS MODAL (MVP 1) */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className={`p-6 ${getListingIconBg(selectedListing.listingType)}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                    {getListingIcon(selectedListing.listingType)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{getTypeLabel(selectedListing.listingType)}</h2>
                    <p className="text-sm font-medium text-slate-600">{selectedListing.ownerName} • {selectedListing.departmentName}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedListing(null)} className="rounded-full bg-white/50 p-2 text-slate-600 hover:bg-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-6 flex items-center gap-6">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tarih</p>
                  <p className="font-bold text-slate-900">{selectedListing.shiftDate}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Saat</p>
                  <p className="font-bold text-slate-900">{selectedListing.startTime} - {selectedListing.endTime}</p>
                </div>
              </div>
              {selectedListing.reason && (
                <div className="mt-4 bg-white/60 p-3 rounded-xl border border-white">
                  <p className="text-sm font-medium text-slate-700">"{selectedListing.reason}"</p>
                </div>
              )}
            </div>

            <div className="p-6">
              {/* STATUS: COMPLETED */}
              {selectedListing.status === "completed" ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Devir İşlemi Tamamlandı</h3>
                  <p className="text-sm text-slate-500 mt-2">Bu vardiya başarıyla devredilmiştir ve yeni personelin takvimine eklenmiştir.</p>
                </div>
              ) : selectedListing.status === "manager_approval" ? (
                /* STATUS: MANAGER APPROVAL */
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-amber-900">Yönetici Onayı Bekleniyor</h4>
                        <p className="text-xs font-medium text-amber-700 mt-1">
                          İlan sahibi devir teklifini kabul etti. Sistemin aktarımı yapması için yönetici onayı gereklidir.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-2">
                    <button onClick={() => setSelectedListing(null)} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                      Kapat
                    </button>
                    <button onClick={() => handleManagerApprove(selectedListing.id)} className="px-5 py-2.5 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 transition">
                      Aktarımı Onayla
                    </button>
                  </div>
                </div>
              ) : selectedListing.ownerName !== CURRENT_USER ? (
                /* If user is NOT the owner */
                <div className="flex flex-col items-center justify-center py-4">
                  {selectedListing.applicants.find(a => a.name === CURRENT_USER) ? (
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-3">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Başvurunuz Alındı</h3>
                      <p className="text-sm text-slate-500 mt-1">İlan sahibinin onayı bekleniyor.</p>
                    </div>
                  ) : (
                    <div className="w-full text-center">
                      <p className="text-sm text-slate-600 mb-4 font-medium">Bu vardiyayı devralmak için talip olabilirsiniz. Kurallara uygunluğunuz sistem tarafından kontrol edilecektir.</p>
                      
                      {/* MVP 3: Swap Select Logic */}
                      {selectedListing.listingType === "swap_request" && (
                        <div className="mb-4 text-left">
                          <label className="mb-1 block text-sm font-bold text-slate-700">Takas olarak önereceğiniz vardiyanızı seçin:</label>
                          <select 
                            value={swapShiftSelect} 
                            onChange={(e) => setSwapShiftSelect(e.target.value)} 
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-- Vardiya Seçin --</option>
                            <option value="10 Mayis">10 Mayıs Gündüz Mesaisi</option>
                            <option value="14 Mayis">14 Mayıs Gece Nöbeti</option>
                          </select>
                        </div>
                      )}

                      <button 
                        onClick={() => {
                          if (selectedListing.listingType === "swap_request" && !swapShiftSelect) {
                            setNotification("Lütfen takas edeceğiniz vardiyayı seçin.");
                            setTimeout(() => setNotification(null), 3000);
                            return;
                          }
                          handleApply(selectedListing.id);
                        }}
                        disabled={isApplying}
                        className={`w-full flex items-center justify-center gap-2 rounded-xl ${isApplying ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'} py-3.5 text-sm font-bold text-white transition`}
                      >
                        {isApplying ? (
                          <>
                            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                            Uygunluk Kontrol Ediliyor...
                          </>
                        ) : (
                          selectedListing.listingType === "swap_request" ? "Takas Teklifi Gönder" : "İlana Talip Ol"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* If user IS the owner */
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Talipler ({selectedListing.applicants.length})
                    </h3>
                    <button 
                      onClick={() => setShowAiMatches(!showAiMatches)}
                      className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition"
                    >
                      <span>✨</span> AI Eşleşme Önerileri
                    </button>
                  </div>
                  
                  {/* MVP 3: AI MATCHES VIEW */}
                  {showAiMatches && (
                    <div className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-4">
                      <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3">Sistem Tarafından Bulunan Potansiyel Personeller</p>
                      <div className="space-y-2">
                        {MOCK_AI_MATCHES.map((aiMatch) => (
                          <div key={aiMatch.id} className="flex items-center justify-between rounded-xl border border-indigo-100 bg-white p-3 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                                {aiMatch.matchScore}%
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{aiMatch.name}</p>
                                <p className="text-xs font-medium text-slate-500">{aiMatch.role}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setNotification(`${aiMatch.name} personeline teklif gönderildi.`);
                                setTimeout(() => setNotification(null), 3000);
                              }}
                              className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-50 transition"
                            >
                              Teklif Gönder
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedListing.applicants.length === 0 ? (
                    <p className="text-sm text-slate-500 italic text-center py-4">Henüz kimse talip olmadı.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedListing.applicants.map(app => (
                        <div key={app.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{app.name}</p>
                            <p className="text-xs text-slate-500 font-medium">{app.date}</p>
                          </div>
                          {selectedListing.status !== "open" ? (
                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${app.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                              {app.status === 'accepted' ? 'Kabul Edildi' : 'Reddedildi'}
                            </span>
                          ) : (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleAcceptApplicant(selectedListing.id, app.id)}
                                className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition"
                              >
                                Kabul Et
                              </button>
                              <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition">
                                Reddet
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
