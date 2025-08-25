"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Settings,
  ExternalLink,
  Calendar,
  CreditCard,
  Server,
  Database,
  Activity,
  TrendingUp,
  AlertCircle,
  BarChart3,
  FileText,
  Eye,
  Cog,
  RotateCcw,
  Square,
  RefreshCw,
  Copy,
  Globe,
} from "lucide-react";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";
import { format } from "date-fns";
import Link from "next/link";

export default function MyAppDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [autoRenew, setAutoRenew] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (session?.accessToken && params.id) {
      fetchSubscriptionDetail();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [session, status, params.id]);

  const fetchSubscriptionDetail = async () => {
    if (!session?.accessToken) return;

    try {
      // Use specific endpoint for single subscription detail
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.MY_APPS.GET_ALL}/${params.id}`,
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
        const subscriptionData = result.data?.subscription;

        if (subscriptionData) {
          // Check if subscription status is ACTIVE
          if (subscriptionData.status !== "ACTIVE") {
            toast.error(
              "This subscription is not active. Redirecting to My Apps."
            );
            router.push("/dashboard/my-apps");
            return;
          }

          setSubscription(subscriptionData);
          setAutoRenew(subscriptionData.autoRenew);
        } else {
          toast.error("Subscription not found");
          router.push("/dashboard/my-apps");
        }
      } else {
        const errorResult = await response.json();
        toast.error(
          errorResult.message || "Failed to load subscription details"
        );
      }
    } catch (error) {
      toast.error("Error loading subscription details");
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
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      case "SUSPENDED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInstanceStatusColor = (status) => {
    switch (status) {
      case "RUNNING":
        return "bg-green-100 text-green-800";
      case "STOPPED":
        return "bg-gray-100 text-gray-800";
      case "ERROR":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateUsagePercentage = (used, total) => {
    if (!used || !total) return 0;
    return Math.min((parseFloat(used) / total) * 100, 100);
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await fetchSubscriptionDetail();
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">
          Loading application details...
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

  if (!subscription) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <div className="text-muted-foreground">Application not found</div>
          <Link href="/dashboard/my-apps">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Apps
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <img
              src={subscription.service.icon}
              alt={subscription.service.name}
              className="h-8 w-8"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <Server
              className="h-8 w-8 text-muted-foreground"
              style={{ display: "none" }}
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {subscription.service.name}
              </h1>
              <p className="text-muted-foreground">
                {subscription.plan.name} Plan - {subscription.service.slug}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {subscription.instances?.[0] && (
            <Badge
              className={getInstanceStatusColor(
                subscription.instances[0].status
              )}
            >
              {subscription.instances[0].status}
            </Badge>
          )}
          <Button variant="outline">
            <Square className="mr-2 h-4 w-4" />
            Stop
          </Button>
          <Button variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Restart
          </Button>
          <Button
            onClick={() =>
              subscription.instances?.[0]?.publicUrl &&
              window.open(subscription.instances[0].publicUrl, "_blank")
            }
            disabled={!subscription.instances?.[0]?.publicUrl}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open App
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid  grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="monitoring"
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Monitoring</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Logs</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Billing</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Cog className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Overview Cards */}
          {/* <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Cost
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(subscription.monthlyPrice)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {subscription.plan.planType} plan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Next Billing
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subscription.nextBilling
                    ? format(new Date(subscription.nextBilling), "dd MMM")
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {subscription.nextBilling
                    ? format(new Date(subscription.nextBilling), "yyyy")
                    : "No billing date"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {calculateUsagePercentage(
                    subscription.instances?.[0]?.cpuUsage,
                    subscription.plan.cpuMilli
                  ).toFixed(1)}
                  %
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${calculateUsagePercentage(
                        subscription.instances?.[0]?.cpuUsage,
                        subscription.plan.cpuMilli
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {(
                    (subscription.instances?.[0]?.cpuUsage || 0) / 1000
                  ).toFixed(2)}{" "}
                  of {(subscription.plan.cpuMilli / 1000).toFixed(2)} cores
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Memory Usage
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {calculateUsagePercentage(
                    subscription.instances?.[0]?.memoryUsage,
                    subscription.plan.memoryMb
                  ).toFixed(1)}
                  %
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${calculateUsagePercentage(
                        subscription.instances?.[0]?.memoryUsage,
                        subscription.plan.memoryMb
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {subscription.instances?.[0]?.memoryUsage || 0}MB of{" "}
                  {subscription.plan.memoryMb}MB
                </p>
              </CardContent>
            </Card>
          </div> */}

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Subscription Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application URL</CardTitle>
                  <CardDescription>
                    Access and manage your application URL
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscription.instances?.[0]?.publicUrl ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Public URL
                        </label>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex-1 p-2 bg-gray-50 rounded-lg border text-sm font-mono truncate">
                            {subscription.instances[0].publicUrl}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              copyToClipboard(
                                subscription.instances[0].publicUrl
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              subscription.instances?.[0]?.publicUrl &&
                              window.open(
                                subscription.instances[0].publicUrl,
                                "_blank"
                              )
                            }
                            disabled={!subscription.instances?.[0]?.publicUrl}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Globe className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No public URL available
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Details</CardTitle>
                  <CardDescription>
                    Complete information about your subscription
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Service
                      </label>
                      <p className="text-sm">{subscription.service.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Plan
                      </label>
                      <p className="text-sm">{subscription.plan.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Status
                      </label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(subscription.status)}>
                          {subscription.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Auto Renew
                      </label>
                      <p className="text-sm">
                        {subscription.autoRenew ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Start Date
                      </label>
                      <p className="text-sm">
                        {subscription.startDate
                          ? format(
                              new Date(subscription.startDate),
                              "dd MMM yyyy"
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        End Date
                      </label>
                      <p className="text-sm">
                        {subscription.endDate
                          ? format(
                              new Date(subscription.endDate),
                              "dd MMM yyyy"
                            )
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Plan Information</CardTitle>
                  <CardDescription>
                    Your current resource plan details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Plan Name
                      </label>
                      <p className="text-sm font-semibold">
                        {subscription.plan.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Plan Type
                      </label>
                      <p className="text-sm font-semibold">
                        {subscription.plan.planType}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        CPU Allocation
                      </label>
                      <p className="text-sm font-semibold">
                        {(subscription.plan.cpuMilli / 1000).toFixed(2)} cores
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Memory Allocation
                      </label>
                      <p className="text-sm font-semibold">
                        {subscription.plan.memoryMb}MB
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Storage Allocation
                      </label>
                      <p className="text-sm font-semibold">
                        {subscription.plan.storageGb}GB
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Monthly Price
                      </label>
                      <p className="text-sm font-semibold">
                        {formatCurrency(subscription.monthlyPrice)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" variant="outline">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Settings
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() =>
                      subscription.instances?.[0]?.publicUrl &&
                      window.open(subscription.instances[0].publicUrl, "_blank")
                    }
                    disabled={!subscription.instances?.[0]?.publicUrl}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Application
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Resource Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                Real-time resource usage and performance metrics
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          {/* Resource Usage Cards - 3 Columns */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {calculateUsagePercentage(
                    subscription.instances?.[0]?.cpuUsage,
                    subscription.plan.cpuMilli
                  ).toFixed(1)}
                  %
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${calculateUsagePercentage(
                        subscription.instances?.[0]?.cpuUsage,
                        subscription.plan.cpuMilli
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {(
                    (subscription.instances?.[0]?.cpuUsage || 0) / 1000
                  ).toFixed(2)}{" "}
                  of {(subscription.plan.cpuMilli / 1000).toFixed(2)} cores
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Memory Usage
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {calculateUsagePercentage(
                    subscription.instances?.[0]?.memoryUsage,
                    subscription.plan.memoryMb
                  ).toFixed(1)}
                  %
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${calculateUsagePercentage(
                        subscription.instances?.[0]?.memoryUsage,
                        subscription.plan.memoryMb
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {subscription.instances?.[0]?.memoryUsage || 0}MB of{" "}
                  {subscription.plan.memoryMb}MB
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Storage Usage
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subscription.plan.storageGb > 0
                    ? calculateUsagePercentage(
                        subscription.instances?.[0]?.storageUsage,
                        subscription.plan.storageGb
                      ).toFixed(1)
                    : 0}
                  %
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width:
                        subscription.plan.storageGb > 0
                          ? `${calculateUsagePercentage(
                              subscription.instances?.[0]?.storageUsage,
                              subscription.plan.storageGb
                            )}%`
                          : "0%",
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {subscription.instances?.[0]?.storageUsage || 0}GB of{" "}
                  {subscription.plan.storageGb}GB allocated
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Instance Status Card - Full Width */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Instance Status
                </h3>
                <Badge
                  className={getInstanceStatusColor(
                    subscription.instances?.[0]?.status || "STOPPED"
                  )}
                >
                  {subscription.instances?.[0]?.status || "STOPPED"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Instance Name
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {subscription.instances?.[0]?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Health Status
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {subscription.instances?.[0]?.healthStatus || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Public URL
                    </p>
                    <p className="text-base font-semibold text-blue-600 truncate">
                      {subscription.instances?.[0]?.publicUrl || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      SSL Enabled
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {subscription.instances?.[0]?.sslEnabled ? "Yes" : "No"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Last Started
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {subscription.instances?.[0]?.lastStarted
                        ? format(
                            new Date(subscription.instances[0].lastStarted),
                            "dd MMM yyyy, HH:mm"
                          )
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Last Health Check
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {subscription.instances?.[0]?.lastHealthCheck
                        ? format(
                            new Date(subscription.instances[0].lastHealthCheck),
                            "dd MMM yyyy, HH:mm"
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Logs</CardTitle>
              <CardDescription>Recent activity and system logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                  <div className="space-y-1">
                    <div className="text-green-600">
                      [2024-01-15 10:30:15] INFO: Application started
                      successfully
                    </div>
                    <div className="text-blue-600">
                      [2024-01-15 10:30:16] DEBUG: Database connection
                      established
                    </div>
                    <div className="text-gray-600">
                      [2024-01-15 10:30:17] INFO: Server listening on port 3000
                    </div>
                    <div className="text-yellow-600">
                      [2024-01-15 10:35:22] WARN: High memory usage detected
                      (75%)
                    </div>
                    <div className="text-green-600">
                      [2024-01-15 10:40:33] INFO: Backup completed successfully
                    </div>
                    <div className="text-red-600">
                      [2024-01-15 10:45:12] ERROR: Failed to connect to external
                      API
                    </div>
                    <div className="text-blue-600">
                      [2024-01-15 10:45:15] DEBUG: Retrying API connection...
                    </div>
                    <div className="text-green-600">
                      [2024-01-15 10:45:18] INFO: API connection restored
                    </div>
                    <div className="text-gray-600">
                      [2024-01-15 10:50:25] INFO: Processing user request
                    </div>
                    <div className="text-blue-600">
                      [2024-01-15 10:55:33] DEBUG: Cache cleared successfully
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Download Logs
                  </Button>
                  <Button variant="outline" size="sm">
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Current Plan Card */}
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  Your active subscription details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-medium">{subscription.plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Price:</span>
                  <span className="font-medium">
                    {formatCurrency(subscription.monthlyPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Next Billing:</span>
                  <span className="font-medium">
                    {subscription.nextBilling
                      ? format(
                          new Date(subscription.nextBilling),
                          "dd MMM yyyy"
                        )
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Auto Renew:</span>
                  <Switch
                    checked={autoRenew || subscription.autoRenew}
                    onCheckedChange={setAutoRenew}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Options Card */}
            <Card>
              <CardHeader>
                <CardTitle>Upgrade Options</CardTitle>
                <CardDescription>
                  Available plans for your application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Pro Plan</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(299000)}/month
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      2.00 CPU cores • 2GB RAM • 20GB Storage
                    </div>
                    <Button size="sm" className="w-full">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Upgrade to Pro
                    </Button>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Enterprise Plan</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(599000)}/month
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      4.00 CPU cores • 4GB RAM • 50GB Storage
                    </div>
                    <Button size="sm" className="w-full">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Upgrade to Enterprise
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Billing History - Full Width */}
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                Recent payment transactions and invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription.transactions &&
              subscription.transactions.length > 0 ? (
                <div className="space-y-3">
                  {subscription.transactions.map((transaction, index) => (
                    <div
                      key={transaction.id || index}
                      className="flex justify-between items-center py-3 border-b"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {transaction.description || "Monthly Subscription"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.createdAt
                            ? format(
                                new Date(transaction.createdAt),
                                "dd MMM yyyy"
                              )
                            : "N/A"}{" "}
                          • Invoice #{transaction.invoiceNumber || "N/A"}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge
                          className={
                            transaction.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {transaction.status === "COMPLETED"
                            ? "Paid"
                            : transaction.status}
                        </Badge>
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(transaction.amount)}
                        </div>
                        <Button variant="outline" size="sm">
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    No billing history available
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full">
                  View All Billing History
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>
                  Configure your application preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Application Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    defaultValue={subscription.service.name}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Environment</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Production</option>
                    <option>Staging</option>
                    <option>Development</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Auto Scaling</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Enabled</option>
                    <option>Disabled</option>
                  </select>
                </div>
                <Button className="w-full">Save Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Cancel Subscription
                  </h4>
                  <p className="text-sm text-red-600 mb-3">
                    This will immediately cancel your subscription and stop all
                    services.
                  </p>
                  <Button variant="destructive" size="sm">
                    Cancel Subscription
                  </Button>
                </div>
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Delete Application
                  </h4>
                  <p className="text-sm text-red-600 mb-3">
                    Permanently delete this application and all associated data.
                  </p>
                  <Button variant="destructive" size="sm">
                    Delete Application
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
