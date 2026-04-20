export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-black">
      <div className="max-w-7xl mx-auto px-4 py-12 text-sm text-white text-center">
        © {new Date().getFullYear()} PlaySafe.games
      </div>
    </footer>
  )
}