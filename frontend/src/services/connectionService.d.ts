
import type { Connection } from "../types";

export function getMyConnections(): Promise<Connection[]>;

export function getConnection(
  connectionId: string
): Promise<Connection>;

export function confirmLivingTogether(
  connectionId: string
): Promise<{
  status: Connection["status"];
  alreadyConfirmed?: boolean;
  confirmedBy?: string[];
  deadlineCreated?: boolean;
}>;

export function endRoommateConnection(
  connectionId: string
): Promise<{
  success: boolean;
  reviewWindowPreserved: boolean;
}>;