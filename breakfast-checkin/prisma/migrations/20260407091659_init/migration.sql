-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'SUPERVISOR', 'ENTRANCE', 'KITCHEN');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('OCCUPIED', 'VACANT', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "GuestType" AS ENUM ('HOTEL', 'SPA', 'VIP', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MemberType" AS ENUM ('SPA', 'VIP');

-- CreateEnum
CREATE TYPE "KitchenItemStatus" AS ENUM ('AVAILABLE', 'LOW', 'SOLD_OUT');

-- CreateEnum
CREATE TYPE "ReminderRecurrence" AS ENUM ('TODAY', 'EVERY_DAY', 'WEEKDAYS');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "LogCategory" AS ENUM ('SHIFT_NOTE', 'INCIDENT', 'VIP', 'KITCHEN', 'HOUSEKEEPING');

-- CreateTable
CREATE TABLE "staff" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pin_hash" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'ENTRANCE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" SERIAL NOT NULL,
    "room_number" TEXT NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "max_guests" INTEGER NOT NULL DEFAULT 4,
    "status" "RoomStatus" NOT NULL DEFAULT 'OCCUPIED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "room_id" INTEGER NOT NULL,
    "guest_type" "GuestType" NOT NULL DEFAULT 'HOTEL',
    "is_child" BOOLEAN NOT NULL DEFAULT false,
    "check_in_date" TIMESTAMP(3) NOT NULL,
    "check_out_date" TIMESTAMP(3) NOT NULL,
    "pms_id" TEXT,
    "has_breakfast" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breakfast_sessions" (
    "id" SERIAL NOT NULL,
    "session_date" DATE NOT NULL,
    "start_time" TEXT NOT NULL DEFAULT '07:00',
    "end_time" TEXT NOT NULL DEFAULT '10:30',
    "total_guests" INTEGER NOT NULL DEFAULT 0,
    "total_adults" INTEGER NOT NULL DEFAULT 0,
    "total_children" INTEGER NOT NULL DEFAULT 0,
    "status" "SessionStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breakfast_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "guest_id" INTEGER,
    "staff_id" INTEGER NOT NULL,
    "session_id" INTEGER NOT NULL,
    "adult_count" INTEGER NOT NULL DEFAULT 1,
    "child_count" INTEGER NOT NULL DEFAULT 0,
    "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
    "is_override" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "checked_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spa_members" (
    "id" SERIAL NOT NULL,
    "member_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "member_type" "MemberType" NOT NULL DEFAULT 'SPA',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "valid_until" TIMESTAMP(3),
    "total_visits" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spa_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kitchen_items" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" "KitchenItemStatus" NOT NULL DEFAULT 'AVAILABLE',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitchen_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "recurrence" "ReminderRecurrence" NOT NULL DEFAULT 'TODAY',
    "status" "ReminderStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_log_entries" (
    "id" SERIAL NOT NULL,
    "category" "LogCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "staff_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_room_number_key" ON "rooms"("room_number");

-- CreateIndex
CREATE UNIQUE INDEX "breakfast_sessions_session_date_key" ON "breakfast_sessions"("session_date");

-- CreateIndex
CREATE UNIQUE INDEX "spa_members_member_id_key" ON "spa_members"("member_id");

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "breakfast_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
