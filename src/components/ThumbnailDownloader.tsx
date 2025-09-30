import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ThumbnailDownloaderProps {
  onThumbnailChange: (url: string) => void;
  onSwitchToAI: () => void;
}

type ThumbnailQuality = "maxresdefault" | "sddefault" | "hqdefault";

const ThumbnailDownloader = ({ onThumbnailChange, onSwitchToAI }: ThumbnailDownloaderProps) => {
  const [videoUrl, setVideoUrl] = useState("");
  const [quality, setQuality] = useState<ThumbnailQuality>("maxresdefault");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [videoId, setVideoId] = useState("");

  const extractVideoId = (url: string): string | null => {
    // Support various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleUrlChange = (url: string) => {
    setVideoUrl(url);
    const id = extractVideoId(url);
    
    if (id) {
      setVideoId(id);
      const thumbnailUrl = `https://img.youtube.com/vi/${id}/${quality}.jpg`;
      setThumbnailUrl(thumbnailUrl);
      onThumbnailChange(thumbnailUrl);
    } else if (url.trim()) {
      toast.error("Invalid YouTube URL", {
        description: "Please enter a valid YouTube video URL"
      });
    }
  };

  const handleQualityChange = (newQuality: ThumbnailQuality) => {
    setQuality(newQuality);
    if (videoId) {
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${newQuality}.jpg`;
      setThumbnailUrl(thumbnailUrl);
      onThumbnailChange(thumbnailUrl);
    }
  };

  const handleDownload = async () => {
    if (!thumbnailUrl) {
      toast.error("No thumbnail to download");
      return;
    }

    try {
      const response = await fetch(thumbnailUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thumbnail-${videoId}-${quality}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Thumbnail downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download thumbnail", {
        description: "Please try again"
      });
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <CardTitle>Download YouTube Thumbnail</CardTitle>
        <CardDescription>
          Enter a YouTube video URL to preview and download its thumbnail
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">YouTube Video URL</label>
          <Input
            placeholder="https://youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Quality Selector */}
        {thumbnailUrl && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-sm font-medium">Thumbnail Quality</label>
            <Select value={quality} onValueChange={handleQualityChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maxresdefault">Max Resolution (1920x1080)</SelectItem>
                <SelectItem value="sddefault">Standard Quality (640x480)</SelectItem>
                <SelectItem value="hqdefault">High Quality (480x360)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Thumbnail Preview */}
        {thumbnailUrl && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-md border">
              <img
                src={thumbnailUrl}
                alt="YouTube Thumbnail Preview"
                className="w-full h-full object-cover"
                onError={() => {
                  toast.error("Failed to load thumbnail", {
                    description: "This quality may not be available for this video"
                  });
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleDownload}
                className="flex-1 bg-primary hover:bg-primary-hover"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={onSwitchToAI}
                variant="outline"
                className="flex-1 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Generate AI Prompts
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ThumbnailDownloader;
