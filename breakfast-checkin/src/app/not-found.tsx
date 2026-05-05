import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-[#f5f5f0] min-h-screen flex flex-col">
      {/* Minimal top bar */}
      <div className="bg-white border-b border-[#e5e5e0] h-15 flex items-center px-7">
        <span className="text-sm font-semibold text-[#2d2d2d]">Breakfast Check-In</span>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center p-7">
        <div className="bg-white border border-[#e5e5e0] rounded-2xl p-12 flex flex-col items-center text-center max-w-sm w-full">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#e8efe5] flex items-center justify-center mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b8a5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="11" />
              <line x1="11" y1="14" x2="11.01" y2="14" />
            </svg>
          </div>

          {/* 404 number */}
          <p className="text-[64px] font-bold text-[#6b8a5e] leading-none mb-3">404</p>

          <h1 className="text-lg font-semibold text-[#2d2d2d] mb-2">Page not found</h1>
          <p className="text-sm text-[#9e9e9e] mb-8 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <Link
            href="/home"
            className="w-full py-2.5 bg-[#6b8a5e] text-white text-sm font-semibold rounded-lg hover:bg-[#5a7a4e] transition-colors text-center"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
