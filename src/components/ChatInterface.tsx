import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SourceDisplay } from "@/components/SourceDisplay";
import { Search } from "lucide-react";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  phase?: string;
  sources?: Array<{
    title: string;
    section: string;
    page: number;
    excerpt: string;
  }>;
}

interface ChatInterfaceProps {
  selectedPhase: string;
}

const sampleResponses = {
  climb: {
    content: "For climb phase in A321, maintain climb thrust (CLB) until reaching cruise altitude. Target climb rate: 1500-2000 ft/min initially, reducing to 500-1000 ft/min above FL200. Monitor engine parameters and adjust as needed for optimal performance.",
    sources: [
      {
        title: "A321 FCOM",
        section: "Normal Procedures - Climb",
        page: 142,
        excerpt: "Climb thrust setting: CLB detent on thrust levers. Maintain target climb rate as displayed on FMA. Monitor engine parameters within normal operating limits."
      }
    ]
  },
  cruise: {
    content: "In cruise phase, maintain optimum altitude and speed for fuel efficiency. Typical cruise altitude: FL350-FL390. Monitor fuel consumption and adjust flight level as needed for winds and traffic.",
    sources: [
      {
        title: "A321 FCOM",
        section: "Normal Procedures - Cruise",
        page: 156,
        excerpt: "Cruise altitude optimization: Consider winds, traffic, and fuel consumption. Maintain cruise thrust setting and monitor all engine parameters."
      }
    ]
  }
};

export const ChatInterface = ({ selectedPhase }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      phase: selectedPhase,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate API response
    setTimeout(() => {
      const response = sampleResponses[selectedPhase as keyof typeof sampleResponses] || {
        content: "I understand you're asking about procedures for the current flight phase. This is a simulated response. In the full system, I would search through the relevant manuals and provide precise, sourced guidance.",
        sources: [
          {
            title: "A321 QRH",
            section: "General Procedures",
            page: 1,
            excerpt: "Refer to appropriate manual sections for detailed procedures specific to your flight phase and operational conditions."
          }
        ]
      };

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.content,
        phase: selectedPhase,
        sources: response.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="shadow-display bg-display-gradient border-border h-[calc(100vh-240px)] flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Ask Your Question</h2>
          <Badge variant="outline" className="border-primary text-primary">
            {selectedPhase.charAt(0).toUpperCase() + selectedPhase.slice(1)} Mode
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Get precise, phase-aware procedural guidance from A321 manuals
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Ask any question about A321 procedures</p>
              <p className="text-sm mt-1">I'll provide answers specific to your current flight phase</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-6 max-w-md mx-auto">
              <div className="text-xs p-2 bg-muted rounded text-left">
                "What's my thrust setting for climb?"
              </div>
              <div className="text-xs p-2 bg-muted rounded text-left">
                "Emergency descent procedure?"
              </div>
              <div className="text-xs p-2 bg-muted rounded text-left">
                "Approach speed for current weight?"
              </div>
              <div className="text-xs p-2 bg-muted rounded text-left">
                "Pre-flight checklist items?"
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              message.type === "user" 
                ? "bg-primary text-primary-foreground" 
                : "bg-card border border-border"
            }`}>
              <div className="text-sm">{message.content}</div>
              {message.type === "assistant" && message.sources && (
                <SourceDisplay sources={message.sources} />
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-card border border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: "0.2s"}}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: "0.4s"}}></div>
                </div>
                Searching manuals...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about procedures, limitations, or emergency actions..."
            className="flex-1 bg-input border-border"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};