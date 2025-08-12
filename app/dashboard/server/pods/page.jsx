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
  Box,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Trash2,
  Play,
  Activity,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Cpu,
  HardDrive,
  Image,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";

export default function PodsPage() {
  const { data: session, status } = useSession();
  const [pods, setPods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    if (session?.accessToken) {
      fetchPods();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [session, status]);

  const fetchPods = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.ADMIN.SERVER.PODS.GET_ALL}`,
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
        setPods(result.data?.pods || []);
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || "Failed to load pods", {
          style: {
            background: "#ef4444",
            color: "white",
            border: "1px solid #dc2626",
          },
        });
      }
    } catch (error) {
      toast.error("Error loading pods", {
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
    fetchPods();
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

  const sortedPods = React.useMemo(() => {
    if (!sortConfig.key) return pods;

    return [...pods].sort((a, b) => {
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
        case "ready":
          const aReady = a.containers?.filter((c) => c.ready).length || 0;
          const aTotal = a.containers?.length || 0;
          const bReady = b.containers?.filter((c) => c.ready).length || 0;
          const bTotal = b.containers?.length || 0;
          aValue = aTotal > 0 ? aReady / aTotal : 0;
          bValue = bTotal > 0 ? bReady / bTotal : 0;
          break;
        case "status":
          const statusPriority = {
            Running: 4,
            Succeeded: 3,
            Pending: 2,
            Failed: 1,
          };
          aValue = statusPriority[a.status] || 0;
          bValue = statusPriority[b.status] || 0;
          break;
        case "restarts":
          aValue = a.restarts || 0;
          bValue = b.restarts || 0;
          break;
        case "age":
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        case "node":
          aValue = a.nodeName?.toLowerCase() || "";
          bValue = b.nodeName?.toLowerCase() || "";
          break;
        case "ip":
          aValue = a.podIP || "";
          bValue = b.podIP || "";
          break;
        case "cpu":
          aValue = a.containers?.[0]?.usage?.cpu?.millicores || 0;
          bValue = b.containers?.[0]?.usage?.cpu?.millicores || 0;
          break;
        case "memory":
          aValue = a.containers?.[0]?.usage?.memory?.megabytes || 0;
          bValue = b.containers?.[0]?.usage?.memory?.megabytes || 0;
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
  }, [pods, sortConfig]);

  const getStatusBadge = (status) => {
    if (status === "Running") {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Running
        </Badge>
      );
    } else if (status === "Pending") {
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-500 hover:bg-yellow-600"
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    } else if (status === "Failed") {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    } else if (status === "Succeeded") {
      return (
        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Succeeded
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          <AlertCircle className="w-3 h-3 mr-1" />
          {status || "Unknown"}
        </Badge>
      );
    }
  };

  const getReadyStatus = (containers) => {
    if (!containers || containers.length === 0) {
      return "0/0";
    }

    const readyCount = containers.filter((container) => container.ready).length;
    const totalCount = containers.length;

    return `${readyCount}/${totalCount}`;
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

  const formatMemory = (megabytes) => {
    if (!megabytes) return "-";
    if (megabytes >= 1024) {
      return `${(megabytes / 1024).toFixed(1)}Gi`;
    }
    return `${Math.round(megabytes)}Mi`;
  };

  const formatCPU = (millicores) => {
    if (!millicores) return "-";
    if (millicores >= 1000) {
      return `${(millicores / 1000).toFixed(1)}`;
    }
    return `${millicores}m`;
  };

  const getContainerImages = (containers) => {
    if (!containers || containers.length === 0) {
      return (
        <span className="text-muted-foreground text-xs">No containers</span>
      );
    }

    return (
      <div className="flex flex-wrap gap-1">
        {containers.slice(0, 2).map((container, index) => (
          <Badge
            key={index}
            variant="outline"
            className="text-xs max-w-[150px]"
          >
            <Image className="w-3 h-3 mr-1" />
            <span className="truncate">
              {container.image.split(":")[0].split("/").pop()}
            </span>
          </Badge>
        ))}
        {containers.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{containers.length - 2} more
          </Badge>
        )}
      </div>
    );
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
          <h2 className="text-3xl font-bold tracking-tight">Kubernetes Pods</h2>
          <p className="text-muted-foreground">
            Monitor and manage your Kubernetes cluster pods
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Box className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {pods.length} pod{pods.length !== 1 ? "s" : ""}
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
          <CardTitle>Cluster Pods</CardTitle>
          <CardDescription>
            Overview of all pods in your Kubernetes cluster
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading pods...</div>
            </div>
          ) : pods.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No pods found</div>
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
                      onClick={() => handleSort("ready")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Ready</span>
                        {getSortIcon("ready")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Status</span>
                        {getSortIcon("status")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("restarts")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Restarts</span>
                        {getSortIcon("restarts")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("cpu")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>CPU</span>
                        {getSortIcon("cpu")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("memory")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Memory</span>
                        {getSortIcon("memory")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("ip")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>IP</span>
                        {getSortIcon("ip")}
                      </div>
                    </TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("age")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Age</span>
                        {getSortIcon("age")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("node")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Node</span>
                        {getSortIcon("node")}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPods.map((pod) => (
                    <TableRow
                      key={`${pod.namespace}/${pod.name}`}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Box className="h-4 w-4 text-muted-foreground" />
                          <span>{pod.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {pod.namespace}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {getReadyStatus(pod.containers)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(pod.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Activity className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{pod.restarts || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Cpu className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {formatCPU(
                              pod.containers?.[0]?.usage?.cpu?.millicores
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <HardDrive className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {formatMemory(
                              pod.containers?.[0]?.usage?.memory?.megabytes
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {pod.podIP || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getContainerImages(pod.containers)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatAge(pod.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {pod.nodeName || "-"}
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
                              <Activity className="mr-2 h-4 w-4" />
                              View Logs
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Play className="mr-2 h-4 w-4" />
                              Restart Pod
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Pod
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
