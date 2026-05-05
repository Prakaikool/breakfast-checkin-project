"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/frontend/hooks/useAuth";

export default function LoginForm() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      router.push("/home");
    } else {
      setError(result.error || "Login failed. Check your email and password.");
    }
    setLoading(false);
  };

  return (
    <div className="w-100 bg-white rounded-2xl shadow-sm border border-[#e5e5e0] p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-[#9e9e9e] uppercase tracking-wide mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@hotel.com"
            autoComplete="email"
            required
            className="w-full px-4 py-3 border border-[#e5e5e0] rounded-xl text-sm text-[#2d2d2d] placeholder:text-[#c0c0c0] focus:outline-none focus:ring-2 focus:ring-[#6b8a5e]/30 focus:border-[#6b8a5e] transition-colors"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-[#9e9e9e] uppercase tracking-wide mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              minLength={8}
              required
              className="w-full px-4 py-3 pr-11 border border-[#e5e5e0] rounded-xl text-sm text-[#2d2d2d] placeholder:text-[#c0c0c0] focus:outline-none focus:ring-2 focus:ring-[#6b8a5e]/30 focus:border-[#6b8a5e] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e] hover:text-[#6b6b6b] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-[#b0b0b0]">
            Min 8 characters - uppercase, lowercase and number required
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-[#fdeeee] border border-[#f5c0c0] text-[#c04040] text-sm px-3 py-2.5 rounded-lg">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M7 4v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full py-3 bg-[#6b8a5e] text-white rounded-xl text-sm font-bold hover:bg-[#5a7a4e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Signing in…
            </span>
          ) : "Sign In"}
        </button>

        <p className="text-center text-xs text-[#c0c0c0]">
          Contact your administrator if you need access
        </p>
      </form>
    </div>
  );
}
