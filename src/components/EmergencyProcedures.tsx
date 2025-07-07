import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";

interface EmergencyProcedure {
  id: string;
  title: string;
  category: "critical" | "warning" | "caution";
  steps: string[];
  reference: string;
  conditions: string[];
}

const emergencyProcedures: EmergencyProcedure[] = [
  {
    id: "engine-failure",
    title: "Engine Failure During Flight",
    category: "critical",
    reference: "QRH 2.1.1",
    conditions: ["Engine parameters abnormal", "Engine fire warning", "Severe vibration"],
    steps: [
      "Maintain control of aircraft",
      "Apply memory items if applicable",
      "Identify failed engine",
      "Secure failed engine following QRH",
      "Consider diversion if required",
      "Brief cabin crew and passengers"
    ]
  },
  {
    id: "fire-warning",
    title: "Engine Fire Warning",
    category: "critical",
    reference: "QRH 2.2.1",
    conditions: ["ENG FIRE warning displayed", "Fire bell activated"],
    steps: [
      "Engine Fire Switch - PUSH",
      "Engine Master Switch - OFF",
      "Fire Agent - PUSH if fire persists",
      "If fire persists after 30 seconds, push second agent",
      "Land at nearest suitable airport"
    ]
  },
  {
    id: "smoke-fumes",
    title: "Smoke/Fumes in Cabin",
    category: "warning",
    reference: "QRH 3.1.1",
    conditions: ["Visible smoke", "Unusual odors", "Passenger reports"],
    steps: [
      "Don oxygen masks",
      "Establish communications",
      "Identify source if possible",
      "Consider emergency descent",
      "Inform ATC - declare emergency",
      "Land at nearest suitable airport"
    ]
  },
  {
    id: "depressurization",
    title: "Rapid Depressurization",
    category: "critical",
    reference: "QRH 1.1.1",
    conditions: ["Cabin altitude > 10,000 ft", "Loud noise", "Rapid descent required"],
    steps: [
      "Don oxygen masks immediately",
      "Emergency descent - initiate",
      "Descend to 10,000 ft or MSA",
      "ATC - inform and request vectors",
      "Passenger oxygen - verify deployed",
      "Consider diversion"
    ]
  }
];

export const EmergencyProcedures = () => {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean[]>>({});
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null);

  const toggleStep = (procedureId: string, stepIndex: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [procedureId]: {
        ...prev[procedureId],
        [stepIndex]: !prev[procedureId]?.[stepIndex]
      }
    }));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "critical": return "destructive";
      case "warning": return "default";
      case "caution": return "secondary";
      default: return "outline";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "critical": return <AlertTriangle className="h-4 w-4" />;
      case "warning": return <AlertTriangle className="h-4 w-4" />;
      case "caution": return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className="shadow-cockpit bg-display-gradient border-border h-[calc(100vh-240px)]">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Emergency Procedures
        </h2>
        <p className="text-sm text-muted-foreground">
          Quick Reference Handbook (QRH) procedures for abnormal situations
        </p>
      </div>

      <Tabs defaultValue="procedures" className="h-full">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
          <TabsTrigger value="procedures">Emergency Procedures</TabsTrigger>
          <TabsTrigger value="checklist">Active Checklist</TabsTrigger>
        </TabsList>

        <TabsContent value="procedures" className="p-4 space-y-4 overflow-y-auto h-[calc(100%-120px)]">
          {emergencyProcedures.map((procedure) => (
            <Card key={procedure.id} className="p-4 border border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getCategoryColor(procedure.category)} className="flex items-center gap-1">
                      {getCategoryIcon(procedure.category)}
                      {procedure.category.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {procedure.reference}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground">{procedure.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Conditions: {procedure.conditions.join(", ")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProcedure(procedure.id)}
                  className="ml-4"
                >
                  Use Procedure
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="checklist" className="p-4 overflow-y-auto h-[calc(100%-120px)]">
          {selectedProcedure ? (
            (() => {
              const procedure = emergencyProcedures.find(p => p.id === selectedProcedure);
              if (!procedure) return <div>No procedure selected</div>;

              return (
                <Card className="p-4 border border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={getCategoryColor(procedure.category)} className="flex items-center gap-1">
                      {getCategoryIcon(procedure.category)}
                      {procedure.category.toUpperCase()}
                    </Badge>
                    <h3 className="font-semibold text-foreground">{procedure.title}</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <strong>Reference:</strong> {procedure.reference}
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">Checklist Steps:</h4>
                      {procedure.steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 rounded border border-border">
                          <button
                            onClick={() => toggleStep(procedure.id, index)}
                            className="mt-1"
                          >
                            {completedSteps[procedure.id]?.[index] ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <div className="h-5 w-5 border-2 border-muted-foreground rounded-full" />
                            )}
                          </button>
                          <div className="flex-1">
                            <span className={`text-sm ${
                              completedSteps[procedure.id]?.[index] 
                                ? 'line-through text-muted-foreground' 
                                : 'text-foreground'
                            }`}>
                              {index + 1}. {step}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-muted rounded border border-border">
                      <p className="text-xs text-muted-foreground">
                        <strong>Important:</strong> This is a reference only. Always consult the official QRH for complete procedures.
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })()
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg mb-2">No Active Checklist</p>
              <p className="text-sm">Select a procedure from the Emergency Procedures tab to begin</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};