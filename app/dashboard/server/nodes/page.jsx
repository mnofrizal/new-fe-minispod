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
import { Progress } from "@/components/ui/progress";
import { 
  MoreHorizontal, 
  HardDrive,
  CheckCircle,
  XCircle,
  AlertCircle,
  Cpu,
  MemoryStick,
  Network,
  Eye,
  RefreshCw,
  Server
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";

export default function NodesPage() {
  const { data: session, status } = useSession();
  const [nodes, setNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.accessToken) {
      fetchNodes();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [session, status]);

  const fetchNodes = async () => {
    if (!session?.accessToken) return;
    
    try {
      const response = await fetch(`${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.ADMIN.SERVER.NODES.GET_ALL}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setNodes(result.data?.nodes || []);
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || 'Failed to load nodes', {
          style: {
            background: '#ef4444',
            color: 'white',
            border: '1px solid #dc2626'
          }
        });
      }
    } catch (error) {
      toast.error('Error loading nodes', {
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
    fetchNodes();
  };

  const getReadyStatusBadge = (status) => {
    if (status === 'Ready') {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ready
        </Badge>
      );
    } else if (status === 'NotReady') {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Not Ready
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          <AlertCircle className="w-3 h-3 mr-1" />
          Unknown
        </Badge>
      );
    }
  };

  const getRoleBadges = (labels) => {
    if (!labels) return <span className="text-muted-foreground">-</span>;
    
    // Extract node roles from labels
    const roles = [];
    if (labels['node-role.kubernetes.io/control-plane'] !== undefined || 
        labels['node-role.kubernetes.io/master'] !== undefined) {
      roles.push('control-plane');
    }
    if (labels['node-role.kubernetes.io/worker'] !== undefined) {
      roles.push('worker');
    }
    if (labels['node.kubernetes.io/instance-type']) {
      roles.push(labels['node.kubernetes.io/instance-type']);
    }
    
    if (roles.length === 0) {
      roles.push('worker'); // Default to worker if no specific role found
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {roles.map((role, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {role}
          </Badge>
        ))}
      </div>
    );
  };

  const getTaintsBadges = (node) => {
    // K3s nodes typically don't have taints in the API response shown
    // We'll show "None" for now or could extract from spec.taints if available
    return <span className="text-muted-foreground">None</span>;
  };

  const formatCpuUsage = (capacity, metrics) => {
    if (!capacity) return { display: '-', percentage: 0, hasMetrics: false };
    
    const totalCores = parseInt(capacity);
    
    if (metrics?.usage?.cpu) {
      const usedCores = metrics.usage.cpu.cores;
      const percentage = ((usedCores / totalCores) * 100).toFixed(1);
      return {
        display: `${usedCores.toFixed(2)} / ${totalCores} cores`,
        percentage: parseFloat(percentage),
        hasMetrics: true
      };
    }
    
    return {
      display: `${capacity} cores`,
      percentage: 0,
      hasMetrics: false
    };
  };

  const formatMemoryUsage = (capacity, metrics) => {
    if (!capacity) return { display: '-', percentage: 0, hasMetrics: false };
    
    // Convert Ki to GB for better readability
    const totalMemoryKi = parseInt(capacity.replace('Ki', ''));
    const totalMemoryGB = totalMemoryKi / (1024 * 1024);
    
    if (metrics?.usage?.memory) {
      const usedMemoryGB = metrics.usage.memory.gigabytes;
      const percentage = ((usedMemoryGB / totalMemoryGB) * 100).toFixed(1);
      return {
        display: `${usedMemoryGB.toFixed(1)} / ${totalMemoryGB.toFixed(1)} GB`,
        percentage: parseFloat(percentage),
        hasMetrics: true
      };
    }
    
    return {
      display: `${totalMemoryGB.toFixed(1)} GB`,
      percentage: 0,
      hasMetrics: false
    };
  };

  const getInternalIP = (addresses) => {
    if (!addresses) return '-';
    const internalIP = addresses.find(addr => addr.type === 'InternalIP');
    return internalIP ? internalIP.address : '-';
  };

  const getExternalIP = (addresses) => {
    if (!addresses) return '-';
    const externalIP = addresses.find(addr => addr.type === 'ExternalIP');
    return externalIP ? externalIP.address : '-';
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
          <h2 className="text-3xl font-bold tracking-tight">Kubernetes Nodes</h2>
          <p className="text-muted-foreground">
            Monitor and manage your Kubernetes cluster nodes
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Server className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {nodes.length} node{nodes.length !== 1 ? 's' : ''}
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
          <CardTitle>Cluster Nodes</CardTitle>
          <CardDescription>
            Overview of all nodes in your Kubernetes cluster
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading nodes...</div>
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No nodes found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>CPU</TableHead>
                    <TableHead>Memory</TableHead>
                    <TableHead>Pods</TableHead>
                    <TableHead>Ready</TableHead>
                    <TableHead>Taints</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Internal IP</TableHead>
                    <TableHead>External IP</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nodes.map((node) => (
                    <TableRow key={node.name} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <HardDrive className="h-4 w-4 text-muted-foreground" />
                          <span>{node.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const cpuData = formatCpuUsage(node.capacity?.cpu, node.metrics);
                          return (
                            <div className="space-y-1 min-w-[140px]">
                              <div className="flex items-center space-x-1">
                                <Cpu className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs">
                                  {cpuData.display}
                                </span>
                              </div>
                              {cpuData.hasMetrics && (
                                <div className="flex items-center space-x-2">
                                  <Progress 
                                    value={cpuData.percentage} 
                                    className="h-1.5 flex-1"
                                  />
                                  <span className="text-xs text-muted-foreground w-10">
                                    {cpuData.percentage.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const memoryData = formatMemoryUsage(node.capacity?.memory, node.metrics);
                          return (
                            <div className="space-y-1 min-w-[140px]">
                              <div className="flex items-center space-x-1">
                                <MemoryStick className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs">
                                  {memoryData.display}
                                </span>
                              </div>
                              {memoryData.hasMetrics && (
                                <div className="flex items-center space-x-2">
                                  <Progress 
                                    value={memoryData.percentage} 
                                    className="h-1.5 flex-1"
                                  />
                                  <span className="text-xs text-muted-foreground w-10">
                                    {memoryData.percentage.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          - / {node.capacity?.pods || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getReadyStatusBadge(node.status)}
                      </TableCell>
                      <TableCell>
                        {getTaintsBadges(node)}
                      </TableCell>
                      <TableCell>
                        {getRoleBadges(node.labels)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Network className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-mono">
                            {getInternalIP(node.addresses)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {getExternalIP(node.addresses)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {node.version || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatAge(node.createdAt)}
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
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Drain Node
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Network className="mr-2 h-4 w-4" />
                              Cordon Node
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