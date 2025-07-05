import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FlightPhaseSelectorProps {
  selectedPhase: string;
  onPhaseChange: (phase: string) => void;
}

const flightPhases = [
  { value: "preflight", label: "Pre-flight", icon: "📋" },
  { value: "taxi", label: "Taxi", icon: "🛬" },
  { value: "takeoff", label: "Takeoff", icon: "🛫" },
  { value: "climb", label: "Climb", icon: "📈" },
  { value: "cruise", label: "Cruise", icon: "✈️" },
  { value: "descent", label: "Descent", icon: "📉" },
  { value: "approach", label: "Approach", icon: "🎯" },
  { value: "landing", label: "Landing", icon: "🛬" },
  { value: "emergency", label: "Emergency", icon: "🚨" },
];

export const FlightPhaseSelector = ({ selectedPhase, onPhaseChange }: FlightPhaseSelectorProps) => {
  return (
    <Card className="p-4 shadow-display bg-display-gradient border-border">
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-foreground">Flight Phase</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Select current phase for context-aware guidance
          </p>
        </div>

        <Select value={selectedPhase} onValueChange={onPhaseChange}>
          <SelectTrigger className="w-full bg-input border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {flightPhases.map((phase) => (
              <SelectItem key={phase.value} value={phase.value} className="hover:bg-muted">
                <div className="flex items-center gap-2">
                  <span>{phase.icon}</span>
                  <span>{phase.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Current Phase Display */}
        <div className="mt-4 p-3 bg-muted rounded-md">
          <div className="text-xs font-medium text-muted-foreground mb-1">CURRENT PHASE</div>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {flightPhases.find(p => p.value === selectedPhase)?.icon}
            </span>
            <span className="font-semibold text-foreground">
              {flightPhases.find(p => p.value === selectedPhase)?.label}
            </span>
          </div>
        </div>

        {/* Phase-Specific Info */}
        <div className="text-xs text-muted-foreground p-2 bg-secondary/50 rounded border border-border">
          Phase-specific procedures and limitations will be prioritized in responses.
        </div>
      </div>
    </Card>
  );
};