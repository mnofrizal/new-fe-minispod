import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Plus, ExternalLink, Settings } from "lucide-react"

export default function MyAppsPage() {
  const apps = [
    {
      id: 1,
      name: "MiniPod Mobile",
      description: "Primary mobile application for podcast streaming",
      status: "active",
      users: "1,234",
      version: "v2.1.0",
      lastUpdated: "2 days ago"
    },
    {
      id: 2,
      name: "MiniPod Web",
      description: "Web-based podcast player and manager",
      status: "active",
      users: "856",
      version: "v1.8.2",
      lastUpdated: "5 days ago"
    },
    {
      id: 3,
      name: "MiniPod Admin",
      description: "Administrative dashboard for content management",
      status: "development",
      users: "12",
      version: "v0.9.1",
      lastUpdated: "1 day ago"
    },
    {
      id: 4,
      name: "MiniPod API",
      description: "Backend API service for all applications",
      status: "active",
      users: "2,847",
      version: "v3.2.1",
      lastUpdated: "3 hours ago"
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'development':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Apps</h2>
          <p className="text-muted-foreground">
            Manage and monitor your applications
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New App
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {apps.map((app) => (
          <Card key={app.id}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="flex items-center space-x-2 flex-1">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {app.description}
                  </CardDescription>
                </div>
              </div>
              <Badge className={getStatusColor(app.status)}>
                {app.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Users</p>
                    <p className="font-medium">{app.users}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Version</p>
                    <p className="font-medium">{app.version}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Updated</p>
                    <p className="font-medium">{app.lastUpdated}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}