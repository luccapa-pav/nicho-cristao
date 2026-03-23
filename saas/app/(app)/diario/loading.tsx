export default function DiarioLoading() {
  return (
    <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto animate-pulse">
      <div className="h-8 w-32 bg-divine-100 rounded-2xl" />
      <div className="divine-card p-5 flex flex-col gap-3">
        <div className="h-5 w-48 bg-divine-100 rounded-xl" />
        <div className="flex gap-2">
          {[0,1,2,3].map((i) => <div key={i} className="h-9 flex-1 bg-divine-100 rounded-2xl" />)}
        </div>
        <div className="h-24 w-full bg-divine-100 rounded-2xl" />
        <div className="h-10 w-full bg-divine-100 rounded-2xl" />
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="divine-card p-4 flex flex-col gap-2">
          <div className="h-4 w-1/3 bg-divine-100 rounded-xl" />
          <div className="h-3 w-full bg-divine-100 rounded-xl" />
          <div className="h-3 w-4/5 bg-divine-100 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
