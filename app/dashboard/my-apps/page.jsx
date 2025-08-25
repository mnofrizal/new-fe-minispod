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
  Smartphone,
  Plus,
  ExternalLink,
  Settings,
  Search,
  Grid3X3,
  List,
  Calendar,
  Globe,
} from "lucide-react";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function MyAppsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("card"); // "card" or "list"

  useEffect(() => {
    if (session?.accessToken) {
      fetchSubscriptions();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [session, status]);

  const fetchSubscriptions = async () => {
    if (!session?.accessToken) return;

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
        setSubscriptions(result.data.subscriptions || []);
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || "Failed to load subscriptions", {
          style: {
            background: "#ef4444",
            color: "white",
            border: "1px solid #dc2626",
          },
        });
      }
    } catch (error) {
      toast.error("Error loading subscriptions", {
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PENDING_DEPLOYMENT":
        return "bg-yellow-100 text-yellow-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      case "SUSPENDED":
        return "bg-red-100 text-red-800";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "ACTIVE":
        return "Active";
      case "PENDING_DEPLOYMENT":
        return "Pending Deployment";
      case "INACTIVE":
        return "Inactive";
      case "SUSPENDED":
        return "Suspended";
      case "EXPIRED":
        return "Expired";
      case "CANCELLED":
        return "Canceled";
      default:
        return status;
    }
  };

  // Filter subscriptions based on search query and exclude cancelled subscriptions
  const filteredSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.status !== "CANCELLED" &&
      (subscription.service.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        subscription.plan.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        subscription.service.slug
          .toLowerCase()
          .includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to get the first instance (assuming one instance per subscription)
  const getInstance = (subscription) => {
    return subscription.instances && subscription.instances.length > 0
      ? subscription.instances[0]
      : null;
  };

  // Helper function to get subdomain from instance
  const getSubdomain = (subscription) => {
    const instance = getInstance(subscription);
    return instance ? instance.subdomain : null;
  };

  // Helper function to get public URL from instance
  const getPublicUrl = (subscription) => {
    const instance = getInstance(subscription);
    return instance ? instance.publicUrl : null;
  };

  // Helper function to determine if app can be opened (active subscription + healthy instance)
  const canOpenApp = (subscription) => {
    const instance = getInstance(subscription);
    return (
      subscription.status === "ACTIVE" &&
      instance &&
      instance.status !== "ERROR" &&
      instance.publicUrl
    );
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">
          Loading your applications...
        </div>
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Apps</h2>
          <p className="text-muted-foreground">
            Manage and monitor your applications
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b pb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full h-11"
          />
        </div>
        <div className="flex items-center">
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("card")}
            className="flex items-center gap-2 rounded-r-none h-10 w-10"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="flex items-center gap-2 rounded-l-none h-10 w-10"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Apps Display */}
      {filteredSubscriptions.length === 0 && subscriptions.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No apps found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your search query to find what you're looking for.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : subscriptions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Smartphone className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No apps yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                You haven't subscribed to any applications yet. Start by
                creating your first application.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "card" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubscriptions.map((subscription) => (
            <Card
              key={subscription.id}
              className="hover:shadow-xl transition-all duration-300 group border gap-2"
            >
              <CardHeader className="pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gray-100 border dark:bg-blue-900 rounded-lg">
                        <img
                          src={subscription.service.icon}
                          alt={subscription.service.name}
                          className="w-9 h-9 object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "block";
                          }}
                        />
                        <Smartphone
                          className="w-9 h-9 text-muted-foreground"
                          style={{ display: "none" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate text-gray-900 dark:text-white">
                          {subscription.service.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                          {subscription.plan.name} Plan
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={`text-white text-xs font-medium px-2 py-1 ${getStatusColor(
                      subscription.status
                    )}`}
                  >
                    {getStatusText(subscription.status)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* App URL - if subdomain exists */}
                {getSubdomain(subscription) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Globe className="w-4 h-4" />
                      <span>App URL</span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 border">
                      <p className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                        {getSubdomain(subscription)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Expiry Date - if available */}
                {subscription.endDate && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Expires</span>
                    </div>
                    <span className="text-sm text-gray-500  dark:text-white">
                      {formatDate(subscription.endDate)}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {canOpenApp(subscription) ? (
                    <>
                      <Button
                        size="lg"
                        variant=""
                        className="flex-1 cursor-pointer"
                        onClick={() =>
                          window.open(getPublicUrl(subscription), "_blank")
                        }
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open App
                      </Button>
                      <Button
                        size="lg"
                        className="cursor-pointer"
                        variant="outline"
                        onClick={() =>
                          router.push(`/dashboard/my-apps/${subscription.id}`)
                        }
                      >
                        Manage
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1"
                        disabled={!canOpenApp(subscription)}
                        onClick={() => {
                          if (canOpenApp(subscription)) {
                            window.open(getPublicUrl(subscription), "_blank");
                          } else {
                            router.push(
                              `/dashboard/my-apps/${subscription.id}`
                            );
                          }
                        }}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {(() => {
                          const instance = getInstance(subscription);
                          if (
                            subscription.status === "PENDING_DEPLOYMENT" ||
                            (instance && instance.status === "PROVISIONING")
                          ) {
                            return "Deploying...";
                          } else if (instance && instance.status === "ERROR") {
                            return "Error";
                          } else if (canOpenApp(subscription)) {
                            return "Open App";
                          } else {
                            return "View Details";
                          }
                        })()}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() =>
                          router.push(`/dashboard/my-apps/${subscription.id}`)
                        }
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Manage
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="gap-4 flex flex-col">
          {filteredSubscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border rounded-lg"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="p-2 bg-gray-100 border dark:bg-blue-900 rounded-lg">
                  <img
                    src={subscription.service.icon}
                    alt={subscription.service.name}
                    className="w-9 h-9 object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <Smartphone
                    className="w-9 h-9 text-muted-foreground"
                    style={{ display: "none" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {subscription.service.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {subscription.plan.name} Plan - {subscription.service.slug}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Badge className={getStatusColor(subscription.status)}>
                  {subscription.status}
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canOpenApp(subscription)}
                    onClick={() => {
                      if (canOpenApp(subscription)) {
                        window.open(getPublicUrl(subscription), "_blank");
                      } else {
                        router.push(`/dashboard/my-apps/${subscription.id}`);
                      }
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {(() => {
                      const instance = getInstance(subscription);
                      if (
                        subscription.status === "PENDING_DEPLOYMENT" ||
                        (instance && instance.status === "PROVISIONING")
                      ) {
                        return "Deploying...";
                      } else if (instance && instance.status === "ERROR") {
                        return "Error";
                      } else if (canOpenApp(subscription)) {
                        return "Open App";
                      } else {
                        return "View Details";
                      }
                    })()}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/dashboard/my-apps/${subscription.id}`)
                    }
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Manage
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
