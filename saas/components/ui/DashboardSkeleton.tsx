export function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-8 md:px-16 py-8 md:py-12 space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex flex-col items-center gap-4">
        <div className="h-3 w-32 bg-divine-100 rounded-full" />
        <div className="h-10 w-64 bg-divine-100 rounded-2xl" />
        <div className="h-3 w-48 bg-divine-100 rounded-full" />
      </div>

      <div className="h-px bg-divine-100" />

      {/* Section 01 label */}
      <div className="flex flex-col items-center gap-2">
        <div className="h-2 w-6 bg-divine-100 rounded-full" />
        <div className="h-6 w-48 bg-divine-100 rounded-xl" />
        <div className="h-px w-8 bg-divine-100" />
      </div>

      {/* Row 1: Streak + AudioPlayer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 h-72 bg-divine-100/60 rounded-2xl" />
        <div className="lg:col-span-2 h-72 bg-divine-100/60 rounded-2xl" />
      </div>

      {/* Row 2: VerseCard + CellGroup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 h-44 bg-divine-100/60 rounded-2xl" />
        <div className="lg:col-span-2 h-44 bg-divine-100/60 rounded-2xl" />
      </div>

      <div className="h-px bg-divine-100" />

      {/* Section 02 label */}
      <div className="flex flex-col items-center gap-2">
        <div className="h-2 w-6 bg-divine-100 rounded-full" />
        <div className="h-6 w-56 bg-divine-100 rounded-xl" />
        <div className="h-px w-8 bg-divine-100" />
      </div>

      {/* Row 3: PrayerList + GratitudeFeed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-divine-100/60 rounded-2xl" />
        <div className="h-64 bg-divine-100/60 rounded-2xl" />
      </div>
    </div>
  );
}
