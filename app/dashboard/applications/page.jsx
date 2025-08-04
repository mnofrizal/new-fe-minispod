import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Grid3X3, Download, Star, Users } from "lucide-react"

export default function ApplicationsPage() {
  const featuredApps = [
    {
      id: 1,
      name: "PodcastPro",
      description: "Professional podcast hosting and analytics platform",
      category: "Media",
      downloads: "50K+",
      rating: 4.8,
      price: "Free",
      image: "🎙️"
    },
    {
      id: 2,
      name: "StreamFlow",
      description: "Live streaming and recording solution for content creators",
      category: "Media",
      downloads: "25K+",
      rating: 4.6,
      price: "$9.99",
      image: "📺"
    },
    {
      id: 3,
      name: "AudioMixer",
      description: "Advanced audio editing and mixing tools",
      category: "Productivity",
      downloads: "75K+",
      rating: 4.9,
      price: "$19.99",
      image: "🎵"
    },
    {
      id: 4,
      name: "VoiceRecorder",
      description: "High-quality voice recording with noise cancellation",
      category: "Utilities",
      downloads: "100K+",
      rating: 4.7,
      price: "Free",
      image: "🎤"
    }
  ]

  const categories = [
    { name: "All", count: 156 },
    { name: "Media", count: 45 },
    { name: "Productivity", count: 32 },
    { name: "Utilities", count: 28 },
    { name: "Entertainment", count: 24 },
    { name: "Business", count: 18 },
    { name: "Education", count: 9 }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Applications List</h2>
        <p className="text-muted-foreground">
          Discover and explore available applications
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search applications..." 
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Grid3X3 className="mr-2 h-4 w-4" />
          Categories
        </Button>
      </div>

      <Tabs defaultValue="featured" className="space-y-6">
        <TabsList>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="recent">Recently Added</TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {featuredApps.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{app.image}</div>
                      <div>
                        <CardTitle className="text-lg">{app.name}</CardTitle>
                        <CardDescription>{app.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">{app.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{app.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Download className="h-4 w-4 text-muted-foreground" />
                          <span>{app.downloads}</span>
                        </div>
                      </div>
                      <div className="font-semibold text-primary">{app.price}</div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Install
                      </Button>
                      <Button variant="outline" size="icon">
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            Popular applications will be displayed here
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            Recently added applications will be displayed here
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Browse applications by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div 
                key={category.name}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
              >
                <span className="font-medium">{category.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {category.count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}