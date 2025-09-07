"use client";

import { useState, useEffect, useRef } from "react";
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
  Wifi,
  WifiOff,
  ChevronDown,
  Play,
  RotateCw,
} from "lucide-react";
import { io } from "socket.io-client";
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
  const [isAutoRenewLoading, setIsAutoRenewLoading] = useState(false);
  const [autoRenewMessage, setAutoRenewMessage] = useState("");
  const [autoRenewNextSteps, setAutoRenewNextSteps] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLogConnected, setIsLogConnected] = useState(false);
  const [billingInfo, setBillingInfo] = useState(null);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState("");
  const [isStopLoading, setIsStopLoading] = useState(false);
  const [isRestartLoading, setIsRestartLoading] = useState(false);
  const [isStartLoading, setIsStartLoading] = useState(false);
  const [isRetryLoading, setIsRetryLoading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showProvisioningDialog, setShowProvisioningDialog] = useState(false);
  const [upgradeProvisioningStatus, setUpgradeProvisioningStatus] = useState({
    isProvisioning: false,
    status: "PENDING",
    healthStatus: "Unknown",
    publicUrl: null,
    adminUrl: null,
  });
  const [upgradePollingInterval, setUpgradePollingInterval] = useState(null);
  const [upgradeToastId, setUpgradeToastId] = useState(null);
  const socketRef = useRef(null);
  const logsContainerRef = useRef(null);

  const fetchMetrics = async () => {
    if (!session?.accessToken || !params.id) return;
    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.MY_APPS.GET_METRICS.replace(
          ":id",
          params.id
        )}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (response.ok) {
        const result = await response.json();
        setMetrics(result.data);
      } else {
        console.error("Failed to fetch metrics");
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  const fetchBillingInfo = async () => {
    if (!session?.accessToken || !params.id) return;
    try {
      const response = await fetch(
        `${
          ENV_CONFIG.BASE_API_URL
        }${API_ENDPOINTS.MY_APPS.GET_BILLING_INFO.replace(":id", params.id)}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (response.ok) {
        const result = await response.json();
        setBillingInfo(result.data);
      } else {
        console.error("Failed to fetch billing info");
      }
    } catch (error) {
      console.error("Error fetching billing info:", error);
    }
  };

  const handleStopInstance = async () => {
    if (!session?.accessToken || !params.id) return;

    setIsStopLoading(true);
    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.MY_APPS.STOP.replace(
          ":id",
          params.id
        )}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || "Instance stopped successfully");
        // Refresh subscription data to update status
        await fetchSubscriptionDetail();
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || "Failed to stop instance");
      }
    } catch (error) {
      toast.error("Error stopping instance");
    } finally {
      setIsStopLoading(false);
    }
  };

  const handleRestartInstance = async () => {
    if (!session?.accessToken || !params.id) return;

    setIsRestartLoading(true);
    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.MY_APPS.RESTART.replace(
          ":id",
          params.id
        )}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || "Instance restarted successfully");
        // Refresh subscription data to update status
        await fetchSubscriptionDetail();
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || "Failed to restart instance");
      }
    } catch (error) {
      toast.error("Error restarting instance");
    } finally {
      setIsRestartLoading(false);
    }
  };

  const handleStartInstance = async () => {
    if (!session?.accessToken || !params.id) return;

    setIsStartLoading(true);
    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.MY_APPS.START.replace(
          ":id",
          params.id
        )}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || "Instance started successfully");
        // Refresh subscription data to update status
        await fetchSubscriptionDetail();
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || "Failed to start instance");
      }
    } catch (error) {
      toast.error("Error starting instance");
    } finally {
      setIsStartLoading(false);
    }
  };

  const handleRetryProvisioning = async () => {
    if (!session?.accessToken || !params.id) return;

    setIsRetryLoading(true);
    try {
      const response = await fetch(
        `${
          ENV_CONFIG.BASE_API_URL
        }${API_ENDPOINTS.MY_APPS.RETRY_PROVISIONING.replace(":id", params.id)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(
          result.message || "Retry provisioning started successfully"
        );
        // Refresh subscription data to update status
        await fetchSubscriptionDetail();
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || "Failed to retry provisioning");
      }
    } catch (error) {
      toast.error("Error retrying provisioning");
    } finally {
      setIsRetryLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!session?.accessToken || !params.id || !selectedUpgradePlan) return;

    try {
      setIsUpgrading(true);

      const response = await fetch(
        `${
          ENV_CONFIG.BASE_API_URL
        }${API_ENDPOINTS.SUBSCRIPTIONS.UPGRADE.replace(":id", params.id)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newPlanId: selectedUpgradePlan,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setShowUpgradeDialog(false);
        setShowProvisioningDialog(true);
        setUpgradeProvisioningStatus({
          isProvisioning: true,
          status: "PROVISIONING",
          healthStatus: "Unknown",
          publicUrl: null,
          adminUrl: null,
        });

        // Start polling for upgrade status
        startUpgradePolling(params.id);
        toast.success("Upgrade started successfully!");
      } else {
        toast.error(data.message || "Failed to upgrade service");
      }
    } catch (err) {
      toast.error("An error occurred while upgrading the service");
    } finally {
      setIsUpgrading(false);
    }
  };

  const startUpgradePolling = (subscriptionId) => {
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

          if (result.data && result.data.subscription) {
            const subscription = result.data.subscription;

            if (subscription.instances && subscription.instances.length > 0) {
              const instance = subscription.instances[0];
              const isReady =
                instance.status === "RUNNING" &&
                instance.healthStatus === "Healthy";

              setUpgradeProvisioningStatus({
                isProvisioning: !isReady,
                status: instance.status,
                healthStatus: instance.healthStatus,
                publicUrl: instance.publicUrl,
                adminUrl: instance.adminUrl,
              });

              // Show success toast when upgrade is complete
              if (isReady) {
                toast.success("🎉 Upgrade Complete!", {
                  description: `Your service has been successfully upgraded`,
                });
                // Refresh subscription data
                await fetchSubscriptionDetail();
              }

              // Stop polling when service is running and healthy
              if (isReady) {
                clearInterval(interval);
                setUpgradePollingInterval(null);
              }
            } else {
              // No instances yet, keep provisioning status
              setUpgradeProvisioningStatus((prev) => ({
                ...prev,
                status: "PROVISIONING",
                healthStatus: "Unknown",
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error polling upgrade status:", error);
      }
    }, 3000);

    setUpgradePollingInterval(interval);
  };

  const handleUpgradeDialogClose = (open) => {
    setShowProvisioningDialog(open);
  };

  useEffect(() => {
    if (session?.accessToken && params.id) {
      fetchSubscriptionDetail();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [session, status, params.id]);

  useEffect(() => {
    if (activeTab === "monitoring") {
      fetchMetrics(); // Fetch immediately when tab is opened
      const intervalId = setInterval(fetchMetrics, 10000); // Poll every 10 seconds
      return () => clearInterval(intervalId); // Cleanup on unmount or tab change
    } else if (activeTab === "billing") {
      fetchBillingInfo(); // Fetch billing info when billing tab is opened
    } else if (activeTab === "logs") {
      if (session?.accessToken && params.id && !socketRef.current?.connected) {
        setLogs([]);
        const socket = io(`${ENV_CONFIG.BASE_API_URL}/k8s-logs`, {
          auth: {
            token: session.accessToken,
            subscriptionId: params.id,
          },
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          setIsLogConnected(true);
          setLogs((prev) => [
            ...prev,
            { type: "info", msg: "Connected to logs stream." },
          ]);
        });

        socket.on("disconnect", () => {
          setIsLogConnected(false);
          setLogs((prev) => [
            ...prev,
            { type: "info", msg: "Disconnected from logs stream." },
          ]);
        });

        socket.on("log-data", (data) => {
          setLogs((prev) => [...prev, { type: "data", msg: data.trim() }]);
        });

        socket.on("log-error", (error) => {
          setLogs((prev) => [...prev, { type: "error", msg: error }]);
        });

        return () => {
          socket.disconnect();
          socketRef.current = null;
        };
      }
    }
  }, [activeTab, session, params.id]);

  // Auto-select first available upgrade plan when billing info loads
  useEffect(() => {
    if (
      billingInfo?.availableUpgrades &&
      billingInfo.availableUpgrades.length > 0
    ) {
      setSelectedUpgradePlan(billingInfo.availableUpgrades[0].id);
    } else {
      setSelectedUpgradePlan("");
    }
  }, [billingInfo]);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

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
    if (total === 0) return 0;
    return Math.min((parseFloat(used) / total) * 100, 100);
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const promises = [fetchSubscriptionDetail()];
      if (activeTab === "monitoring") {
        promises.push(fetchMetrics());
      }
      if (activeTab === "billing") {
        promises.push(fetchBillingInfo());
      }
      await Promise.all(promises);
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAutoRenewToggle = async (newAutoRenewValue) => {
    if (!session?.accessToken || !params.id) return;

    setIsAutoRenewLoading(true);
    try {
      const response = await fetch(
        `${
          ENV_CONFIG.BASE_API_URL
        }${API_ENDPOINTS.SUBSCRIPTIONS.AUTO_RENEW_TOGGLE.replace(
          ":id",
          params.id
        )}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            autoRenew: newAutoRenewValue,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setAutoRenew(newAutoRenewValue);

        // Update auto-renew message and next steps from API response
        if (result.data?.message) {
          setAutoRenewMessage(result.data.message);
        }
        if (result.data?.nextSteps) {
          setAutoRenewNextSteps(result.data.nextSteps);
        }

        // Update billing info with the latest data from API response
        if (result.data?.billingInfo) {
          setBillingInfo((prevBillingInfo) => ({
            ...prevBillingInfo,
            billingInfo: {
              ...prevBillingInfo?.billingInfo,
              ...result.data.billingInfo,
            },
          }));
        }

        // Update subscription data with the latest data from API response
        if (result.data?.subscription) {
          setSubscription((prevSubscription) => ({
            ...prevSubscription,
            ...result.data.subscription,
          }));
        }

        toast.success(
          result.message ||
            `Auto-renew ${
              newAutoRenewValue ? "enabled" : "disabled"
            } successfully`
        );
        // Refresh subscription data to ensure consistency
        await fetchSubscriptionDetail();
      } else {
        const errorResult = await response.json();
        toast.error(
          errorResult.message || "Failed to update auto-renew setting"
        );
      }
    } catch (error) {
      toast.error("Error updating auto-renew setting");
    } finally {
      setIsAutoRenewLoading(false);
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

  // Socket connection functions
  const connectToLogs = () => {
    if (!session?.accessToken || !params.id || socketRef.current?.connected)
      return;

    // Clear old logs when reconnecting
    setLogs([]);

    const socket = io(`${ENV_CONFIG.BASE_API_URL}/k8s-logs`, {
      auth: {
        token: session.accessToken,
        subscriptionId: params.id,
      },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsLogConnected(true);
      setLogs((prev) => [
        ...prev,
        { type: "info", msg: "Connected to logs stream." },
      ]);
      toast.success("Connected to logs stream");
    });

    socket.on("disconnect", () => {
      setIsLogConnected(false);
      setLogs((prev) => [
        ...prev,
        { type: "info", msg: "Disconnected from logs stream." },
      ]);
      toast.info("Disconnected from logs stream");
    });

    socket.on("log-data", (data) => {
      setLogs((prev) => [...prev, { type: "data", msg: data.trim() }]);
    });

    socket.on("log-error", (error) => {
      setLogs((prev) => [...prev, { type: "error", msg: error }]);
    });
  };

  const disconnectFromLogs = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsLogConnected(false);
      toast.info("Manually disconnected from logs stream");
    }
  };

  // Helper function to parse log entries
  const parseLogEntry = (logMessage) => {
    // Parse log format: [2025-08-26 15:37:50] INFO "GET /healthz" 301 2ms
    const logRegex = /^\[([^\]]+)\]\s+(\w+)\s+(.*)$/;
    const match = logMessage.match(logRegex);

    if (!match) {
      return {
        timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
        level: "INFO",
        message: logMessage,
        method: null,
        path: null,
        statusCode: null,
        duration: null,
      };
    }

    const [, timestamp, level, rest] = match;

    // Try to parse HTTP request format: "GET /healthz" 301 2ms
    const httpRegex = /^"(\w+)\s+([^"]+)"\s+(\d+)\s+(\d+ms)$/;
    const httpMatch = rest.match(httpRegex);

    if (httpMatch) {
      const [, method, path, statusCode, duration] = httpMatch;
      return {
        timestamp,
        level,
        method,
        path,
        statusCode: parseInt(statusCode),
        duration,
        message: null,
      };
    }

    // If not HTTP format, treat as regular message
    return {
      timestamp,
      level,
      message: rest,
      method: null,
      path: null,
      statusCode: null,
      duration: null,
    };
  };

  // Component for log level badges
  const LogLevelBadge = ({ level }) => {
    const getLogLevelStyle = (level) => {
      switch (level?.toUpperCase()) {
        case "ERROR":
          return "bg-red-500/20 text-red-400 border-red-500/30";
        case "WARN":
        case "WARNING":
          return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
        case "INFO":
          return "bg-blue-500/20 text-blue-400 border-blue-500/30";
        case "DEBUG":
          return "bg-purple-500/20 text-purple-400 border-purple-500/30";
        case "SUCCESS":
          return "bg-green-500/20 text-green-400 border-green-500/30";
        default:
          return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      }
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getLogLevelStyle(
          level
        )}`}
      >
        {level}
      </span>
    );
  };

  // Component for status code badges
  const StatusCodeBadge = ({ code }) => {
    const getStatusCodeStyle = (code) => {
      if (code >= 200 && code < 300) {
        return "bg-green-500/20 text-green-400 border-green-500/30";
      } else if (code >= 300 && code < 400) {
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      } else if (code >= 400 && code < 500) {
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      } else if (code >= 500) {
        return "bg-red-500/20 text-red-400 border-red-500/30";
      }
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    };

    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${getStatusCodeStyle(
          code
        )}`}
      >
        {code}
      </span>
    );
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
          {subscription.instances?.[0]?.status === "ERROR" ||
          subscription.instances?.[0]?.status === "PROVISIONING" ||
          subscription.instances?.[0]?.status === "PENDING" ? (
            <Button
              variant="outline"
              onClick={handleRetryProvisioning}
              disabled={
                isRetryLoading ||
                subscription.instances?.[0]?.status === "PROVISIONING" ||
                subscription.instances?.[0]?.status === "PENDING"
              }
            >
              <RotateCw className="mr-2 h-4 w-4" />
              {subscription.instances?.[0]?.status === "PROVISIONING"
                ? "Provisioning..."
                : subscription.instances?.[0]?.status === "PENDING"
                ? "Pending..."
                : isRetryLoading
                ? "Retrying..."
                : "Retry Deploy"}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={
                  subscription.instances?.[0]?.status === "STOPPED"
                    ? handleStartInstance
                    : handleStopInstance
                }
                disabled={
                  !subscription.instances?.[0]?.status ||
                  isStartLoading ||
                  isStopLoading ||
                  isRestartLoading ||
                  subscription.instances?.[0]?.status === "RESTARTING" ||
                  subscription.instances?.[0]?.status === "STOPPING" ||
                  subscription.instances?.[0]?.status === "STARTING"
                }
              >
                {subscription.instances?.[0]?.status === "STOPPED" ? (
                  <Play className="mr-2 h-4 w-4" />
                ) : (
                  <Square className="mr-2 h-4 w-4" />
                )}
                {subscription.instances?.[0]?.status === "STOPPED"
                  ? isStartLoading
                    ? "Starting..."
                    : "Start"
                  : isStopLoading
                  ? "Stopping..."
                  : "Stop"}
              </Button>
              <Button
                variant="outline"
                onClick={handleRestartInstance}
                disabled={
                  !subscription.instances?.[0]?.status ||
                  isStartLoading ||
                  isStopLoading ||
                  isRestartLoading ||
                  subscription.instances?.[0]?.status === "STOPPED" ||
                  subscription.instances?.[0]?.status === "RESTARTING" ||
                  subscription.instances?.[0]?.status === "STOPPING" ||
                  subscription.instances?.[0]?.status === "STARTING"
                }
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {isRestartLoading ? "Restarting..." : "Restart"}
              </Button>
            </>
          )}
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
                          <div className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg border text-base font-mono truncate">
                            <div>{subscription.instances[0].publicUrl}</div>
                            <div className="flex gap-2">
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
                                disabled={
                                  !subscription.instances?.[0]?.publicUrl
                                }
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
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
                  {metrics
                    ? metrics.cpu.percentage.toFixed(1)
                    : calculateUsagePercentage(
                        subscription.instances?.[0]?.cpuUsage,
                        subscription.plan.cpuMilli
                      ).toFixed(1)}
                  %
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        metrics
                          ? metrics.cpu.percentage
                          : calculateUsagePercentage(
                              subscription.instances?.[0]?.cpuUsage,
                              subscription.plan.cpuMilli
                            )
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics
                    ? `${(metrics.cpu.usage / 1000).toFixed(2)} of ${(
                        metrics.cpu.limit / 1000
                      ).toFixed(2)} cores`
                    : `${(
                        (subscription.instances?.[0]?.cpuUsage || 0) / 1000
                      ).toFixed(2)} of ${(
                        subscription.plan.cpuMilli / 1000
                      ).toFixed(2)} cores`}
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
                  {metrics
                    ? metrics.memory.percentage.toFixed(1)
                    : calculateUsagePercentage(
                        subscription.instances?.[0]?.memoryUsage,
                        subscription.plan.memoryMb
                      ).toFixed(1)}
                  %
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${
                        metrics
                          ? metrics.memory.percentage
                          : calculateUsagePercentage(
                              subscription.instances?.[0]?.memoryUsage,
                              subscription.plan.memoryMb
                            )
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics
                    ? `${metrics.memory.usage.toFixed(2)}MB of ${
                        metrics.memory.limit
                      }MB`
                    : `${subscription.instances?.[0]?.memoryUsage || 0}MB of ${
                        subscription.plan.memoryMb
                      }MB`}
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
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isLogConnected ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span className="text-sm font-medium">
                        {isLogConnected ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {logs.length} log entries
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLogs([])}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={
                        isLogConnected ? disconnectFromLogs : connectToLogs
                      }
                    >
                      {isLogConnected ? (
                        <>
                          <WifiOff className="mr-2 h-4 w-4" />
                          Disconnect
                        </>
                      ) : (
                        <>
                          <Wifi className="mr-2 h-4 w-4" />
                          Connect
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>

                <div
                  ref={logsContainerRef}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
                  style={{ height: "calc(100vh - 500px)" }}
                >
                  {logs.length === 0 ? (
                    <div className="text-slate-400 text-center py-8">
                      <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p>No logs available</p>
                      <p className="text-xs mt-1">
                        Logs will appear here when your application generates
                        them
                      </p>
                    </div>
                  ) : (
                    logs.map((log, i) => {
                      const logEntry = parseLogEntry(log.msg);
                      return (
                        <div
                          key={i}
                          className="flex items-center space-x-3 py-1 hover:bg-slate-900/50 rounded px-2 -mx-2 transition-colors text-sm"
                        >
                          <LogLevelBadge level={logEntry.level} />
                          <span className="text-slate-500 font-medium texts-sm">
                            {logEntry.timestamp}
                          </span>
                          {logEntry.method && logEntry.path ? (
                            <>
                              <span className="text-blue-400 font-medium">
                                {logEntry.method}
                              </span>
                              <span className="text-slate-300">
                                {logEntry.path}
                              </span>
                              {logEntry.statusCode && (
                                <StatusCodeBadge code={logEntry.statusCode} />
                              )}
                              {logEntry.duration && (
                                <span className="text-yellow-400">
                                  {logEntry.duration}
                                </span>
                              )}
                            </>
                          ) : typeof logEntry.message === "string" &&
                            (logEntry.message.startsWith("http://") ||
                              logEntry.message.startsWith("https://")) ? (
                            <a
                              href={logEntry.message}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-400  hover:text-orange-300 transition-colors"
                            >
                              {logEntry.message}
                            </a>
                          ) : (
                            <span className="text-slate-100">
                              {logEntry.message}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          {billingInfo ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                {/* Renew Option Card */}
                <Card className="p-0">
                  {/* Auto-renew status information */}
                  <div
                    className={`p-4 rounded-xl border ${
                      autoRenew
                        ? "bg-green-50 border-green-200"
                        : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    {isAutoRenewLoading && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                        <span>Updating auto-renew setting...</span>
                      </div>
                    )}

                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          autoRenew ? "bg-green-500" : "bg-yellow-500"
                        }`}
                      >
                        {autoRenew ? (
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
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`text-sm font-medium ${
                              autoRenew ? "text-green-800" : "text-yellow-800"
                            }`}
                          >
                            {autoRenew
                              ? "Auto-Renew Enabled"
                              : "Auto-Renew Disabled"}
                          </h4>
                          <Switch
                            checked={autoRenew}
                            onCheckedChange={handleAutoRenewToggle}
                            disabled={isAutoRenewLoading}
                          />
                        </div>
                        <p
                          className={`text-sm mt-1 ${
                            autoRenew ? "text-green-700" : "text-yellow-700"
                          }`}
                        >
                          {autoRenewMessage ||
                            (autoRenew
                              ? `Your subscription will automatically renew on ${
                                  billingInfo?.billingInfo?.nextBillingDate
                                    ? format(
                                        new Date(
                                          billingInfo.billingInfo.nextBillingDate
                                        ),
                                        "dd MMM yyyy"
                                      )
                                    : "the next billing date"
                                } and you will be charged ${formatCurrency(
                                  subscription?.monthlyPrice || 0
                                )}.`
                              : `Your subscription will end on ${
                                  subscription?.endDate
                                    ? format(
                                        new Date(subscription.endDate),
                                        "dd MMM yyyy"
                                      )
                                    : "the current period end date"
                                }. No automatic charges will occur.`)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
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
                      <span className="font-medium">
                        {billingInfo.currentPlan.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Price:</span>
                      <span className="font-medium">
                        {formatCurrency(billingInfo.currentPlan.monthlyPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Billing:</span>
                      <span className="font-medium">
                        {billingInfo.billingInfo.nextBillingDate
                          ? format(
                              new Date(billingInfo.billingInfo.nextBillingDate),
                              "dd MMM yyyy"
                            )
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Days Remaining:</span>
                      <span className="font-medium">
                        {billingInfo.billingInfo.daysRemaining} days
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>{" "}
              {/* Upgrade Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Upgrade Options</CardTitle>
                  <CardDescription>
                    {billingInfo?.availableUpgrades &&
                    billingInfo.availableUpgrades.length > 0
                      ? "Select a plan to view upgrade details"
                      : "Plan upgrade information"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {billingInfo?.availableUpgrades &&
                  billingInfo.availableUpgrades.length > 0 ? (
                    <>
                      <div>
                        <label className="block text-sm  text-muted-foreground mb-1">
                          Select Upgrade Plan
                        </label>
                        <Select
                          value={selectedUpgradePlan}
                          onValueChange={setSelectedUpgradePlan}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a plan to upgrade" />
                          </SelectTrigger>
                          <SelectContent>
                            {billingInfo.availableUpgrades.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name} -{" "}
                                {formatCurrency(plan.monthlyPrice)}/month
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedUpgradePlan &&
                        (() => {
                          const selectedPlan =
                            billingInfo.availableUpgrades.find(
                              (plan) => plan.id === selectedUpgradePlan
                            );
                          return selectedPlan ? (
                            <div className="p-4 border rounded-lg bg-gray-50">
                              <div className="flex justify-between items-center mb-3">
                                <span className="font-medium text-lg">
                                  {selectedPlan.name}
                                </span>
                                <div className="text-right">
                                  <div className="text-sm font-medium">
                                    {formatCurrency(selectedPlan.monthlyPrice)}
                                    /month
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Upgrade Cost:{" "}
                                    {formatCurrency(selectedPlan.upgradeCost)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mb-3">
                                {(
                                  selectedPlan.resources.cpuMilli / 1000
                                ).toFixed(2)}{" "}
                                CPU cores • {selectedPlan.resources.memoryMb}MB
                                RAM • {selectedPlan.resources.storageGb}GB
                                Storage
                              </div>

                              <Button
                                size="lg"
                                className="w-full"
                                disabled={
                                  !selectedPlan.canUpgrade ||
                                  !selectedPlan.quotaAvailable
                                }
                                onClick={() => setShowUpgradeDialog(true)}
                              >
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Upgrade to {selectedPlan.name}
                              </Button>
                              {!selectedPlan.canUpgrade &&
                                selectedPlan.reason && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                                    <p className="text-xs text-red-500">
                                      {selectedPlan.reason}
                                    </p>
                                  </div>
                                )}
                              {!selectedPlan.quotaAvailable && (
                                <p className="text-xs text-red-500 mt-1">
                                  Quota not available
                                </p>
                              )}
                            </div>
                          ) : null;
                        })()}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {billingInfo?.currentPlan?.planType === "MAX" ||
                        billingInfo?.currentPlan?.planType === "PRO"
                          ? "You're on the highest plan!"
                          : "No upgrades available"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {billingInfo?.currentPlan?.planType === "MAX" ||
                        billingInfo?.currentPlan?.planType === "PRO"
                          ? `You're currently on the ${billingInfo.currentPlan.name} plan, which is our highest tier. You have access to all premium features.`
                          : "There are currently no upgrade options available for your plan. Please check back later or contact support for more information."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                Loading billing information...
              </div>
            </div>
          )}

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

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Upgrade</DialogTitle>
            <DialogDescription>
              Are you sure you want to upgrade your plan?
            </DialogDescription>
          </DialogHeader>

          {selectedUpgradePlan &&
            billingInfo?.availableUpgrades &&
            (() => {
              const selectedPlan = billingInfo.availableUpgrades.find(
                (plan) => plan.id === selectedUpgradePlan
              );
              return selectedPlan ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{selectedPlan.name}</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(selectedPlan.monthlyPrice)}/month
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {(selectedPlan.resources.cpuMilli / 1000).toFixed(2)} CPU
                      cores •{selectedPlan.resources.memoryMb}MB RAM •
                      {selectedPlan.resources.storageGb}GB Storage
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      Upgrade Cost: {formatCurrency(selectedPlan.upgradeCost)}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleUpgrade}
                      disabled={isUpgrading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isUpgrading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Upgrading...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Confirm Upgrade
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowUpgradeDialog(false)}
                      className="flex-1"
                      disabled={isUpgrading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null;
            })()}
        </DialogContent>
      </Dialog>

      {/* Upgrade Provisioning Dialog */}
      <Dialog
        open={showProvisioningDialog}
        onOpenChange={handleUpgradeDialogClose}
      >
        <DialogContent className="max-w-md">
          {/* Header */}
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <img
                  src={subscription?.service?.icon}
                  alt={subscription?.service?.name}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {upgradeProvisioningStatus.isProvisioning
                    ? "Upgrading Service"
                    : "Upgrade Complete"}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  {subscription?.service?.name} • Upgrade in progress
                </DialogDescription>
              </div>
              {!upgradeProvisioningStatus.isProvisioning && (
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

          {/* Conditional Content */}
          {!upgradeProvisioningStatus.isProvisioning &&
          upgradeProvisioningStatus.publicUrl ? (
            /* Service Ready */
            <div className="py-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-900">
                  Your service upgrade is complete
                </p>

                {/* Service URL Display */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                      />
                    </svg>
                    <span>Service URL</span>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 border">
                    <p className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                      {upgradeProvisioningStatus.publicUrl}
                    </p>
                  </div>
                </div>

                {/* Access Service Button */}
                <a
                  href={upgradeProvisioningStatus.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Access service
                </a>
              </div>
            </div>
          ) : (
            /* Progress Steps */
            <div className="space-y-3 py-4">
              {/* Step 1: Upgrade Started */}
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
                    Upgrade Started
                  </p>
                  <p className="text-xs text-gray-500">
                    Your upgrade request is processing
                  </p>
                </div>
              </div>

              {/* Step 2: Service Status */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    upgradeProvisioningStatus.status === "RUNNING"
                      ? "bg-green-500"
                      : "bg-gray-400"
                  }`}
                >
                  {upgradeProvisioningStatus.status === "RUNNING" ? (
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
                    Service Upgrade
                  </p>
                  <p className="text-xs text-gray-500">
                    Status: {upgradeProvisioningStatus.status || "PROVISIONING"}
                  </p>
                </div>
              </div>

              {/* Step 3: Health Check */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    upgradeProvisioningStatus.healthStatus === "Healthy"
                      ? "bg-green-500"
                      : upgradeProvisioningStatus.status === "RUNNING"
                      ? "bg-gray-400"
                      : "bg-gray-300"
                  }`}
                >
                  {upgradeProvisioningStatus.healthStatus === "Healthy" ? (
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
                  ) : upgradeProvisioningStatus.status === "RUNNING" ? (
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
                    Status:{" "}
                    {upgradeProvisioningStatus.healthStatus || "Pending"}
                  </p>
                </div>
              </div>

              {/* Progress Message */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Upgrading your service
                    </p>
                    <p className="text-xs text-gray-500">
                      This usually takes 1-2 minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Only show when upgrade is complete */}
          {!upgradeProvisioningStatus.isProvisioning &&
            upgradeProvisioningStatus.publicUrl && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    window.open(upgradeProvisioningStatus.publicUrl, "_blank");
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Open App
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (upgradePollingInterval) {
                      clearInterval(upgradePollingInterval);
                      setUpgradePollingInterval(null);
                    }
                    setShowProvisioningDialog(false);
                  }}
                  className="flex-1"
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
