"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Paperclip,
  Send,
  ArrowLeft,
  Calendar,
  Hash,
  AlertCircle,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";

export default function UserTicketDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id;

  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [responseText, setResponseText] = useState("");
  const [isSendingResponse, setIsSendingResponse] = useState(false);

  useEffect(() => {
    if (session?.accessToken && ticketId) {
      fetchTicketDetail();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [session, status, ticketId]);

  const fetchTicketDetail = async () => {
    if (!session?.accessToken) return;

    try {
      const endpoint = API_ENDPOINTS.SUPPORT_TICKET.GET_BY_ID.replace(
        ":id",
        ticketId
      );
      const response = await fetch(`${ENV_CONFIG.BASE_API_URL}${endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        setTicket(result.data);
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || "Failed to load ticket details", {
          style: {
            background: "#ef4444",
            color: "white",
            border: "1px solid #dc2626",
          },
        });
      }
    } catch (error) {
      toast.error("Error loading ticket details", {
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

  const handleSendResponse = async () => {
    if (!session?.accessToken || !ticket || !responseText.trim()) return;

    setIsSendingResponse(true);
    try {
      const endpoint = API_ENDPOINTS.SUPPORT_TICKET.RESPOND.replace(
        ":id",
        ticket.id
      );
      const response = await fetch(`${ENV_CONFIG.BASE_API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: responseText.trim(),
        }),
      });

      if (response.ok) {
        toast.success("Response sent successfully");
        setResponseText("");

        // Refresh ticket details to show new message
        fetchTicketDetail();
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || "Failed to send response", {
          style: {
            background: "#ef4444",
            color: "white",
            border: "1px solid #dc2626",
          },
        });
      }
    } catch (error) {
      toast.error("Error sending response", {
        style: {
          background: "#ef4444",
          color: "white",
          border: "1px solid #dc2626",
        },
      });
    } finally {
      setIsSendingResponse(false);
    }
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

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading ticket details...</div>
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

  if (!ticket) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Ticket not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The ticket you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/support-tickets")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Support Tickets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/support-tickets")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Hash className="h-6 w-6" />
              {ticket.ticketNumber}
            </h2>
            <p className="text-muted-foreground">{ticket.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={getStatusBadgeVariant(ticket.status)}
            className="flex items-center gap-1"
          >
            {getStatusIcon(ticket.status)}
            {ticket.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Status Alert */}
      {ticket.status === "CLOSED" && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            This ticket has been closed. If you need further assistance, please
            create a new ticket.
          </AlertDescription>
        </Alert>
      )}

      {ticket.status === "IN_PROGRESS" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Our support team is working on your ticket. You'll receive updates
            as we make progress.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Information */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Subject</Label>
                <div className="mt-1 p-3 bg-muted/30 rounded-lg">
                  {ticket.subject}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <div className="mt-1 p-3 bg-muted/30 rounded-lg whitespace-pre-wrap">
                  {ticket.description}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages/Conversation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversation ({ticket.messages?.length || 0})
              </CardTitle>
              <CardDescription>
                All messages and responses for this ticket
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ticket.messages && ticket.messages.length > 0 ? (
                <div className="space-y-4">
                  {ticket.messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.isAdminReply ? "flex-row" : "flex-row-reverse"
                      }`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage
                          src={message.author?.avatar}
                          alt={message.author?.name}
                        />
                        <AvatarFallback>
                          {message.author?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`flex-1 max-w-[80%] ${
                          message.isAdminReply ? "text-left" : "text-right"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-lg ${
                            message.isAdminReply
                              ? "bg-muted"
                              : "bg-primary text-primary-foreground ml-auto"
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </div>
                        </div>
                        <div
                          className={`text-xs text-muted-foreground mt-1 flex items-center gap-1 ${
                            message.isAdminReply
                              ? "justify-start"
                              : "justify-end"
                          }`}
                        >
                          <span>{message.author?.name}</span>
                          <span>•</span>
                          <span>{formatDate(message.createdAt)}</span>
                          {message.attachments &&
                            message.attachments.length > 0 && (
                              <>
                                <span>•</span>
                                <Paperclip className="h-3 w-3" />
                                <span>{message.attachments.length}</span>
                              </>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No messages yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Our support team will respond to your ticket soon.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Response Section - Only show if ticket is not closed */}
          {ticket.status !== "CLOSED" && (
            <Card>
              <CardHeader>
                <CardTitle>Add Response</CardTitle>
                <CardDescription>
                  Provide additional information or ask follow-up questions
                  about your ticket.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Type your message here..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSendResponse}
                    disabled={isSendingResponse || !responseText.trim()}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isSendingResponse ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Ticket Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Ticket ID</Label>
                <div className="text-sm text-muted-foreground font-mono">
                  {ticket.id}
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">
                  <Badge
                    variant={getStatusBadgeVariant(ticket.status)}
                    className="flex items-center gap-1 w-fit"
                  >
                    {getStatusIcon(ticket.status)}
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <div className="text-sm text-muted-foreground">
                  {formatDate(ticket.createdAt)}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Updated</Label>
                <div className="text-sm text-muted-foreground">
                  {formatDate(ticket.updatedAt)}
                </div>
              </div>
              {ticket.closedAt && (
                <>
                  <div>
                    <Label className="text-sm font-medium">Closed</Label>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(ticket.closedAt)}
                    </div>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {ticket.messages?.length || 0} messages
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {ticket.attachments?.length || 0} attachments
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Our support team typically responds within 24 hours during
                business days.
              </p>
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Business Hours:</strong>
                </div>
                <div className="text-sm text-muted-foreground">
                  Monday - Friday: 9:00 AM - 6:00 PM (UTC+7)
                </div>
              </div>
              {ticket.status !== "CLOSED" && (
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">
                    If this is urgent, please add more details to help us
                    prioritize your request.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
