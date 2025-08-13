"use client";

import { useState, useEffect } from "react";
import * as React from "react";
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
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  WifiIcon,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  Edit,
  Trash2,
  Server,
  Network,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Target,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";

export default function ServicesPage() {
  const { data: session, status } = useSession();
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

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
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.ADMIN.SERVER.SERVICES.GET_ALL}`,
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

  const handleRefresh = () => {
    setIsLoading(true);
    fetchServices();
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const sortedServices = React.useMemo(() => {
    if (!sortConfig.key) return services;

    return [...services].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "namespace":
          aValue = a.namespace?.toLowerCase() || "";
          bValue = b.namespace?.toLowerCase() || "";
          break;
        case "type":
          aValue = a.type?.toLowerCase() || "";
          bValue = b.type?.toLowerCase() || "";
          break;
        case "clusterIP":
          aValue = a.clusterIP || "";
          bValue = b.clusterIP || "";
          break;
        case "externalIP":
          aValue = a.externalIPs?.length || 0;
          bValue = b.externalIPs?.length || 0;
          break;
        case "ports":
          aValue = a.ports?.length || 0;
          bValue = b.ports?.length || 0;
          break;
        case "age":
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
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
  }, [services, sortConfig]);

  const getTypeBadge = (type) => {
    const typeColor = {
      ClusterIP: "bg-blue-500 hover:bg-blue-600",
      NodePort: "bg-green-500 hover:bg-green-600",
      LoadBalancer: "bg-purple-500 hover:bg-purple-600",
      ExternalName: "bg-orange-500 hover:bg-orange-600",
    };

    return (
      <Badge
        variant="default"
        className={typeColor[type] || "bg-gray-500 hover:bg-gray-600"}
      >
        {type}
      </Badge>
    );
  };

  const getExternalIPsBadge = (externalIPs, loadBalancerIPs) => {
    const allIPs = [...(externalIPs || []), ...(loadBalancerIPs || [])];

    if (allIPs.length === 0) {
      return <span className="text-muted-foreground text-xs">None</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {allIPs.slice(0, 1).map((ip, index) => (
          <Badge
            key={index}
            variant="outline"
            className="text-xs max-w-[120px]"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            <span className="truncate">{ip}</span>
          </Badge>
        ))}
        {allIPs.length > 1 && (
          <Badge variant="outline" className="text-xs">
            +{allIPs.length - 1} more
          </Badge>
        )}
      </div>
    );
  };

  const getPortsBadge = (ports) => {
    if (!ports || ports.length === 0) {
      return <span className="text-muted-foreground text-xs">No ports</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {ports.slice(0, 2).map((port, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            {port.port}
            {port.name ? `:${port.name}` : ""}/{port.protocol}
          </Badge>
        ))}
        {ports.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{ports.length - 2} more
          </Badge>
        )}
      </div>
    );
  };

  const getSelectorBadge = (selector) => {
    if (!selector || Object.keys(selector).length === 0) {
      return <span className="text-muted-foreground text-xs">No selector</span>;
    }

    const selectorEntries = Object.entries(selector);

    return (
      <div className="flex flex-wrap gap-1">
        {selectorEntries.slice(0, 2).map(([key, value], index) => (
          <Badge
            key={index}
            variant="outline"
            className="text-xs max-w-[120px]"
          >
            <Target className="w-3 h-3 mr-1" />
            <span className="truncate">
              {key}={value}
            </span>
          </Badge>
        ))}
        {selectorEntries.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{selectorEntries.length - 2} more
          </Badge>
        )}
      </div>
    );
  };

  const formatAge = (createdAt) => {
    if (!createdAt) return "-";
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading...</div>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Kubernetes Services
          </h2>
          <p className="text-muted-foreground">
            Monitor and manage your Kubernetes cluster services
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <WifiIcon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {services.length} service{services.length !== 1 ? "s" : ""}
            </span>
          </div>
          <Button onClick={handleRefresh} disabled={isLoading} size="sm">
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cluster Services</CardTitle>
          <CardDescription>
            Overview of all services in your Kubernetes cluster
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading services...</div>
            </div>
          ) : services.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No services found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Name</span>
                        {getSortIcon("name")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("namespace")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Namespace</span>
                        {getSortIcon("namespace")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("type")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Type</span>
                        {getSortIcon("type")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("clusterIP")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Cluster IP</span>
                        {getSortIcon("clusterIP")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("externalIP")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>External IP</span>
                        {getSortIcon("externalIP")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("ports")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Ports</span>
                        {getSortIcon("ports")}
                      </div>
                    </TableHead>
                    <TableHead>Selector</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("age")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Age</span>
                        {getSortIcon("age")}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedServices.map((service) => (
                    <TableRow
                      key={`${service.namespace}-${service.name}`}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <WifiIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{service.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {service.namespace}
                        </Badge>
                      </TableCell>
                      <TableCell>{getTypeBadge(service.type)}</TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {service.clusterIP || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getExternalIPsBadge(
                          service.externalIPs,
                          service.loadBalancerIPs
                        )}
                      </TableCell>
                      <TableCell>{getPortsBadge(service.ports)}</TableCell>
                      <TableCell>
                        {getSelectorBadge(service.selector)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatAge(service.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Target className="mr-2 h-4 w-4" />
                              View Endpoints
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Service
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Network className="mr-2 h-4 w-4" />
                              Manage Ports
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Service
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
