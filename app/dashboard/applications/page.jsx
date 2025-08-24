"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Grid3X3, Download, Star, Users, X } from "lucide-react";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";

export default function ApplicationsPage() {
  const { data: session, status } = useSession();
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (session?.accessToken) {
      fetchServices();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [session, status]);

  const fetchServices = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.CATALOG.SERVICES.GET_ALL}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setServices(result.data?.services || []);
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || "Failed to load services", {
          style: {
            background: "#ef4444",
            color: "white",
            border: "1px solid #dc2626",
          },
        });
      }
    } catch (error) {
      toast.error("Error loading services", {
        style: {
          background: "#ef4444",
          color: "white",
          border: "1px solid #dc2626",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredServices = services.filter(
    (service) =>
      service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryCount = (categoryName) => {
    if (categoryName === "All") return services.length;
    return services.filter((service) => service.category?.name === categoryName)
      .length;
  };

  const uniqueCategories = [
    "All",
    ...new Set(
      services.map((service) => service.category?.name).filter(Boolean)
    ),
  ];

  const categories = uniqueCategories.map((category) => ({
    name: category,
    count: getCategoryCount(category),
  }));

  const getLowestPrice = (plans) => {
    if (!plans || plans.length === 0) return null;
    const prices = plans.map((plan) => plan.monthlyPrice);
    const minPrice = Math.min(...prices);
    return minPrice === 0 ? "Free" : `From Rp ${minPrice.toLocaleString()}/mo`;
  };

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {services.length} service{services.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {status === "loading" || isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading services...</div>
        </div>
      ) : status === "unauthenticated" ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">
            Please sign in to access this page
          </div>
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Services</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="recent">Recently Added</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {filteredServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm
                  ? "No services found matching your search"
                  : "No services available"}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredServices.map((service) => (
                  <Card
                    key={service.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {service.icon ? (
                              <img
                                src={service.icon}
                                alt={service.name}
                                className="w-8 h-8"
                              />
                            ) : (
                              "📦"
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {service.name}
                            </CardTitle>
                            <CardDescription>
                              {service.description}
                            </CardDescription>
                          </div>
                        </div>
                        {service.category && (
                          <Badge variant="secondary">
                            {service.category.name}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            {service.version && (
                              <div className="text-muted-foreground">
                                v{service.version}
                              </div>
                            )}
                            <Badge
                              variant={
                                service.isActive ? "default" : "secondary"
                              }
                            >
                              {service.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {service.isFeatured && (
                              <Badge variant="outline">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-primary">
                            {getLowestPrice(service.plans) ||
                              "Contact for pricing"}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {service.createdAt &&
                              new Date(service.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            className="flex-1"
                            disabled={!service.isActive}
                            onClick={() => handleServiceClick(service)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            {service.isActive ? "View Plans" : "Unavailable"}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              // Handle favorite action
                            }}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="featured" className="space-y-6">
            <div className="text-center py-8 text-muted-foreground">
              Featured services will be displayed here
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <div className="text-center py-8 text-muted-foreground">
              Recently added services will be displayed here
            </div>
          </TabsContent>
        </Tabs>
      )}

      {!isLoading && status === "authenticated" && (
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Browse services by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() =>
                    setSearchTerm(category.name === "All" ? "" : category.name)
                  }
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
      )}

      {/* Service Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[85vw] w-[85vw] max-h-[80vh] overflow-y-auto scrollbar-hide sm:max-w-[75vw] sm:w-[75vw]">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="text-3xl">
                {selectedService?.icon ? (
                  <img
                    src={selectedService.icon}
                    alt={selectedService.name}
                    className="w-10 h-10"
                  />
                ) : (
                  "📦"
                )}
              </div>
              <div>
                <DialogTitle className="text-2xl">
                  {selectedService?.name}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {selectedService?.longDescription ||
                    selectedService?.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedService && (
            <div className="space-y-6">
              {/* Service Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Category:</span>
                    <Badge variant="secondary">
                      {selectedService.category?.name}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Version:</span>
                    <span className="text-muted-foreground">
                      v{selectedService.version}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Status:</span>
                    <Badge
                      variant={
                        selectedService.isActive ? "default" : "secondary"
                      }
                    >
                      {selectedService.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {selectedService.isFeatured && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        <Star className="h-3 w-3 mr-1" />
                        Featured Service
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Docker Image:</span>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedService.dockerImage}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Default Port:</span>
                    <p className="text-sm text-muted-foreground">
                      {selectedService.defaultPort}
                    </p>
                  </div>
                  {selectedService.documentation && (
                    <div>
                      <span className="font-medium">Documentation:</span>
                      <a
                        href={selectedService.documentation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline block"
                      >
                        {selectedService.documentation}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {selectedService.tags && selectedService.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedService.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Plans */}
              {selectedService.plans && selectedService.plans.length > 0 && (
                <div>
                  <h4 className="font-medium text-lg mb-4">Available Plans</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedService.plans.map((plan) => (
                      <Card
                        key={plan.id}
                        className={`relative ${
                          plan.isPopular ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        {plan.isPopular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-primary text-primary-foreground">
                              Most Popular
                            </Badge>
                          </div>
                        )}
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {plan.name}
                            </CardTitle>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                {plan.monthlyPrice === 0
                                  ? "Free"
                                  : `Rp ${plan.monthlyPrice.toLocaleString()}`}
                              </div>
                              {plan.monthlyPrice > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  /month
                                </div>
                              )}
                            </div>
                          </div>
                          <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">CPU:</span>
                              <p className="text-muted-foreground">
                                {plan.cpuMilli}m
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Memory:</span>
                              <p className="text-muted-foreground">
                                {plan.memoryMb}MB
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Storage:</span>
                              <p className="text-muted-foreground">
                                {plan.storageGb}GB
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Bandwidth:</span>
                              <p className="text-muted-foreground">
                                {plan.bandwidth}GB
                              </p>
                            </div>
                          </div>

                          <div>
                            <span className="font-medium text-sm">
                              Features:
                            </span>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                              {plan.features.map((feature, index) => (
                                <li key={index}>{feature}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <span className="font-medium">Available:</span>
                              <span className="text-muted-foreground ml-1">
                                {plan.availableQuota}/{plan.totalQuota} slots
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Max Domains:</span>
                              <span className="text-muted-foreground ml-1">
                                {plan.maxDomains}
                              </span>
                            </div>
                          </div>

                          <Button
                            className="w-full"
                            disabled={
                              !plan.isAvailable || plan.availableQuota === 0
                            }
                            variant={plan.isPopular ? "default" : "outline"}
                          >
                            {!plan.isAvailable
                              ? "Unavailable"
                              : plan.availableQuota === 0
                              ? "Out of Stock"
                              : "Select Plan"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
