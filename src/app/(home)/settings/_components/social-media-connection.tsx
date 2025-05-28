"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Facebook,
  Instagram,
  Linkedin,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui-elements/alert";
import { SocialPage, SocialPlatform } from "@/types/social-page";
import {
  connectFacebook,
  connectInstagram,
  connectLinkedIn,
  disconnectFacebook,
  disconnectInstagram,
  disconnectLinkedIn,
  getFacebookAccount,
  getInstagramAccount,
  getLinkedInAccount,
} from "@/services/socialMedia";

interface SocialMediaConnectionsProps {
  onConnectionChange?: (accounts: SocialPage[]) => void;
  className?: string;
}

// Facebook Platform Component
const FacebookPlatform = ({
  page,
  onConnect,
  onDisconnect,
  isConnecting,
}: {
  page: SocialPage | null;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}) => {
  const getSocialColor = () => "bg-blue-600 hover:bg-blue-700";

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center space-x-3">
        <div className={`rounded-lg p-2 text-white ${getSocialColor()}`}>
          <Facebook className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium capitalize">Facebook</h3>
            {page && (
              <Badge variant="destructive" className="text-xs">
                Connected
              </Badge>
            )}
          </div>
          {page ? (
            <div className="space-y-1">
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600">{page.name}</span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {page.followers_count && (
                    <span>
                      {page.followers_count.toLocaleString()} followers
                    </span>
                  )}
                  <span>
                    Last sync: {formatLastUpdateTime(page.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Not connected</p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {page ? (
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => onDisconnect()}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className={`text-white ${getSocialColor()}`}
            onClick={onConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                Connecting...
              </>
            ) : (
              "Connect Facebook"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

// Instagram Platform Component
const InstagramPlatform = ({
  page,
  onConnect,
  onDisconnect,
  isConnecting,
}: {
  page: SocialPage | null;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}) => {
  const getSocialColor = () =>
    "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600";

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center space-x-3">
        <div className={`rounded-lg p-2 text-white ${getSocialColor()}`}>
          <Instagram className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium capitalize">Instagram</h3>
            {page && (
              <Badge variant="destructive" className="text-xs">
                Connected
              </Badge>
            )}
          </div>
          {page ? (
            <div className="space-y-1">
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600">{page.name}</span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {page.followers_count && (
                    <span>
                      {page.followers_count.toLocaleString()} followers
                    </span>
                  )}
                  <span>
                    Last sync: {formatLastUpdateTime(page.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Not connected</p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {page ? (
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => onDisconnect()}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className={`text-white ${getSocialColor()}`}
            onClick={onConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                Connecting...
              </>
            ) : (
              "Connect Instagram"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

// LinkedIn Platform Component
const LinkedInPlatform = ({
  page,
  onConnect,
  onDisconnect,
  isConnecting,
}: {
  page: SocialPage | null;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}) => {
  const getSocialColor = () => "bg-blue-700 hover:bg-blue-800";

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center space-x-3">
        <div className={`rounded-lg p-2 text-white ${getSocialColor()}`}>
          <Linkedin className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium capitalize">LinkedIn</h3>
            {page && (
              <Badge variant="destructive" className="text-xs">
                Connected
              </Badge>
            )}
          </div>
          {page ? (
            <div className="space-y-1">
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600">{page.name}</span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {page.followers_count && (
                    <span>
                      {page.followers_count.toLocaleString()} followers
                    </span>
                  )}
                  <span>
                    Last sync: {formatLastUpdateTime(page.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Not connected</p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {page ? (
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => onDisconnect()}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className={`text-white ${getSocialColor()}`}
            onClick={onConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                Connecting...
              </>
            ) : (
              "Connect LinkedIn"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

// Format last update time helper function
const formatLastUpdateTime = (date?: Date | string) => {
  if (!date) return "Never";
  const now = new Date();
  // Handle both Date objects and string dates for backward compatibility
  const updateDate = date instanceof Date ? date : new Date(date);
  const diffMs = now.getTime() - updateDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
};

export function SocialMediaConnections({
  onConnectionChange,
  className = "bg-white shadow-1 dark:bg-gray-dark dark:shadow-card mt-6",
}: SocialMediaConnectionsProps) {
  // State for platform-specific pages
  const [facebookPage, setFacebookPage] = useState<SocialPage | null>(null);
  const [instagramPage, setInstagramPage] = useState<SocialPage | null>(null);
  const [linkedinPage, setLinkedinPage] = useState<SocialPage | null>(null);

  // State for connection status
  const [isConnecting, setIsConnecting] = useState<SocialPlatform | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Alert state
  const [alert, setAlert] = useState<{
    show: boolean;
    title: string;
    description: string;
    variant: "success" | "error" | "warning";
  } | null>(null);

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notify parent component when accounts change
  useEffect(() => {
    if (onConnectionChange) {
      const allAccounts = [facebookPage, instagramPage, linkedinPage].filter(
        Boolean,
      ) as SocialPage[];
      onConnectionChange(allAccounts);
    }
  }, [facebookPage, instagramPage, linkedinPage, onConnectionChange]);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);

      // Load platform-specific accounts
      const [facebookResult, instagramResult, linkedinResult] =
        await Promise.all([
          getFacebookAccount(),
          getInstagramAccount(),
          getLinkedInAccount(),
        ]);

      // Set the page states with the results
      // Note: results will be null if not connected or there's an error
      // or an object with 'error' property if there's an authentication issue
      if (facebookResult && "error" in facebookResult) {
        console.error("Facebook account error:", facebookResult.error);
        setFacebookPage(null);
      } else {
        setFacebookPage(facebookResult);
      }

      if (instagramResult && "error" in instagramResult) {
        console.error("Instagram account error:", instagramResult.error);
        setInstagramPage(null);
      } else {
        setInstagramPage(instagramResult);
      }

      if (linkedinResult && "error" in linkedinResult) {
        console.error("LinkedIn account error:", linkedinResult.error);
        setLinkedinPage(null);
      } else {
        console.log("LinkedIn account result:", linkedinResult);
        setLinkedinPage(linkedinResult);
      }
    } catch (error) {
      console.error("Failed to load social media accounts:", error);
      showAlert("Error", "Failed to load social media accounts", "error");
      setFacebookPage(null);
      setInstagramPage(null);
      setLinkedinPage(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Facebook actions
  const handleConnectFacebook = async () => {
    setIsConnecting("facebook");
    try {
      const response = await connectFacebook();

      if (response.success && response.authUrl) {
        // Only redirect on client-side
        window.location.href = response.authUrl;
      } else {
        showAlert(
          "Error",
          response.error || "Failed to connect to Facebook",
          "error",
        );
        setIsConnecting(null);
      }
    } catch (error) {
      console.error("Facebook connection error:", error);
      showAlert(
        "Error",
        "An unexpected error occurred while connecting to Facebook",
        "error",
      );
      setIsConnecting(null);
    }
  };

  // Instagram actions
  const handleConnectInstagram = async () => {
    setIsConnecting("instagram");
    try {
      const response = await connectInstagram();

      if (response.success && response.authUrl) {
        // Only redirect on client-side
        window.location.href = response.authUrl;
      } else {
        showAlert(
          "Error",
          response.error || "Failed to connect to Instagram",
          "error",
        );
        setIsConnecting(null);
      }
    } catch (error) {
      console.error("Instagram connection error:", error);
      showAlert(
        "Error",
        "An unexpected error occurred while connecting to Instagram",
        "error",
      );
      setIsConnecting(null);
    }
  };

  // LinkedIn actions
  const handleConnectLinkedIn = async () => {
    setIsConnecting("linkedin");
    try {
      const response = await connectLinkedIn();

      if (response.success && response.authUrl) {
        // Only redirect on client-side
        window.location.href = response.authUrl;
      } else {
        showAlert(
          "Error",
          response.error || "Failed to connect to LinkedIn",
          "error",
        );

        console.log(response.authUrl);
        setIsConnecting(null);
      }
    } catch (error) {
      console.error("LinkedIn connection error:", error);
      showAlert(
        "Error",
        "An unexpected error occurred while connecting to LinkedIn",
        "error",
      );
      setIsConnecting(null);
    }
  };

  // Platform specific disconnect handlers
  const handleDisconnectFacebook = async () => {
    try {
      const success = await disconnectFacebook();

      if (success) {
        setFacebookPage(null);
        showAlert(
          "Disconnected",
          "Successfully disconnected Facebook account",
          "warning",
        );
      } else {
        showAlert("Error", "Failed to disconnect Facebook account", "error");
      }
    } catch (error) {
      console.error("Facebook disconnect error:", error);
      showAlert("Error", "An unexpected error occurred", "error");
    }
  };

  const handleDisconnectInstagram = async () => {
    try {
      const success = await disconnectInstagram();

      if (success) {
        setInstagramPage(null);
        showAlert(
          "Disconnected",
          "Successfully disconnected Instagram account",
          "warning",
        );
      } else {
        showAlert("Error", "Failed to disconnect Instagram account", "error");
      }
    } catch (error) {
      console.error("Instagram disconnect error:", error);
      showAlert("Error", "An unexpected error occurred", "error");
    }
  };

  const handleDisconnectLinkedIn = async () => {
    try {
      const success = await disconnectLinkedIn();

      if (success) {
        setLinkedinPage(null);
        showAlert(
          "Disconnected",
          "Successfully disconnected LinkedIn account",
          "warning",
        );
      } else {
        showAlert("Error", "Failed to disconnect LinkedIn account", "error");
      }
    } catch (error) {
      console.error("LinkedIn disconnect error:", error);
      showAlert("Error", "An unexpected error occurred", "error");
    }
  };

  const showAlert = (
    title: string,
    description: string,
    variant: "success" | "error" | "warning",
  ) => {
    setAlert({ show: true, title, description, variant });
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-black">
            SOCIAL MEDIA ACCOUNTS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex animate-pulse items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 rounded bg-gray-200"></div>
                    <div className="h-3 w-32 rounded bg-gray-200"></div>
                  </div>
                </div>
                <div className="h-8 w-24 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          SOCIAL MEDIA ACCOUNTS
        </CardTitle>
        <CardDescription>
          Connect your social media accounts to manage them from this dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Social Media Platforms */}
        <div className="space-y-4">
          <FacebookPlatform
            page={facebookPage}
            onConnect={handleConnectFacebook}
            onDisconnect={handleDisconnectFacebook}
            isConnecting={isConnecting === "facebook"}
          />

          <InstagramPlatform
            page={instagramPage}
            onConnect={handleConnectInstagram}
            onDisconnect={handleDisconnectInstagram}
            isConnecting={isConnecting === "instagram"}
          />

          <LinkedInPlatform
            page={linkedinPage}
            onConnect={handleConnectLinkedIn}
            onDisconnect={handleDisconnectLinkedIn}
            isConnecting={isConnecting === "linkedin"}
          />
        </div>

        <Separator className="my-6" />

        {/* Security Notice */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h4 className="font-medium text-blue-900">
                Secure Authentication
              </h4>
              <p className="mt-1 text-sm text-blue-700">
                Your social media accounts are connected using secure OAuth 2.0
                authentication. We never store your passwords and you can
                disconnect at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {alert && alert.show && (
          <div className="animate-fade-in fixed bottom-4 right-4 z-[9999]">
            <Alert
              variant={alert.variant}
              title={alert.title}
              description={alert.description}
              className="mb-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
