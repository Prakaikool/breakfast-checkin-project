export default function Loading() {
  return (
    <div className="bg-[#f5f5f0] min-h-screen flex flex-col">
      {/* Skeleton top bar */}
      <div className="bg-white border-b border-[#e5e5e0] h-15 flex items-center justify-between px-7">
        <div className="flex flex-col gap-1.5">
          <div className="h-3.5 w-36 bg-[#e5e5e0] rounded animate-pulse" />
          <div className="h-2.5 w-24 bg-[#eeeeea] rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-28 bg-[#eeeeea] rounded animate-pulse" />
          <div className="h-8 w-32 bg-[#e5e5e0] rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Skeleton tab strip */}
      <div className="bg-white border-b border-[#e5e5e0] px-7 py-3">
        <div className="h-3 w-16 bg-[#e5e5e0] rounded animate-pulse" />
      </div>

      <div className="p-7 flex flex-col gap-5">
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#e5e5e0] rounded-xl px-5 py-4 flex flex-col gap-2">
              <div className="h-2.5 w-20 bg-[#eeeeea] rounded animate-pulse" />
              <div className="h-7 w-12 bg-[#e5e5e0] rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Skeleton two-column section */}
        <div className="grid grid-cols-2 gap-5">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white border border-[#e5e5e0] rounded-xl p-5">
              <div className="h-3 w-28 bg-[#e5e5e0] rounded animate-pulse mb-5" />
              <div className="flex items-end gap-2 h-16">
                {[...Array(7)].map((_, j) => (
                  <div
                    key={j}
                    className="flex-1 bg-[#e5e5e0] rounded animate-pulse"
                    style={{ height: `${30 + Math.sin(j * 1.4) * 25 + 25}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton table */}
        <div className="bg-white border border-[#e5e5e0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e5e5e0]">
            <div className="h-3 w-28 bg-[#e5e5e0] rounded animate-pulse" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#f0f0eb] last:border-0">
              <div className="h-2.5 w-28 bg-[#eeeeea] rounded animate-pulse" />
              <div className="h-2.5 w-10 bg-[#eeeeea] rounded animate-pulse" />
              <div className="h-2.5 w-10 bg-[#eeeeea] rounded animate-pulse" />
              <div className="h-2.5 w-10 bg-[#eeeeea] rounded animate-pulse" />
              <div className="h-5 w-16 bg-[#e8efe5] rounded-full animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
