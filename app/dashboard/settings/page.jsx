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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User, Bell, Shield, Palette, Globe } from "lucide-react";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    if (session?.accessToken) {
      fetchUserProfile();
    } else if (status === 'unauthenticated') {
      setIsLoadingProfile(false);
    }
  }, [session, status]);

  const fetchUserProfile = async () => {
    if (!session?.accessToken) return;
    
    try {
      const response = await fetch(`${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.USER.PROFILE}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const userData = result.data?.user;
        setFormData({
          name: userData?.name || "",
          email: userData?.email || "",
          phone: userData?.phone || "",
          avatar: userData?.avatar || ""
        });
      } else {
        // Fallback to session data if API fails
        setFormData({
          name: session.user?.name || "",
          email: session.user?.email || "",
          phone: session.user?.phone || "",
          avatar: session.user?.avatar || ""
        });
        const errorResult = await response.json();
        toast.error(errorResult.message || 'Failed to load profile data', {
          style: {
            background: '#ef4444',
            color: 'white',
            border: '1px solid #dc2626'
          }
        });
      }
    } catch (error) {
      // Fallback to session data if API call fails
      setFormData({
        name: session.user?.name || "",
        email: session.user?.email || "",
        phone: session.user?.phone || "",
        avatar: session.user?.avatar || ""
      });
      toast.error('Error loading profile data', {
        style: {
          background: '#ef4444',
          color: 'white',
          border: '1px solid #dc2626'
        }
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.USER.PROFILE}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          avatar: formData.avatar
        })
      });

      if (response.ok) {
        await response.json();
        toast.success('Profile updated successfully');
      } else {
        const errorResult = await response.json();
        toast.error(errorResult.message || 'Failed to update profile', {
          style: {
            background: '#ef4444',
            color: 'white',
            border: '1px solid #dc2626'
          }
        });
      }
    } catch (error) {
      toast.error('Error updating profile', {
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
        <div className="text-muted-foreground">Please sign in to access settings</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>
                Update your profile information and manage your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingProfile ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading profile...</div>
                </div>
              ) : (
                <>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={formData.avatar || "/placeholder-avatar.jpg"} />
                  <AvatarFallback className="text-lg">
                    {formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline">Change Avatar</Button>
                  <p className="text-sm text-muted-foreground">
                    Recommended: Square image, at least 400x400px
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="firstName">Name</Label>
                <Input 
                  id="firstName" 
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Change Password</h4>
                  <div className="space-y-2">
                    <Input type="password" placeholder="Current password" />
                    <Input type="password" placeholder="New password" />
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                  <Button className="mt-2">Update Password</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Application Preferences</span>
              </CardTitle>
              <CardDescription>
                Configure your application preferences and defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Date Format</Label>
                  <Select defaultValue="mm/dd/yyyy">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-destructive">
                  Danger Zone
                </h4>
                <div className="space-y-2">
                  <Button variant="destructive" className="w-full">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
