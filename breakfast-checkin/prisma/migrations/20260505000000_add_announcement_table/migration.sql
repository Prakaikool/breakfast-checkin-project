-- CreateTable
CREATE TABLE "announcements" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- Enable Row Level Security (blocks direct PostgREST access)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
