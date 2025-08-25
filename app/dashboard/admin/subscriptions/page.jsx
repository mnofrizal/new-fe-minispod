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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  CreditCard as SubscriptionIcon,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Plus,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";
import { format } from "date-fns";

export default function ManageSubscriptionsPage() {
  const { data: session, status } = useSession();
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Add Subscription Dialog States
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [plans, setPlans] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    planId: "",
    reason:
      "Administrative subscription creation - credit check bypassed by admin",
    skipCreditCheck: true,
  });

  // Upgrade Subscription Dialog States
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeFormData, setUpgradeFormData] = useState({
    newPlanId: "",
    reason: "Administrative subscription upgrade",
    skipCreditCheck: true,
  });

  // Cancel Subscription Dialog States
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedCancelSubscription, setSelectedCancelSubscription] =
    useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelFormData, setCancelFormData] = useState({
    reason: "User requested immediate cancellation",
    terminateInstances: true,
    processRefund: false,
  });

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
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.GET_ALL}`,
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
        setSubscriptions(result.data?.subscriptions || []);
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

  const fetchUsers = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.ADMIN.USERS.GET_ALL}`,
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
        setUsers(result.data?.users || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

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
      }
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const handleOpenAddDialog = () => {
    setFormData({
      userId: "",
      planId: "",
      reason:
        "Administrative subscription creation - credit check bypassed by admin",
      skipCreditCheck: true,
    });
    setSelectedService(null);
    setPlans([]);
    fetchUsers();
    fetchServices();
    setAddDialogOpen(true);
  };

  const handleServiceChange = (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    setSelectedService(service);
    setPlans(service?.plans || []);
    setFormData((prev) => ({ ...prev, planId: "" }));
  };

  const handleSubmitSubscription = async () => {
    if (!formData.userId || !formData.planId || !formData.reason.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Creating subscription with data:", {
        userId: formData.userId,
        planId: formData.planId,
        skipCreditCheck: true,
        reason: formData.reason,
      });

      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.CREATE}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: formData.userId,
            planId: formData.planId,
            skipCreditCheck: formData.skipCreditCheck,
            reason: formData.reason,
          }),
        }
      );

      console.log("Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Success result:", result);
        toast.success("Subscription created successfully");
        setAddDialogOpen(false);
        fetchSubscriptions(); // Refresh the list
      } else {
        let errorMessage = "Failed to create subscription";
        try {
          const errorResult = await response.json();
          console.log("Error result:", errorResult);
          errorMessage =
            errorResult.message || errorResult.error || errorMessage;
        } catch (parseError) {
          console.log("Could not parse error response:", parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        toast.error(errorMessage, {
          style: {
            background: "#ef4444",
            color: "white",
            border: "1px solid #dc2626",
          },
        });
      }
    } catch (error) {
      console.error("Network error creating subscription:", error);
      toast.error(`Network error: ${error.message}`, {
        style: {
          background: "#ef4444",
          color: "white",
          border: "1px solid #dc2626",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenUpgradeDialog = async (subscription) => {
    setSelectedSubscription(subscription);
    setUpgradeFormData({
      newPlanId: "",
      reason: "Administrative subscription upgrade",
      skipCreditCheck: true,
    });

    // Fetch available plans for the same service
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
        const currentService = result.data?.services?.find(
          (s) => s.id === subscription.serviceId
        );
        setAvailablePlans(currentService?.plans || []);
      }
    } catch (error) {
      console.error("Error loading plans for upgrade:", error);
    }

    setUpgradeDialogOpen(true);
  };

  const handleSubmitUpgrade = async () => {
    if (!upgradeFormData.newPlanId || !upgradeFormData.reason.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsUpgrading(true);
    try {
      console.log("Upgrading subscription with data:", {
        newPlanId: upgradeFormData.newPlanId,
        skipCreditCheck: upgradeFormData.skipCreditCheck,
        reason: upgradeFormData.reason,
      });

      const endpoint = API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.UPGRADE.replace(
        ":id",
        selectedSubscription.id
      );
      const response = await fetch(`${ENV_CONFIG.BASE_API_URL}${endpoint}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPlanId: upgradeFormData.newPlanId,
          skipCreditCheck: upgradeFormData.skipCreditCheck,
          reason: upgradeFormData.reason,
        }),
      });

      console.log("Upgrade response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Upgrade success result:", result);
        toast.success("Subscription upgraded successfully");
        setUpgradeDialogOpen(false);
        fetchSubscriptions(); // Refresh the list
      } else {
        let errorMessage = "Failed to upgrade subscription";
        try {
          const errorResult = await response.json();
          console.log("Upgrade error result:", errorResult);
          errorMessage =
            errorResult.message || errorResult.error || errorMessage;
        } catch (parseError) {
          console.log("Could not parse upgrade error response:", parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        toast.error(errorMessage, {
          style: {
            background: "#ef4444",
            color: "white",
            border: "1px solid #dc2626",
          },
        });
      }
    } catch (error) {
      console.error("Network error upgrading subscription:", error);
      toast.error(`Network error: ${error.message}`, {
        style: {
          background: "#ef4444",
          color: "white",
          border: "1px solid #dc2626",
        },
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleOpenCancelDialog = (subscription) => {
    setSelectedCancelSubscription(subscription);
    setCancelFormData({
      reason: "User requested immediate cancellation",
      terminateInstances: true,
      processRefund: false,
    });
    setCancelDialogOpen(true);
  };

  const handleSubmitCancel = async () => {
    if (!cancelFormData.reason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    setIsCancelling(true);
    try {
      console.log("Cancelling subscription with data:", {
        reason: cancelFormData.reason,
        terminateInstances: cancelFormData.terminateInstances,
        processRefund: cancelFormData.processRefund,
      });

      const endpoint = API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.CANCEL.replace(
        ":id",
        selectedCancelSubscription.id
      );
      const response = await fetch(`${ENV_CONFIG.BASE_API_URL}${endpoint}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: cancelFormData.reason,
          terminateInstances: cancelFormData.terminateInstances,
          processRefund: cancelFormData.processRefund,
        }),
      });

      console.log("Cancel response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Cancel success result:", result);
        toast.success("Subscription cancelled successfully");
        setCancelDialogOpen(false);
        fetchSubscriptions(); // Refresh the list
      } else {
        let errorMessage = "Failed to cancel subscription";
        try {
          const errorResult = await response.json();
          console.log("Cancel error result:", errorResult);
          errorMessage =
            errorResult.message || errorResult.error || errorMessage;
        } catch (parseError) {
          console.log("Could not parse cancel error response:", parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        toast.error(errorMessage, {
          style: {
            background: "#ef4444",
            color: "white",
            border: "1px solid #dc2626",
          },
        });
      }
    } catch (error) {
      console.error("Network error cancelling subscription:", error);
      toast.error(`Network error: ${error.message}`, {
        style: {
          background: "#ef4444",
          color: "white",
          border: "1px solid #dc2626",
        },
      });
    } finally {
      setIsCancelling(false);
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

  const getStatusBadgeVariant = (status) => {
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

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedSubscriptions = () => {
    if (!sortConfig.key) return subscriptions;

    return [...subscriptions].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case "user":
          aValue = a.user?.name || "";
          bValue = b.user?.name || "";
          break;
        case "service":
          aValue = a.service?.name || "";
          bValue = b.service?.name || "";
          break;
        case "plan":
          aValue = a.plan?.name || "";
          bValue = b.plan?.name || "";
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        case "instance":
          aValue = a.instances?.[0]?.status || "STOPPED";
          bValue = b.instances?.[0]?.status || "STOPPED";
          break;
        case "monthlyPrice":
          aValue = a.monthlyPrice || 0;
          bValue = b.monthlyPrice || 0;
          break;
        case "startDate":
          aValue = new Date(a.startDate || 0);
          bValue = new Date(b.startDate || 0);
          break;
        case "nextBilling":
          aValue = new Date(a.nextBilling || 0);
          bValue = new Date(b.nextBilling || 0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading subscriptions...</div>
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

  const sortedSubscriptions = getSortedSubscriptions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Manage Subscriptions
          </h2>
          <p className="text-muted-foreground">
            View and manage all user subscriptions in the system
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <SubscriptionIcon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {subscriptions.length} subscription
              {subscriptions.length !== 1 ? "s" : ""}
            </span>
          </div>
          <Button onClick={handleOpenAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subscription
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscriptions List</CardTitle>
          <CardDescription>
            All active and inactive subscriptions with user details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                No subscriptions found
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("user")}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      User
                      {getSortIcon("user")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("service")}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Service
                      {getSortIcon("service")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("plan")}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Plan
                      {getSortIcon("plan")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Status
                      {getSortIcon("status")}
                    </Button>
                  </TableHead>
                  <TableHead>Instance</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("monthlyPrice")}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Monthly Price
                      {getSortIcon("monthlyPrice")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("startDate")}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Start Date
                      {getSortIcon("startDate")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("nextBilling")}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Next Billing
                      {getSortIcon("nextBilling")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={subscription.user?.avatar}
                            alt={subscription.user?.name}
                          />
                          <AvatarFallback>
                            {subscription.user?.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {subscription.user?.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {subscription.user?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <img
                          src={subscription.service?.icon}
                          alt={subscription.service?.name}
                          className="h-5 w-5"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "block";
                          }}
                        />
                        <SubscriptionIcon
                          className="h-5 w-5 text-muted-foreground"
                          style={{ display: "none" }}
                        />
                        <span>{subscription.service?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {subscription.plan?.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {subscription.plan?.planType}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusBadgeVariant(subscription.status)}
                      >
                        {subscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusBadgeVariant(
                          subscription.instances?.[0]?.status === "RUNNING"
                            ? "ACTIVE"
                            : "INACTIVE"
                        )}
                      >
                        {subscription.instances?.[0]?.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(subscription.monthlyPrice)}
                    </TableCell>
                    <TableCell>
                      {subscription.startDate
                        ? format(
                            new Date(subscription.startDate),
                            "dd MMM yyyy"
                          )
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {subscription.nextBilling
                        ? format(
                            new Date(subscription.nextBilling),
                            "dd MMM yyyy"
                          )
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleOpenUpgradeDialog(subscription)
                            }
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Upgrade Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem>Edit Subscription</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleOpenCancelDialog(subscription)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Subscription
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Subscription Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Subscription</DialogTitle>
            <DialogDescription>
              Create a new subscription for a user with credit check bypass.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user-select">User *</Label>
              <Select
                value={formData.userId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, userId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>
                            {user.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="service-select">Service *</Label>
              <Select
                value={selectedService?.id || ""}
                onValueChange={handleServiceChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center space-x-2">
                        <img
                          src={service.icon}
                          alt={service.name}
                          className="h-5 w-5"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                        <span>{service.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="plan-select">Plan *</Label>
              <Select
                value={formData.planId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, planId: value }))
                }
                disabled={!selectedService}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedService
                        ? "Select a plan"
                        : "Select a service first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(plan.monthlyPrice)} / month -{" "}
                          {plan.planType}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="skip-credit-check">Skip Credit Check</Label>
                <Switch
                  id="skip-credit-check"
                  checked={formData.skipCreditCheck}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      skipCreditCheck: checked,
                    }))
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Enable this to bypass credit validation for the subscription
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for creating this subscription"
                value={formData.reason}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reason: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitSubscription}
              disabled={
                isSubmitting ||
                !formData.userId ||
                !formData.planId ||
                !formData.reason.trim()
              }
            >
              {isSubmitting ? "Creating..." : "Create Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Subscription Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upgrade Subscription</DialogTitle>
            <DialogDescription>
              Upgrade the subscription plan for{" "}
              {selectedSubscription?.user?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {selectedSubscription && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium">Current Plan</div>
                <div className="text-lg">{selectedSubscription.plan?.name}</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(selectedSubscription.monthlyPrice)} / month -{" "}
                  {selectedSubscription.plan?.planType}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="new-plan-select">New Plan *</Label>
              <Select
                value={upgradeFormData.newPlanId}
                onValueChange={(value) =>
                  setUpgradeFormData((prev) => ({ ...prev, newPlanId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a new plan" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans
                    .filter((plan) => plan.id !== selectedSubscription?.planId)
                    .map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div>
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(plan.monthlyPrice)} / month -{" "}
                            {plan.planType}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="upgrade-skip-credit-check">
                  Skip Credit Check
                </Label>
                <Switch
                  id="upgrade-skip-credit-check"
                  checked={upgradeFormData.skipCreditCheck}
                  onCheckedChange={(checked) =>
                    setUpgradeFormData((prev) => ({
                      ...prev,
                      skipCreditCheck: checked,
                    }))
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Enable this to bypass credit validation for the upgrade
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="upgrade-reason">Reason *</Label>
              <Textarea
                id="upgrade-reason"
                placeholder="Enter reason for upgrading this subscription"
                value={upgradeFormData.reason}
                onChange={(e) =>
                  setUpgradeFormData((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpgradeDialogOpen(false)}
              disabled={isUpgrading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitUpgrade}
              disabled={
                isUpgrading ||
                !upgradeFormData.newPlanId ||
                !upgradeFormData.reason.trim()
              }
            >
              {isUpgrading ? "Upgrading..." : "Upgrade Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Cancel the subscription for{" "}
              {selectedCancelSubscription?.user?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {selectedCancelSubscription && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm font-medium text-red-800">Warning</div>
                <div className="text-sm text-red-700 mt-1">
                  This action will cancel the subscription for{" "}
                  <strong>{selectedCancelSubscription.service?.name}</strong> -{" "}
                  <strong>{selectedCancelSubscription.plan?.name}</strong>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="terminate-instances">Terminate Instances</Label>
                <Switch
                  id="terminate-instances"
                  checked={cancelFormData.terminateInstances}
                  onCheckedChange={(checked) =>
                    setCancelFormData((prev) => ({
                      ...prev,
                      terminateInstances: checked,
                    }))
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Enable:</strong> Delete subscription completely and
                terminate all instances immediately
                <br />
                <strong>Disable:</strong> Stop auto-renew but keep subscription
                active until end date
              </p>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="process-refund">Process Refund</Label>
                <Switch
                  id="process-refund"
                  checked={cancelFormData.processRefund}
                  onCheckedChange={(checked) =>
                    setCancelFormData((prev) => ({
                      ...prev,
                      processRefund: checked,
                    }))
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Enable:</strong> Process automatic refund for unused
                subscription period
                <br />
                <strong>Disable:</strong> No refund will be processed
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cancel-reason">Reason *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Enter reason for cancelling this subscription"
                value={cancelFormData.reason}
                onChange={(e) =>
                  setCancelFormData((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmitCancel}
              disabled={isCancelling || !cancelFormData.reason.trim()}
            >
              {isCancelling ? "Cancelling..." : "Cancel Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
