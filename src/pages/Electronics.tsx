import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FilterGroup from "@/components/bidding/FilterGroup";
import CountdownTimer from "@/components/bidding/CountdownTimer";
import ReserveIndicator from "@/components/bidding/ReserveIndicator";
import WatchlistButton from "@/components/bidding/WatchlistButton";


const mockElectronics = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80",
    title: "HP EliteBook 840 G5",
    highestBid: 32000,
    reserveMet: true,
    timeLeft: 5400,
    category: "Laptops",
    brand: "HP",
    condition: "Used",
    watched: false,
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80",
    title: "iPhone 12 Pro",
    highestBid: 68000,
    reserveMet: false,
    timeLeft: 3600,
    category: "Phones",
    brand: "Apple",
    condition: "New Repo",
    watched: true,
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
    title: "Samsung 55'' 4K TV",
    highestBid: 45000,
    reserveMet: true,
    timeLeft: 1800,
    category: "TVs",
    brand: "Samsung",
    condition: "Used",
    watched: false,
  },
];

const categories = [
  { label: "All", value: "" },
  { label: "Phones", value: "Phones" },
  { label: "TVs", value: "TVs" },
  { label: "Laptops", value: "Laptops" },
];
const brands = [
  { label: "All", value: "" },
  { label: "HP", value: "HP" },
  { label: "Apple", value: "Apple" },
  { label: "Samsung", value: "Samsung" },
];
const conditions = [
  { label: "All", value: "" },
  { label: "Used", value: "Used" },
  { label: "New Repo", value: "New Repo" },
];
const sortOptions = [
  { label: "Ending soon", value: "ending" },
  { label: "Highest bid", value: "highest" },
  { label: "Lowest price", value: "lowest" },
];

const ElectronicsPage = () => {
  const [category, setCategory] = React.useState("");
  const [brand, setBrand] = React.useState("");
  const [condition, setCondition] = React.useState("");
  const [sort, setSort] = React.useState("ending");
  const [watched, setWatched] = React.useState<{ [id: number]: boolean }>({});

  let filtered = mockElectronics.filter(item =>
    (category ? item.category === category : true) &&
    (brand ? item.brand === brand : true) &&
    (condition ? item.condition === condition : true)
  );
  if (sort === "ending") filtered = filtered.sort((a, b) => a.timeLeft - b.timeLeft);
  if (sort === "highest") filtered = filtered.sort((a, b) => b.highestBid - a.highestBid);
  if (sort === "lowest") filtered = filtered.sort((a, b) => a.highestBid - b.highestBid);

  const handleWatch = (id: number) => {
    setWatched(w => ({ ...w, [id]: !w[id] }));
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-16 pt-24">
        <h1 className="text-3xl font-bold mb-4 flex items-center">📱 Electronics Bidding</h1>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-64 w-full md:sticky top-24">
            <FilterGroup label="Category" options={categories} selected={category} onChange={setCategory} />
            <FilterGroup label="Brand" options={brands} selected={brand} onChange={setBrand} />
            <FilterGroup label="Condition" options={conditions} selected={condition} onChange={setCondition} />
            <FilterGroup label="Sort by" options={sortOptions} selected={sort} onChange={setSort} />
          </aside>
          {/* Main Section */}
          <main className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(item => (
                <div key={item.id} className="bg-white rounded shadow p-4 flex flex-col">
                  <img src={item.image} alt={item.title} className="h-40 w-full object-cover rounded mb-3" />
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg mb-1">{item.title}</h2>
                    <div className="mb-1 text-sm text-gray-500">Current highest bid: <span className="font-bold text-primary">Ksh {item.highestBid.toLocaleString()}</span></div>
                    <div className="mb-1 flex items-center gap-2">
                      <CountdownTimer seconds={item.timeLeft} />
                      <ReserveIndicator met={item.reserveMet} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <button className="bg-primary text-white px-3 py-1 rounded mr-2">Bid Now</button>
                    <WatchlistButton watched={watched[item.id] ?? item.watched} onToggle={() => handleWatch(item.id)} />
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="col-span-full text-center text-muted-foreground">No electronics found.</div>}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ElectronicsPage;
