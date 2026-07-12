import { z } from "zod";

const E164_RE = /^\+[1-9]\d{7,14}$/;

export const requestOtpSchema = z.object({
  phone: z.string().regex(E164_RE, "Enter a valid phone number in international format, e.g. +14155551234")
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(E164_RE),
  code: z.string().length(6),
  username: z.string().regex(/^[a-z0-9_]{3,20}$/i).optional()
});

export const createConversationSchema = z.object({
  username: z.string().min(1)
});

export const createMessageSchema = z.object({
  type: z.enum(["TEXT", "PHOTO"]).default("TEXT"),
  content: z.string().max(4000).optional(),
  mediaUrl: z.string().url().optional(),
  viewOnce: z.boolean().optional()
}).refine((v) => (v.type === "PHOTO" ? !!v.mediaUrl : !!v.content?.trim()), {
  message: "mediaUrl is required for PHOTO messages, content is required for TEXT messages"
});

export const createDataRequestSchema = z.object({
  targetUsername: z.string().min(1),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  legalReference: z.string().optional()
});

export const exportDataSchema = z.object({
  requestId: z.string().min(1)
});

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  take: z.coerce.number().int().min(1).max(100).default(50)
});
