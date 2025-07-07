import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Fuel, 
  Leaf, 
  Trophy, 
  TrendingUp, 
  Target,
  Zap,
  Route,
  Plane,
  CheckCircle,
  Star
} from "lucide-react";

interface FuelSavingMeasure {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  points: number;
  fuelSaved: number; // kg
  co2Reduced: number; // kg
  costSaving: number; // USD
  completed: boolean;
  streak: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  target: number;
  category: "fuel" | "safety" | "performance";
}

export const FuelEfficiencyDashboard = () => {
  const [measures, setMeasures] = useState<FuelSavingMeasure[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState(500); // kg fuel saving target
  const [weeklyProgress, setWeeklyProgress] = useState(0);

  useEffect(() => {
    // Initialize fuel-saving measures
    const initialMeasures: FuelSavingMeasure[] = [
      {
        id: "single-engine-taxi-out",
        name: "Single Engine Taxi-Out",
        description: "Use only one engine during taxi from gate to runway",
        icon: <Plane className="h-4 w-4" />,
        points: 50,
        fuelSaved: 25,
        co2Reduced: 78,
        costSaving: 35,
        completed: false,
        streak: 0
      },
      {
        id: "single-engine-taxi-in",
        name: "Single Engine Taxi-In",
        description: "Use only one engine during taxi from runway to gate",
        icon: <Plane className="h-4 w-4" />,
        points: 50,
        fuelSaved: 15,
        co2Reduced: 47,
        costSaving: 21,
        completed: false,
        streak: 0
      },
      {
        id: "flap3-landing",
        name: "Flap 3 Landing",
        description: "Land with flap configuration 3 instead of FULL",
        icon: <Target className="h-4 w-4" />,
        points: 75,
        fuelSaved: 40,
        co2Reduced: 125,
        costSaving: 56,
        completed: false,
        streak: 0
      },
      {
        id: "managed-climb",
        name: "Managed Climb",
        description: "Use FMGC managed climb mode for optimal performance",
        icon: <TrendingUp className="h-4 w-4" />,
        points: 60,
        fuelSaved: 35,
        co2Reduced: 109,
        costSaving: 49,
        completed: false,
        streak: 0
      },
      {
        id: "managed-descent",
        name: "Managed Descent",
        description: "Use FMGC managed descent mode for continuous descent",
        icon: <TrendingUp className="h-4 w-4" />,
        points: 60,
        fuelSaved: 30,
        co2Reduced: 94,
        costSaving: 42,
        completed: false,
        streak: 0
      },
      {
        id: "managed-cruise",
        name: "Managed Cruise",
        description: "Maintain optimal cruise speed and altitude",
        icon: <Zap className="h-4 w-4" />,
        points: 80,
        fuelSaved: 120,
        co2Reduced: 375,
        costSaving: 168,
        completed: false,
        streak: 0
      },
      {
        id: "direct-routing",
        name: "Direct Routing",
        description: "Accept ATC shortcuts and direct routing when offered",
        icon: <Route className="h-4 w-4" />,
        points: 100,
        fuelSaved: 85,
        co2Reduced: 266,
        costSaving: 119,
        completed: false,
        streak: 0
      }
    ];

    const initialAchievements: Achievement[] = [
      {
        id: "eco-warrior",
        name: "Eco Warrior",
        description: "Save 100kg fuel in a single flight",
        icon: <Leaf className="h-4 w-4" />,
        unlocked: false,
        progress: 0,
        target: 100,
        category: "fuel"
      },
      {
        id: "green-captain",
        name: "Green Captain",
        description: "Maintain 90%+ efficiency for 5 consecutive flights",
        icon: <Trophy className="h-4 w-4" />,
        unlocked: false,
        progress: 0,
        target: 5,
        category: "fuel"
      },
      {
        id: "efficiency-expert",
        name: "Efficiency Expert",
        description: "Complete all fuel-saving measures in one flight",
        icon: <Star className="h-4 w-4" />,
        unlocked: false,
        progress: 0,
        target: 7,
        category: "fuel"
      },
      {
        id: "streak-master",
        name: "Streak Master",
        description: "Maintain single-engine taxi streak for 10 flights",
        icon: <Zap className="h-4 w-4" />,
        unlocked: false,
        progress: 0,
        target: 10,
        category: "performance"
      }
    ];

    setMeasures(initialMeasures);
    setAchievements(initialAchievements);
  }, []);

  const toggleMeasure = (measureId: string) => {
    setMeasures(prev => 
      prev.map(measure => {
        if (measure.id === measureId) {
          const updated = { ...measure, completed: !measure.completed };
          if (updated.completed) {
            updated.streak += 1;
            setTotalPoints(points => points + measure.points);
            setWeeklyProgress(progress => progress + measure.fuelSaved);
          } else {
            setTotalPoints(points => points - measure.points);
            setWeeklyProgress(progress => progress - measure.fuelSaved);
          }
          return updated;
        }
        return measure;
      })
    );
  };

  const completedMeasures = measures.filter(m => m.completed);
  const totalFuelSaved = completedMeasures.reduce((sum, m) => sum + m.fuelSaved, 0);
  const totalCo2Reduced = completedMeasures.reduce((sum, m) => sum + m.co2Reduced, 0);
  const totalCostSaving = completedMeasures.reduce((sum, m) => sum + m.costSaving, 0);
  const efficiencyPercentage = (completedMeasures.length / measures.length) * 100;

  return (
    <Card className="shadow-cockpit bg-display-gradient border-border h-[calc(100vh-240px)]">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Fuel className="h-5 w-5 text-primary" />
          Fuel Efficiency Dashboard
        </h2>
        <p className="text-sm text-muted-foreground">
          Track eco-friendly flying practices and environmental impact
        </p>
      </div>

      <Tabs defaultValue="measures" className="h-full">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="measures">Eco Measures</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <div className="p-4 overflow-y-auto h-[calc(100%-120px)]">
          <TabsContent value="measures" className="space-y-4 mt-0">
            {/* Weekly Goal Progress */}
            <Card className="p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Weekly Fuel Saving Goal</h3>
                <Badge variant="outline">{weeklyProgress} / {weeklyGoal} kg</Badge>
              </div>
              <Progress value={(weeklyProgress / weeklyGoal) * 100} className="mb-2" />
              <div className="text-xs text-muted-foreground">
                {Math.max(0, weeklyGoal - weeklyProgress)} kg remaining to reach goal
              </div>
            </Card>

            {/* Current Flight Summary */}
            <Card className="p-4 border border-border bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
              <h3 className="font-semibold text-foreground mb-3">Current Flight Impact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Fuel Saved: {totalFuelSaved} kg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-500" />
                    <span className="text-sm">CO₂ Reduced: {totalCo2Reduced} kg</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Points: {totalPoints}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">💰 Cost Saved: ${totalCostSaving}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Fuel-Saving Measures */}
            <div className="space-y-3">
              {measures.map((measure) => (
                <Card key={measure.id} className="p-4 border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          onClick={() => toggleMeasure(measure.id)}
                          className="flex-shrink-0"
                        >
                          {measure.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="h-5 w-5 border-2 border-muted-foreground rounded-full" />
                          )}
                        </button>
                        <div className="flex items-center gap-2">
                          {measure.icon}
                          <h4 className="font-medium text-foreground">{measure.name}</h4>
                        </div>
                        {measure.streak > 0 && (
                          <Badge variant="outline" className="text-xs">
                            🔥 {measure.streak}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 ml-8">
                        {measure.description}
                      </p>
                      <div className="grid grid-cols-2 gap-2 ml-8 text-xs">
                        <div className="text-muted-foreground">
                          ⚡ {measure.points} points • 🛢️ {measure.fuelSaved}kg saved
                        </div>
                        <div className="text-muted-foreground">
                          🌱 {measure.co2Reduced}kg CO₂ • 💰 ${measure.costSaving}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Efficiency Score */}
            <Card className="p-4 border border-border">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {efficiencyPercentage.toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Flight Efficiency Score</div>
                <Progress value={efficiencyPercentage} className="mt-3" />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4 mt-0">
            <div className="grid gap-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className={`p-4 border ${
                  achievement.unlocked ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-border"
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      achievement.unlocked ? "bg-green-500 text-white" : "bg-muted"
                    }`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{achievement.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{achievement.progress} / {achievement.target}</span>
                        </div>
                        <Progress 
                          value={(achievement.progress / achievement.target) * 100}
                          className="h-2"
                        />
                      </div>
                      
                      <Badge 
                        variant={achievement.category === "fuel" ? "secondary" : 
                                achievement.category === "safety" ? "destructive" : "default"}
                        className="mt-2 text-xs"
                      >
                        {achievement.category.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 mt-0">
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 border border-border">
                <h3 className="font-semibold text-foreground mb-2">Today's Impact</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fuel Saved:</span>
                    <span className="font-mono text-sm">{totalFuelSaved} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">CO₂ Reduced:</span>
                    <span className="font-mono text-sm">{totalCo2Reduced} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cost Saved:</span>
                    <span className="font-mono text-sm">${totalCostSaving}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border border-border">
                <h3 className="font-semibold text-foreground mb-2">Weekly Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Points:</span>
                    <span className="font-mono text-sm">{totalPoints * 7}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Efficiency:</span>
                    <span className="font-mono text-sm">{efficiencyPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Streak Days:</span>
                    <span className="font-mono text-sm">5 days</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Environmental Impact */}
            <Card className="p-4 border border-border bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-500" />
                Environmental Impact This Month
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{(totalFuelSaved * 30).toLocaleString()} kg</div>
                  <div className="text-sm text-muted-foreground">Fuel Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{(totalCo2Reduced * 30).toLocaleString()} kg</div>
                  <div className="text-sm text-muted-foreground">CO₂ Emissions Prevented</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">${(totalCostSaving * 30).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Cost Savings</div>
                </div>
              </div>
            </Card>

            {/* Challenge */}
            <Card className="p-4 border border-border">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Weekly Challenge
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Complete all 7 eco-measures in 3 consecutive flights to unlock the "Perfect Trilogy" achievement!
                </p>
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>0 / 3 flights</span>
                </div>
                <Progress value={0} className="h-2" />
                <Badge variant="outline" className="text-xs">🏆 Reward: 500 bonus points</Badge>
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};