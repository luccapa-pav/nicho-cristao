export default function PerfilLoading() {
  return (
    <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto animate-pulse">
      <div className="divine-card p-6 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-divine-100 flex-shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-5 w-40 bg-divine-100 rounded-xl" />
          <div className="h-3 w-32 bg-divine-100 rounded-xl" />
          <div className="h-3 w-24 bg-divine-100 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0,1,2].map((i) => (
          <div key={i} className="divine-card p-4 flex flex-col items-center gap-2">
            <div className="h-7 w-10 bg-divine-100 rounded-xl" />
            <div className="h-3 w-12 bg-divine-100 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="divine-card p-5 flex flex-col gap-3">
        <div className="h-5 w-28 bg-divine-100 rounded-xl" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded bg-divine-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
