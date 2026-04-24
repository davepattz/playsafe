"use client";

import { useState } from "react";
import Header from "@/components/Header"
import Title from "@/components/Title"
import Filters from "@/components/Filters"
import Search from "@/components/Search"
import Results from "@/components/Results"
import Sidebar from "@/components/Sidebar"
import Footer from "@/components/Footer"
import { filterOptions, gameTypeOptions, playStyleOptions } from "@/lib/filterOptions"

export default function Home() {
  // Lifting state up so Results can eventually use these for API calls
  const [selectedPlayStyles, setSelectedPlayStyles] = useState<string[]>([]);
  const [selectedGameTypes, setSelectedGameTypes] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSort, setSelectedSort] = useState("Newest releases");

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="max-w-[1222px] mx-auto px-0">
        <Title />
        <Filters 
          selectedPlayStyles={selectedPlayStyles}
          setSelectedPlayStyles={setSelectedPlayStyles}
          selectedGameTypes={selectedGameTypes}
          setSelectedGameTypes={setSelectedGameTypes}
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
        />
        <Search 
          selectedPlatforms={selectedPlatforms}
          setSelectedPlatforms={setSelectedPlatforms}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedSort={selectedSort}
          setSelectedSort={setSelectedSort}
        />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Results
              selectedGameTypes={selectedGameTypes}
              selectedPlayStyles={selectedPlayStyles}
              selectedFilters={selectedFilters}
              selectedPlatforms={selectedPlatforms}
              searchQuery={searchQuery}
              selectedSort={selectedSort}
            />
          </div>

          <Sidebar />
        </div>
      </section>

      <Footer />
    </main>
  )
}
