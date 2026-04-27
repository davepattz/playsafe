"use client";

import { useState } from "react";
import Header from "@/components/Header"
import Title from "@/components/Title"
import Filters from "@/components/Filters"
import Featured, { type FeaturedOption } from "@/components/Featured"
import Search from "@/components/Search"
import Results from "@/components/Results"
import Sidebar from "@/components/Sidebar"
import Footer from "@/components/Footer"
import { filterOptions, gameTypeOptions, playStyleOptions } from "@/lib/filterOptions";

export default function Home() {
  // Lifting state up so Results can eventually use these for API calls
  const [selectedPlayStyles, setSelectedPlayStyles] = useState<string[]>(playStyleOptions);
  const [selectedGameTypes, setSelectedGameTypes] = useState<string[]>(gameTypeOptions);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(filterOptions);
  const [applyPopularFilters, setApplyPopularFilters] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSort, setSelectedSort] = useState("Newest to oldest");
  const [selectedFeatured, setSelectedFeatured] = useState<FeaturedOption>("popular");
  const updateSelectedPlayStyles: typeof setSelectedPlayStyles = (value) => {
    setApplyPopularFilters(true);
    setSelectedPlayStyles(value);
  };
  const updateSelectedGameTypes: typeof setSelectedGameTypes = (value) => {
    setApplyPopularFilters(true);
    setSelectedGameTypes(value);
  };
  const updateSelectedFilters: typeof setSelectedFilters = (value) => {
    setApplyPopularFilters(true);
    setSelectedFilters(value);
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="max-w-[1222px] mx-auto px-0">
        <Title />
        <Filters 
          selectedPlayStyles={selectedPlayStyles}
          setSelectedPlayStyles={updateSelectedPlayStyles}
          selectedGameTypes={selectedGameTypes}
          setSelectedGameTypes={updateSelectedGameTypes}
          selectedFilters={selectedFilters}
          setSelectedFilters={updateSelectedFilters}
        />
        <Search 
          selectedPlatforms={selectedPlatforms}
          setSelectedPlatforms={setSelectedPlatforms}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedSort={selectedSort}
          setSelectedSort={setSelectedSort}
        />
        <Featured
          selectedFeatured={selectedFeatured}
          setSelectedFeatured={setSelectedFeatured}
        />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Results
              selectedGameTypes={selectedGameTypes}
              selectedPlayStyles={selectedPlayStyles}
              selectedFilters={selectedFilters}
              selectedPlatforms={selectedPlatforms}
              applyPopularFilters={applyPopularFilters}
              searchQuery={searchQuery}
              selectedSort={selectedSort}
              selectedFeatured={selectedFeatured}
            />
          </div>

          <Sidebar />
        </div>
      </section>

      <Footer />
    </main>
  )
}
