import { useState } from "react";
import { FlightPhaseSelector } from "@/components/FlightPhaseSelector";
import { ChatInterface } from "@/components/ChatInterface";
import { Card } from "@/components/ui/card";

const Index = () => {
  const [selectedPhase, setSelectedPhase] = useState<string>("preflight");

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
                A321 Decision Support System
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Aircraft Type</div>
              <div className="text-lg font-semibold text-primary">A321</div>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Flight Phase Selector */}
          <div className="lg:col-span-1">
            <FlightPhaseSelector 
              selectedPhase={selectedPhase}
              onPhaseChange={setSelectedPhase}
            />
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <ChatInterface selectedPhase={selectedPhase} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;