import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Source {
  title: string;
  section: string;
  page: number;
  excerpt: string;
}

interface SourceDisplayProps {
  sources: Source[];
}

export const SourceDisplay = ({ sources }: SourceDisplayProps) => {
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());

  const toggleSource = (index: number) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSources(newExpanded);
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        SOURCES ({sources.length})
      </div>
      
      {sources.map((source, index) => (
        <Card key={index} className="bg-muted/50 border border-border/50 p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                {source.title}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {source.section} • p.{source.page}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSource(index)}
              className="h-6 w-6 p-0"
            >
              {expandedSources.has(index) ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </Button>
          </div>
          
          {expandedSources.has(index) && (
            <div className="mt-2 pt-2 border-t border-border/30">
              <div className="text-xs text-foreground bg-card/50 p-2 rounded border">
                "{source.excerpt}"
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};