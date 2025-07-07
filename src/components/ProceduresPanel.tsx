import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, AlertCircle, Clock, CheckCircle } from "lucide-react";

interface SOPProcedure {
  id: string;
  title: string;
  reference: string;
  category: "critical" | "mandatory" | "normal";
  description: string;
  keyPoints: string[];
  limitations?: string[];
}

const proceduresByPhase = {
  approach: [
    {
      id: "app-brief",
      title: "Approach Briefing",
      reference: "SOP 4.2.1",
      category: "mandatory" as const,
      description: "Complete approach briefing including runway, approach type, weather, and go-around procedures",
      keyPoints: [
        "Review approach chart and identify key altitudes",
        "Brief runway conditions and length",
        "Confirm weather and wind conditions",
        "Review missed approach procedure",
        "Set navigation equipment and verify ILS/RNAV setup"
      ]
    },
    {
      id: "app-config",
      title: "Approach Configuration",
      reference: "SOP 4.2.3",
      category: "critical" as const,
      description: "Aircraft configuration for final approach phase",
      keyPoints: [
        "Flaps FULL or CONF 3 as required",
        "Landing gear DOWN and locked",
        "Autobrake system set as briefed",
        "Speedbrakes armed",
        "Final speed target confirmed"
      ],
      limitations: [
        "Maximum approach speed: VAPP + 20 kts",
        "Stabilized approach criteria must be met by 1000 ft AAL"
      ]
    },
    {
      id: "app-monitor",
      title: "Approach Monitoring",
      reference: "SOP 4.2.4",
      category: "critical" as const,
      description: "Continuous monitoring of approach parameters and energy management",
      keyPoints: [
        "Monitor flight path and energy state",
        "Call deviations immediately",
        "Verify approach category and minima",
        "Prepare for go-around if unstabilized",
        "Monitor weather conditions continuously"
      ]
    }
  ],
  cruise: [
    {
      id: "cruise-opt",
      title: "Cruise Optimization",
      reference: "SOP 3.1.2",
      category: "normal" as const,
      description: "Optimize flight level and speed for fuel efficiency",
      keyPoints: [
        "Monitor fuel flow and consumption",
        "Request step climbs when beneficial",
        "Use cost index for speed optimization",
        "Monitor weather and turbulence reports",
        "Coordinate with ATC for optimal routing"
      ]
    },
    {
      id: "cruise-monitor",
      title: "Systems Monitoring",
      reference: "SOP 3.1.4",
      category: "mandatory" as const,
      description: "Continuous monitoring of aircraft systems during cruise",
      keyPoints: [
        "Regular engine parameter checks",
        "Fuel quantity and balance monitoring",
        "Cabin pressurization checks",
        "Navigation system verification",
        "Weather radar interpretation"
      ]
    },
    {
      id: "cruise-comm",
      title: "Communication Procedures",
      reference: "SOP 3.1.5",
      category: "normal" as const,
      description: "Standard communication and position reporting",
      keyPoints: [
        "Position reports at designated waypoints",
        "Monitor guard frequency (121.5)",
        "Report significant weather to ATC",
        "Coordinate with cabin crew for service",
        "Update ETA and fuel predictions"
      ]
    }
  ],
  descent: [
    {
      id: "desc-plan",
      title: "Descent Planning",
      reference: "SOP 3.2.1",
      category: "mandatory" as const,
      description: "Plan and execute optimal descent profile",
      keyPoints: [
        "Calculate top of descent point",
        "Review arrival procedures and constraints",
        "Brief approach and landing runway",
        "Set target speed and descent rate",
        "Prepare for approach phase"
      ]
    },
    {
      id: "desc-energy",
      title: "Energy Management",
      reference: "SOP 3.2.2",
      category: "critical" as const,
      description: "Manage aircraft energy state during descent",
      keyPoints: [
        "Maintain appropriate descent rate",
        "Use speedbrakes judiciously",
        "Monitor speed and altitude constraints",
        "Prepare for approach configuration",
        "Maintain situational awareness"
      ]
    },
    {
      id: "desc-brief",
      title: "Approach Preparation",
      reference: "SOP 3.2.4",
      category: "mandatory" as const,
      description: "Prepare for approach phase during descent",
      keyPoints: [
        "Review approach plates and minima",
        "Set up navigation equipment",
        "Brief cabin crew for landing",
        "Complete descent checklist",
        "Verify landing performance data"
      ]
    }
  ]
};

interface ProceduresPanelProps {
  selectedPhase: string;
}

export const ProceduresPanel = ({ selectedPhase }: ProceduresPanelProps) => {
  const [expandedProcedure, setExpandedProcedure] = useState<string | null>(null);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "critical": return "destructive";
      case "mandatory": return "default";
      case "normal": return "secondary";
      default: return "outline";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "critical": return <AlertCircle className="h-4 w-4" />;
      case "mandatory": return <Clock className="h-4 w-4" />;
      case "normal": return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Get procedures for the current phase, default to approach if phase not found
  const currentProcedures = proceduresByPhase[selectedPhase as keyof typeof proceduresByPhase] || proceduresByPhase.approach;

  return (
    <Card className="shadow-cockpit bg-display-gradient border-border h-[calc(100vh-240px)]">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          SOP Procedures Reference
        </h2>
        <p className="text-sm text-muted-foreground">
          Phase: {selectedPhase.charAt(0).toUpperCase() + selectedPhase.slice(1)} • Information Only
        </p>
      </div>

      <Tabs defaultValue="procedures" className="h-full">
        <TabsList className="grid w-full grid-cols-1 mx-4 mt-4">
          <TabsTrigger value="procedures">Current Phase Procedures</TabsTrigger>
        </TabsList>

        <div className="p-4 overflow-y-auto h-[calc(100%-120px)]">
          <TabsContent value="procedures" className="space-y-4 mt-0">
            {/* Phase Information */}
            <Card className="p-4 border border-border bg-muted/50">
              <h3 className="font-semibold text-foreground mb-2">
                {selectedPhase.charAt(0).toUpperCase() + selectedPhase.slice(1)} Phase Procedures
              </h3>
              <p className="text-sm text-muted-foreground">
                Key SOP highlights for the current flight phase. This is reference information only - 
                always consult official manuals for complete procedures.
              </p>
            </Card>

            {/* Procedures List */}
            <div className="space-y-4">
              {currentProcedures.map((procedure) => (
                <Card key={procedure.id} className="border border-border">
                  <div 
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedProcedure(
                      expandedProcedure === procedure.id ? null : procedure.id
                    )}
                  >
                    <div className="flex items-start justify-between">
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
                        <h4 className="font-semibold text-foreground mb-1">{procedure.title}</h4>
                        <p className="text-sm text-muted-foreground">{procedure.description}</p>
                      </div>
                      <div className="ml-4">
                        {expandedProcedure === procedure.id ? "−" : "+"}
                      </div>
                    </div>
                  </div>

                  {expandedProcedure === procedure.id && (
                    <div className="px-4 pb-4 border-t border-border">
                      <div className="mt-4 space-y-4">
                        <div>
                          <h5 className="font-medium text-foreground mb-2">Key Points:</h5>
                          <ul className="space-y-1">
                            {procedure.keyPoints.map((point, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {procedure.limitations && (
                          <div>
                            <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                              Limitations:
                            </h5>
                            <ul className="space-y-1">
                              {procedure.limitations.map((limitation, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-destructive mt-1">•</span>
                                  <span>{limitation}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="p-3 bg-muted rounded border border-border">
                          <p className="text-xs text-muted-foreground">
                            <strong>Reference:</strong> {procedure.reference} • 
                            <strong> Important:</strong> This is a summary only. Consult official SOP manual for complete procedures.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Disclaimer */}
            <Card className="p-4 border border-border bg-yellow-50 dark:bg-yellow-950/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground mb-1">Important Disclaimer</h4>
                  <p className="text-sm text-muted-foreground">
                    This panel provides SOP highlights for situational awareness only. Always refer to the 
                    official A321 Standard Operating Procedures manual and current company operations manual 
                    for complete and authoritative procedures.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};