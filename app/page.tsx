"use client";

import { useState } from "react";
import Header from "@/components/Header"
import Title from "@/components/Title"
import Filters, { playStyleOptions, gameTypeOptions, filterOptions } from "@/components/Filters"
import Search from "@/components/Search"
import Results from "@/components/Results"
import Sidebar from "@/components/Sidebar"
import Footer from "@/components/Footer"

export default function Home() {
  // Lifting state up so Results can eventually use these for API calls
  const [selectedPlayStyles, setSelectedPlayStyles] = useState<string[]>(playStyleOptions);
  const [selectedGameTypes, setSelectedGameTypes] = useState<string[]>(gameTypeOptions);
  // Defaulting to "Hide All" problematic content for maximum safety
  const [selectedFilters, setSelectedFilters] = useState<string[]>(filterOptions);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["windows", "macos", "linux"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSort, setSelectedSort] = useState("Popular new releases");

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
            <Results />
          </div>

          <Sidebar />
        </div>
      </section>

      <Footer />
    </main>
  )
}