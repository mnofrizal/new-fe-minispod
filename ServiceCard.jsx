"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Server,
  DollarSign,
  Tag,
  Cpu,
  MemoryStick,
  Rocket,
  Cloud,
} from "lucide-react";
import Link from "next/link";

export default function ServiceCard({ service }) {
  const { data: session } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    return numPrice === 0 ? "Free" : `$${numPrice}/month`;
  };

  const formatRupiahPrice = (price) => {
    const numPrice = parseFloat(price);
    if (numPrice === 0) return "Free";
    // Convert USD to IDR (assuming price is in USD)
    // If price is already in IDR, remove the multiplication
    return `Rp ${numPrice.toLocaleString("id-ID")}/month`;
  };

  const handleSubscribe = async () => {
    if (!session?.accessToken) {
      setSubscriptionError("Please login to subscribe to this service");
      return;
    }

    try {
      setIsSubscribing(true);
      setSubscriptionError("");
      setSubscriptionSuccess(false);

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
        }/api/v1/subscriptions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serviceId: selectedVariant?.id || service.defaultVariant?.id,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSubscriptionSuccess(true);
        setSubscriptionError("");
        // Close deploy dialog and open success dialog
        setIsDialogOpen(false);
        setIsSuccessDialogOpen(true);
        setSubscriptionSuccess(false);
      } else {
        // Use specific reasons from the API response if available
        let errorMessage = data.message || "Failed to subscribe to service";

        if (data.code && data.code.reasons && data.code.reasons.length > 0) {
          errorMessage = data.code.reasons.join(", ");
        }

        setSubscriptionError(errorMessage);
      }
    } catch (err) {
      setSubscriptionError(
        "An error occurred while subscribing to the service"
      );
      console.error("Error subscribing to service:", err);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDialogOpen = () => {
    setIsDialogOpen(true);
    setSubscriptionError("");
    setSubscriptionSuccess(false);
    // Set default variant when opening dialog
    const defaultVariant =
      service.variants?.find((v) => v.isDefault) ||
      service.variants?.[0] ||
      service.defaultVariant;
    setSelectedVariant(defaultVariant);
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col pb-0  gap-5">
        <CardHeader>
          <div className="flex items-start justify-between p-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 border dark:bg-blue-900 rounded-lg">
                <img
                  src={service.icon}
                  alt={service.displayName || service.name}
                  className="w-9 h-9 object-contain"
                />
              </div>
              <div>
                <CardTitle className="text-lg ">
                  {service.displayName}
                </CardTitle>
                <div className="mt-1">
                  <span className="rounded-full inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-v-900 dark:text-green-200">
                    {service.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col px-8">
          <div className="flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 text-justify leading-relaxed mb-2">
              {service.description}
            </p>
          </div>
        </CardContent>
        {/* Pricing Section */}
        <div className="space-y-3 bg-[#FBFBFC] p-6 px-8 border-t rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Starting from
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl text-gray-900 dark:text-white">
                  {formatRupiahPrice(service.monthlyPrice) === "Free" ? (
                    <span className="font-semibold">Free</span>
                  ) : (
                    <>
                      <span className="font-semibold">
                        {formatRupiahPrice(service.monthlyPrice).replace(
                          /\/month$/,
                          ""
                        )}
                      </span>
                      <span className="font-light text-zinc-500 text-lg">
                        /month
                      </span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Deploy Now Button */}
          <Button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              handleDialogOpen();
            }}
            className="w-full cursor-pointer bg-zinc-900 text-white font-medium py-2 h-10 px-4 rounded-md transition-colors duration-200 hover:bg-zinc-800 hover:text-white flex items-center justify-center gap-2"
            size="sm"
          >
            <Cloud className="w-2 h-2 " />
            Deploy Now
          </Button>
        </div>
      </Card>

      {/* Service Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[85vw] w-[85vw] max-h-[80vh] overflow-y-auto scrollbar-hide sm:max-w-[75vw] sm:w-[75vw]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 border dark:bg-blue-900 rounded-lg">
                <img
                  src={service.icon}
                  alt={service.displayName || service.name}
                  className="w-9 h-9 object-contain"
                />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {service.displayName}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Please select plan configuration
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Grid - Detail Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Variant Selection */}
              {service.variants && service.variants.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {service.variants.map((variant) => (
                      <div
                        key={variant.id}
                        className={`border rounded-lg p-4 transition-colors ${
                          variant.availableQuota === 0
                            ? "border-red-200 bg-red-50 dark:bg-red-900/20 cursor-not-allowed opacity-60"
                            : selectedVariant?.id === variant.id
                            ? "border-blue-500 border-2 bg-blue-50 dark:bg-blue-900/20 cursor-pointer"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 cursor-pointer"
                        }`}
                        onClick={() => {
                          if (variant.availableQuota !== 0) {
                            setSelectedVariant(variant);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="bg-zinc-200  rounded-md">
                                <Server className="w-4 h-4 text-gray-900" />
                              </div>
                              <h5 className="font-medium text-gray-900 dark:text-white text-xl">
                                {variant.variantDisplayName}
                              </h5>
                              {variant.isDefault && (
                                <Badge variant="secondary" className="text-xs">
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-zinc-600 dark:text-gray-400 mt-1">
                              {variant.description}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {variant.cpuSpec && (
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1 px-2 py-1 text-xs"
                                >
                                  <Cpu className="w-3 h-3 mr-1" />
                                  {variant.cpuSpec}
                                </Badge>
                              )}
                              {variant.memSpec && (
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1 px-2 py-1 text-xs"
                                >
                                  <MemoryStick className="w-3 h-3 mr-1" />
                                  {variant.memSpec}
                                </Badge>
                              )}
                              {variant.availableQuota === 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs font-medium"
                                >
                                  Out of Quota
                                </Badge>
                              )}
                            </div>
                            {/* {variant.features &&
                              variant.features.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 flex-wrap">
                                    {variant.features
                                      .slice(0, 3)
                                      .map((feature, index) => (
                                        <span
                                          key={index}
                                          className="flex items-center gap-1"
                                        >
                                          <svg
                                            className="w-3 h-3 text-green-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M5 13l4 4L19 7"
                                            />
                                          </svg>
                                          {feature}
                                          {index <
                                            Math.min(
                                              variant.features.length,
                                              3
                                            ) -
                                              1 && (
                                            <span className="mx-1">•</span>
                                          )}
                                        </span>
                                      ))}
                                    {variant.features.length > 3 && (
                                      <span className="text-gray-500 ml-1">
                                        +{variant.features.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )} */}
                          </div>
                          <div className="text-right">
                            <span className="text-xl text-gray-900 dark:text-white">
                              {formatRupiahPrice(variant.monthlyPrice) ===
                              "Free" ? (
                                <span className="font-bold">Free</span>
                              ) : (
                                <>
                                  <span className="font-bold">
                                    {formatRupiahPrice(
                                      variant.monthlyPrice
                                    ).replace(/\/month$/, "")}
                                  </span>
                                  <span className="font-light text-zinc-500 text-lg">
                                    /month
                                  </span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Service Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Service Information
                </h4>
                {parseFloat(
                  selectedVariant?.monthlyPrice || service.monthlyPrice
                ) === 0 ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                        Free Service
                      </h4>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      This service is available at no cost. You can start using
                      it immediately.
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Premium Service
                      </h4>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      This service requires a monthly subscription of{" "}
                      {formatRupiahPrice(
                        selectedVariant?.monthlyPrice || service.monthlyPrice
                      )}
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Grid - Deployment Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Deployment Summary
                </h3>

                <div className="space-y-6">
                  <div className="border rounded-lg p-2 bg-zinc-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white border dark:bg-blue-900 rounded-lg">
                        <img
                          src={service.icon}
                          alt={service.displayName || service.name}
                          className="w-7 h-7 object-contain"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {service.displayName}
                        </span>
                        <span className="text-sm text-zinc-500">
                          {service.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div className="text-gray-500 dark:text-gray-400">Plan</div>
                    <div className="font-medium text-gray-900 dark:text-white text-right">
                      {selectedVariant?.variantDisplayName || service.version}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">CPU</div>
                    <div className="font-medium text-gray-900 dark:text-gray-300 flex items-center gap-2 justify-end text-right">
                      <span>
                        {selectedVariant?.cpuSpec ||
                          service.defaultVariant?.cpuSpec}
                      </span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Memory
                    </div>
                    <div className="font-medium text-gray-900 dark:text-gray-300 flex items-center gap-2 justify-end text-right">
                      <span>
                        {selectedVariant?.memSpec ||
                          service.defaultVariant?.memSpec}
                      </span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Billing Cycle
                    </div>
                    <div className="font-medium  text-gray-900 dark:text-white text-right">
                      Monthly
                    </div>
                  </div>
                  <Separator className="my-6" />

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      Cost
                    </span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {formatRupiahPrice(
                        selectedVariant?.monthlyPrice || service.monthlyPrice
                      )}
                    </span>
                  </div>

                  {/* Error Message */}
                  {subscriptionError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {subscriptionError}
                    </div>
                  )}

                  {/* Success Message */}
                  {subscriptionSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                      Successfully subscribed to {service.displayName}!
                    </div>
                  )}

                  <Button
                    onClick={handleSubscribe}
                    disabled={isSubscribing || subscriptionSuccess}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    {isSubscribing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Subscribing...
                      </>
                    ) : subscriptionSuccess ? (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Subscribed
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Deploy Service
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <DialogTitle className="text-xl text-green-900">
                  Deployment Successful!
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-2">
                  Your {service.displayName} service has been successfully
                  deployed and is now ready to use.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-white border rounded-lg">
                <img
                  src={service.icon}
                  alt={service.displayName}
                  className="w-6 h-6 object-contain"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-green-900">
                  {service.displayName}
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  Plan:{" "}
                  {selectedVariant?.variantDisplayName ||
                    service.defaultVariant?.variantDisplayName}
                </p>
                <p className="text-sm text-green-700">
                  Cost:{" "}
                  {formatRupiahPrice(
                    selectedVariant?.monthlyPrice || service.monthlyPrice
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full mt-6">
            <Link href="/dashboard/my-apps">
              <Button
                onClick={() => {
                  setIsSuccessDialogOpen(false);
                  // You can add navigation to dashboard or service management here
                  // router.push('/dashboard/my-apps');
                }}
                className="w-full cursor-pointer h-10 flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                View My Apps
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setIsSuccessDialogOpen(false)}
              className="flex-1 cursor-pointer "
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
