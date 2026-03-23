export default function OracaoLoading() {
  return (
    <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto animate-pulse">
      <div className="h-8 w-40 bg-divine-100 rounded-2xl" />
      <div className="divine-card p-5 flex flex-col gap-3">
        <div className="h-5 w-36 bg-divine-100 rounded-xl" />
        <div className="h-10 w-full bg-divine-100 rounded-2xl" />
        <div className="h-20 w-full bg-divine-100 rounded-2xl" />
        <div className="h-10 w-full bg-divine-100 rounded-2xl" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="divine-card p-4 flex gap-3">
          <div className="w-10 h-10 rounded-full bg-divine-100 flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 w-3/4 bg-divine-100 rounded-xl" />
            <div className="h-3 w-1/2 bg-divine-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
