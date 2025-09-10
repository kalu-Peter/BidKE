import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Edit, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";

const ListingsTab: React.FC = () => {
  // Mock data
  const listings = [
    {
      id: 1,
      title: "Toyota Axio 2016",
      category: "Cars",
      reservePrice: 900000,
      currentBid: 950000,
      bids: 12,
      timeLeft: "2h 15m",
      status: "active",
      image: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: 2,
      title: "Bajaj Boxer 150cc",
      category: "Motorbikes",
      reservePrice: 60000,
      currentBid: 68000,
      bids: 8,
      timeLeft: "1d 5h",
      status: "active",
      image: "https://images.unsplash.com/photo-1518655048521-f130df041f66?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: 3,
      title: "HP EliteBook 840 G5",
      category: "Electronics",
      reservePrice: 30000,
      currentBid: 35000,
      bids: 5,
      timeLeft: "Ended",
      status: "sold",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: 4,
      title: "MacBook Pro 2019",
      category: "Electronics",
      reservePrice: 80000,
      currentBid: 0,
      bids: 0,
      timeLeft: "Pending",
      status: "pending",
      image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: 5,
      title: "Honda Civic 2018",
      category: "Cars",
      reservePrice: 1200000,
      currentBid: 0,
      bids: 0,
      timeLeft: "Ended",
      status: "ended",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80"
    }
  ];

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { label: "Active", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
      pending: { label: "Pending Review", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3" /> },
      sold: { label: "Sold", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-3 h-3" /> },
      ended: { label: "Ended", color: "bg-gray-100 text-gray-800", icon: <XCircle className="w-3 h-3" /> }
    };
    return configs[status as keyof typeof configs] || configs.ended;
  };

  const handleViewListing = (id: number) => {
    console.log("View listing:", id);
  };

  const handleEditListing = (id: number) => {
    console.log("Edit listing:", id);
  };

  const handleDeleteListing = (id: number) => {
    console.log("Delete listing:", id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>My Listings</span>
        </CardTitle>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Manage your auction items and track their performance
          </p>
          <Badge variant="outline">
            {listings.length} Total Listings
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {listings.map((listing) => (
            <div key={listing.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
              <img 
                src={listing.image} 
                alt={listing.title} 
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-lg">{listing.title}</h3>
                  <Badge variant="outline">{listing.category}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <span>Reserve: Ksh {listing.reservePrice.toLocaleString()}</span>
                  <span>
                    Current: {listing.currentBid > 0 
                      ? `Ksh ${listing.currentBid.toLocaleString()}` 
                      : "No bids yet"
                    }
                  </span>
                  <span>Bids: {listing.bids}</span>
                  <span>Time: {listing.timeLeft}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusBadge(listing.status).color}>
                  <div className="flex items-center space-x-1">
                    {getStatusBadge(listing.status).icon}
                    <span>{getStatusBadge(listing.status).label}</span>
                  </div>
                </Badge>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewListing(listing.id)}
                  title="View listing"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditListing(listing.id)}
                  title="Edit listing"
                  disabled={listing.status === 'sold'}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                {listing.status === 'pending' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteListing(listing.id)}
                    title="Delete listing"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {listings.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings yet</h3>
            <p className="text-gray-600 mb-4">Start by posting your first auction item</p>
            <Button>Post New Item</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ListingsTab;
