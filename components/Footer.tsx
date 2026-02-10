export default function Footer() {
  return (
    <footer className="mt-10 border-t bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6 text-sm text-gray-500">
        © {new Date().getFullYear()} PlaySafe.games
      </div>
    </footer>
  )
}