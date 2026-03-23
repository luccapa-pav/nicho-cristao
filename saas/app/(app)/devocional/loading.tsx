export default function DevocionalLoading() {
  return (
    <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto animate-pulse">
      <div className="h-8 w-40 bg-divine-100 rounded-2xl" />
      <div className="divine-card p-6 flex flex-col gap-4">
        <div className="h-6 w-2/3 bg-divine-100 rounded-xl" />
        <div className="h-4 w-full bg-divine-100 rounded-xl" />
        <div className="h-4 w-5/6 bg-divine-100 rounded-xl" />
        <div className="h-12 w-full bg-divine-100 rounded-2xl mt-2" />
        <div className="h-10 w-full bg-divine-100 rounded-2xl" />
      </div>
    </div>
  );
}
