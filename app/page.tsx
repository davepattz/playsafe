import Header from "@/components/Header"
import Filters from "@/components/Filters"
import Search from "@/components/Search"
import Results from "@/components/Results"
import Sidebar from "@/components/Sidebar"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="max-w-[1222px] mx-auto px-0">
        <Filters />
        <Search />

        
      </section>

      <Footer />
    </main>
  )
}