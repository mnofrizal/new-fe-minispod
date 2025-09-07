"use client";

import React, { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  Eye,
  EyeOff,
  Star,
  Users,
  Settings,
  Globe,
  Lock,
  DollarSign,
  List,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";

export default function ManageServiceCatalogPage() {
  const { data: session, status } = useSession();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expandedServices, setExpandedServices] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPlansDialogOpen, setIsPlansDialogOpen] = useState(false);
  const [isCreatePlanDialogOpen, setIsCreatePlanDialogOpen] = useState(false);
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [servicePlans, setServicePlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    longDescription: "",
    icon: "",
    version: "",
    dockerImage: "",
    defaultPort: "",
    categoryId: "",
    envTemplate: "",
    tags: "",
    documentation: "",
    isActive: true,
    isPublic: true,
    isFeatured: false,
    sortOrder: "",
  });

  // Plan form states
  const [planFormData, setPlanFormData] = useState({
    name: "",
    planType: "BASIC",
    description: "",
    monthlyPrice: "",
    cpuMilli: "",
    memoryMb: "",
    storageGb: "",
    bandwidth: "",
    totalQuota: "",
    features: "",
    maxInstancesPerUser: "",
    maxDomains: "",
    isActive: true,
    isPopular: false,
    sortOrder: "",
  });

  useEffect(() => {
    if (session?.accessToken) {
      fetchServices();
      fetchCategories();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [session, status]);

  // Filter services based on search term and filters
  useEffect(() => {
    let filtered = services;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (service) =>
          service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          service.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.category?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((service) => service.isActive);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((service) => !service.isActive);
      }
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (service) => service.categoryId === categoryFilter
      );
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, statusFilter, categoryFilter]);

  const fetchServices = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.ADMIN.MANAGE_SERVICE_CATALOG.GET_ALL}`,
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
        toast.error(errorResult.message || "Failed to load services");
      }
    } catch (error) {
      toast.error("Error loading services");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.ADMIN.MANAGE_SERVICE_CATALOG.GET_CATAGORIES}`,
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
        setCategories(result.data || []);
      } else {
        console.error("Failed to load categories");
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      longDescription: "",
      icon: "",
      version: "",
      dockerImage: "",
      defaultPort: "",
      categoryId: "",
      envTemplate: "",
      tags: "",
      documentation: "",
      isActive: true,
      isPublic: true,
      isFeatured: false,
      sortOrder: "",
    });
  };

  const resetPlanForm = () => {
    setPlanFormData({
      name: "",
      planType: "BASIC",
      description: "",
      monthlyPrice: "",
      cpuMilli: "",
      memoryMb: "",
      storageGb: "",
      bandwidth: "",
      totalQuota: "",
      features: "",
      maxInstancesPerUser: "",
      maxDomains: "",
      isActive: true,
      isPopular: false,
      sortOrder: "",
    });
  };

  const handleCreateService = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleEditService = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name || "",
      slug: service.slug || "",
      description: service.description || "",
      longDescription: service.longDescription || "",
      icon: service.icon || "",
      version: service.version || "",
      dockerImage: service.dockerImage || "",
      defaultPort: service.defaultPort?.toString() || "",
      categoryId: service.categoryId || "",
      envTemplate: service.envTemplate
        ? JSON.stringify(service.envTemplate, null, 2)
        : "",
      tags: service.tags ? service.tags.join(", ") : "",
      documentation: service.documentation || "",
      isActive: service.isActive ?? true,
      isPublic: service.isPublic ?? true,
      isFeatured: service.isFeatured ?? false,
      sortOrder: service.sortOrder?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteService = (service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (service) => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(
        `${
          ENV_CONFIG.BASE_API_URL
        }${API_ENDPOINTS.ADMIN.MANAGE_SERVICE_CATALOG.TOGGLE_STATUS.replace(
          ":id",
          service.id
        )}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(
          `Service ${
            service.isActive ? "deactivated" : "activated"
          } successfully`
        );
        fetchServices();
      } else {
        toast.error(data.message || "Failed to toggle service status");
      }
    } catch (err) {
      toast.error("An error occurred while toggling service status");
    }
  };

  const handleCreatePlan = () => {
    resetPlanForm();
    setIsCreatePlanDialogOpen(true);
  };

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setPlanFormData({
      name: plan.name || "",
      planType: plan.planType || "BASIC",
      description: plan.description || "",
      monthlyPrice: plan.monthlyPrice?.toString() || "",
      cpuMilli: plan.cpuMilli?.toString() || "",
      memoryMb: plan.memoryMb?.toString() || "",
      storageGb: plan.storageGb?.toString() || "",
      bandwidth: plan.bandwidth?.toString() || "",
      totalQuota: plan.totalQuota?.toString() || "",
      features: plan.features ? plan.features.join(", ") : "",
      maxInstancesPerUser: plan.maxInstancesPerUser?.toString() || "",
      maxDomains: plan.maxDomains?.toString() || "",
      isActive: plan.isActive ?? true,
      isPopular: plan.isPopular ?? false,
      sortOrder: plan.sortOrder?.toString() || "",
    });
    setIsEditPlanDialogOpen(true);
  };

  const handleSubmitPlan = async (isEdit = false) => {
    if (!session?.accessToken || !selectedService) {
      toast.error("Please login to perform this action");
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare the plan payload to match API specification
      const payload = isEdit
        ? {
            // Edit payload - exclude planType to avoid unique constraint issues
            name: planFormData.name,
            description: planFormData.description,
            monthlyPrice: planFormData.monthlyPrice
              ? parseInt(planFormData.monthlyPrice)
              : 0,
            cpuMilli: planFormData.cpuMilli
              ? parseInt(planFormData.cpuMilli)
              : 250,
            memoryMb: planFormData.memoryMb
              ? parseInt(planFormData.memoryMb)
              : 512,
            storageGb: planFormData.storageGb
              ? parseInt(planFormData.storageGb)
              : 1,
            bandwidth: planFormData.bandwidth
              ? parseInt(planFormData.bandwidth)
              : 10,
            totalQuota: planFormData.totalQuota
              ? parseInt(planFormData.totalQuota)
              : 20,
            features: planFormData.features
              ? planFormData.features.split(",").map((f) => f.trim())
              : [],
            maxInstancesPerUser: planFormData.maxInstancesPerUser
              ? parseInt(planFormData.maxInstancesPerUser)
              : 1,
            maxDomains: planFormData.maxDomains
              ? parseInt(planFormData.maxDomains)
              : 1,
            isActive: planFormData.isActive,
            isPopular: planFormData.isPopular,
            sortOrder: planFormData.sortOrder
              ? parseInt(planFormData.sortOrder)
              : 1,
          }
        : {
            // Create payload - include planType for new plans
            name: planFormData.name,
            planType: planFormData.planType,
            description: planFormData.description,
            monthlyPrice: planFormData.monthlyPrice
              ? parseInt(planFormData.monthlyPrice)
              : 0,
            cpuMilli: planFormData.cpuMilli
              ? parseInt(planFormData.cpuMilli)
              : 250,
            memoryMb: planFormData.memoryMb
              ? parseInt(planFormData.memoryMb)
              : 512,
            storageGb: planFormData.storageGb
              ? parseInt(planFormData.storageGb)
              : 1,
            bandwidth: planFormData.bandwidth
              ? parseInt(planFormData.bandwidth)
              : 10,
            totalQuota: planFormData.totalQuota
              ? parseInt(planFormData.totalQuota)
              : 20,
            features: planFormData.features
              ? planFormData.features.split(",").map((f) => f.trim())
              : [],
            maxInstancesPerUser: planFormData.maxInstancesPerUser
              ? parseInt(planFormData.maxInstancesPerUser)
              : 1,
            maxDomains: planFormData.maxDomains
              ? parseInt(planFormData.maxDomains)
              : 1,
            isActive: planFormData.isActive,
            isPopular: planFormData.isPopular,
            sortOrder: planFormData.sortOrder
              ? parseInt(planFormData.sortOrder)
              : 1,
          };

      const endpoint = isEdit
        ? `${
            ENV_CONFIG.BASE_API_URL
          }${API_ENDPOINTS.ADMIN.MANAGE_SERVICE_CATALOG.UPDATE_SERVICE_PLAN.replace(
            ":id",
            selectedService.id
          ).replace(":planId", selectedPlan.id)}`
        : `${
            ENV_CONFIG.BASE_API_URL
          }${API_ENDPOINTS.ADMIN.MANAGE_SERVICE_CATALOG.CREATE_SERVICE_PLAN.replace(
            ":id",
            selectedService.id
          )}`;

      const response = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(
          isEdit ? "Plan updated successfully" : "Plan created successfully"
        );
        setIsCreatePlanDialogOpen(false);
        setIsEditPlanDialogOpen(false);
        resetPlanForm();
        // Refresh the plans list and services
        if (isPlansDialogOpen) {
          handleViewPlans(selectedService);
        }
        fetchServices(); // Refresh the main services list to update cascading table
      } else {
        toast.error(
          data.message || `Failed to ${isEdit ? "update" : "create"} plan`
        );
      }
    } catch (err) {
      toast.error(
        `An error occurred while ${isEdit ? "updating" : "creating"} the plan`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPlans = async (service) => {
    setSelectedService(service);
    setIsPlansDialogOpen(true);
    setIsLoadingPlans(true);
    setServicePlans([]);

    try {
      const response = await fetch(
        `${
          ENV_CONFIG.BASE_API_URL
        }${API_ENDPOINTS.ADMIN.MANAGE_SERVICE_CATALOG.GET_SERVICE_PLANS.replace(
          ":id",
          service.id
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
        setServicePlans(result.data?.plans || []);
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || "Failed to load service plans");
      }
    } catch (error) {
      toast.error("Error loading service plans");
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const toggleServiceExpansion = (serviceId) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
    }
    setExpandedServices(newExpanded);
  };

  const handleSubmit = async (isEdit = false) => {
    if (!session?.accessToken) {
      toast.error("Please login to perform this action");
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare the payload
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        longDescription: formData.longDescription || null,
        icon: formData.icon || null,
        version: formData.version,
        dockerImage: formData.dockerImage,
        defaultPort: formData.defaultPort
          ? parseInt(formData.defaultPort)
          : null,
        categoryId: formData.categoryId,
        envTemplate: formData.envTemplate
          ? JSON.parse(formData.envTemplate)
          : null,
        tags: formData.tags
          ? formData.tags.split(",").map((tag) => tag.trim())
          : [],
        documentation: formData.documentation || null,
        isActive: formData.isActive,
        isPublic: formData.isPublic,
        isFeatured: formData.isFeatured,
        sortOrder: formData.sortOrder ? parseInt(formData.sortOrder) : 0,
      };

      const endpoint = isEdit
        ? `${
            ENV_CONFIG.BASE_API_URL
          }${API_ENDPOINTS.ADMIN.MANAGE_SERVICE_CATALOG.UPDATE.replace(
            ":id",
            selectedService.id
          )}`
        : `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.ADMIN.MANAGE_SERVICE_CATALOG.CREATE}`;

      const response = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(
          isEdit
            ? "Service updated successfully"
            : "Service created successfully"
        );
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        resetForm();
        fetchServices();
      } else {
        toast.error(
          data.message || `Failed to ${isEdit ? "update" : "create"} service`
        );
      }
    } catch (err) {
      // Handle JSON parse error for envTemplate
      if (err instanceof SyntaxError && formData.envTemplate) {
        toast.error("Invalid JSON format in Environment Template");
      } else {
        toast.error(
          `An error occurred while ${
            isEdit ? "updating" : "creating"
          } the service`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!session?.accessToken || !selectedService) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `${
          ENV_CONFIG.BASE_API_URL
        }${API_ENDPOINTS.ADMIN.MANAGE_SERVICE_CATALOG.DELETE.replace(
          ":id",
          selectedService.id
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Service deleted successfully");
        setIsDeleteDialogOpen(false);
        setSelectedService(null);
        fetchServices();
      } else {
        toast.error(data.message || "Failed to delete service");
      }
    } catch (err) {
      toast.error("An error occurred while deleting the service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (amount) => {
    if (!amount) return "Free";
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  const getStatusBadge = (isActive) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const getVisibilityBadge = (isPublic) => {
    return (
      <Badge variant={isPublic ? "outline" : "secondary"}>
        {isPublic ? (
          <>
            <Globe className="w-3 h-3 mr-1" />
            Public
          </>
        ) : (
          <>
            <Lock className="w-3 h-3 mr-1" />
            Private
          </>
        )}
      </Badge>
    );
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading services...</div>
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

  if (session?.user?.role !== "ADMINISTRATOR") {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">
          Access denied. Administrator role required.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Manage Service Catalog
          </h2>
          <p className="text-muted-foreground">
            Create and manage services available in your platform
          </p>
        </div>
        <Button onClick={handleCreateService}>
          <Plus className="w-4 h-4 mr-2" />
          Create Service
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(searchTerm ||
              statusFilter !== "all" ||
              categoryFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Services ({filteredServices.length})</CardTitle>
          <CardDescription>
            Manage your service catalog and configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredServices.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No services found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ||
                statusFilter !== "all" ||
                categoryFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating a new service"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Service / Plan</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Resources</TableHead>
                    <TableHead>Subscriptions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <React.Fragment key={service.id}>
                      {/* Service Row */}
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleServiceExpansion(service.id)}
                            className="p-1 h-6 w-6"
                          >
                            {expandedServices.has(service.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {service.icon ? (
                              <img
                                src={service.icon}
                                alt={service.name}
                                className="w-8 h-8 rounded"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {service.name}
                                {service.isFeatured && (
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                )}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-[300px]">
                                {service.description}
                              </div>
                              <div className="text-xs text-gray-400">
                                {service.dockerImage} • v{service.version}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {service.category?.name || "Uncategorized"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(service.isActive)}
                            {getVisibilityBadge(service.isPublic)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{service.plans?.length || 0} plans</div>
                            {service.plans?.length > 0 && (
                              <div className="text-gray-500">
                                From{" "}
                                {formatRupiah(
                                  Math.min(
                                    ...service.plans.map((p) => p.monthlyPrice)
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            Service Configuration
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">
                              {service._count?.subscriptions || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(service)}
                            >
                              {service.isActive ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPlans(service)}
                            >
                              <List className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditService(service)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteService(service)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Plans Rows */}
                      {expandedServices.has(service.id) &&
                        service.plans?.map((plan) => (
                          <TableRow
                            key={`${service.id}-${plan.id}`}
                            className="border-l-4 border-l-blue-200"
                          >
                            <TableCell></TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3 ml-6">
                                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                                  <DollarSign className="w-3 h-3 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {plan.name}
                                    {plan.isPopular && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        Popular
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500 truncate max-w-[250px]">
                                    {plan.description}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {plan.planType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  plan.isActive ? "default" : "secondary"
                                }
                              >
                                {plan.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {plan.monthlyPrice === 0 ? (
                                  "Free"
                                ) : (
                                  <>
                                    Rp{" "}
                                    {plan.monthlyPrice.toLocaleString("id-ID")}
                                    <span className="text-xs text-gray-500">
                                      /month
                                    </span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs space-y-1">
                                <div className="flex items-center gap-1">
                                  <Cpu className="w-3 h-3 text-gray-400" />
                                  <span>
                                    {(plan.cpuMilli / 1000).toFixed(1)} Cores
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MemoryStick className="w-3 h-3 text-gray-400" />
                                  <span>{plan.memoryMb}MB</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <HardDrive className="w-3 h-3 text-gray-400" />
                                  <span>{plan.storageGb}GB</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">
                                  {plan._count?.subscriptions || 0}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditPlan(plan)}
                                  className="text-xs"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    /* TODO: Delete plan */
                                  }}
                                  className="text-red-600 hover:text-red-700 text-xs"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Service" : "Create New Service"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Update the service details below"
                : "Fill in the details to create a new service"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., PostgreSQL Database"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="e.g., postgresql"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the service"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longDescription">Long Description</Label>
              <Textarea
                id="longDescription"
                value={formData.longDescription}
                onChange={(e) =>
                  setFormData({ ...formData, longDescription: e.target.value })
                }
                placeholder="Detailed description of the service"
                rows={3}
              />
            </div>

            {/* Docker Configuration */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dockerImage">Docker Image *</Label>
                <Input
                  id="dockerImage"
                  value={formData.dockerImage}
                  onChange={(e) =>
                    setFormData({ ...formData, dockerImage: e.target.value })
                  }
                  placeholder="e.g., postgres:15-alpine"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Version *</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) =>
                    setFormData({ ...formData, version: e.target.value })
                  }
                  placeholder="e.g., 15-alpine"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultPort">Default Port</Label>
                <Input
                  id="defaultPort"
                  type="number"
                  value={formData.defaultPort}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultPort: e.target.value })
                  }
                  placeholder="e.g., 5432"
                />
              </div>
            </div>

            {/* Additional Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon URL</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  placeholder="https://example.com/icon.png"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentation">Documentation URL</Label>
                <Input
                  id="documentation"
                  value={formData.documentation}
                  onChange={(e) =>
                    setFormData({ ...formData, documentation: e.target.value })
                  }
                  placeholder="https://docs.example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="database, postgresql, sql"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="envTemplate">Environment Template (JSON)</Label>
              <Textarea
                id="envTemplate"
                value={formData.envTemplate}
                onChange={(e) =>
                  setFormData({ ...formData, envTemplate: e.target.value })
                }
                placeholder='{"POSTGRES_DB": "myapp", "POSTGRES_USER": "admin"}'
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            {/* Settings */}
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPublic: checked })
                  }
                />
                <Label htmlFor="isPublic">Public</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isFeatured: checked })
                  }
                />
                <Label htmlFor="isFeatured">Featured</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSubmit(isEditDialogOpen)}
              disabled={
                isSubmitting ||
                !formData.name ||
                !formData.slug ||
                !formData.dockerImage ||
                !formData.categoryId
              }
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditDialogOpen ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditDialogOpen ? "Update Service" : "Create Service"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the service "
              {selectedService?.name}"? This action cannot be undone and will
              affect any active subscriptions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete Service"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Service Plans Dialog */}
      <Dialog open={isPlansDialogOpen} onOpenChange={setIsPlansDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <List className="w-5 h-5" />
                  Service Plans - {selectedService?.name}
                </DialogTitle>
                <DialogDescription>
                  View all plans available for this service
                </DialogDescription>
              </div>
              <Button onClick={handleCreatePlan} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create New Plan
              </Button>
            </div>
          </DialogHeader>

          <div className="py-4">
            {isLoadingPlans ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="ml-2 text-muted-foreground">
                  Loading plans...
                </span>
              </div>
            ) : servicePlans.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No plans found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This service doesn't have any plans configured yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {servicePlans.map((plan) => (
                  <Card key={plan.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{plan.name}</h3>
                          {plan.isPopular && (
                            <Badge variant="secondary" className="text-xs">
                              Popular
                            </Badge>
                          )}
                          <Badge
                            variant={plan.isActive ? "default" : "secondary"}
                          >
                            {plan.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {plan.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {plan.monthlyPrice === 0 ? (
                            "Free"
                          ) : (
                            <>
                              Rp {plan.monthlyPrice.toLocaleString("id-ID")}
                              <span className="text-sm font-normal text-gray-500">
                                /month
                              </span>
                            </>
                          )}
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {plan.planType}
                        </Badge>
                      </div>
                    </div>

                    {/* Plan Specifications */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium">CPU</div>
                          <div className="text-xs text-gray-500">
                            {(plan.cpuMilli / 1000).toFixed(1)} Cores
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MemoryStick className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium">Memory</div>
                          <div className="text-xs text-gray-500">
                            {plan.memoryMb}MB
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium">Storage</div>
                          <div className="text-xs text-gray-500">
                            {plan.storageGb}GB
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium">Bandwidth</div>
                          <div className="text-xs text-gray-500">
                            {plan.bandwidth}GB
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Plan Limits */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <span className="font-medium">Max Instances:</span>
                        <span className="ml-1">{plan.maxInstancesPerUser}</span>
                      </div>
                      <div>
                        <span className="font-medium">Max Domains:</span>
                        <span className="ml-1">{plan.maxDomains}</span>
                      </div>
                      <div>
                        <span className="font-medium">Subscriptions:</span>
                        <span className="ml-1">
                          {plan._count?.subscriptions || 0}
                        </span>
                      </div>
                    </div>

                    {/* Plan Features */}
                    {plan.features && plan.features.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Features:</h4>
                        <div className="flex flex-wrap gap-1">
                          {plan.features.map((feature, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quota Information */}
                    {plan.totalQuota > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">
                            Quota Usage
                          </span>
                          <span className="text-sm text-gray-500">
                            {plan.usedQuota} / {plan.totalQuota}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                (plan.usedQuota / plan.totalQuota) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPlansDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Plan Dialog */}
      <Dialog
        open={isCreatePlanDialogOpen}
        onOpenChange={setIsCreatePlanDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
            <DialogDescription>
              Create a new plan for {selectedService?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planName">Plan Name *</Label>
                <Input
                  id="planName"
                  value={planFormData.name}
                  onChange={(e) =>
                    setPlanFormData({ ...planFormData, name: e.target.value })
                  }
                  placeholder="e.g., Free Plan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planType">Plan Type *</Label>
                <Select
                  value={planFormData.planType}
                  onValueChange={(value) =>
                    setPlanFormData({ ...planFormData, planType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="BASIC">Basic</SelectItem>
                    <SelectItem value="PRO">Pro</SelectItem>
                    <SelectItem value="MAX">Max</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planDescription">Description *</Label>
              <Textarea
                id="planDescription"
                value={planFormData.description}
                onChange={(e) =>
                  setPlanFormData({
                    ...planFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Free tier for testing the service with basic features"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyPrice">Monthly Price (IDR)</Label>
              <Input
                id="monthlyPrice"
                type="number"
                value={planFormData.monthlyPrice}
                onChange={(e) =>
                  setPlanFormData({
                    ...planFormData,
                    monthlyPrice: e.target.value,
                  })
                }
                placeholder="0"
              />
            </div>

            {/* Resource Specifications */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpuMilli">CPU (milli-cores)</Label>
                <Input
                  id="cpuMilli"
                  type="number"
                  value={planFormData.cpuMilli}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      cpuMilli: e.target.value,
                    })
                  }
                  placeholder="250"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memoryMb">Memory (MB)</Label>
                <Input
                  id="memoryMb"
                  type="number"
                  value={planFormData.memoryMb}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      memoryMb: e.target.value,
                    })
                  }
                  placeholder="512"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storageGb">Storage (GB)</Label>
                <Input
                  id="storageGb"
                  type="number"
                  value={planFormData.storageGb}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      storageGb: e.target.value,
                    })
                  }
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bandwidth">Bandwidth (GB)</Label>
                <Input
                  id="bandwidth"
                  type="number"
                  value={planFormData.bandwidth}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      bandwidth: e.target.value,
                    })
                  }
                  placeholder="10"
                />
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxInstancesPerUser">Max Instances</Label>
                <Input
                  id="maxInstancesPerUser"
                  type="number"
                  value={planFormData.maxInstancesPerUser}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      maxInstancesPerUser: e.target.value,
                    })
                  }
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDomains">Max Domains</Label>
                <Input
                  id="maxDomains"
                  type="number"
                  value={planFormData.maxDomains}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      maxDomains: e.target.value,
                    })
                  }
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalQuota">Total Quota</Label>
                <Input
                  id="totalQuota"
                  type="number"
                  value={planFormData.totalQuota}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      totalQuota: e.target.value,
                    })
                  }
                  placeholder="20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="features">Features (comma-separated)</Label>
                <Textarea
                  id="features"
                  value={planFormData.features}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      features: e.target.value,
                    })
                  }
                  placeholder="Basic features, Community support, Limited usage"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={planFormData.sortOrder}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      sortOrder: e.target.value,
                    })
                  }
                  placeholder="1"
                />
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="planIsActive"
                  checked={planFormData.isActive}
                  onCheckedChange={(checked) =>
                    setPlanFormData({ ...planFormData, isActive: checked })
                  }
                />
                <Label htmlFor="planIsActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="planIsPopular"
                  checked={planFormData.isPopular}
                  onCheckedChange={(checked) =>
                    setPlanFormData({ ...planFormData, isPopular: checked })
                  }
                />
                <Label htmlFor="planIsPopular">Popular</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreatePlanDialogOpen(false);
                resetPlanForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSubmitPlan(false)}
              disabled={
                isSubmitting || !planFormData.name || !planFormData.description
              }
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                "Create Plan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog
        open={isEditPlanDialogOpen}
        onOpenChange={setIsEditPlanDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update the plan details for {selectedService?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editPlanName">Plan Name *</Label>
                <Input
                  id="editPlanName"
                  value={planFormData.name}
                  onChange={(e) =>
                    setPlanFormData({ ...planFormData, name: e.target.value })
                  }
                  placeholder="e.g., Free Plan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPlanType">Plan Type</Label>
                <Input
                  id="editPlanType"
                  value={planFormData.planType}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800"
                  placeholder="Cannot be changed after creation"
                />
                <p className="text-xs text-gray-500">
                  Plan type cannot be changed after creation
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editPlanDescription">Description *</Label>
              <Textarea
                id="editPlanDescription"
                value={planFormData.description}
                onChange={(e) =>
                  setPlanFormData({
                    ...planFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Free tier for testing the service with basic features"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editMonthlyPrice">Monthly Price (IDR)</Label>
              <Input
                id="editMonthlyPrice"
                type="number"
                value={planFormData.monthlyPrice}
                onChange={(e) =>
                  setPlanFormData({
                    ...planFormData,
                    monthlyPrice: e.target.value,
                  })
                }
                placeholder="0"
              />
            </div>

            {/* Resource Specifications */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCpuMilli">CPU (milli-cores)</Label>
                <Input
                  id="editCpuMilli"
                  type="number"
                  value={planFormData.cpuMilli}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      cpuMilli: e.target.value,
                    })
                  }
                  placeholder="250"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMemoryMb">Memory (MB)</Label>
                <Input
                  id="editMemoryMb"
                  type="number"
                  value={planFormData.memoryMb}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      memoryMb: e.target.value,
                    })
                  }
                  placeholder="512"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStorageGb">Storage (GB)</Label>
                <Input
                  id="editStorageGb"
                  type="number"
                  value={planFormData.storageGb}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      storageGb: e.target.value,
                    })
                  }
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editBandwidth">Bandwidth (GB)</Label>
                <Input
                  id="editBandwidth"
                  type="number"
                  value={planFormData.bandwidth}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      bandwidth: e.target.value,
                    })
                  }
                  placeholder="10"
                />
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editMaxInstancesPerUser">Max Instances</Label>
                <Input
                  id="editMaxInstancesPerUser"
                  type="number"
                  value={planFormData.maxInstancesPerUser}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      maxInstancesPerUser: e.target.value,
                    })
                  }
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMaxDomains">Max Domains</Label>
                <Input
                  id="editMaxDomains"
                  type="number"
                  value={planFormData.maxDomains}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      maxDomains: e.target.value,
                    })
                  }
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTotalQuota">Total Quota</Label>
                <Input
                  id="editTotalQuota"
                  type="number"
                  value={planFormData.totalQuota}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      totalQuota: e.target.value,
                    })
                  }
                  placeholder="20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFeatures">Features (comma-separated)</Label>
                <Textarea
                  id="editFeatures"
                  value={planFormData.features}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      features: e.target.value,
                    })
                  }
                  placeholder="Basic features, Community support, Limited usage"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSortOrder">Sort Order</Label>
                <Input
                  id="editSortOrder"
                  type="number"
                  value={planFormData.sortOrder}
                  onChange={(e) =>
                    setPlanFormData({
                      ...planFormData,
                      sortOrder: e.target.value,
                    })
                  }
                  placeholder="1"
                />
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="editPlanIsActive"
                  checked={planFormData.isActive}
                  onCheckedChange={(checked) =>
                    setPlanFormData({ ...planFormData, isActive: checked })
                  }
                />
                <Label htmlFor="editPlanIsActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editPlanIsPopular"
                  checked={planFormData.isPopular}
                  onCheckedChange={(checked) =>
                    setPlanFormData({ ...planFormData, isPopular: checked })
                  }
                />
                <Label htmlFor="editPlanIsPopular">Popular</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditPlanDialogOpen(false);
                resetPlanForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSubmitPlan(true)}
              disabled={
                isSubmitting || !planFormData.name || !planFormData.description
              }
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                "Update Plan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
