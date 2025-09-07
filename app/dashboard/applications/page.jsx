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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [subscriptionResult, setSubscriptionResult] = useState(null);
  const [existingSubscription, setExistingSubscription] = useState(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [provisioningStatus, setProvisioningStatus] = useState({
    isProvisioning: false,
    status: "PENDING",
    healthStatus: "Unknown",
    publicUrl: null,
    adminUrl: null,
  });
  const [pollingInterval, setPollingInterval] = useState(null);
  const [provisioningToastId, setProvisioningToastId] = useState(null);

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

  const handleServiceClick = async (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
    setSubscriptionError("");
    setExistingSubscription(null);
    setSelectedVariant(null);

    // Reset deployment summary state
    setProvisioningStatus({
      isProvisioning: false,
      status: "PENDING",
      healthStatus: "Unknown",
      publicUrl: null,
      adminUrl: null,
    });
    setSubscriptionResult(null);
    setShowSuccessDialog(false);

    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    // Dismiss any existing provisioning toast
    if (provisioningToastId) {
      toast.dismiss(provisioningToastId);
      setProvisioningToastId(null);
    }

    // Check if user already has this service first
    await checkExistingSubscription(service.id);
  };

  const checkExistingSubscription = async (serviceId) => {
    if (!session?.accessToken || !selectedService) return;

    setIsCheckingSubscription(true);
    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.MY_APPS.GET_ALL}`,
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
        const subscriptions = result.data?.subscriptions || [];

        // Find existing subscription for this service
        const existing = subscriptions.find(
          (sub) => sub.service.id === serviceId && sub.status === "ACTIVE"
        );

        setExistingSubscription(existing);

        // Set appropriate default plan based on existing subscription
        if (existing && selectedService.plans) {
          // If user has existing subscription, select the next higher tier plan
          const availablePlans = selectedService.plans
            .filter((plan) => plan.monthlyPrice > existing.monthlyPrice)
            .sort((a, b) => a.monthlyPrice - b.monthlyPrice);

          const defaultUpgradePlan = availablePlans?.[0];
          setSelectedVariant(defaultUpgradePlan || null);
        } else if (selectedService.plans) {
          // If no existing subscription, use normal logic
          const defaultPlan =
            selectedService.plans.find((p) => p.isPopular) ||
            selectedService.plans[0];
          setSelectedVariant(defaultPlan);
        }
      }
    } catch (error) {
      console.error("Error checking existing subscription:", error);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const handleSubscribe = async () => {
    if (!session?.accessToken) {
      setSubscriptionError("Please login to subscribe to this service");
      return;
    }

    try {
      setIsSubscribing(true);
      setSubscriptionError("");

      // Use different endpoint and payload for upgrade vs new subscription
      const isUpgrade = existingSubscription !== null;
      const endpoint = isUpgrade
        ? `${
            ENV_CONFIG.BASE_API_URL
          }${API_ENDPOINTS.SUBSCRIPTIONS.UPGRADE.replace(
            ":id",
            existingSubscription.id
          )}`
        : `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.SUBSCRIPTIONS.CREATE}`;

      const requestBody = isUpgrade
        ? { newPlanId: selectedVariant?.id }
        : { planId: selectedVariant?.id };

      const response = await fetch(endpoint, {
        method: isUpgrade ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubscriptionResult(data);
        setIsModalOpen(false);
        setShowSuccessDialog(true);
        setProvisioningStatus({
          isProvisioning: true,
          status: "PROVISIONING",
          healthStatus: "Unknown",
          publicUrl: null,
          adminUrl: null,
        });

        // Show persistent provisioning toast
        const toastId = toast.loading(
          isUpgrade ? "🚀 Upgrading service..." : "🚀 Provisioning service...",
          {
            description: isUpgrade
              ? "Upgrading your service, this usually takes 1-2 minutes"
              : "Setting up your service, this usually takes 1-2 minutes",
            duration: Infinity, // Keep toast until manually dismissed
          }
        );
        setProvisioningToastId(toastId);

        // Start polling for provisioning status
        const subscriptionId = isUpgrade
          ? existingSubscription.id
          : data.data.subscription.id;
        startProvisioningPolling(subscriptionId);
      } else {
        setSubscriptionError(
          data.message ||
            `Failed to ${isUpgrade ? "upgrade" : "subscribe to"} service`
        );
      }
    } catch (err) {
      setSubscriptionError(
        `An error occurred while ${
          existingSubscription ? "upgrading" : "subscribing to"
        } the service`
      );
    } finally {
      setIsSubscribing(false);
    }
  };

  const startProvisioningPolling = (subscriptionId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `${
            ENV_CONFIG.BASE_API_URL
          }${API_ENDPOINTS.SUBSCRIPTIONS.GET_BY_ID.replace(
            ":id",
            subscriptionId
          )}`,
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

          // Check if data and subscription exist (note: singular 'subscription', not 'subscriptions')
          if (result.data && result.data.subscription) {
            const subscription = result.data.subscription;

            // Check if instances exist
            if (subscription.instances && subscription.instances.length > 0) {
              const instance = subscription.instances[0];

              const isReady =
                instance.status === "RUNNING" &&
                instance.healthStatus === "Healthy";

              setProvisioningStatus({
                isProvisioning: !isReady,
                status: instance.status,
                healthStatus: instance.healthStatus,
                publicUrl: instance.publicUrl,
                adminUrl: instance.adminUrl,
              });

              // Update toast with current status
              if (provisioningToastId) {
                if (isReady) {
                  // Service is ready - show success toast and dismiss loading toast
                  toast.dismiss(provisioningToastId);
                  toast.success("🎉 Service Ready!", {
                    description: `Your ${selectedService?.name} service is now running and ready to use`,
                    action: {
                      label: "Open Service",
                      onClick: () => window.open(instance.publicUrl, "_blank"),
                    },
                  });
                  setProvisioningToastId(null);
                } else {
                  // Update existing toast with current status (don't create new one)
                  toast(`🚀 ${instance.status}...`, {
                    id: provisioningToastId,
                    description: `Health: ${instance.healthStatus} • Setting up your service`,
                    duration: Infinity,
                  });
                }
              }

              // Stop polling when service is running and healthy
              if (isReady) {
                clearInterval(interval);
                setPollingInterval(null);
              }
            } else {
              // No instances yet, keep provisioning status
              setProvisioningStatus((prev) => ({
                ...prev,
                status: "PROVISIONING",
                healthStatus: "Unknown",
              }));
            }
          } else {
            console.log("No subscription data found, continuing to poll...");
          }
        }
      } catch (error) {
        console.error("Error polling subscription status:", error);
      }
    }, 3000); // Poll every 3 seconds

    setPollingInterval(interval);
  };

  // Cleanup polling and toast on component unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (provisioningToastId) {
        toast.dismiss(provisioningToastId);
      }
    };
  }, [pollingInterval, provisioningToastId]);

  // Cleanup toast when dialog is closed
  const handleDialogClose = (open) => {
    setShowSuccessDialog(open);
    if (!open && provisioningToastId && provisioningStatus.isProvisioning) {
      // Keep the toast running even when dialog is closed
      toast("🚀 Service provisioning continues...", {
        id: provisioningToastId,
        description: "Your service is being set up in the background",
        duration: Infinity,
      });
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Grid - Plan Selection */}
            <div className="lg:col-span-2 space-y-6">
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
              {/* Plan Selection */}
              {selectedService?.plans && selectedService.plans.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {selectedService.plans.map((plan) => {
                      const isCurrentPlan =
                        existingSubscription &&
                        plan.id === existingSubscription.plan.id;
                      const isLowerTier =
                        existingSubscription &&
                        plan.monthlyPrice <=
                          existingSubscription.monthlyPrice &&
                        plan.id !== existingSubscription.plan.id;
                      const isDisabled =
                        existingSubscription && (isCurrentPlan || isLowerTier);

                      return (
                        <div
                          key={plan.id}
                          className={`border rounded-lg p-4 transition-colors relative ${
                            isDisabled
                              ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                              : selectedVariant?.id === plan.id
                              ? "border-blue-500 border-2 bg-blue-50 dark:bg-blue-900/20 cursor-pointer"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 cursor-pointer"
                          }`}
                          onClick={() =>
                            !isDisabled && setSelectedVariant(plan)
                          }
                        >
                          {isCurrentPlan && (
                            <div className="absolute bottom-2 right-2">
                              <Badge variant="secondary" className="text-xs">
                                Current Plan
                              </Badge>
                            </div>
                          )}

                          <div className="flex justify-between items-start">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`p-1 rounded-md ${
                                    isDisabled ? "bg-gray-300" : "bg-zinc-200"
                                  }`}
                                >
                                  <Server
                                    className={`w-4 h-4 ${
                                      isDisabled
                                        ? "text-gray-500"
                                        : "text-gray-900"
                                    }`}
                                  />
                                </div>
                                <h5
                                  className={`font-medium text-xl ${
                                    isDisabled
                                      ? "text-gray-500"
                                      : "text-gray-900 dark:text-white"
                                  }`}
                                >
                                  {plan.name}
                                </h5>
                                {plan.isPopular && !isDisabled && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                              <div
                                className={`text-sm mt-1 ${
                                  isDisabled
                                    ? "text-gray-400"
                                    : "text-zinc-600 dark:text-gray-400"
                                }`}
                              >
                                {plan.description}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge
                                  variant="outline"
                                  className={`flex items-center gap-1 px-2 py-1 text-xs ${
                                    isDisabled
                                      ? "text-gray-400 border-gray-300"
                                      : ""
                                  }`}
                                >
                                  <Cpu className="w-3 h-3 mr-1" />
                                  {(plan.cpuMilli / 1000).toFixed(1)} Cores
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`flex items-center gap-1 px-2 py-1 text-xs ${
                                    isDisabled
                                      ? "text-gray-400 border-gray-300"
                                      : ""
                                  }`}
                                >
                                  <MemoryStick className="w-3 h-3 mr-1" />
                                  {plan.memoryMb}MB RAM
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className={`text-xl ${
                                  isDisabled
                                    ? "text-gray-400"
                                    : "text-gray-900 dark:text-white"
                                }`}
                              >
                                {plan.monthlyPrice === 0 ? (
                                  <span className="font-bold">Free</span>
                                ) : (
                                  <>
                                    <span className="font-bold">
                                      Rp{" "}
                                      {plan.monthlyPrice.toLocaleString(
                                        "id-ID"
                                      )}
                                    </span>
                                    <span
                                      className={`font-light text-lg ${
                                        isDisabled
                                          ? "text-gray-400"
                                          : "text-zinc-500"
                                      }`}
                                    >
                                      /month
                                    </span>
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Grid - Deployment Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                {/* Title aligned with dialog header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {existingSubscription
                      ? "Upgrade Summary"
                      : "Deployment Summary"}
                  </h3>
                </div>

                <div className="p-6">
                  {/* Show highest plan message when no upgrades available */}
                  {existingSubscription &&
                  !selectedVariant &&
                  !isCheckingSubscription ? (
                    <div>
                      {existingSubscription && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-blue-800">
                              Current Subscription
                            </span>
                          </div>
                          <div className="text-sm text-blue-700">
                            <div className="flex justify-between">
                              <span>Plan:</span>
                              <span className="font-medium">
                                {existingSubscription.plan.name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <span className="font-medium">
                                {existingSubscription.status}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Monthly Cost:</span>
                              <span className="font-medium">
                                Rp{" "}
                                {existingSubscription.monthlyPrice?.toLocaleString(
                                  "id-ID"
                                )}
                                /month
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-green-800">
                            You're on the Highest Plan!
                          </span>
                        </div>
                        <div className="text-sm text-green-700">
                          <p>
                            You're currently on the{" "}
                            <strong>{existingSubscription.plan.name}</strong>{" "}
                            plan, which is the highest tier available for this
                            service.
                          </p>
                          <p className="mt-2">
                            You have access to all premium features and maximum
                            resources.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Show normal upgrade summary content */
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
                        <div className="text-gray-500 dark:text-gray-400">
                          Plan
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white text-right">
                          {selectedVariant?.name}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          CPU
                        </div>
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
                          {existingSubscription ? "New Cost" : "Cost"}
                        </span>
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {selectedVariant?.monthlyPrice === 0
                            ? "Free"
                            : `Rp ${selectedVariant?.monthlyPrice?.toLocaleString(
                                "id-ID"
                              )}/month`}
                        </span>
                      </div>

                      {/* Upgrade Cost Difference */}
                      {existingSubscription && selectedVariant && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="text-sm text-yellow-800">
                            <div className="flex justify-between">
                              <span>Current:</span>
                              <span>
                                Rp{" "}
                                {existingSubscription.monthlyPrice?.toLocaleString(
                                  "id-ID"
                                )}
                                /month
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>New:</span>
                              <span>
                                Rp{" "}
                                {selectedVariant.monthlyPrice?.toLocaleString(
                                  "id-ID"
                                )}
                                /month
                              </span>
                            </div>
                            <div className="flex justify-between font-medium border-t border-yellow-300 pt-2 mt-2">
                              <span>Difference:</span>
                              <span
                                className={
                                  selectedVariant.monthlyPrice >
                                  existingSubscription.monthlyPrice
                                    ? "text-red-600"
                                    : "text-green-600"
                                }
                              >
                                {selectedVariant.monthlyPrice >
                                existingSubscription.monthlyPrice
                                  ? "+"
                                  : ""}
                                Rp{" "}
                                {Math.abs(
                                  selectedVariant.monthlyPrice -
                                    existingSubscription.monthlyPrice
                                ).toLocaleString("id-ID")}
                                /month
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* No Upgrade Available Message */}
                      {existingSubscription &&
                        !selectedVariant &&
                        !isCheckingSubscription && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-green-800">
                                You're on the Highest Plan!
                              </span>
                            </div>
                            <div className="text-sm text-green-700">
                              <p>
                                You're currently on the{" "}
                                <strong>
                                  {existingSubscription.plan.name}
                                </strong>{" "}
                                plan, which is the highest tier available for
                                this service.
                              </p>
                              <p className="mt-2">
                                You have access to all premium features and
                                maximum resources.
                              </p>
                            </div>
                          </div>
                        )}

                      {/* Loading State */}
                      {isCheckingSubscription && (
                        <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          Checking existing subscriptions...
                        </div>
                      )}

                      {/* Error Message */}
                      {subscriptionError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                          {subscriptionError}
                        </div>
                      )}

                      {/* Only show button if there's a valid plan to select or no existing subscription */}
                      {(!existingSubscription || selectedVariant) && (
                        <Button
                          onClick={handleSubscribe}
                          disabled={
                            isSubscribing ||
                            !selectedVariant ||
                            isCheckingSubscription
                          }
                          className="cursor-pointer w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          {isSubscribing ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              {existingSubscription
                                ? "Upgrading..."
                                : "Subscribing..."}
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
                                  d={
                                    existingSubscription
                                      ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                      : "M13 10V3L4 14h7v7l9-11h-7z"
                                  }
                                />
                              </svg>
                              {existingSubscription
                                ? "Upgrade Service"
                                : "Deploy Service"}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog - Clean & Professional */}
      <Dialog open={showSuccessDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          {/* Header */}
          <DialogHeader className="pb-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <img
                  src={selectedService?.icon}
                  alt={selectedService?.name}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {provisioningStatus.isProvisioning
                    ? "Deploying Service"
                    : "Service Ready"}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  {selectedService?.name} • {selectedVariant?.name}
                </DialogDescription>
              </div>
              {!provisioningStatus.isProvisioning && (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Conditional Content - Show service ready or progress steps */}
          {!provisioningStatus.isProvisioning &&
          provisioningStatus.publicUrl ? (
            /* Service Ready - Show only when ready */
            <div className="py-2">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-900">
                  Your service is ready
                </p>

                {/* Service URL Display - matching my-apps page style */}
                <div className="space-y-2">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 border">
                    <p className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                      {provisioningStatus.publicUrl}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Progress Steps - Show only when provisioning */
            <div className="space-y-3 py-4">
              {/* Step 1: Subscription */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Subscription Created
                  </p>
                  <p className="text-xs text-gray-500">
                    Your subscription is active
                  </p>
                </div>
              </div>

              {/* Step 2: Service Status */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    provisioningStatus.status === "RUNNING"
                      ? "bg-green-500"
                      : "bg-gray-400"
                  }`}
                >
                  {provisioningStatus.status === "RUNNING" ? (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Service Deployment
                  </p>
                  <p className="text-xs text-gray-500">
                    Status: {provisioningStatus.status || "PROVISIONING"}
                  </p>
                </div>
              </div>

              {/* Step 3: Health Check */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    provisioningStatus.healthStatus === "Healthy"
                      ? "bg-green-500"
                      : provisioningStatus.status === "RUNNING"
                      ? "bg-gray-400"
                      : "bg-gray-300"
                  }`}
                >
                  {provisioningStatus.healthStatus === "Healthy" ? (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : provisioningStatus.status === "RUNNING" ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div className="w-3 h-3 border-2 border-white rounded-full opacity-50"></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Health Check
                  </p>
                  <p className="text-xs text-gray-500">
                    Status: {provisioningStatus.healthStatus || "Pending"}
                  </p>
                </div>
              </div>

              {/* Progress Message */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Setting up your service
                    </p>
                    <p className="text-xs text-gray-500">
                      This usually takes 1-2 minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Action Buttons - Only show when service is ready */}
          {!provisioningStatus.isProvisioning &&
            provisioningStatus.publicUrl && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    window.open(provisioningStatus.publicUrl, "_blank");
                  }}
                  className="flex-1 text-white cursor-pointer"
                >
                  Open App
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (pollingInterval) {
                      clearInterval(pollingInterval);
                      setPollingInterval(null);
                    }
                    setShowSuccessDialog(false);
                  }}
                  className="flex-1  cursor-pointer"
                >
                  Continue Browsing
                </Button>
              </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
