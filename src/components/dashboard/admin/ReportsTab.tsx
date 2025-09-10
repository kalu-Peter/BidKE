import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Filter,
  PieChart,
  Activity,
  Target,
  ShoppingBag,
  User
} from "lucide-react";

const ReportsTab: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState("overview");
  const [dateRange, setDateRange] = useState("month");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);

  // Mock data for reports
  const reportData = {
    overview: {
      title: "Platform Overview",
      period: "January 2024",
      metrics: [
        {
          label: "Total Revenue",
          value: "Ksh 2,450,000",
          change: "+15.2%",
          trend: "up",
          details: "Commission fees, listing fees, and other charges"
        },
        {
          label: "Active Users",
          value: "1,247",
          change: "+8.5%",
          trend: "up",
          details: "Users who logged in or participated in auctions"
        },
        {
          label: "Successful Auctions",
          value: "156",
          change: "+12.3%",
          trend: "up",
          details: "Auctions that received bids and completed successfully"
        },
        {
          label: "Avg Transaction Value",
          value: "Ksh 345,000",
          change: "-2.1%",
          trend: "down",
          details: "Average value of completed auction sales"
        },
        {
          label: "New Registrations",
          value: "89",
          change: "+25.6%",
          trend: "up",
          details: "New user accounts created this period"
        },
        {
          label: "Conversion Rate",
          value: "23.4%",
          change: "+3.2%",
          trend: "up",
          details: "Percentage of listings that result in successful sales"
        }
      ],
      charts: [
        {
          type: "revenue_trend",
          title: "Revenue Trend",
          data: [
            { month: "Aug", revenue: 1800000, transactions: 120 },
            { month: "Sep", revenue: 2100000, transactions: 135 },
            { month: "Oct", revenue: 1950000, transactions: 128 },
            { month: "Nov", revenue: 2200000, transactions: 142 },
            { month: "Dec", revenue: 2350000, transactions: 151 },
            { month: "Jan", revenue: 2450000, transactions: 156 }
          ]
        },
        {
          type: "user_growth",
          title: "User Growth",
          data: [
            { month: "Aug", total: 986, new: 67 },
            { month: "Sep", total: 1045, new: 59 },
            { month: "Oct", total: 1098, new: 53 },
            { month: "Nov", total: 1167, new: 69 },
            { month: "Dec", total: 1213, new: 46 },
            { month: "Jan", total: 1247, new: 89 }
          ]
        }
      ]
    },
    financial: {
      title: "Financial Performance",
      period: "January 2024",
      metrics: [
        {
          label: "Total Transaction Volume",
          value: "Ksh 45,670,000",
          change: "+18.7%",
          trend: "up",
          breakdown: {
            "Auction Sales": "Ksh 42,340,000",
            "Listing Fees": "Ksh 78,000",
            "Commission": "Ksh 3,252,000"
          }
        },
        {
          label: "Platform Commission",
          value: "Ksh 1,825,000",
          change: "+16.2%",
          trend: "up",
          breakdown: {
            "5% Commission": "Ksh 1,680,000",
            "3% Commission": "Ksh 145,000"
          }
        },
        {
          label: "Processing Fees",
          value: "Ksh 156,000",
          change: "+12.8%",
          trend: "up",
          breakdown: {
            "M-Pesa": "Ksh 89,000",
            "Bank Transfer": "Ksh 45,000",
            "Credit Card": "Ksh 22,000"
          }
        },
        {
          label: "Refunds Processed",
          value: "Ksh 89,000",
          change: "-15.3%",
          trend: "down",
          breakdown: {
            "Item Issues": "Ksh 56,000",
            "Shipping Problems": "Ksh 23,000",
            "Other": "Ksh 10,000"
          }
        }
      ],
      paymentMethods: [
        { method: "M-Pesa", volume: 28500000, percentage: 62.4, transactions: 98 },
        { method: "Bank Transfer", volume: 12800000, percentage: 28.0, transactions: 34 },
        { method: "Credit Card", volume: 4370000, percentage: 9.6, transactions: 24 }
      ]
    },
    categories: {
      title: "Category Performance",
      period: "January 2024",
      categories: [
        {
          name: "Cars",
          listings: 45,
          sold: 32,
          revenue: "Ksh 18,450,000",
          avgPrice: "Ksh 576,562",
          conversionRate: "71.1%",
          trend: "up",
          change: "+5.2%"
        },
        {
          name: "Motorbikes",
          listings: 38,
          sold: 25,
          revenue: "Ksh 8,750,000",
          avgPrice: "Ksh 350,000",
          conversionRate: "65.8%",
          trend: "up",
          change: "+8.7%"
        },
        {
          name: "Electronics",
          listings: 73,
          sold: 48,
          revenue: "Ksh 2,890,000",
          avgPrice: "Ksh 60,208",
          conversionRate: "65.7%",
          trend: "down",
          change: "-3.1%"
        },
        {
          name: "Furniture",
          listings: 29,
          sold: 18,
          revenue: "Ksh 1,240,000",
          avgPrice: "Ksh 68,889",
          conversionRate: "62.1%",
          trend: "up",
          change: "+12.4%"
        },
        {
          name: "Jewelry",
          listings: 15,
          sold: 9,
          revenue: "Ksh 890,000",
          avgPrice: "Ksh 98,889",
          conversionRate: "60.0%",
          trend: "up",
          change: "+15.8%"
        }
      ]
    },
    users: {
      title: "User Analytics",
      period: "January 2024",
      userMetrics: [
        {
          label: "Total Users",
          value: "1,247",
          change: "+8.5%",
          trend: "up",
          breakdown: {
            "Active Buyers": "789",
            "Active Sellers": "234",
            "Inactive": "224"
          }
        },
        {
          label: "New Registrations",
          value: "89",
          change: "+25.6%",
          trend: "up",
          breakdown: {
            "Buyers": "56",
            "Sellers": "33"
          }
        },
        {
          label: "User Retention",
          value: "76.3%",
          change: "+4.2%",
          trend: "up",
          breakdown: {
            "30-day": "76.3%",
            "90-day": "62.1%",
            "365-day": "45.8%"
          }
        }
      ],
      topUsers: [
        {
          name: "Premium Motors",
          type: "Seller",
          auctions: 12,
          revenue: "Ksh 5,670,000",
          rating: 4.9,
          joinDate: "2023-03-15"
        },
        {
          name: "John Kamau",
          type: "Buyer",
          purchases: 8,
          spent: "Ksh 2,340,000",
          rating: 4.7,
          joinDate: "2023-07-22"
        },
        {
          name: "ABC Auctioneers",
          type: "Seller",
          auctions: 15,
          revenue: "Ksh 4,890,000",
          rating: 4.8,
          joinDate: "2023-01-10"
        }
      ]
    }
  };

  const getCurrentData = (): any => {
    return reportData[selectedReport as keyof typeof reportData];
  };

  const formatCurrency = (amount: string | number) => {
    if (typeof amount === 'string') return amount;
    return `Ksh ${amount.toLocaleString()}`;
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> : 
      <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getTrendColor = (trend: string) => {
    return trend === "up" ? "text-green-600" : "text-red-600";
  };

  const handleExportReport = () => {
    console.log("Exporting report:", selectedReport);
    // Handle report export logic
  };

  const handleRefreshData = () => {
    console.log("Refreshing data for:", selectedReport);
    // Handle data refresh logic
  };

  const handleViewDetails = (metric: any) => {
    setSelectedMetric(metric);
    setShowDetailModal(true);
  };

  const currentData = getCurrentData();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Reports & Analytics</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Comprehensive platform performance reports and insights
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <Select value={selectedReport} onValueChange={setSelectedReport}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Platform Overview</SelectItem>
                <SelectItem value="financial">Financial Performance</SelectItem>
                <SelectItem value="categories">Category Analysis</SelectItem>
                <SelectItem value="users">User Analytics</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>

            {selectedReport === "categories" && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="cars">Cars</SelectItem>
                  <SelectItem value="motorbikes">Motorbikes</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefreshData}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Report Header */}
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">{currentData.title}</h2>
          <p className="text-gray-600 flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{currentData.period}</span>
          </p>
        </div>

        {/* Platform Overview Report */}
        {selectedReport === "overview" && (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentData.metrics.map((metric: any, index: number) => (
                <div key={index} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => handleViewDetails(metric)}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">{metric.label}</h3>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    <p className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                      {metric.change}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{metric.details}</p>
                </div>
              ))}
            </div>

            {/* Chart Placeholders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Revenue Trend (Last 6 Months)
                </h3>
                <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Chart visualization would go here</p>
                    <p className="text-sm text-gray-400">Showing revenue growth over time</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-600" />
                  User Growth (Last 6 Months)
                </h3>
                <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Chart visualization would go here</p>
                    <p className="text-sm text-gray-400">Showing user acquisition trends</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Performance Report */}
        {selectedReport === "financial" && (
          <div className="space-y-6">
            {/* Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentData.metrics?.map((metric: any, index: number) => (
                <div key={index} className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{metric.label}</h3>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(metric.trend)}
                      <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-4">{metric.value}</p>
                  
                  {metric.breakdown && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Breakdown:</p>
                      {Object.entries(metric.breakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                Payment Methods Performance
              </h3>
              <div className="space-y-4">
                {currentData.paymentMethods?.map((method: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{method.method}</p>
                      <p className="text-sm text-gray-600">{method.transactions} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(method.volume)}</p>
                      <p className="text-sm text-gray-600">{method.percentage}% of total</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Performance Report */}
        {selectedReport === "categories" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {currentData.categories?.map((category: any, index: number) => (
                <div key={index} className="bg-white border rounded-lg p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <ShoppingBag className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600">
                          {category.sold} of {category.listings} listings sold
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 lg:mt-0">
                      {getTrendIcon(category.trend)}
                      <span className={`text-sm font-medium ${getTrendColor(category.trend)}`}>
                        {category.change}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="font-bold text-green-600">{category.revenue}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Price</p>
                      <p className="font-medium text-gray-900">{category.avgPrice}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Conversion Rate</p>
                      <p className="font-medium text-gray-900">{category.conversionRate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Items Sold</p>
                      <p className="font-medium text-gray-900">{category.sold}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Analytics Report */}
        {selectedReport === "users" && (
          <div className="space-y-6">
            {/* User Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {currentData.userMetrics?.map((metric: any, index: number) => (
                <div key={index} className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{metric.label}</h3>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(metric.trend)}
                      <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-4">{metric.value}</p>
                  
                  <div className="space-y-2">
                    {Object.entries(metric.breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Top Users */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-600" />
                Top Performing Users
              </h3>
              <div className="space-y-4">
                {currentData.topUsers?.map((user: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <Badge variant="outline">{user.type}</Badge>
                          <span>⭐ {user.rating}</span>
                          <span>Since {new Date(user.joinDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {user.revenue && (
                        <p className="font-bold text-green-600">{user.revenue}</p>
                      )}
                      {user.spent && (
                        <p className="font-bold text-blue-600">{user.spent}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {user.auctions ? `${user.auctions} auctions` : `${user.purchases} purchases`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Metric Detail Modal */}
        {showDetailModal && selectedMetric && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedMetric.label}</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowDetailModal(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{selectedMetric.value}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getTrendIcon(selectedMetric.trend)}
                    <span className={`font-medium ${getTrendColor(selectedMetric.trend)}`}>
                      {selectedMetric.change} vs last period
                    </span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">{selectedMetric.details}</p>
                </div>

                {selectedMetric.breakdown && (
                  <div className="border-t pt-4">
                    <p className="font-medium text-gray-900 mb-2">Breakdown:</p>
                    <div className="space-y-2">
                      {Object.entries(selectedMetric.breakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Report Generation Tips */}
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
          <h4 className="font-medium text-indigo-900 mb-2">Report Analysis Tips:</h4>
          <ul className="text-sm text-indigo-800 space-y-1">
            <li>• Monitor conversion rates to identify category performance issues</li>
            <li>• Track user retention metrics to improve platform engagement</li>
            <li>• Analyze payment method preferences for processing optimization</li>
            <li>• Compare period-over-period growth to identify trends</li>
            <li>• Export detailed reports for deeper analysis and stakeholder sharing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportsTab;
