import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calculator, Plane, AlertTriangle } from "lucide-react";

interface PerformanceData {
  v1: number;
  vr: number;
  v2: number;
  flexTemp: number;
  takeoffDistance: number;
  landingDistance: number;
  optimumAltitude: number;
  fuelFlow: number;
}

export const PerformanceCalculator = () => {
  const [activeTab, setActiveTab] = useState("takeoff");
  const [formData, setFormData] = useState({
    // Takeoff data
    runway: "",
    weight: "",
    temperature: "",
    windSpeed: "",
    windDirection: "",
    altimeter: "",
    flaps: "1+F",
    // Landing data
    landingWeight: "",
    landingRunway: "",
    approach: "ILS",
    autobrake: "MED",
    // Cruise data
    cruiseWeight: "",
    cruiseAltitude: "",
    isaDeviation: "",
    costIndex: "35"
  });

  const [results, setResults] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculatePerformance = async () => {
    setLoading(true);
    
    // Simulate performance calculation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock calculations based on inputs
    const weight = parseInt(formData.weight) || 75000;
    const temp = parseInt(formData.temperature) || 15;
    const altitude = parseInt(formData.cruiseAltitude) || 37000;
    
    const mockResults: PerformanceData = {
      v1: Math.floor(140 + (weight - 70000) * 0.0008 + temp * 0.3),
      vr: Math.floor(150 + (weight - 70000) * 0.0008 + temp * 0.3),
      v2: Math.floor(160 + (weight - 70000) * 0.0008 + temp * 0.3),
      flexTemp: Math.max(temp + 10, temp + (85 - weight / 1000)),
      takeoffDistance: Math.floor(2200 + (weight - 70000) * 0.02 + temp * 15),
      landingDistance: Math.floor(1800 + (weight - 65000) * 0.015),
      optimumAltitude: Math.floor(35000 + (80000 - weight) * 0.1),
      fuelFlow: Math.floor(2200 + (weight - 70000) * 0.01 - (altitude - 30000) * 0.05)
    };
    
    setResults(mockResults);
    setLoading(false);
  };

  const getPerformanceStatus = (type: string, value: number) => {
    switch (type) {
      case "takeoffDistance":
        return value > 3000 ? "warning" : value > 2500 ? "caution" : "normal";
      case "landingDistance":
        return value > 2200 ? "warning" : value > 1900 ? "caution" : "normal";
      default:
        return "normal";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "warning": return "destructive";
      case "caution": return "default";
      default: return "secondary";
    }
  };

  return (
    <Card className="shadow-cockpit bg-display-gradient border-border h-[calc(100vh-240px)]">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Performance Calculator
        </h2>
        <p className="text-sm text-muted-foreground">
          A321 performance calculations for all flight phases
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="takeoff">Takeoff</TabsTrigger>
          <TabsTrigger value="landing">Landing</TabsTrigger>
          <TabsTrigger value="cruise">Cruise</TabsTrigger>
        </TabsList>

        <div className="p-4 overflow-y-auto h-[calc(100%-120px)]">
          <TabsContent value="takeoff" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="runway">Runway</Label>
                <Select onValueChange={(value) => handleInputChange("runway", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select runway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="31L">31L (3600m)</SelectItem>
                    <SelectItem value="31R">31R (4100m)</SelectItem>
                    <SelectItem value="13L">13L (3600m)</SelectItem>
                    <SelectItem value="13R">13R (4100m)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">TOW (kg)</Label>
                <Input
                  id="weight"
                  placeholder="75000"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  placeholder="25"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange("temperature", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="windSpeed">Wind (kts)</Label>
                <Input
                  id="windSpeed"
                  placeholder="10"
                  value={formData.windSpeed}
                  onChange={(e) => handleInputChange("windSpeed", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="altimeter">QNH (hPa)</Label>
                <Input
                  id="altimeter"
                  placeholder="1013"
                  value={formData.altimeter}
                  onChange={(e) => handleInputChange("altimeter", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flaps">Flap Setting</Label>
                <Select onValueChange={(value) => handleInputChange("flaps", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="1+F" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1+F">1+F</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="landing" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="landingRunway">Runway</Label>
                <Select onValueChange={(value) => handleInputChange("landingRunway", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select runway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="31L">31L (3600m)</SelectItem>
                    <SelectItem value="31R">31R (4100m)</SelectItem>
                    <SelectItem value="13L">13L (3600m)</SelectItem>
                    <SelectItem value="13R">13R (4100m)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="landingWeight">Landing Weight (kg)</Label>
                <Input
                  id="landingWeight"
                  placeholder="65000"
                  value={formData.landingWeight}
                  onChange={(e) => handleInputChange("landingWeight", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="approach">Approach Type</Label>
                <Select onValueChange={(value) => handleInputChange("approach", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="ILS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ILS">ILS</SelectItem>
                    <SelectItem value="RNAV">RNAV</SelectItem>
                    <SelectItem value="Visual">Visual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="autobrake">Autobrake</Label>
                <Select onValueChange={(value) => handleInputChange("autobrake", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="MED" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">LOW</SelectItem>
                    <SelectItem value="MED">MED</SelectItem>
                    <SelectItem value="MAX">MAX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cruise" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cruiseWeight">Current Weight (kg)</Label>
                <Input
                  id="cruiseWeight"
                  placeholder="70000"
                  value={formData.cruiseWeight}
                  onChange={(e) => handleInputChange("cruiseWeight", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cruiseAltitude">Current Altitude (ft)</Label>
                <Input
                  id="cruiseAltitude"
                  placeholder="37000"
                  value={formData.cruiseAltitude}
                  onChange={(e) => handleInputChange("cruiseAltitude", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isaDeviation">ISA Deviation (°C)</Label>
                <Input
                  id="isaDeviation"
                  placeholder="+5"
                  value={formData.isaDeviation}
                  onChange={(e) => handleInputChange("isaDeviation", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costIndex">Cost Index</Label>
                <Input
                  id="costIndex"
                  placeholder="35"
                  value={formData.costIndex}
                  onChange={(e) => handleInputChange("costIndex", e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <div className="mt-6">
            <Button
              onClick={calculatePerformance}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Performance
                </>
              )}
            </Button>
          </div>

          {results && (
            <Card className="mt-6 p-4 border border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Performance Results
              </h3>
              
              {activeTab === "takeoff" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">V1:</span>
                      <span className="font-mono">{results.v1} kts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">VR:</span>
                      <span className="font-mono">{results.vr} kts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">V2:</span>
                      <span className="font-mono">{results.v2} kts</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Flex Temp:</span>
                      <span className="font-mono">{results.flexTemp}°C</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">TOD:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{results.takeoffDistance}m</span>
                        <Badge variant={getStatusColor(getPerformanceStatus("takeoffDistance", results.takeoffDistance))}>
                          {getPerformanceStatus("takeoffDistance", results.takeoffDistance)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "landing" && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Landing Distance:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{results.landingDistance}m</span>
                      <Badge variant={getStatusColor(getPerformanceStatus("landingDistance", results.landingDistance))}>
                        {getPerformanceStatus("landingDistance", results.landingDistance)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">VAPP:</span>
                    <span className="font-mono">{Math.floor(results.v2 * 1.3)} kts</span>
                  </div>
                </div>
              )}

              {activeTab === "cruise" && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Optimum Altitude:</span>
                    <span className="font-mono">FL{Math.floor(results.optimumAltitude / 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fuel Flow:</span>
                    <span className="font-mono">{results.fuelFlow} kg/h</span>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-muted rounded border border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Simplified calculations for demonstration. Use certified performance tools for operations.</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </Tabs>
    </Card>
  );
};