import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cloud, CloudRain, Sun, Wind, AlertCircle, Thermometer } from "lucide-react";

interface WeatherData {
  station: string;
  type: "METAR" | "TAF";
  raw: string;
  decoded: {
    visibility: string;
    wind: {
      direction: number;
      speed: number;
      gusts?: number;
    };
    temperature: number;
    dewpoint: number;
    pressure: number;
    clouds: Array<{
      coverage: string;
      height: number;
      type?: string;
    }>;
    weather?: string[];
  };
  conditions: "VFR" | "MVFR" | "IFR" | "LIFR";
  warnings: string[];
}

const mockWeatherData: WeatherData[] = [
  {
    station: "OMAA",
    type: "METAR",
    raw: "OMAA 071200Z 33015KT 9999 FEW030 SCT080 28/18 Q1015 NOSIG",
    decoded: {
      visibility: "10+ km",
      wind: { direction: 330, speed: 15 },
      temperature: 28,
      dewpoint: 18,
      pressure: 1015,
      clouds: [
        { coverage: "FEW", height: 3000 },
        { coverage: "SCT", height: 8000 }
      ]
    },
    conditions: "VFR",
    warnings: []
  },
  {
    station: "OMDB",
    type: "METAR",
    raw: "OMDB 071200Z 35012G18KT 8000 -DZ BKN015 OVC030 24/22 Q1012 TEMPO 4000 DZ",
    decoded: {
      visibility: "8 km",
      wind: { direction: 350, speed: 12, gusts: 18 },
      temperature: 24,
      dewpoint: 22,
      pressure: 1012,
      clouds: [
        { coverage: "BKN", height: 1500 },
        { coverage: "OVC", height: 3000 }
      ],
      weather: ["Light Drizzle"]
    },
    conditions: "MVFR",
    warnings: ["WINDSHEAR POSSIBLE"]
  },
  {
    station: "OMAA",
    type: "TAF",
    raw: "OMAA 071200Z 0712/0818 33015KT 9999 FEW030 SCT080 TEMPO 0714/0718 35020G25KT 6000 TSRA BKN020CB",
    decoded: {
      visibility: "10+ km",
      wind: { direction: 330, speed: 15 },
      temperature: 28,
      dewpoint: 18,
      pressure: 1015,
      clouds: [
        { coverage: "FEW", height: 3000 },
        { coverage: "SCT", height: 8000 }
      ],
      weather: ["Thunderstorm with Rain"]
    },
    conditions: "VFR",
    warnings: ["THUNDERSTORMS FORECAST"]
  }
];

export const WeatherInfo = () => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>(mockWeatherData);
  const [selectedStation, setSelectedStation] = useState("OMAA");
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Simulate real-time weather updates
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getConditionsColor = (conditions: string) => {
    switch (conditions) {
      case "VFR": return "secondary";
      case "MVFR": return "default";
      case "IFR": return "destructive";
      case "LIFR": return "destructive";
      default: return "outline";
    }
  };

  const getWeatherIcon = (weather?: string[]) => {
    if (!weather || weather.length === 0) return <Sun className="h-4 w-4" />;
    
    const weatherStr = weather.join(" ").toLowerCase();
    if (weatherStr.includes("rain") || weatherStr.includes("drizzle")) {
      return <CloudRain className="h-4 w-4" />;
    }
    if (weatherStr.includes("cloud") || weatherStr.includes("overcast")) {
      return <Cloud className="h-4 w-4" />;
    }
    return <Sun className="h-4 w-4" />;
  };

  const formatWindDirection = (direction: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const index = Math.round(direction / 22.5) % 16;
    return directions[index];
  };

  const currentMetar = weatherData.find(w => w.station === selectedStation && w.type === "METAR");
  const currentTaf = weatherData.find(w => w.station === selectedStation && w.type === "TAF");

  return (
    <Card className="shadow-cockpit bg-display-gradient border-border h-[calc(100vh-240px)]">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          Weather Information
        </h2>
        <p className="text-sm text-muted-foreground">
          Current conditions and forecasts • Last update: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      <Tabs defaultValue="current" className="h-full">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="warnings">Warnings</TabsTrigger>
        </TabsList>

        <div className="p-4 overflow-y-auto h-[calc(100%-120px)]">
          <TabsContent value="current" className="space-y-4 mt-0">
            {/* Station Selector */}
            <div className="flex gap-2 mb-4">
              {["OMAA", "OMDB", "OMAL"].map((station) => (
                <Badge
                  key={station}
                  variant={selectedStation === station ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedStation(station)}
                >
                  {station}
                </Badge>
              ))}
            </div>

            {currentMetar && (
              <Card className="p-4 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">{currentMetar.station} METAR</h3>
                  <Badge variant={getConditionsColor(currentMetar.conditions)}>
                    {currentMetar.conditions}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          {formatWindDirection(currentMetar.decoded.wind.direction)} {currentMetar.decoded.wind.speed}kt
                          {currentMetar.decoded.wind.gusts && ` G${currentMetar.decoded.wind.gusts}kt`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {currentMetar.decoded.wind.direction}°
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          {currentMetar.decoded.temperature}°C / {currentMetar.decoded.dewpoint}°C
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Temp / Dewpoint
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {getWeatherIcon(currentMetar.decoded.weather)}
                      <div>
                        <div className="text-sm font-medium">{currentMetar.decoded.visibility}</div>
                        <div className="text-xs text-muted-foreground">Visibility</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{currentMetar.decoded.pressure} hPa</div>
                        <div className="text-xs text-muted-foreground">QNH</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cloud Layers */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Cloud Layers</h4>
                  <div className="space-y-1">
                    {currentMetar.decoded.clouds.map((cloud, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {cloud.coverage} {cloud.height}ft {cloud.type || ""}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weather Phenomena */}
                {currentMetar.decoded.weather && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Weather</h4>
                    <div className="flex flex-wrap gap-1">
                      {currentMetar.decoded.weather.map((wx, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {wx}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw METAR */}
                <div className="p-3 bg-muted rounded border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Raw METAR:</div>
                  <div className="text-xs font-mono">{currentMetar.raw}</div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4 mt-0">
            <div className="flex gap-2 mb-4">
              {["OMAA", "OMDB", "OMAL"].map((station) => (
                <Badge
                  key={station}
                  variant={selectedStation === station ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedStation(station)}
                >
                  {station}
                </Badge>
              ))}
            </div>

            {currentTaf && (
              <Card className="p-4 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">{currentTaf.station} TAF</h3>
                  <Badge variant="outline">30hr Forecast</Badge>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Base Forecast:</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Wind: {formatWindDirection(currentTaf.decoded.wind.direction)} {currentTaf.decoded.wind.speed}kt
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Visibility: {currentTaf.decoded.visibility}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Conditions:</span>
                      </div>
                      {currentTaf.decoded.weather && (
                        <div className="flex flex-wrap gap-1">
                          {currentTaf.decoded.weather.map((wx, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {wx}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded border border-border">
                    <div className="text-xs text-muted-foreground mb-1">Raw TAF:</div>
                    <div className="text-xs font-mono">{currentTaf.raw}</div>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="warnings" className="space-y-4 mt-0">
            <div className="space-y-3">
              {weatherData
                .filter(w => w.warnings.length > 0)
                .map((station, index) => (
                  <Card key={index} className="p-4 border border-destructive">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="font-semibold text-foreground">{station.station}</span>
                    </div>
                    <div className="space-y-1">
                      {station.warnings.map((warning, wIndex) => (
                        <div key={wIndex} className="text-sm text-muted-foreground">
                          • {warning}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}

              {weatherData.every(w => w.warnings.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Cloud className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg mb-2">No Active Weather Warnings</p>
                  <p className="text-sm">All monitored stations report normal conditions</p>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};