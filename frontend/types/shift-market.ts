export type MarketplaceStatus =
  | "open"
  | "pending_acceptance"
  | "accepted"
  | "manager_approval"
  | "completed"
  | "cancelled"
  | "expired";

export type ShiftMarketApplicant = {
  id: string;
  listingId: string;
  applicantId: string;
  applicantName: string;

  note?: string;

  status: "pending" | "accepted" | "rejected" | "withdrawn";

  createdAt: string;
};

export type ShiftMarketListing = {
  id: string;
  ownerId: string;
  ownerName: string;

  listingType: "shift_transfer" | "overtime_transfer" | "swap_request";

  departmentId: string;
  departmentName: string;

  shiftDate: string;
  startTime: string;
  endTime: string;

  title: string;
  description?: string;

  compensationType?: "none" | "swap" | "bonus" | "custom";
  compensationNote?: string;

  status: MarketplaceStatus;

  applicants: ShiftMarketApplicant[];

  createdAt: string;
  expiresAt?: string;
};
