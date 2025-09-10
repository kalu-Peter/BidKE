import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "@/components/dashboard/StatsCard";
import { 
  Plus, 
  FileText, 
  BarChart3, 
  DollarSign,
  Eye,
  CheckCircle,
  Clock
} from "lucide-react";

interface OverviewTabProps {
  onTabChange: (tab: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ onTabChange }) => {
  // Mock data
  const stats = {
    activeListings: 8,
    totalSales: 15,
    pendingPayouts: 285000,
    thisMonthRevenue: 520000
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Listings"
          value={stats.activeListings}
          icon={<FileText className="w-6 h-6" />}
          change="+2 this week"
          changeType="positive"
        />
        <StatsCard
          title="Total Sales"
          value={stats.totalSales}
          icon={<BarChart3 className="w-6 h-6" />}
          change="+3 this month"
          changeType="positive"
        />
        <StatsCard
          title="Pending Payouts"
          value={`Ksh ${stats.pendingPayouts.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6" />}
          subtitle="2 payments pending"
        />
        <StatsCard
          title="This Month Revenue"
          value={`Ksh ${stats.thisMonthRevenue.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6" />}
          change="+12% vs last month"
          changeType="positive"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-16" onClick={() => onTabChange("post-item")}>
              <div className="text-center">
                <Plus className="w-6 h-6 mx-auto mb-1" />
                <span>Post New Item</span>
              </div>
            </Button>
            <Button variant="outline" className="h-16" onClick={() => onTabChange("listings")}>
              <div className="text-center">
                <FileText className="w-6 h-6 mx-auto mb-1" />
                <span>Manage Listings</span>
              </div>
            </Button>
            <Button variant="outline" className="h-16" onClick={() => onTabChange("sales")}>
              <div className="text-center">
                <DollarSign className="w-6 h-6 mx-auto mb-1" />
                <span>View Payouts</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bidding Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bidding & Buying</CardTitle>
          <p className="text-sm text-gray-600">
            As a verified seller, you can also participate in auctions as a buyer
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-16" onClick={() => onTabChange("browse")}>
              <div className="text-center">
                <Eye className="w-6 h-6 mx-auto mb-1" />
                <span>Browse Auctions</span>
              </div>
            </Button>
            <Button variant="outline" className="h-16" onClick={() => onTabChange("my-bids")}>
              <div className="text-center">
                <BarChart3 className="w-6 h-6 mx-auto mb-1" />
                <span>My Bids</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium">HP EliteBook 840 G5 sold for Ksh 35,000</p>
                <p className="text-sm text-gray-600">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">New bid received on Toyota Axio 2016</p>
                <p className="text-sm text-gray-600">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium">Bajaj Boxer 150cc auction ending in 1 day</p>
                <p className="text-sm text-gray-600">6 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
