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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Smartphone,
  Wallet,
  Clock,
  ExternalLink,
  Settings,
  Calendar,
  Globe,
  AlertCircle,
  Plus,
  Server,
} from "lucide-react";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);
  const [walletInfo, setWalletInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.accessToken) {
      fetchSubscriptions();
      fetchWalletInfo();
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
        toast.error(errorResult.message || "Failed to load subscriptions");
      }
    } catch (error) {
      toast.error("Error loading subscriptions");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWalletInfo = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.WALLET.INFO}`,
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
        setWalletInfo(result.data.wallet);
      }
    } catch (error) {
      console.error("Error loading wallet info:", error);
    }
  };

  // Helper functions from my-apps page
  const getInstance = (subscription) => {
    return subscription.instances && subscription.instances.length > 0
      ? subscription.instances[0]
      : null;
  };

  const getSubdomain = (subscription) => {
    const instance = getInstance(subscription);
    return instance ? instance.subdomain : null;
  };

  const getPublicUrl = (subscription) => {
    const instance = getInstance(subscription);
    return instance ? instance.publicUrl : null;
  };

  const canOpenApp = (subscription) => {
    const instance = getInstance(subscription);
    return (
      subscription.status === "ACTIVE" &&
      instance &&
      instance.status !== "ERROR" &&
      instance.publicUrl
    );
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter subscriptions (exclude cancelled)
  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status !== "CANCELLED"
  );
  const totalActiveSubscriptions = activeSubscriptions.filter(
    (sub) => sub.status === "ACTIVE"
  ).length;

  // Get expiring soon (within 7 days)
  const expiringSoon = activeSubscriptions.filter((sub) => {
    if (!sub.endDate) return false;
    const endDate = new Date(sub.endDate);
    const now = new Date();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  }).length;

  const stats = [
    {
      title: "Active Subscriptions",
      value: totalActiveSubscriptions.toString(),
      description: "Currently running",
      icon: CheckCircle,
      trend: `Currently running apps`,
    },
    {
      title: "Total Subscriptions",
      value: activeSubscriptions.length.toString(),
      description: "All subscriptions",
      icon: Smartphone,
      trend: "All subscribed apps",
    },
    {
      title: "Account Balance",
      value: walletInfo
        ? formatCurrency(walletInfo.creditBalance)
        : "Loading...",
      description: "Available credit",
      icon: Wallet,
      trend: walletInfo
        ? `Spent: ${formatCurrency(walletInfo.totalSpent)}`
        : "",
    },
    {
      title: "Expiring Soon",
      value: expiringSoon.toString(),
      description: "Within 7 days",
      icon: Clock,
      trend: expiringSoon > 0 ? "Renewal required" : "All up to date",
    },
  ];

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading dashboard...</div>
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your subscriptions.
        </p>
      </div>

      {/* Stats Cards */}
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
              <p className="text-xs text-muted-foreground">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Subscriptions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              {" "}
              <Server strokeWidth={2.5} className="h-4 w-4 text-gray-500" /> My
              Subscriptions
            </h3>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/my-apps">View All</Link>
          </Button>
        </div>

        {activeSubscriptions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Smartphone className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  No subscriptions yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  You haven't subscribed to any applications yet. Browse our
                  services to find the perfect apps for your needs.
                </p>
                <Button
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link href="/dashboard/applications">Browse Services</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeSubscriptions.slice(0, 5).map((subscription) => (
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
                      <span className="text-sm text-gray-500 font-medium dark:text-white">
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
                          variant="outline"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 hover:text-white text-white cursor-pointer"
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
                            } else if (
                              instance &&
                              instance.status === "ERROR"
                            ) {
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
            {/* Add New Service Card */}
            <div>
              <Card className="flex flex-col items-center justify-center h-full min-h-[220px] border-dashed border-2 border-zinc-200 hover:border-zinc-400 transition-colors cursor-pointer group">
                <Link href="/dashboard/applications" className="w-full h-full">
                  <CardContent className="flex flex-col items-center justify-center h-full w-full cursor-pointer">
                    <div className="flex items-center justify-center mb-3">
                      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-50 group-hover:bg-zinc-100 transition-colors">
                        <Plus className="text-zinc-400 group-hover:text-zinc-500" />
                      </span>
                    </div>
                    <div className="text-center">
                      <h4 className="text-base font-semibold text-zinc-500 group-hover:text-zinc-700 mb-1">
                        Add New Service
                      </h4>
                      <p className="text-xs text-zinc-500">
                        Browse and deploy a new app or service
                      </p>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
