import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ImagePreviewModal from "./ImagePreviewModal";

interface PromptCardProps {
  prompt: string;
  index: number;
}

const PromptCard = ({ prompt, index }: PromptCardProps) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [apiSource, setApiSource] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy prompt");
    }
  };

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt }
      });

      if (error) throw error;

      if (data?.image) {
        setGeneratedImage(data.image);
        setApiSource(data.source);
        setShowModal(true);
        
        const sourceText = data.source === 'user_gemini_api' 
          ? "သင့်ရဲ့ Gemini API Key" 
          : "Lovable AI";
        toast.success(`ပုံထုတ်ပြီးပါပြီ! (${sourceText} သုံးထားပါတယ်)`);
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image", {
        description: "Please try again"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-all hover:scale-105 duration-300">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
              {index + 1}
            </span>
            Prompt {index + 1}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed">
            {prompt}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {apiSource && (
            <Badge 
              variant={apiSource === 'user_gemini_api' ? 'default' : 'secondary'}
              className="self-start"
            >
              {apiSource === 'user_gemini_api' ? '🔑 သင့်ရဲ့ Gemini API' : '⚡ Lovable AI'}
            </Badge>
          )}
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex-1"
            >
            {copied ? (
              <>
                <Check className="mr-2 h-3 w-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-3 w-3" />
                Copy
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleGenerateImage}
            disabled={isGenerating}
            className="flex-1 bg-accent hover:bg-accent-hover"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-3 w-3" />
                Generate
              </>
            )}
          </Button>
          </div>
        </CardFooter>
      </Card>

      {generatedImage && (
        <ImagePreviewModal
          imageUrl={generatedImage}
          prompt={prompt}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default PromptCard;
