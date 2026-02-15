export default function Results() {
  return (
    <section className="border-2 border-black rounded-[22px] p-4">
      <div className="flex flex-col gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-4">
            Game Card
          </div>
        ))}
      </div>
    </section>
  )
}