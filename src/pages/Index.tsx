import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ThumbnailDownloader from "@/components/ThumbnailDownloader";
import AIToolsPanel from "@/components/AIToolsPanel";

const Index = () => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState("downloader");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            YouTube Thumbnail Power Tool
          </h1>
          <p className="text-muted-foreground text-lg">
            Download thumbnails, generate AI prompts, and create new images
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="downloader">Downloader</TabsTrigger>
            <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="downloader" className="animate-fade-in">
            <ThumbnailDownloader 
              onThumbnailChange={setThumbnailUrl}
              onSwitchToAI={() => setActiveTab("ai-tools")}
            />
          </TabsContent>

          <TabsContent value="ai-tools" className="animate-fade-in">
            <AIToolsPanel thumbnailUrl={thumbnailUrl} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
