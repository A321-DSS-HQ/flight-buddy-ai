import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, FileText } from "lucide-react";
import { SourceDisplay } from "./SourceDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { chatInputSchema, sanitizeInput, createRateLimiter } from "@/lib/validation";

interface Source {
  title: string;
  section: string;
  page: number;
  excerpt: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
}

interface DocumentChunk {
  id: string;
  content: string;
  page_number: number;
  section_title: string;
  document_title: string;
  document_type: string;
  file_name: string;
  similarity: number;
}

interface ChatInterfaceProps {
  selectedPhase: string;
}

// Rate limiter: 20 messages per 5 minutes per user
const chatRateLimiter = createRateLimiter(20, 5 * 60 * 1000);

export const ChatInterface = ({ selectedPhase }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchingDocs, setSearchingDocs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const searchDocuments = async (query: string): Promise<DocumentChunk[]> => {
    if (!user) return [];

    try {
      setSearchingDocs(true);
      
      const { data, error } = await supabase.functions.invoke('search-documents', {
        body: {
          query,
          limit: 5,
          documentTypes: ['FCOM', 'QRH', 'FCTM', 'MEL', 'AFM'], // Aviation manuals
        },
      });

      if (error) {
        console.error('Document search error:', error);
        return [];
      }

      return data?.results || [];
    } catch (error) {
      console.error('Failed to search documents:', error);
      return [];
    } finally {
      setSearchingDocs(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    // Rate limiting check
    if (!chatRateLimiter(user.id)) {
      toast({
        title: "Rate Limit Exceeded",
        description: "You're sending messages too quickly. Please wait a moment.",
        variant: "destructive",
      });
      return;
    }

    // Validate and sanitize input
    const sanitizedInput = sanitizeInput(inputValue.trim());
    const validation = chatInputSchema.safeParse(sanitizedInput);
    
    if (!validation.success) {
      toast({
        title: "Invalid Input",
        description: "Please check your message and try again.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: sanitizedInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const query = sanitizedInput;
    setInputValue("");
    setIsLoading(true);

    try {
      // Search uploaded documents first
      const documentChunks = await searchDocuments(query);
      
      let responseContent = `For the ${selectedPhase} phase, here's the guidance:\n\n`;
      let sources: Source[] = [];

      if (documentChunks.length > 0) {
        // Use real document content
        responseContent += "Based on your uploaded manuals:\n\n";
        
        documentChunks.forEach((chunk, index) => {
          responseContent += `${index + 1}. ${chunk.content.substring(0, 200)}...\n\n`;
          
          sources.push({
            title: chunk.document_title,
            section: chunk.section_title || `${chunk.document_type} Manual`,
            page: chunk.page_number,
            excerpt: chunk.content.substring(0, 150) + "...",
          });
        });
      } else {
        // Fallback to mock response
        responseContent += getMockResponse(selectedPhase, query);
        sources = getMockSources(selectedPhase);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMockResponse = (phase: string, query: string) => {
    const responses: Record<string, string> = {
      preflight: "Complete all preflight inspection items as per checklist. Verify aircraft configuration, fuel quantity, and weather conditions.",
      taxi: "Taxi at safe speed, monitor ground traffic, and follow ATC instructions. Complete taxi checklist items.",
      takeoff: "Set takeoff thrust, monitor engine parameters, and maintain runway centerline until V1/VR/V2 speeds.",
      climb: "Maintain climb thrust (CLB), target climb rate 1500-2000 ft/min initially, monitor engine parameters.",
      cruise: "Maintain optimum altitude and speed for fuel efficiency. Monitor fuel consumption and adjust as needed.",
      descent: "Begin descent at calculated top of descent point. Use appropriate descent profile and speed restrictions.",
      approach: "Configure aircraft for approach, maintain proper speed and glide path, complete approach checklist.",
      landing: "Maintain approach speed until threshold, execute proper landing technique, complete landing checklist."
    };
    return responses[phase] || "Please refer to the appropriate manual section for detailed procedures.";
  };

  const getMockSources = (phase: string): Source[] => {
    return [
      {
        title: "A321 FCOM",
        section: `${phase.charAt(0).toUpperCase() + phase.slice(1)} Procedures`,
        page: Math.floor(Math.random() * 200) + 100,
        excerpt: "Standard operating procedures for normal operations. Follow checklist items in sequence and monitor all systems."
      }
    ];
  };

  return (
    <Card className="shadow-cockpit bg-display-gradient border-border h-[calc(100vh-240px)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Flight Assistant</h2>
        <p className="text-sm text-muted-foreground">
          Ask questions about A321 procedures • Phase: {selectedPhase.charAt(0).toUpperCase() + selectedPhase.slice(1)}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg mb-2">Ready to assist with A321 procedures</p>
            <p className="text-sm">Ask me anything about flight operations, emergency procedures, or system operations</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] space-y-2 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
              <div className="flex items-center gap-2">
                {message.type === 'user' ? (
                  <>
                    <span className="text-xs text-muted-foreground">You</span>
                    <User className="w-4 h-4 text-muted-foreground" />
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">A321 Assistant</span>
                  </>
                )}
              </div>
              
              <div className={`rounded-lg p-3 ${
                message.type === 'user' 
                  ? 'bg-primary text-primary-foreground ml-8' 
                  : 'bg-card border border-border mr-8'
              }`}>
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                
                {message.type === 'assistant' && message.sources && (
                  <SourceDisplay sources={message.sources} />
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] space-y-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">A321 Assistant</span>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-3 mr-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: "0.2s"}}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: "0.4s"}}></div>
                  </div>
                  {searchingDocs ? 'Searching documents...' : 'Analyzing request...'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about procedures, limitations, emergency actions..."
            className="min-h-[50px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim() || searchingDocs}
            size="sm"
            className="self-end"
          >
            {searchingDocs ? (
              <FileText className="h-4 w-4 animate-pulse" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};