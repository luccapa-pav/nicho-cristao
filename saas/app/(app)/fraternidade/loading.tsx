export default function FraternidadeLoading() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto animate-pulse">
      <div className="h-8 w-48 bg-divine-100 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="divine-card p-5 flex flex-col gap-4">
            <div className="h-5 w-32 bg-divine-100 rounded-xl" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="w-10 h-10 rounded-full bg-divine-100" />
              ))}
            </div>
            <div className="h-4 w-full bg-divine-100 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
