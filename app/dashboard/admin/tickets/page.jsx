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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  MessageCircle,
  Paperclip,
  Send,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";

export default function ManageTicketsPage() {
  const { data: session, status } = useSession();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    recentTickets: 0,
  });

  useEffect(() => {
    if (session?.accessToken) {
      fetchTickets();
      fetchStats();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [session, status]);

  // Filter tickets based on search term and status
  useEffect(() => {
    let filtered = tickets;

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.ticketNumber
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ticket.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.user?.email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ticket.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTickets(filtered);
  }, [tickets, searchTerm, statusFilter]);

  const fetchTickets = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.ADMIN.MANAGE_TICKETS.GET_ALL}`,
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
        const ticketData = result.data?.tickets || [];
        setTickets(ticketData);
        setFilteredTickets(ticketData);
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || "Failed to load tickets", {
          style: {
            background: "#ef4444",
            color: "white",
            border: "1px solid #dc2626",
          },
        });
      }
    } catch (error) {
      toast.error("Error loading tickets", {
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

  const fetchStats = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.ADMIN.MANAGE_TICKETS.STATS}`,
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
        setStats(
          result.data || {
            totalTickets: 0,
            openTickets: 0,
            closedTickets: 0,
            recentTickets: 0,
          }
        );
      }
    } catch (error) {
      console.error("Error loading ticket stats:", error);
    }
  };

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    if (!session?.accessToken) return;

    setIsUpdating(true);
    try {
      let endpoint;
      if (newStatus === "CLOSED") {
        endpoint = API_ENDPOINTS.ADMIN.MANAGE_TICKETS.CLOSE.replace(
          ":id",
          ticketId
        );
      } else if (newStatus === "OPEN") {
        endpoint = API_ENDPOINTS.ADMIN.MANAGE_TICKETS.REOPEN.replace(
          ":id",
          ticketId
        );
      } else {
        // For IN_PROGRESS, we'll use a generic status update endpoint
        endpoint = `/api/admin/tickets/${ticketId}/status`;
      }

      const response = await fetch(`${ENV_CONFIG.BASE_API_URL}${endpoint}`, {
        method: newStatus === "IN_PROGRESS" ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body:
          newStatus === "IN_PROGRESS"
            ? JSON.stringify({ status: newStatus })
            : undefined,
      });

      if (response.ok) {
        const updatedTickets = tickets.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                status: newStatus,
                closedAt:
                  newStatus === "CLOSED" ? new Date().toISOString() : null,
                closedBy: newStatus === "CLOSED" ? session.user.id : null,
              }
            : ticket
        );
        setTickets(updatedTickets);

        // Update filtered tickets as well
        const updatedFiltered = updatedTickets.filter((ticket) => {
          const matchesStatus =
            statusFilter === "ALL" || ticket.status === statusFilter;
          const matchesSearch =
            !searchTerm ||
            ticket.ticketNumber
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            ticket.user?.name
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            ticket.user?.email
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            ticket.id?.toLowerCase().includes(searchTerm.toLowerCase());
          return matchesStatus && matchesSearch;
        });
        setFilteredTickets(updatedFiltered);

        toast.success(
          `Ticket ${newStatus.toLowerCase().replace("_", " ")} successfully`
        );

        // Refresh stats
        fetchStats();
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || "Failed to update ticket status", {
          style: {
            background: "#ef4444",
            color: "white",
            border: "1px solid #dc2626",
          },
        });
      }
    } catch (error) {
      toast.error("Error updating ticket status", {
        style: {
          background: "#ef4444",
          color: "white",
          border: "1px solid #dc2626",
        },
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewTicket = (ticket) => {
    // Navigate to ticket detail page instead of opening dialog
    window.location.href = `/dashboard/admin/tickets/${ticket.id}`;
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "OPEN":
        return "default";
      case "IN_PROGRESS":
        return "secondary";
      case "CLOSED":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "OPEN":
        return <Clock className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <MessageCircle className="h-4 w-4" />;
      case "CLOSED":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
            Manage Support Tickets
          </h2>
          <p className="text-muted-foreground">
            View and manage all support tickets in the system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filteredTickets.length} of {tickets.length} ticket
            {tickets.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">All support tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.openTickets}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Closed Tickets
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.closedTickets}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully resolved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Tickets
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentTickets}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tickets by number, subject, description, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== "ALL") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
          <CardDescription>
            {searchTerm || statusFilter !== "ALL"
              ? `Showing ${filteredTickets.length} ticket${
                  filteredTickets.length !== 1 ? "s" : ""
                } ${searchTerm ? `matching "${searchTerm}"` : ""} ${
                  statusFilter !== "ALL" ? `with status "${statusFilter}"` : ""
                }`
              : "All support tickets and their information"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading tickets...</div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No tickets found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== "ALL"
                    ? "No tickets match your current filters. Try adjusting your search or filter criteria."
                    : "No support tickets have been created yet."}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Attachments</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <ContextMenu key={ticket.id}>
                    <ContextMenuTrigger asChild>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewTicket(ticket)}
                      >
                        <TableCell>
                          <div className="font-medium text-blue-600">
                            {ticket.ticketNumber}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {ticket.id.slice(-8)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={ticket.user?.avatar}
                                alt={ticket.user?.name}
                              />
                              <AvatarFallback>
                                {ticket.user?.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {ticket.user?.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {ticket.user?.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <div className="font-medium truncate">
                              {ticket.subject}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {ticket.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusBadgeVariant(ticket.status)}
                            className="flex items-center gap-1 w-fit"
                          >
                            {getStatusIcon(ticket.status)}
                            {ticket.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Badge variant="outline" className="text-xs">
                              {ticket._count?.messages || 0}
                            </Badge>
                            <MessageCircle className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Badge variant="outline" className="text-xs">
                              {ticket._count?.attachments || 0}
                            </Badge>
                            <Paperclip className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(ticket.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(ticket.updatedAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewTicket(ticket)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {ticket.status !== "IN_PROGRESS" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateTicketStatus(
                                      ticket.id,
                                      "IN_PROGRESS"
                                    )
                                  }
                                  disabled={isUpdating}
                                >
                                  <MessageCircle className="mr-2 h-4 w-4" />
                                  Mark In Progress
                                </DropdownMenuItem>
                              )}
                              {ticket.status !== "CLOSED" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateTicketStatus(
                                      ticket.id,
                                      "CLOSED"
                                    )
                                  }
                                  disabled={isUpdating}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Close Ticket
                                </DropdownMenuItem>
                              )}
                              {ticket.status === "CLOSED" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateTicketStatus(ticket.id, "OPEN")
                                  }
                                  disabled={isUpdating}
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  Reopen Ticket
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handleViewTicket(ticket)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      {ticket.status !== "IN_PROGRESS" && (
                        <ContextMenuItem
                          onClick={() =>
                            handleUpdateTicketStatus(ticket.id, "IN_PROGRESS")
                          }
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Mark In Progress
                        </ContextMenuItem>
                      )}
                      {ticket.status !== "CLOSED" && (
                        <ContextMenuItem
                          onClick={() =>
                            handleUpdateTicketStatus(ticket.id, "CLOSED")
                          }
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Close Ticket
                        </ContextMenuItem>
                      )}
                      {ticket.status === "CLOSED" && (
                        <ContextMenuItem
                          onClick={() =>
                            handleUpdateTicketStatus(ticket.id, "OPEN")
                          }
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Reopen Ticket
                        </ContextMenuItem>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
