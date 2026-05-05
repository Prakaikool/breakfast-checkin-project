"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
          <div className="w-16 h-16 rounded-2xl bg-[#fdeeee] flex items-center justify-center mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c04040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1 className="text-lg font-semibold text-[#2d2d2d] mb-2">Something went wrong</h1>
          <p className="text-sm text-[#9e9e9e] mb-2 leading-relaxed">
            An unexpected error occurred. You can try again or return to the home page.
          </p>

          {/* Error detail */}
          {error.message && (
            <div className="w-full bg-[#f5f5f0] border border-[#e5e5e0] rounded-lg px-4 py-2.5 mb-6 text-left">
              <p className="text-[11px] text-[#9e9e9e] font-mono break-all leading-relaxed">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2.5 w-full mt-2">
            <button
              onClick={reset}
              className="w-full py-2.5 bg-[#6b8a5e] text-white text-sm font-semibold rounded-lg hover:bg-[#5a7a4e] transition-colors"
            >
              Try again
            </button>
            <a
              href="/home"
              className="w-full py-2.5 bg-white border border-[#e5e5e0] text-[#2d2d2d] text-sm font-semibold rounded-lg hover:border-[#c0c0c0] transition-colors text-center"
            >
              Go to Home
            </a>
          </div>

          {error.digest && (
            <p className="text-[10px] text-[#c0c0c0] mt-5">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
