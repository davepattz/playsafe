import Header from "@/components/Header"
import Filters from "@/components/Filters"
import Search from "@/components/Search"
import Results from "@/components/Results"
import Sidebar from "@/components/Sidebar"
import Footer from "@/components/Footer"

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Filters />
        <Search />

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <Results />
          <Sidebar />
        </section>
      </main>

      <Footer />
    </>
  )
}
