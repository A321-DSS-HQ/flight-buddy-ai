import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Cpu, 
  Gauge, 
  Fuel, 
  Zap, 
  Thermometer, 
  Settings, 
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface SystemParameter {
  name: string;
  value: number;
  unit: string;
  normal: [number, number];
  caution: [number, number];
  warning: [number, number];
}

interface SystemStatus {
  name: string;
  status: "normal" | "caution" | "warning" | "inop";
  icon: React.ReactNode;
  parameters: SystemParameter[];
  lastCheck: Date;
}

export const SystemStatus = () => {
  const [systems, setSystems] = useState<SystemStatus[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  useEffect(() => {
    // Initialize systems with mock data
    const initialSystems: SystemStatus[] = [
      {
        name: "Engine 1",
        status: "normal",
        icon: <Settings className="h-4 w-4" />,
        lastCheck: new Date(),
        parameters: [
          { name: "N1", value: 85.2, unit: "%", normal: [20, 100], caution: [100, 105], warning: [105, 110] },
          { name: "N2", value: 92.1, unit: "%", normal: [20, 100], caution: [100, 105], warning: [105, 110] },
          { name: "EGT", value: 650, unit: "°C", normal: [0, 900], caution: [900, 950], warning: [950, 1000] },
          { name: "FF", value: 1200, unit: "kg/h", normal: [0, 3000], caution: [3000, 3500], warning: [3500, 4000] }
        ]
      },
      {
        name: "Engine 2",
        status: "normal",
        icon: <Settings className="h-4 w-4" />,
        lastCheck: new Date(),
        parameters: [
          { name: "N1", value: 84.8, unit: "%", normal: [20, 100], caution: [100, 105], warning: [105, 110] },
          { name: "N2", value: 91.9, unit: "%", normal: [20, 100], caution: [100, 105], warning: [105, 110] },
          { name: "EGT", value: 645, unit: "°C", normal: [0, 900], caution: [900, 950], warning: [950, 1000] },
          { name: "FF", value: 1195, unit: "kg/h", normal: [0, 3000], caution: [3000, 3500], warning: [3500, 4000] }
        ]
      },
      {
        name: "Hydraulics",
        status: "normal",
        icon: <Gauge className="h-4 w-4" />,
        lastCheck: new Date(),
        parameters: [
          { name: "Green Sys", value: 3000, unit: "psi", normal: [2500, 3500], caution: [2000, 2500], warning: [0, 2000] },
          { name: "Blue Sys", value: 3000, unit: "psi", normal: [2500, 3500], caution: [2000, 2500], warning: [0, 2000] },
          { name: "Yellow Sys", value: 2950, unit: "psi", normal: [2500, 3500], caution: [2000, 2500], warning: [0, 2000] }
        ]
      },
      {
        name: "Electrical",
        status: "caution",
        icon: <Zap className="h-4 w-4" />,
        lastCheck: new Date(),
        parameters: [
          { name: "APU Gen", value: 115.2, unit: "V", normal: [110, 120], caution: [105, 110], warning: [0, 105] },
          { name: "Engine 1 Gen", value: 114.8, unit: "V", normal: [110, 120], caution: [105, 110], warning: [0, 105] },
          { name: "Engine 2 Gen", value: 108.5, unit: "V", normal: [110, 120], caution: [105, 110], warning: [0, 105] },
          { name: "Battery", value: 24.1, unit: "V", normal: [22, 28], caution: [20, 22], warning: [0, 20] }
        ]
      },
      {
        name: "Fuel System",
        status: "normal",
        icon: <Fuel className="h-4 w-4" />,
        lastCheck: new Date(),
        parameters: [
          { name: "Left Tank", value: 8500, unit: "kg", normal: [0, 15000], caution: [500, 1000], warning: [0, 500] },
          { name: "Right Tank", value: 8750, unit: "kg", normal: [0, 15000], caution: [500, 1000], warning: [0, 500] },
          { name: "Center Tank", value: 2300, unit: "kg", normal: [0, 15000], caution: [500, 1000], warning: [0, 500] },
          { name: "Fuel Used", value: 3250, unit: "kg", normal: [0, 30000], caution: [25000, 28000], warning: [28000, 30000] }
        ]
      },
      {
        name: "Environmental",
        status: "normal",
        icon: <Thermometer className="h-4 w-4" />,
        lastCheck: new Date(),
        parameters: [
          { name: "Cabin Alt", value: 6800, unit: "ft", normal: [0, 8000], caution: [8000, 10000], warning: [10000, 15000] },
          { name: "Cabin Press", value: 11.2, unit: "psi", normal: [10, 15], caution: [8, 10], warning: [0, 8] },
          { name: "Cabin Temp", value: 22, unit: "°C", normal: [18, 26], caution: [15, 18], warning: [0, 15] }
        ]
      }
    ];

    setSystems(initialSystems);
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setSystems(prevSystems => 
        prevSystems.map(system => ({
          ...system,
          parameters: system.parameters.map(param => ({
            ...param,
            value: param.value + (Math.random() - 0.5) * 0.1 * param.value
          })),
          lastCheck: new Date()
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getParameterStatus = (param: SystemParameter): "normal" | "caution" | "warning" => {
    if (param.value >= param.warning[0] && param.value <= param.warning[1]) return "warning";
    if (param.value >= param.caution[0] && param.value <= param.caution[1]) return "caution";
    return "normal";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "secondary";
      case "caution": return "default";
      case "warning": return "destructive";
      case "inop": return "destructive";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "normal": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "caution": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "inop": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const systemsWithIssues = systems.filter(s => s.status !== "normal");
  const allNormal = systemsWithIssues.length === 0;

  return (
    <Card className="shadow-cockpit bg-display-gradient border-border h-[calc(100vh-240px)]">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          System Status
        </h2>
        <p className="text-sm text-muted-foreground">
          Real-time aircraft systems monitoring and health status
        </p>
      </div>

      <Tabs defaultValue="overview" className="h-full">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">System Details</TabsTrigger>
        </TabsList>

        <div className="p-4 overflow-y-auto h-[calc(100%-120px)]">
          <TabsContent value="overview" className="space-y-4 mt-0">
            {/* Systems Grid */}
            <div className="grid grid-cols-2 gap-4">
              {systems.map((system) => (
                <Card 
                  key={system.name} 
                  className={`p-4 border cursor-pointer transition-colors hover:bg-muted/50 ${
                    system.status !== "normal" ? "border-destructive" : "border-border"
                  }`}
                  onClick={() => setSelectedSystem(system.name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {system.icon}
                      <span className="font-medium text-sm">{system.name}</span>
                    </div>
                    {getStatusIcon(system.status)}
                  </div>
                  
                  <Badge variant={getStatusColor(system.status)} className="text-xs">
                    {system.status.toUpperCase()}
                  </Badge>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    Last: {system.lastCheck.toLocaleTimeString()}
                  </div>
                </Card>
              ))}
            </div>

            {/* System Alerts */}
            {!allNormal && (
              <Card className="p-4 border border-destructive">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Active System Alerts
                </h3>
                <div className="space-y-2">
                  {systemsWithIssues.map((system) => (
                    <div key={system.name} className="flex justify-between items-center">
                      <span className="text-sm">{system.name}</span>
                      <Badge variant={getStatusColor(system.status)}>
                        {system.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {allNormal && (
              <Card className="p-4 border border-green-500">
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p className="text-lg font-semibold text-green-500 mb-2">All Systems Normal</p>
                  <p className="text-sm text-muted-foreground">No active alerts or warnings</p>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4 mt-0">
            {/* System Selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              {systems.map((system) => (
                <Badge
                  key={system.name}
                  variant={selectedSystem === system.name ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedSystem(system.name)}
                >
                  {system.name}
                </Badge>
              ))}
            </div>

            {selectedSystem && (() => {
              const system = systems.find(s => s.name === selectedSystem);
              if (!system) return null;

              return (
                <Card className="p-4 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      {system.icon}
                      {system.name} Details
                    </h3>
                    <Badge variant={getStatusColor(system.status)}>
                      {system.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {system.parameters.map((param, index) => {
                      const status = getParameterStatus(param);
                      const percentage = ((param.value - param.normal[0]) / (param.normal[1] - param.normal[0])) * 100;
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{param.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">
                                {param.value.toFixed(1)} {param.unit}
                              </span>
                              <Badge 
                                variant={getStatusColor(status)} 
                                className="text-xs"
                              >
                                {status}
                              </Badge>
                            </div>
                          </div>
                          <Progress 
                            value={Math.max(0, Math.min(100, percentage))}
                            className={`h-2 ${
                              status === "warning" ? "bg-red-100" :
                              status === "caution" ? "bg-yellow-100" :
                              "bg-green-100"
                            }`}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Normal: {param.normal[0]}-{param.normal[1]} {param.unit}</span>
                            <span>Max: {param.warning[1]} {param.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-3 bg-muted rounded border border-border">
                    <p className="text-xs text-muted-foreground">
                      Last system check: {system.lastCheck.toLocaleTimeString()} • 
                      Auto-refresh every 2 seconds
                    </p>
                  </div>
                </Card>
              );
            })()}

            {!selectedSystem && (
              <div className="text-center py-8 text-muted-foreground">
                <Cpu className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg mb-2">Select a System</p>
                <p className="text-sm">Choose a system above to view detailed parameters</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};