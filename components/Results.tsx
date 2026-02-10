export default function Results() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white p-4 rounded shadow">
          Game Card
        </div>
      ))}
    </div>
  )
}