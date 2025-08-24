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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  DollarSign,
  Download,
  MoreHorizontal,
  PlusCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";
import { format } from "date-fns";

export default function BillingPage() {
  const { data: session, status } = useSession();
  const [walletInfo, setWalletInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const transactionsPerPage = 10;

  useEffect(() => {
    const midtransScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

    const script = document.createElement("script");
    script.src = midtransScriptUrl;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (session?.accessToken) {
      fetchWalletInfo();
      fetchTransactions(currentPage);
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [session, status, currentPage]);

  const handlePay = (token) => {
    if (window.snap) {
      window.snap.pay(token, {
        onSuccess: function (result) {
          toast.success("Payment success!");
          fetchTransactions(currentPage);
          fetchWalletInfo();
        },
        onPending: function (result) {
          toast.info("Waiting for your payment!");
        },
        onError: function (result) {
          toast.error("Payment failed!");
        },
        onClose: function () {
          toast.info("You closed the popup without finishing the payment");
        },
      });
    }
  };

  const handleTopUp = async () => {
    if (!session?.accessToken || !topUpAmount || Number(topUpAmount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setIsToppingUp(true);
    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.WALLET.TOPUP}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Number(topUpAmount),
            paymentMethod: "QRIS",
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setTopUpDialogOpen(false);
        setTopUpAmount("");
        if (result.data.transaction.snapToken) {
          handlePay(result.data.transaction.snapToken);
        }
        fetchTransactions(currentPage);
      } else {
        toast.error(result.message || "Failed to initiate top-up.");
      }
    } catch (error) {
      toast.error("Error initiating top-up.");
    } finally {
      setIsToppingUp(false);
    }
  };

  const fetchWalletInfo = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.WALLET.INFO}`,
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
        setWalletInfo(result.data.wallet);
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || "Failed to load wallet info", {
          style: {
            background: "#ef4444",
            color: "white",
            border: "1px solid #dc2626",
          },
        });
      }
    } catch (error) {
      toast.error("Error loading wallet info", {
        style: {
          background: "#ef4444",
          color: "white",
          border: "1px solid #dc2626",
        },
      });
    }
  };

  const fetchTransactions = async (page) => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.WALLET.TRANSACTIION.GET_ALL}?page=${page}&limit=${transactionsPerPage}`,
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
        setTransactions(result.data.transactions || []);
        setTotalPages(result.data.totalPages || 1);
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || "Failed to load transactions", {
          style: {
            background: "#ef4444",
            color: "white",
            border: "1px solid #dc2626",
          },
        });
      }
    } catch (error) {
      toast.error("Error loading transactions", {
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "COMPLETED":
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">
          Loading billing information...
        </div>
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing & Wallet</h2>
        <p className="text-muted-foreground">
          Manage your wallet, view transactions, and handle your billing.
        </p>
      </div>

      {walletInfo && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>My Wallet</span>
              </CardTitle>
              <CardDescription>
                Your current balance and wallet details.
              </CardDescription>
            </div>
            <Button onClick={() => setTopUpDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Top Up
            </Button>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col justify-between p-6 bg-primary text-primary-foreground rounded-lg">
              <div>
                <p className="text-sm">Credit Balance</p>
                <p className="text-4xl font-bold">
                  {formatCurrency(walletInfo.creditBalance)}
                </p>
              </div>
              <div className="text-xs opacity-80">
                <p>User: {walletInfo.userName}</p>
                <p>Email: {walletInfo.email}</p>
              </div>
            </div>
            <div className="space-y-4 col-span-2 grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Top Up
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(walletInfo.totalTopUp)}
                  </div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Spent
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(walletInfo.totalSpent)}
                  </div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Net Balance
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(walletInfo.netBalance)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Member since{" "}
                    {format(new Date(walletInfo.memberSince), "MMM yyyy")}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Monthly Spending
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(walletInfo.monthlySpending)}
                  </div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            A record of all your wallet transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No transactions found</div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {format(new Date(tx.createdAt), "dd MMM yyyy, HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.type === "TOP_UP" ? "outline" : "secondary"
                          }
                        >
                          {tx.type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`font-medium ${
                          tx.type === "TOP_UP"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {tx.type === "TOP_UP" ? "+" : "-"}{" "}
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeVariant(tx.status)}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell className="text-right">
                        {tx.status === "PENDING" &&
                        tx.metadata?.midtrans_token ? (
                          <Button
                            size="sm"
                            onClick={() =>
                              handlePay(tx.metadata.midtrans_token)
                            }
                          >
                            Pay Now
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((prev) => Math.max(prev - 1, 1));
                      }}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>
                  {[...Array(totalPages).keys()].map((number) => (
                    <PaginationItem key={number + 1}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(number + 1);
                        }}
                        isActive={currentPage === number + 1}
                      >
                        {number + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, totalPages)
                        );
                      }}
                      disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Top Up Wallet</DialogTitle>
            <DialogDescription>
              Enter the amount you want to top up. Payment will be processed via
              QRIS.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 50000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTopUpDialogOpen(false)}
              disabled={isToppingUp}
            >
              Cancel
            </Button>
            <Button onClick={handleTopUp} disabled={isToppingUp}>
              {isToppingUp ? "Processing..." : "Top Up Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
