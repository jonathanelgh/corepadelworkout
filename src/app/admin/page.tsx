import { Users, TrendingUp, Activity, CreditCard, ArrowUpRight, ArrowDownRight, MoreHorizontal, Dumbbell, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    { title: "Total Users", value: "2,405", change: "+12.5%", isPositive: true, icon: Users },
    { title: "Active Subscriptions", value: "1,842", change: "+5.2%", isPositive: true, icon: Activity },
    { title: "Monthly Revenue", value: "€24,500", change: "+18.1%", isPositive: true, icon: TrendingUp },
    { title: "Churn Rate", value: "2.4%", change: "-0.5%", isPositive: true, icon: CreditCard }, // lower churn is positive
  ];

  const recentUsers = [
    { name: "Alex Martinez", email: "alex@example.com", plan: "Monthly Package", date: "2 mins ago", status: "Active" },
    { name: "Sarah Jenkins", email: "sara.j@example.com", plan: "Single Program", date: "1 hour ago", status: "Active" },
    { name: "Michael Chen", email: "mikec@example.com", plan: "Monthly Package", date: "3 hours ago", status: "Active" },
    { name: "Emma Wilson", email: "emma.w@example.com", plan: "Free Warmup", date: "5 hours ago", status: "Lead" },
    { name: "David Thompson", email: "david.t@example.com", plan: "Monthly Package", date: "1 day ago", status: "Cancelled" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Sub Top Bar */}
      <div className="flex h-14 shrink-0 items-center border-b border-gray-200 bg-white px-8">
        <h1 className="text-lg font-semibold text-gray-900">Dashboard Overview</h1>
      </div>

      {/* Scrollable Content */}
      <div className="min-h-0 flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                    <stat.icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-md ${
                    stat.isPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}>
                    {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">{stat.title}</h3>
                <div className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Main Content Area (Charts / Tables) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Recent Activity Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Recent Signups</h2>
                <button className="text-sm font-medium text-gray-500 hover:text-black transition-colors">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-200">
                      <th className="px-6 py-4 font-medium">User</th>
                      <th className="px-6 py-4 font-medium">Plan</th>
                      <th className="px-6 py-4 font-medium">Joined</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {recentUsers.map((user, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{user.plan}</td>
                        <td className="px-6 py-4 text-gray-500">{user.date}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                            user.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 
                            user.status === 'Lead' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 
                            'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-gray-400 hover:text-black transition-colors p-1">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions / Secondary Widget */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#ccff00]/20 rounded-md flex items-center justify-center text-black group-hover:bg-[#ccff00] transition-colors">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-gray-900">Add New Program</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-black" />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-gray-900">Invite Coach</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-black" />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-colors">
                      <Activity className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-gray-900">View Reports</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-black" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}