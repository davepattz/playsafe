export default function Search() {
  return (
    <div className="mt-4 flex flex-wrap gap-4">
      <input className="flex-1 border rounded p-2" placeholder="Search games..." />
      <select className="border rounded p-2">
        <option>Platform</option>
      </select>
      <select className="border rounded p-2">
        <option>Sort</option>
      </select>
    </div>
  )
}