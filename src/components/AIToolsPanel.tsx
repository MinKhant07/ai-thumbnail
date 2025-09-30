import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PromptCard from "./PromptCard";

interface AIToolsPanelProps {
  thumbnailUrl: string;
}

interface GeneratedPrompt {
  prompt: string;
  index: number;
}

const AIToolsPanel = ({ thumbnailUrl }: AIToolsPanelProps) => {
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePrompts = async () => {
    if (!thumbnailUrl) {
      toast.error("No thumbnail selected", {
        description: "Please select a thumbnail from the Downloader tab first"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-prompts', {
        body: { thumbnailUrl }
      });

      if (error) throw error;

      if (data?.prompts) {
        const formattedPrompts = data.prompts.map((prompt: string, index: number) => ({
          prompt,
          index
        }));
        setPrompts(formattedPrompts);
        toast.success("Prompts generated successfully!");
      }
    } catch (error) {
      console.error("Error generating prompts:", error);
      toast.error("Failed to generate prompts", {
        description: "Please try again"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>AI Prompt Generator</CardTitle>
          <CardDescription>
            Generate creative prompts based on the thumbnail image
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGeneratePrompts}
            disabled={isGenerating || !thumbnailUrl}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Prompts...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Prompts from Thumbnail
              </>
            )}
          </Button>

          {!thumbnailUrl && (
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Select a thumbnail from the Downloader tab first
            </p>
          )}
        </CardContent>
      </Card>

      {/* Generated Prompts */}
      {prompts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 animate-fade-in">
          {prompts.map((item) => (
            <PromptCard
              key={item.index}
              prompt={item.prompt}
              index={item.index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AIToolsPanel;
