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
import { Smartphone, Plus, ExternalLink, Settings } from "lucide-react";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function MyAppsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

      <div className="grid gap-6 md:grid-cols-2">
        {subscriptions.length === 0 ? (
          <div className="col-span-2 flex items-center justify-center py-8">
            <div className="text-center">
              <Smartphone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="text-muted-foreground">No applications found</div>
              <p className="text-sm text-muted-foreground mt-2">
                Start by creating your first application
              </p>
            </div>
          </div>
        ) : (
          subscriptions.map((subscription) => (
            <Card key={subscription.id}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2 flex-1">
                  <img
                    src={subscription.service.icon}
                    alt={subscription.service.name}
                    className="h-5 w-5"
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <Smartphone
                    className="h-5 w-5 text-muted-foreground"
                    style={{ display: "none" }}
                  />
                  <div>
                    <CardTitle className="text-lg">
                      {subscription.service.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {subscription.plan.name} Plan -{" "}
                      {subscription.service.slug}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(subscription.status)}>
                  {subscription.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/dashboard/my-apps/${subscription.id}`)
                    }
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Details
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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
