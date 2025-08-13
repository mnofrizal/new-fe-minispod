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
  Router,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  Edit,
  Trash2,
  Globe,
  Shield,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Lock,
  Unlock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";

export default function IngressesPage() {
  const { data: session, status } = useSession();
  const [ingresses, setIngresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    if (session?.accessToken) {
      fetchIngresses();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [session, status]);

  const fetchIngresses = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.ADMIN.SERVER.INGRESSES.GET_ALL}`,
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
        setIngresses(result.data?.ingresses || []);
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || "Failed to load ingresses", {
          style: {
            background: "#ef4444",
            color: "white",
            border: "1px solid #dc2626",
          },
        });
      }
    } catch (error) {
      toast.error("Error loading ingresses", {
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
    fetchIngresses();
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

  const sortedIngresses = React.useMemo(() => {
    if (!sortConfig.key) return ingresses;

    return [...ingresses].sort((a, b) => {
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
        case "hosts":
          aValue = a.hosts?.length || 0;
          bValue = b.hosts?.length || 0;
          break;
        case "class":
          aValue = a.className?.toLowerCase() || "";
          bValue = b.className?.toLowerCase() || "";
          break;
        case "tls":
          aValue = a.tls?.length || 0;
          bValue = b.tls?.length || 0;
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
  }, [ingresses, sortConfig]);

  const getStatusBadge = (ingress) => {
    const { externalIPs, conditions } = ingress;

    if (externalIPs?.length > 0) {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ready
        </Badge>
      );
    } else if (
      conditions?.some(
        (c) => c.type === "LoadBalancerReady" && c.status === "False"
      )
    ) {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="secondary"
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    }
  };

  const getHostsBadge = (hosts) => {
    if (!hosts || hosts.length === 0) {
      return <span className="text-muted-foreground text-xs">No hosts</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {hosts.slice(0, 2).map((host, index) => (
          <Badge
            key={index}
            variant="outline"
            className="text-xs max-w-[200px]"
          >
            <Globe className="w-3 h-3 mr-1" />
            <span className="truncate">{host}</span>
          </Badge>
        ))}
        {hosts.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{hosts.length - 2} more
          </Badge>
        )}
      </div>
    );
  };

  const getTLSBadge = (tls) => {
    if (tls?.length > 0) {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <Lock className="w-3 h-3 mr-1" />
          TLS
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          <Unlock className="w-3 h-3 mr-1" />
          No TLS
        </Badge>
      );
    }
  };

  const getPathsBadge = (paths) => {
    if (!paths || paths.length === 0) {
      return (
        <span className="text-muted-foreground text-xs">No paths</span>
      );
    }

    return (
      <div className="flex flex-wrap gap-1">
        {paths.slice(0, 2).map((pathObj, index) => (
          <Badge
            key={index}
            variant="outline"
            className="text-xs max-w-[200px]"
          >
            <span className="truncate">
              {pathObj.path} → {pathObj.serviceName}:{pathObj.servicePort}
            </span>
          </Badge>
        ))}
        {paths.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{paths.length - 2} more
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
            Kubernetes Ingresses
          </h2>
          <p className="text-muted-foreground">
            Monitor and manage your Kubernetes cluster ingress controllers
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Router className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {ingresses.length} ingress{ingresses.length !== 1 ? "es" : ""}
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
          <CardTitle>Cluster Ingresses</CardTitle>
          <CardDescription>
            Overview of all ingress controllers in your Kubernetes cluster
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading ingresses...</div>
            </div>
          ) : ingresses.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No ingresses found</div>
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
                      onClick={() => handleSort("class")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Class Name</span>
                        {getSortIcon("class")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("hosts")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Hosts</span>
                        {getSortIcon("hosts")}
                      </div>
                    </TableHead>

                    <TableHead>Paths</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("tls")}
                    >
                      <div className="flex items-center space-x-2">
                        <span>TLS</span>
                        {getSortIcon("tls")}
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
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
                  {sortedIngresses.map((ingress) => (
                    <TableRow
                      key={`${ingress.namespace}-${ingress.name}`}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Router className="h-4 w-4 text-muted-foreground" />
                          <span>{ingress.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {ingress.namespace}
                        </Badge>
                      </TableCell>
                      <TableCell>{ingress.className || "default"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getHostsBadge(ingress.hosts)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getPathsBadge(ingress.paths)}
                      </TableCell>
                      <TableCell>{getTLSBadge(ingress.tls)}</TableCell>
                      <TableCell>{getStatusBadge(ingress)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatAge(ingress.createdAt)}
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
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Endpoints
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Rules
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Shield className="mr-2 h-4 w-4" />
                              Manage TLS
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Ingress
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
