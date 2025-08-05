'use client';

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
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Globe2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Trash2,
  Plus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";

export default function NamespacesPage() {
  const { data: session, status } = useSession();
  const [namespaces, setNamespaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.accessToken) {
      fetchNamespaces();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [session, status]);

  const fetchNamespaces = async () => {
    if (!session?.accessToken) return;
    
    try {
      const response = await fetch(`${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.ADMIN.SERVER.NAMESPACES.GET_ALL}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setNamespaces(result.data?.namespaces || []);
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || 'Failed to load namespaces', {
          style: {
            background: '#ef4444',
            color: 'white',
            border: '1px solid #dc2626'
          }
        });
      }
    } catch (error) {
      toast.error('Error loading namespaces', {
        style: {
          background: '#ef4444',
          color: 'white',
          border: '1px solid #dc2626'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchNamespaces();
  };

  const getStatusBadge = (status) => {
    if (status === 'Active') {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    } else if (status === 'Terminating') {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Terminating
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          <AlertCircle className="w-3 h-3 mr-1" />
          {status || 'Unknown'}
        </Badge>
      );
    }
  };

  const formatAge = (createdAt) => {
    if (!createdAt) return '-';
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else {
      return `${diffHours}h`;
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Please sign in to access this page</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kubernetes Namespaces</h2>
          <p className="text-muted-foreground">
            Monitor and manage your Kubernetes cluster namespaces
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Globe2 className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {namespaces.length} namespace{namespaces.length !== 1 ? 's' : ''}
            </span>
          </div>
          <Button onClick={handleRefresh} disabled={isLoading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cluster Namespaces</CardTitle>
          <CardDescription>
            Overview of all namespaces in your Kubernetes cluster
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading namespaces...</div>
            </div>
          ) : namespaces.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No namespaces found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Labels</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {namespaces.map((namespace) => (
                    <TableRow key={namespace.name} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Globe2 className="h-4 w-4 text-muted-foreground" />
                          <span>{namespace.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(namespace.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {namespace.labels && Object.keys(namespace.labels).length > 0 ? (
                            Object.entries(namespace.labels).slice(0, 3).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {value}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">No labels</span>
                          )}
                          {namespace.labels && Object.keys(namespace.labels).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{Object.keys(namespace.labels).length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatAge(namespace.createdAt)}
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Namespace
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