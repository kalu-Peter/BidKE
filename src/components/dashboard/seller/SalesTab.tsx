import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";

const SalesTab: React.FC = () => {
  // Mock data
  const recentSales = [
    {
      id: 1,
      item: "MacBook Pro 2019",
      buyer: "John D.",
      soldPrice: 85000,
      commission: 8500,
      payout: 76500,
      date: "2 days ago",
      status: "paid"
    },
    {
      id: 2,
      item: "TVS HLX 125",
      buyer: "Sarah M.",
      soldPrice: 54000,
      commission: 5400,
      payout: 48600,
      date: "5 days ago",
      status: "pending"
    },
    {
      id: 3,
      item: "HP EliteBook 840 G5",
      buyer: "Michael K.",
      soldPrice: 35000,
      commission: 3500,
      payout: 31500,
      date: "1 week ago",
      status: "paid"
    },
    {
      id: 4,
      item: "Samsung Galaxy S21",
      buyer: "Grace W.",
      soldPrice: 42000,
      commission: 4200,
      payout: 37800,
      date: "2 weeks ago",
      status: "paid"
    }
  ];

  const payoutMethods = [
    {
      id: 1,
      type: "Bank Transfer",
      bank: "Standard Chartered Bank",
      account: "****1234",
      isDefault: true
    },
    {
      id: 2,
      type: "M-Pesa",
      number: "****0789",
      isDefault: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Recent Sales</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Track your completed sales and payout history
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Item</th>
                  <th className="text-left p-4 font-medium">Buyer</th>
                  <th className="text-left p-4 font-medium">Sold Price</th>
                  <th className="text-left p-4 font-medium">Commission (10%)</th>
                  <th className="text-left p-4 font-medium">Your Payout</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{sale.item}</td>
                    <td className="p-4">{sale.buyer}</td>
                    <td className="p-4">Ksh {sale.soldPrice.toLocaleString()}</td>
                    <td className="p-4 text-red-600">Ksh {sale.commission.toLocaleString()}</td>
                    <td className="p-4 font-medium text-green-600">Ksh {sale.payout.toLocaleString()}</td>
                    <td className="p-4 text-gray-600">{sale.date}</td>
                    <td className="p-4">
                      <Badge className={sale.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {sale.status === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Button variant="outline" size="sm">
                        {sale.status === 'paid' ? 'View Receipt' : 'Track Payment'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {recentSales.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No sales yet</h3>
              <p className="text-gray-600">Your completed sales will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">Ksh 216,500</div>
              <div className="text-sm text-gray-600">Total Payouts</div>
              <div className="text-xs text-green-600 mt-1">+15% this month</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">Ksh 21,600</div>
              <div className="text-sm text-gray-600">Total Commission</div>
              <div className="text-xs text-gray-500 mt-1">10% platform fee</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">4</div>
              <div className="text-sm text-gray-600">Items Sold</div>
              <div className="text-xs text-blue-600 mt-1">This month</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Settings</CardTitle>
          <p className="text-sm text-gray-600">
            Manage how you receive payments from successful sales
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {payoutMethods.map((method) => (
            <div key={method.id} className={`p-4 rounded-lg border ${method.isDefault ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium flex items-center space-x-2">
                    <span>{method.type}</span>
                    {method.isDefault && <Badge className="bg-green-100 text-green-800">Default</Badge>}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {method.type === 'Bank Transfer' 
                      ? `${method.bank} - Account: ${method.account}`
                      : `Mobile: ${method.number}`
                    }
                  </p>
                </div>
                <div className="flex space-x-2">
                  {!method.isDefault && (
                    <Button variant="outline" size="sm">
                      Set as Default
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          <Button variant="outline" className="w-full">
            Add New Payout Method
          </Button>
        </CardContent>
      </Card>

      {/* Payout Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <h4 className="font-medium">Next Payout</h4>
                <p className="text-sm text-gray-600">Scheduled for Friday, September 15, 2025</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">Ksh 48,600</div>
                <div className="text-xs text-gray-500">1 pending sale</div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Payouts are processed twice weekly (Tuesdays and Fridays)</p>
              <p>• Minimum payout amount: Ksh 1,000</p>
              <p>• Bank transfers take 1-2 business days</p>
              <p>• M-Pesa transfers are instant</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesTab;
