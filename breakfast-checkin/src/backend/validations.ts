// ===========================================
// VALIDATION - Request body schemas (Zod)
// ===========================================

import { z } from 'zod';

// ---- Login ----
export const loginSchema = z.object({
    email: z.string().email('Invalid email').max(254),
    password: z
        .string()
        .min(8,  'Password must be at least 8 characters')
        .max(72, 'Password is too long')
        .refine(s => /[a-z]/.test(s), 'Password must contain at least one lowercase letter')
        .refine(s => /[A-Z]/.test(s), 'Password must contain at least one uppercase letter')
        .refine(s => /\d/.test(s),    'Password must contain at least one number'),
});

// ---- Guest search ----
export const guestSearchSchema = z
    .object({
        room: z.string().max(20).optional(),
        name: z.string().max(100).optional(),
    })
    .refine((data) => data.room || data.name, {
        message: 'Provide either room number or guest name',
    });

// ---- Check-in ----
export const checkInSchema = z.object({
    roomId: z.number().int().positive('Invalid room ID').optional(),
    guestId: z.number().int().positive().optional(),
    adultCount: z.number().int().min(0).max(20, 'Max 20 adults'),
    childCount: z.number().int().min(0).max(20, 'Max 20 children'),
    note: z.string().max(500).optional(),
    overrideDuplicate: z.boolean().optional().default(false),
    isWalkIn: z.boolean().optional().default(false),
}).refine(
    (data) => data.isWalkIn || !!data.roomId,
    { message: 'roomId is required for non-walk-in check-ins', path: ['roomId'] }
);

// ---- Daily log entry ----
export const dailyLogSchema = z.object({
    category: z.enum([
        'SHIFT_NOTE',
        'INCIDENT',
        'VIP',
        'KITCHEN',
        'HOUSEKEEPING',
    ]),
    content: z.string().min(1, 'Content is required').max(1000),
});

// ---- Reminder ----
export const reminderSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format'),
    recurrence: z.enum(['TODAY', 'EVERY_DAY', 'WEEKDAYS']),
});

// ---- Kitchen item status ----
export const kitchenItemSchema = z.object({
    status: z.enum(['AVAILABLE', 'LOW', 'SOLD_OUT']),
});

// ---- Staff creation ----
export const createStaffSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().max(254),
    password: z
        .string()
        .min(8,  'Password must be at least 8 characters')
        .max(72, 'Password is too long')
        .refine(s => /[a-z]/.test(s), 'Password must contain at least one lowercase letter')
        .refine(s => /[A-Z]/.test(s), 'Password must contain at least one uppercase letter')
        .refine(s => /\d/.test(s),    'Password must contain at least one number'),
    role: z.enum(['ADMIN', 'SUPERVISOR', 'ENTRANCE', 'KITCHEN']),
});

// ---- Spa / VIP member creation ----
export const spaMemberSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    // E.164-ish: allow digits, spaces, +, -, parens — max 30 chars
    phone: z.string().max(30).regex(/^[\d\s\+\-\(\)]+$/, 'Invalid phone number').optional().nullable(),
    memberType: z.enum(['SPA', 'VIP']),
    // Accept ISO date/datetime strings and coerce to Date; null means no expiry
    validUntil: z.coerce.date().nullable().optional(),
});

// ---- Instruction section (create / update) ----
// imageUrl must reference a file we uploaded — never an arbitrary external URL.
const UPLOAD_PATH_RE = /^\/uploads\/[\w\-]+\.\w{2,4}$/;
export const instructionSchema = z.object({
    title:    z.string().min(1, 'Title is required').max(200),
    content:  z.string().min(1, 'Content is required').max(50_000),
    imageUrl: z
        .string()
        .regex(UPLOAD_PATH_RE, 'imageUrl must reference an uploaded file (/uploads/…)')
        .nullable()
        .optional(),
});
