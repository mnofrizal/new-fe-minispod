'use client';

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
import { Progress } from "@/components/ui/progress";
import { 
  MoreHorizontal, 
  Rocket,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Users,
  Target,
  Container,
  Image,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";

export default function DeploymentPage() {
  const { data: session, status } = useSession();
  const [deployments, setDeployments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    if (session?.accessToken) {
      fetchDeployments();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [session, status]);

  const fetchDeployments = async () => {
    if (!session?.accessToken) return;
    
    try {
      const response = await fetch(`${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.ADMIN.SERVER.DEPLOYMENTS.GET_ALL}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setDeployments(result.data?.deployments || []);
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || 'Failed to load deployments', {
          style: {
            background: '#ef4444',
            color: 'white',
            border: '1px solid #dc2626'
          }
        });
      }
    } catch (error) {
      toast.error('Error loading deployments', {
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
    fetchDeployments();
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4" />
      : <ArrowDown className="w-4 h-4" />;
  };

  const sortedDeployments = React.useMemo(() => {
    if (!sortConfig.key) return deployments;

    return [...deployments].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'namespace':
          aValue = a.namespace?.toLowerCase() || '';
          bValue = b.namespace?.toLowerCase() || '';
          break;
        case 'ready':
          aValue = (a.readyReplicas || 0) / (a.replicas || 1);
          bValue = (b.readyReplicas || 0) / (b.replicas || 1);
          break;
        case 'available':
          aValue = a.availableReplicas || 0;
          bValue = b.availableReplicas || 0;
          break;
        case 'unavailable':
          aValue = a.unavailableReplicas || 0;
          bValue = b.unavailableReplicas || 0;
          break;
        case 'status':
          // Sort by status priority: Ready > Progressing > Partial > Failed > Unknown
          const statusPriority = { 'Ready': 5, 'Progressing': 4, 'Partial': 3, 'Failed': 2, 'Unknown': 1 };
          const getStatusText = (deployment) => {
            const { replicas, readyReplicas, availableReplicas, unavailableReplicas, conditions } = deployment;
            const availableCondition = conditions?.find(c => c.type === 'Available');
            const progressingCondition = conditions?.find(c => c.type === 'Progressing');
            
            if (availableCondition?.status === 'True' && readyReplicas === replicas && unavailableReplicas === 0) {
              return 'Ready';
            } else if (readyReplicas === 0 || availableCondition?.status === 'False') {
              return 'Failed';
            } else if (progressingCondition?.status === 'True' && progressingCondition?.reason === 'NewReplicaSetAvailable') {
              return 'Progressing';
            } else if (unavailableReplicas > 0) {
              return 'Partial';
            } else {
              return 'Unknown';
            }
          };
          aValue = statusPriority[getStatusText(a)] || 0;
          bValue = statusPriority[getStatusText(b)] || 0;
          break;
        case 'age':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [deployments, sortConfig]);

  const getStatusBadge = (deployment) => {
    const { replicas, readyReplicas, availableReplicas, unavailableReplicas, conditions } = deployment;
    
    // Check conditions for more accurate status
    const availableCondition = conditions?.find(c => c.type === 'Available');
    const progressingCondition = conditions?.find(c => c.type === 'Progressing');
    
    if (availableCondition?.status === 'True' && readyReplicas === replicas && unavailableReplicas === 0) {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ready
        </Badge>
      );
    } else if (readyReplicas === 0 || availableCondition?.status === 'False') {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    } else if (progressingCondition?.status === 'True' && progressingCondition?.reason === 'NewReplicaSetAvailable') {
      return (
        <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white">
          <Clock className="w-3 h-3 mr-1" />
          Progressing
        </Badge>
      );
    } else if (unavailableReplicas > 0) {
      return (
        <Badge variant="secondary">
          <AlertCircle className="w-3 h-3 mr-1" />
          Partial
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          <AlertCircle className="w-3 h-3 mr-1" />
          Unknown
        </Badge>
      );
    }
  };

  const getReplicaStatus = (deployment) => {
    const { replicas, readyReplicas, availableReplicas } = deployment;
    const percentage = replicas > 0 ? ((readyReplicas || 0) / replicas) * 100 : 0;
    
    return {
      display: `${readyReplicas || 0}/${replicas || 0}`,
      percentage: percentage,
      available: availableReplicas || 0
    };
  };

  const formatAge = (createdAt) => {
    if (!createdAt) return '-';
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const getImagesBadge = (images) => {
    if (!images || images.length === 0) {
      return <span className="text-muted-foreground text-xs">No images</span>;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {images.slice(0, 2).map((image, index) => (
          <Badge key={index} variant="outline" className="text-xs max-w-[150px]">
            <Image className="w-3 h-3 mr-1" />
            <span className="truncate">{image.split(':')[0].split('/').pop()}</span>
          </Badge>
        ))}
        {images.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{images.length - 2} more
          </Badge>
        )}
      </div>
    );
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
          <h2 className="text-3xl font-bold tracking-tight">Kubernetes Deployments</h2>
          <p className="text-muted-foreground">
            Monitor and manage your Kubernetes cluster deployments
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Rocket className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {deployments.length} deployment{deployments.length !== 1 ? 's' : ''}
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
          <CardTitle>Cluster Deployments</CardTitle>
          <CardDescription>
            Overview of all deployments in your Kubernetes cluster
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading deployments...</div>
            </div>
          ) : deployments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No deployments found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Name</span>
                        {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('namespace')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Namespace</span>
                        {getSortIcon('namespace')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('ready')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Ready</span>
                        {getSortIcon('ready')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('available')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Available</span>
                        {getSortIcon('available')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('unavailable')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Unavailable</span>
                        {getSortIcon('unavailable')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('age')}
                    >
                      <div className="flex items-center space-x-2">
                        <span>Age</span>
                        {getSortIcon('age')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDeployments.map((deployment) => (
                    <TableRow key={`${deployment.namespace}-${deployment.name}`} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Rocket className="h-4 w-4 text-muted-foreground" />
                          <span>{deployment.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {deployment.namespace}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const replicaStatus = getReplicaStatus(deployment);
                          return (
                            <div className="space-y-1 min-w-[100px]">
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs font-mono">
                                  {replicaStatus.display}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Progress 
                                  value={replicaStatus.percentage} 
                                  className="h-1.5 flex-1"
                                />
                                <span className="text-xs text-muted-foreground w-10">
                                  {replicaStatus.percentage.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {deployment.availableReplicas || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {deployment.unavailableReplicas || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(deployment)}
                      </TableCell>
                      <TableCell>
                        {getImagesBadge(deployment.images)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatAge(deployment.createdAt)}
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
                            <DropdownMenuItem>
                              <Target className="mr-2 h-4 w-4" />
                              Scale Deployment
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Restart Deployment
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause Rollout
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Play className="mr-2 h-4 w-4" />
                              Resume Rollout
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Deployment
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