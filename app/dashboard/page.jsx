import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Users, Smartphone, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Apps",
      value: "12",
      description: "Active applications",
      icon: Smartphone,
      trend: "+2 from last month"
    },
    {
      title: "Active Users",
      value: "2,847",
      description: "Users this month",
      icon: Users,
      trend: "+12% from last month"
    },
    {
      title: "Revenue",
      value: "$8,421",
      description: "Total earnings",
      icon: TrendingUp,
      trend: "+8% from last month"
    },
    {
      title: "Analytics",
      value: "94%",
      description: "Performance score",
      icon: BarChart3,
      trend: "+2% from last month"
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your apps.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your app performance over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Chart placeholder - Connect your analytics here
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage your applications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Create New App</h4>
              <p className="text-xs text-muted-foreground">
                Start building your next application
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">View Analytics</h4>
              <p className="text-xs text-muted-foreground">
                Check your app performance metrics
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Manage Settings</h4>
              <p className="text-xs text-muted-foreground">
                Configure your account preferences
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}