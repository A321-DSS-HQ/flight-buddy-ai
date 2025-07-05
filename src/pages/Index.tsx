import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FlightPhaseSelector } from "@/components/FlightPhaseSelector";
import { ChatInterface } from "@/components/ChatInterface";
import { DocumentUpload } from "@/components/DocumentUpload";
import { SecurityAlert } from "@/components/SecurityAlert";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, MessageSquare, Upload } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [selectedPhase, setSelectedPhase] = useState<string>("preflight");

  if (loading) {
    return (
      <div className="min-h-screen bg-cockpit-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-cockpit-gradient p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6 p-6 shadow-cockpit bg-display-gradient border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                DSS Pilot Assistant
              </h1>
              <p className="text-muted-foreground mt-1">
                A321 Decision Support System • Welcome, {user.user_metadata?.full_name || user.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Aircraft Type</div>
                <div className="text-lg font-semibold text-primary">A321</div>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </Card>

        {/* Security Alert */}
        <SecurityAlert />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Flight Phase Selector */}
          <div className="lg:col-span-1">
            <FlightPhaseSelector 
              selectedPhase={selectedPhase}
              onPhaseChange={setSelectedPhase}
            />
          </div>

          {/* Main Interface */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Assistant
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Documents
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="mt-4">
                <ChatInterface selectedPhase={selectedPhase} />
              </TabsContent>
              
              <TabsContent value="documents" className="mt-4">
                <DocumentUpload />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;