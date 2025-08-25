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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Grid,
  Cloud,
  Server,
  DollarSign,
  Cpu,
  MemoryStick,
} from "lucide-react";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";

export default function ApplicationsPage() {
  const { data: session, status } = useSession();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");

  useEffect(() => {
    if (session?.accessToken) {
      fetchServices();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [session, status]);

  // Filter services based on search term and filters
  useEffect(() => {
    let filtered = services;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (service) =>
          service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          service.category?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Price filter
    if (priceFilter !== "all") {
      filtered = filtered.filter((service) => {
        const lowestPrice = getLowestPrice(service.plans);
        if (priceFilter === "free") return lowestPrice === 0;
        if (priceFilter === "paid") return lowestPrice > 0;
        return true;
      });
    }

    // Only show active services
    filtered = filtered.filter((service) => service.isActive);

    setFilteredServices(filtered);
  }, [services, searchTerm, priceFilter]);

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
        toast.error(errorResult.message || "Failed to load services");
      }
    } catch (error) {
      toast.error("Error loading services");
    } finally {
      setIsLoading(false);
    }
  };

  const getLowestPrice = (plans) => {
    if (!plans || plans.length === 0) return 0;
    const prices = plans.map((plan) => plan.monthlyPrice);
    return Math.min(...prices);
  };

  const formatRupiahPrice = (price) => {
    const numPrice = parseFloat(price);
    if (numPrice === 0) return "Free";
    return `Rp ${numPrice.toLocaleString("id-ID")}/month`;
  };

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
    setSubscriptionError("");
    // Set default plan when opening dialog
    const defaultPlan =
      service.plans?.find((p) => p.isPopular) || service.plans?.[0];
    setSelectedVariant(defaultPlan);
  };

  const handleSubscribe = async () => {
    if (!session?.accessToken) {
      setSubscriptionError("Please login to subscribe to this service");
      return;
    }

    try {
      setIsSubscribing(true);
      setSubscriptionError("");

      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}/api/v1/subscriptions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serviceId: selectedService?.id,
            planId: selectedVariant?.id,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Successfully subscribed to service!");
        setIsModalOpen(false);
      } else {
        setSubscriptionError(data.message || "Failed to subscribe to service");
      }
    } catch (err) {
      setSubscriptionError(
        "An error occurred while subscribing to the service"
      );
    } finally {
      setIsSubscribing(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading applications...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">
          Please sign in to access this page
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {" "}
            Available Services
          </h2>
          <p className="text-muted-foreground">
            Discover and explore our available services
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          {/* Price Filter */}
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-full sm:w-[180px] !h-11">
              <SelectValue placeholder="Filter by price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {`${filteredServices.length} of ${services.length} services`}
            </Badge>
            {searchTerm && (
              <Badge variant="secondary">Search: "{searchTerm}"</Badge>
            )}
            {priceFilter !== "all" && (
              <Badge variant="secondary">Price: {priceFilter}</Badge>
            )}
          </div>

          {(searchTerm || priceFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setPriceFilter("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Grid className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No services found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || priceFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No services are available at the moment"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col pb-0 gap-5 cursor-pointer"
              onClick={() => handleServiceClick(service)}
            >
              <CardHeader>
                <div className="flex items-start justify-between p-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 border dark:bg-blue-900 rounded-lg">
                      <img
                        src={service.icon}
                        alt={service.name}
                        className="w-9 h-9 object-contain"
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <div className="mt-1">
                        <span className="rounded-full inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-green-900 dark:text-green-200">
                          {service.category?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col px-8">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 text-justify leading-relaxed mb-2">
                    {service.description}
                  </p>
                </div>
              </CardContent>
              {/* Pricing Section */}
              <div className="space-y-3 bg-[#FBFBFC] p-6 px-8 border-t rounded-b-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Starting from
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl text-gray-900 dark:text-white">
                        {getLowestPrice(service.plans) === 0 ? (
                          <span className="font-semibold">Free</span>
                        ) : (
                          <>
                            <span className="font-semibold">
                              {formatRupiahPrice(
                                getLowestPrice(service.plans)
                              ).replace(/\/month$/, "")}
                            </span>
                            <span className="font-light text-zinc-500 text-lg">
                              /month
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deploy Now Button */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleServiceClick(service);
                  }}
                  className="w-full cursor-pointer bg-zinc-900 text-white font-medium py-2 h-10 px-4 rounded-md transition-colors duration-200 hover:bg-zinc-800 hover:text-white flex items-center justify-center gap-2"
                  size="sm"
                >
                  <Cloud className="w-4 h-4" />
                  Deploy Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Service Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[85vw] w-[85vw] max-h-[80vh] overflow-y-auto scrollbar-hide sm:max-w-[75vw] sm:w-[75vw]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 border dark:bg-blue-900 rounded-lg">
                <img
                  src={selectedService?.icon}
                  alt={selectedService?.name}
                  className="w-9 h-9 object-contain"
                />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {selectedService?.name}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Please select plan configuration
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Grid - Plan Selection */}
            <div className="lg:col-span-2 space-y-6">
              {/* Plan Selection */}
              {selectedService?.plans && selectedService.plans.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {selectedService.plans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                          selectedVariant?.id === plan.id
                            ? "border-blue-500 border-2 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedVariant(plan)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="bg-zinc-200 p-1 rounded-md">
                                <Server className="w-4 h-4 text-gray-900" />
                              </div>
                              <h5 className="font-medium text-gray-900 dark:text-white text-xl">
                                {plan.name}
                              </h5>
                              {plan.isPopular && (
                                <Badge variant="secondary" className="text-xs">
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-zinc-600 dark:text-gray-400 mt-1">
                              {plan.description}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1 px-2 py-1 text-xs"
                              >
                                <Cpu className="w-3 h-3 mr-1" />
                                {(plan.cpuMilli / 1000).toFixed(1)} Cores
                              </Badge>
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1 px-2 py-1 text-xs"
                              >
                                <MemoryStick className="w-3 h-3 mr-1" />
                                {plan.memoryMb}MB RAM
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xl text-gray-900 dark:text-white">
                              {plan.monthlyPrice === 0 ? (
                                <span className="font-bold">Free</span>
                              ) : (
                                <>
                                  <span className="font-bold">
                                    Rp{" "}
                                    {plan.monthlyPrice.toLocaleString("id-ID")}
                                  </span>
                                  <span className="font-light text-zinc-500 text-lg">
                                    /month
                                  </span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Grid - Deployment Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Deployment Summary
                </h3>

                <div className="space-y-6">
                  <div className="border rounded-lg p-2 bg-zinc-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white border dark:bg-blue-900 rounded-lg">
                        <img
                          src={selectedService?.icon}
                          alt={selectedService?.name}
                          className="w-7 h-7 object-contain"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {selectedService?.name}
                        </span>
                        <span className="text-sm text-zinc-500">
                          {selectedService?.category?.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div className="text-gray-500 dark:text-gray-400">Plan</div>
                    <div className="font-medium text-gray-900 dark:text-white text-right">
                      {selectedVariant?.name}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">CPU</div>
                    <div className="font-medium text-gray-900 dark:text-gray-300 text-right">
                      {(selectedVariant?.cpuMilli / 1000).toFixed(1)} Cores
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Memory
                    </div>
                    <div className="font-medium text-gray-900 dark:text-gray-300 text-right">
                      {selectedVariant?.memoryMb}MB
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Billing Cycle
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white text-right">
                      Monthly
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      Cost
                    </span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedVariant?.monthlyPrice === 0
                        ? "Free"
                        : `Rp ${selectedVariant?.monthlyPrice?.toLocaleString(
                            "id-ID"
                          )}/month`}
                    </span>
                  </div>

                  {/* Error Message */}
                  {subscriptionError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {subscriptionError}
                    </div>
                  )}

                  <Button
                    onClick={handleSubscribe}
                    disabled={isSubscribing || !selectedVariant}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    {isSubscribing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Subscribing...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Deploy Service
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
