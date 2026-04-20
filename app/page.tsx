import Header from "@/components/Header"
import Leaderboard from "@/components/Leaderboard"
import Filters from "@/components/Filters"
import Search from "@/components/Search"
import Platform from "@/components/Platform"
import Footer from "@/components/Footer"
import Title from "@/components/Title"

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Header />
      <Leaderboard />

      <section className="max-w-[1222px] mx-auto px-0">
        <Title />
        <Filters />
        <Search />
        <Platform />

        
      </section>

      <Footer />
    </main>
  )
}