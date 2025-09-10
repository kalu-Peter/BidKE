import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/bidding/SearchBar";
import FilterGroup from "@/components/bidding/FilterGroup";
import CountdownTimer from "@/components/bidding/CountdownTimer";
import ReserveIndicator from "@/components/bidding/ReserveIndicator";
import WatchlistButton from "@/components/bidding/WatchlistButton";


const mockBikes = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1518655048521-f130df041f66?auto=format&fit=crop&w=400&q=80",
    title: "Bajaj Boxer 150cc, 2022",
    highestBid: 68000,
    reserveMet: true,
    timeLeft: 9900,
    category: "Boda Boda",
    condition: "Used",
    watched: false,
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=400&q=80",
    title: "TVS HLX 125, 2021",
    highestBid: 54000,
    reserveMet: false,
    timeLeft: 7200,
    category: "Scooters",
    condition: "New Repo",
    watched: true,
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1465156799763-2c087c332922?auto=format&fit=crop&w=400&q=80",
    title: "Yamaha R15, 2020",
    highestBid: 120000,
    reserveMet: true,
    timeLeft: 3600,
    category: "Sports Bikes",
    condition: "Accident",
    watched: false,
  },
];

const categories = [
  { label: "All", value: "" },
  { label: "Scooters", value: "Scooters" },
  { label: "Boda Boda", value: "Boda Boda" },
  { label: "Sports Bikes", value: "Sports Bikes" },
];
const conditions = [
  { label: "All", value: "" },
  { label: "Used", value: "Used" },
  { label: "Accident", value: "Accident" },
  { label: "New Repo", value: "New Repo" },
];
const brands = [
  { label: "All", value: "" },
  { label: "Bajaj", value: "Bajaj" },
  { label: "TVS", value: "TVS" },
  { label: "Yamaha", value: "Yamaha" },
];
const years = [
  { label: "All", value: "" },
  { label: "2022", value: "2022" },
  { label: "2021", value: "2021" },
  { label: "2020", value: "2020" },
];

const MotorbikesPage = () => {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [condition, setCondition] = React.useState("");
  const [brand, setBrand] = React.useState("");
  const [year, setYear] = React.useState("");
  const [watched, setWatched] = React.useState<{ [id: number]: boolean }>({});

  // Filter logic (mock)
  const filtered = mockBikes.filter(bike =>
    (category ? bike.category === category : true) &&
    (condition ? bike.condition === condition : true) &&
    (brand ? bike.title.includes(brand) : true) &&
    (year ? bike.title.includes(year) : true) &&
    (search ? bike.title.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const handleWatch = (id: number) => {
    setWatched(w => ({ ...w, [id]: !w[id] }));
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-16 pt-24">
        <h1 className="text-3xl font-bold mb-4 flex items-center">🏍️ Motorbike Bidding</h1>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-64 w-full md:sticky top-24">
            <div className="mb-6">
              <SearchBar placeholder="Search by model, year…" onSearch={setSearch} />
            </div>
            <FilterGroup label="Category" options={categories} selected={category} onChange={setCategory} />
            <FilterGroup label="Condition" options={conditions} selected={condition} onChange={setCondition} />
            <FilterGroup label="Brand" options={brands} selected={brand} onChange={setBrand} />
            <FilterGroup label="Year" options={years} selected={year} onChange={setYear} />
          </aside>
          {/* Main Section */}
          <main className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(bike => (
                <div key={bike.id} className="bg-white rounded shadow p-4 flex flex-col">
                  <img src={bike.image} alt={bike.title} className="h-40 w-full object-cover rounded mb-3" />
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg mb-1">{bike.title}</h2>
                    <div className="mb-1 text-sm text-gray-500">Current highest bid: <span className="font-bold text-primary">Ksh {bike.highestBid.toLocaleString()}</span></div>
                    <div className="mb-1 flex items-center gap-2">
                      <CountdownTimer seconds={bike.timeLeft} />
                      <ReserveIndicator met={bike.reserveMet} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <button className="bg-primary text-white px-3 py-1 rounded mr-2">Place Bid</button>
                    <WatchlistButton watched={watched[bike.id] ?? bike.watched} onToggle={() => handleWatch(bike.id)} />
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="col-span-full text-center text-muted-foreground">No motorbikes found.</div>}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MotorbikesPage;
