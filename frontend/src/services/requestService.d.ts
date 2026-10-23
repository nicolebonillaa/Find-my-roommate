
import type { RoommateRequest } from "../types";

export function sendRoommateRequest(
  receiverId: string,
  message?: string
): Promise<{
  id: string;
  senderId: string;
  receiverId: string;
  status: "pending";
}>;

export function getIncomingRequests(): Promise<RoommateRequest[]>;

export function getOutgoingRequests(): Promise<RoommateRequest[]>;

export function respondToRequest(
  requestId: string,
  response: "accepted" | "declined"
): Promise<{
  requestId: string;
  connectionId?: string;
  status: "accepted" | "declined";
}>;

export function cancelOutgoingRequest(
  requestId: string
): Promise<{
  success: boolean;
  requestId: string;
  status: "ended";
}>;