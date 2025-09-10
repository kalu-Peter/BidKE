import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  Users, 
  FileText, 
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

const OverviewTab: React.FC = () => {
  // Mock data for recent activity
  const recentActivity = [
    {
      id: 1,
      type: "approval",
      message: "New seller approved: Kenya Bank Ltd",
      time: "15 minutes ago",
      icon: CheckCircle,
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      id: 2,
      type: "transaction",
      message: "High-value auction completed: Ksh 850,000",
      time: "2 hours ago",
      icon: DollarSign,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      id: 3,
      type: "listing",
      message: "New listing pending review",
      time: "3 hours ago",
      icon: AlertTriangle,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600"
    },
    {
      id: 4,
      type: "user",
      message: "New buyer registration: John Doe",
      time: "5 hours ago",
      icon: Users,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      id: 5,
      type: "revenue",
      message: "Daily revenue target exceeded by 15%",
      time: "1 day ago",
      icon: TrendingUp,
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600"
    }
  ];

  const quickActions = [
    {
      id: 1,
      title: "Approve Users",
      description: "Review pending user registrations",
      icon: Users,
      color: "text-blue-600",
      bgColor: "hover:bg-blue-50",
      action: "users"
    },
    {
      id: 2,
      title: "Review Listings",
      description: "Approve or reject auction listings",
      icon: FileText,
      color: "text-green-600",
      bgColor: "hover:bg-green-50",
      action: "listings"
    },
    {
      id: 3,
      title: "View Transactions",
      description: "Monitor payment and escrow status",
      icon: DollarSign,
      color: "text-yellow-600",
      bgColor: "hover:bg-yellow-50",
      action: "transactions"
    },
    {
      id: 4,
      title: "Generate Reports",
      description: "Create analytics and performance reports",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "hover:bg-purple-50",
      action: "reports"
    }
  ];

  const systemMetrics = [
    {
      id: 1,
      title: "Server Uptime",
      value: "99.9%",
      subtitle: "Last 30 days",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      id: 2,
      title: "Active Users",
      value: "892",
      subtitle: "Currently online",
      icon: Users,
      color: "text-blue-600"
    },
    {
      id: 3,
      title: "Response Time",
      value: "142ms",
      subtitle: "Average API response",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      id: 4,
      title: "Storage Used",
      value: "67%",
      subtitle: "Of allocated space",
      icon: BarChart3,
      color: "text-orange-600"
    }
  ];

  const handleQuickAction = (action: string) => {
    console.log("Quick action:", action);
    // Handle quick action navigation
  };

  return (
    <div className="space-y-6">
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Recent Platform Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className={`flex items-center space-x-4 p-3 ${activity.bgColor} rounded-lg`}>
                    <IconComponent className={`w-5 h-5 ${activity.iconColor}`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.message}</p>
                      <p className="text-sm text-gray-600">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full">
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    className={`h-20 flex-col p-4 ${action.bgColor} transition-colors`}
                    onClick={() => handleQuickAction(action.action)}
                  >
                    <IconComponent className={`w-6 h-6 ${action.color} mb-2`} />
                    <span className="font-medium text-sm">{action.title}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>System Health & Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {systemMetrics.map((metric) => {
              const IconComponent = metric.icon;
              return (
                <div key={metric.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <IconComponent className={`w-8 h-8 ${metric.color}`} />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    <p className="text-sm font-medium text-gray-900">{metric.title}</p>
                    <p className="text-xs text-gray-600">{metric.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Platform Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Cars</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">65%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Electronics</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">45%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Motorbikes</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">30%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Users Today</span>
                <span className="font-semibold">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">This Week</span>
                <span className="font-semibold">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">This Month</span>
                <span className="font-semibold">642</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Growth Rate</span>
                  <span className="font-semibold text-green-600">+15.2%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Today</span>
                <span className="font-semibold">Ksh 45,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">This Week</span>
                <span className="font-semibold">Ksh 287,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">This Month</span>
                <span className="font-semibold">Ksh 1,245,000</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Commission</span>
                  <span className="font-semibold text-blue-600">Ksh 124,500</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Alerts */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span>Priority Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">12 users awaiting approval</p>
                  <p className="text-sm text-red-700">Some registrations are over 48 hours old</p>
                </div>
              </div>
              <Button size="sm" onClick={() => handleQuickAction('users')}>
                Review Now
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">3 high-value listings need review</p>
                  <p className="text-sm text-yellow-700">Items worth over Ksh 500,000 each</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleQuickAction('listings')}>
                Review
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
