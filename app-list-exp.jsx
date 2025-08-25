"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ServiceCard from "@/components/ServiceCard";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ServicesPage() {
  const { data: session, status } = useSession();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");

  // Remove the redirect useEffect - let middleware handle authentication

  useEffect(() => {
    const fetchServices = async () => {
      if (!session?.accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
          }/api/v1/services/grouped`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          // Keep services grouped with their variants
          const groupedServices = data.data.services.map((service) => {
            // Find the default variant or the first one for display
            const defaultVariant =
              service.variants.find((v) => v.isDefault) || service.variants[0];

            return {
              ...service,
              // Remove variant name from displayName for card title
              displayName: service.displayName.replace(
                / - (Basic|Plus|Pro|Free)$/,
                ""
              ),
              // Add default variant info for display on card
              defaultVariant,
              monthlyPrice: defaultVariant.monthlyPrice,
              version: defaultVariant.variantDisplayName,
              // Keep all variants for selection in dialog
              variants: service.variants,
            };
          });

          setServices(groupedServices);
          setFilteredServices(groupedServices);
        } else {
          // Use the specific error message from the API response
          setError(data.message || "Failed to fetch services");
        }
      } catch (err) {
        setError("An error occurred while fetching services");
        console.error("Error fetching services:", err);
      } finally {
        setLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchServices();
    }
  }, [session?.accessToken]);

  // Filter services based on search term and filters
  useEffect(() => {
    let filtered = services;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (service) =>
          service.displayName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Price filter
    if (priceFilter !== "all") {
      filtered = filtered.filter((service) => {
        const price = parseFloat(service.monthlyPrice);
        if (priceFilter === "free") return price === 0;
        if (priceFilter === "paid") return price > 0;
        return true;
      });
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, priceFilter]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Let middleware handle authentication redirect
  if (!session) {
    return null;
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>Error loading services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-red-500">{error}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Available Services
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
          Discover and explore our available services
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6">
        <div className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Price Filter */}
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-full sm:w-[180px] !h-11">
                <SelectValue placeholder="Filter by price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {loading ? (
                  <div className="flex items-center gap-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600"></div>
                    Loading...
                  </div>
                ) : (
                  `${filteredServices.length} of ${services.length} services`
                )}
              </Badge>
              {searchTerm && (
                <Badge variant="secondary">Search: "{searchTerm}"</Badge>
              )}
              {priceFilter !== "all" && (
                <Badge variant="secondary">Price: {priceFilter}</Badge>
              )}
            </div>

            {(searchTerm || priceFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setPriceFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <span>Loading services...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Grid className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No services found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || priceFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No services are available at the moment"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard key={service.name} service={service} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
