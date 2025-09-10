import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/bidding/SearchBar";
import FilterGroup from "@/components/bidding/FilterGroup";
import CountdownTimer from "@/components/bidding/CountdownTimer";
import ReserveIndicator from "@/components/bidding/ReserveIndicator";
import WatchlistButton from "@/components/bidding/WatchlistButton";


const mockCars = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=400&q=80",
    title: "Toyota Axio 2016",
    mileage: 87000,
    engine: "1.5L",
    transmission: "Automatic",
    highestBid: 950000,
    reserve: 1000000,
    reserveMet: false,
    timeLeft: 7200,
    watched: false,
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1465156799763-2c087c332922?auto=format&fit=crop&w=400&q=80",
    title: "Mazda Demio 2018",
    mileage: 42000,
    engine: "1.3L",
    transmission: "Automatic",
    highestBid: 800000,
    reserve: 750000,
    reserveMet: true,
    timeLeft: 3600,
    watched: true,
  },
];

const brands = [
  { label: "All", value: "" },
  { label: "Toyota", value: "Toyota" },
  { label: "Mazda", value: "Mazda" },
];
const years = [
  { label: "All", value: "" },
  { label: "2018", value: "2018" },
  { label: "2016", value: "2016" },
];
const transmissions = [
  { label: "All", value: "" },
  { label: "Automatic", value: "Automatic" },
  { label: "Manual", value: "Manual" },
];
const priceRanges = [
  { label: "All", value: "" },
  { label: "Below 1M", value: "<1000000" },
  { label: "1M - 1.5M", value: "1000000-1500000" },
  { label: "Above 1.5M", value: ">1500000" },
];

const CarsPage = () => {
  const [search, setSearch] = React.useState("");
  const [brand, setBrand] = React.useState("");
  const [year, setYear] = React.useState("");
  const [transmission, setTransmission] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [watched, setWatched] = React.useState<{ [id: number]: boolean }>({});

  // Filter logic (mock)
  const filtered = mockCars.filter(car =>
    (brand ? car.title.includes(brand) : true) &&
    (year ? car.title.includes(year) : true) &&
    (transmission ? car.transmission === transmission : true) &&
    (price ?
      (price === "<1000000" ? car.highestBid < 1000000 :
        price === ">1500000" ? car.highestBid > 1500000 :
        (car.highestBid >= 1000000 && car.highestBid <= 1500000))
      : true
    ) &&
    (search ? car.title.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const handleWatch = (id: number) => {
    setWatched(w => ({ ...w, [id]: !w[id] }));
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-16 pt-24">
        <h1 className="text-3xl font-bold mb-4 flex items-center">🚗 Cars Bidding</h1>
        <div className="mb-6">
          <SearchBar placeholder="Search by make, model…" onSearch={setSearch} />
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="md:w-64 w-full md:sticky top-24">
            <FilterGroup label="Brand" options={brands} selected={brand} onChange={setBrand} />
            <FilterGroup label="Year" options={years} selected={year} onChange={setYear} />
            <FilterGroup label="Transmission" options={transmissions} selected={transmission} onChange={setTransmission} />
            <FilterGroup label="Price Range" options={priceRanges} selected={price} onChange={setPrice} />
          </aside>
          {/* Main Section */}
          <main className="flex-1">
            <div className="divide-y rounded shadow bg-white">
              {filtered.map(car => (
                <div key={car.id} className="flex flex-col md:flex-row items-center gap-4 p-4">
                  <img src={car.image} alt={car.title} className="h-32 w-48 object-cover rounded" />
                  <div className="flex-1 w-full">
                    <h2 className="font-semibold text-lg mb-1">{car.title}</h2>
                    <div className="text-sm text-gray-500 mb-1">Mileage: <span className="font-medium">{car.mileage.toLocaleString()} km</span> | Engine: {car.engine} | {car.transmission}</div>
                    <div className="flex items-center gap-2 mb-1">
                      <span>Current highest bid: <span className="font-bold text-primary">Ksh {car.highestBid.toLocaleString()}</span></span>
                      <span className="ml-2">Reserve: <span className="font-bold">Ksh {car.reserve.toLocaleString()}</span></span>
                      <ReserveIndicator met={car.reserveMet} />
                    </div>
                    <CountdownTimer seconds={car.timeLeft} />
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <button className="bg-primary text-white px-3 py-1 rounded mb-1">View Details / Place Bid</button>
                    <WatchlistButton watched={watched[car.id] ?? car.watched} onToggle={() => handleWatch(car.id)} />
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="p-8 text-center text-muted-foreground">No cars found.</div>}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CarsPage;
