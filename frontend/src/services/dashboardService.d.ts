
export interface FirebaseDashboardStats {
  pendingRequests: number;
  outgoingRequests: number;
  activeConnections: number;
  pendingReviews: number;
  reviewsWritten: number;
  reviewsReceived: number;
}

export interface FirebaseActivityRecord {
  id: string;
  type:
    | "incoming_request"
    | "outgoing_request"
    | "connection"
    | "review_submitted";
  status: string;
  date: string | null;
  data: Record<string, unknown>;
}

export function getDashboardStats(): Promise<FirebaseDashboardStats>;

export function getRecentActivity(): Promise<
  FirebaseActivityRecord[]
>;