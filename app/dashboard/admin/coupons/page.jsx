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
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  Users,
  DollarSign,
  Ticket,
  Eye,
  EyeOff,
} from "lucide-react";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";

export default function ManageCouponsPage() {
  const { data: session, status } = useSession();
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: "CREDIT_TOPUP",
    status: "ACTIVE",
    creditAmount: "",
    discountType: null,
    discountPercent: "",
    maxUses: "",
    maxUsesPerUser: "",
    validFrom: "",
    validUntil: "",
  });

  useEffect(() => {
    if (session?.accessToken) {
      fetchCoupons();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [session, status]);

  // Filter coupons based on search term and filters
  useEffect(() => {
    let filtered = coupons;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (coupon) =>
          coupon.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          coupon.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((coupon) => coupon.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((coupon) => coupon.type === typeFilter);
    }

    setFilteredCoupons(filtered);
  }, [coupons, searchTerm, statusFilter, typeFilter]);

  const fetchCoupons = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.ADMIN.MANAGE_COUPONS.GET_ALL}`,
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
        setCoupons(result.data?.coupons || []);
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || "Failed to load coupons");
      }
    } catch (error) {
      toast.error("Error loading coupons");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      type: "CREDIT_TOPUP",
      status: "ACTIVE",
      creditAmount: "",
      discountType: null,
      discountPercent: "",
      maxUses: "",
      maxUsesPerUser: "",
      validFrom: "",
      validUntil: "",
    });
  };

  const handleCreateCoupon = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleEditCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code || "",
      name: coupon.name || "",
      description: coupon.description || "",
      type: coupon.type || "CREDIT_TOPUP",
      status: coupon.status || "ACTIVE",
      creditAmount: coupon.creditAmount?.toString() || "",
      discountType: coupon.discountType || null,
      discountPercent: coupon.discountPercent?.toString() || "",
      maxUses: coupon.maxUses?.toString() || "",
      maxUsesPerUser: coupon.maxUsesPerUser?.toString() || "",
      validFrom: coupon.validFrom
        ? new Date(coupon.validFrom).toISOString().slice(0, 16)
        : "",
      validUntil: coupon.validUntil
        ? new Date(coupon.validUntil).toISOString().slice(0, 16)
        : "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (isEdit = false) => {
    if (!session?.accessToken) {
      toast.error("Please login to perform this action");
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare the payload based on coupon type
      let payload = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        validFrom: formData.validFrom
          ? new Date(formData.validFrom).toISOString()
          : "",
        validUntil: formData.validUntil
          ? new Date(formData.validUntil).toISOString()
          : "",
      };

      // Add optional fields only if they have values
      if (formData.maxUses) {
        payload.maxUses = parseInt(formData.maxUses);
      }
      if (formData.maxUsesPerUser) {
        payload.maxUsesPerUser = parseInt(formData.maxUsesPerUser);
      }

      // Add type-specific fields
      if (formData.type === "CREDIT_TOPUP") {
        if (formData.creditAmount) {
          payload.creditAmount = parseInt(formData.creditAmount);
        }
      } else if (formData.type === "SUBSCRIPTION_DISCOUNT") {
        if (formData.discountType) {
          payload.discountType = formData.discountType;
          if (
            formData.discountType === "FIXED_AMOUNT" &&
            formData.creditAmount
          ) {
            payload.creditAmount = parseInt(formData.creditAmount);
          } else if (
            formData.discountType === "PERCENTAGE" &&
            formData.discountPercent
          ) {
            payload.discountPercent = parseFloat(formData.discountPercent);
          }
        }
      }

      const endpoint = isEdit
        ? `${
            ENV_CONFIG.BASE_API_URL
          }${API_ENDPOINTS.ADMIN.MANAGE_COUPONS.UPDATE.replace(
            ":id",
            selectedCoupon.id
          )}`
        : `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.ADMIN.MANAGE_COUPONS.CREATE}`;

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
          isEdit ? "Coupon updated successfully" : "Coupon created successfully"
        );
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        resetForm();
        fetchCoupons();
      } else {
        toast.error(
          data.message || `Failed to ${isEdit ? "update" : "create"} coupon`
        );
      }
    } catch (err) {
      toast.error(
        `An error occurred while ${isEdit ? "updating" : "creating"} the coupon`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!session?.accessToken || !selectedCoupon) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `${
          ENV_CONFIG.BASE_API_URL
        }${API_ENDPOINTS.ADMIN.MANAGE_COUPONS.DELETE.replace(
          ":id",
          selectedCoupon.id
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
        toast.success("Coupon deleted successfully");
        setIsDeleteDialogOpen(false);
        setSelectedCoupon(null);
        fetchCoupons();
      } else {
        toast.error(data.message || "Failed to delete coupon");
      }
    } catch (err) {
      toast.error("An error occurred while deleting the coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRupiah = (amount) => {
    if (!amount) return "N/A";
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  const getStatusBadge = (status) => {
    const variants = {
      ACTIVE: "default",
      INACTIVE: "secondary",
      EXPIRED: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getTypeBadge = (type) => {
    const variants = {
      CREDIT_TOPUP: "default",
      SUBSCRIPTION_DISCOUNT: "secondary",
    };
    const labels = {
      CREDIT_TOPUP: "Credit Topup",
      SUBSCRIPTION_DISCOUNT: "Subscription Discount",
    };
    return (
      <Badge variant={variants[type] || "secondary"}>
        {labels[type] || type}
      </Badge>
    );
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading coupons...</div>
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
          <h2 className="text-3xl font-bold tracking-tight">Manage Coupons</h2>
          <p className="text-muted-foreground">
            Create and manage discount coupons and credit vouchers
          </p>
        </div>
        <Button onClick={handleCreateCoupon}>
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
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
                placeholder="Search coupons..."
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
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CREDIT_TOPUP">Credit Topup</SelectItem>
                <SelectItem value="SUBSCRIPTION_DISCOUNT">
                  Subscription Discount
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Coupons ({filteredCoupons.length})</CardTitle>
          <CardDescription>
            Manage your discount coupons and credit vouchers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCoupons.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No coupons found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating a new coupon"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-medium">
                        {coupon.code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{coupon.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[200px]">
                            {coupon.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(coupon.type)}</TableCell>
                      <TableCell>{getStatusBadge(coupon.status)}</TableCell>
                      <TableCell>
                        {coupon.type === "CREDIT_TOPUP"
                          ? formatRupiah(coupon.creditAmount)
                          : coupon.discountType === "FIXED_AMOUNT"
                          ? formatRupiah(coupon.creditAmount)
                          : `${coupon.discountPercent}%`}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {coupon.usedCount || 0} / {coupon.maxUses || "∞"}
                          </div>
                          <div className="text-gray-500">
                            Max per user: {coupon.maxUsesPerUser || "∞"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(coupon.validUntil)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCoupon(coupon)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCoupon(coupon)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Coupon" : "Create New Coupon"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Update the coupon details below"
                : "Fill in the details to create a new coupon"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., WELCOME50K"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Welcome Bonus 50K"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what this coupon offers"
                rows={3}
              />
            </div>

            {/* Type and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREDIT_TOPUP">Credit Topup</SelectItem>
                    <SelectItem value="SUBSCRIPTION_DISCOUNT">
                      Subscription Discount
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Value Configuration */}
            {formData.type === "CREDIT_TOPUP" && (
              <div className="space-y-2">
                <Label htmlFor="creditAmount">Credit Amount (IDR) *</Label>
                <Input
                  id="creditAmount"
                  type="number"
                  value={formData.creditAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, creditAmount: e.target.value })
                  }
                  placeholder="e.g., 50000"
                />
              </div>
            )}

            {formData.type === "SUBSCRIPTION_DISCOUNT" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">Discount Type *</Label>
                  <Select
                    value={formData.discountType || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, discountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  {formData.discountType === "FIXED_AMOUNT" ? (
                    <>
                      <Label htmlFor="creditAmount">
                        Discount Amount (IDR) *
                      </Label>
                      <Input
                        id="creditAmount"
                        type="number"
                        value={formData.creditAmount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            creditAmount: e.target.value,
                          })
                        }
                        placeholder="e.g., 20000"
                      />
                    </>
                  ) : (
                    <>
                      <Label htmlFor="discountPercent">
                        Discount Percentage *
                      </Label>
                      <Input
                        id="discountPercent"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discountPercent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountPercent: e.target.value,
                          })
                        }
                        placeholder="e.g., 20"
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Usage Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Total Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUses: e.target.value })
                  }
                  placeholder="e.g., 100 (leave empty for unlimited)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUsesPerUser">Max Uses Per User</Label>
                <Input
                  id="maxUsesPerUser"
                  type="number"
                  value={formData.maxUsesPerUser}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUsesPerUser: e.target.value })
                  }
                  placeholder="e.g., 1 (leave empty for unlimited)"
                />
              </div>
            </div>

            {/* Validity Period */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From</Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, validFrom: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData({ ...formData, validUntil: e.target.value })
                  }
                />
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
              disabled={isSubmitting || !formData.code || !formData.name}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditDialogOpen ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditDialogOpen ? "Update Coupon" : "Create Coupon"}</>
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
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the coupon "{selectedCoupon?.code}
              "? This action cannot be undone and will affect any users who have
              this coupon.
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
                "Delete Coupon"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
