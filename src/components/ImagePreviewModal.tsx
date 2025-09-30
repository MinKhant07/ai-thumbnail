import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ImagePreviewModalProps {
  imageUrl: string;
  prompt: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImagePreviewModal = ({ imageUrl, prompt, isOpen, onClose }: ImagePreviewModalProps) => {
  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Image downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Generated Image</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {prompt}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border shadow-lg">
            <img
              src={imageUrl}
              alt="Generated"
              className="w-full h-auto"
            />
          </div>
          
          <Button
            onClick={handleDownload}
            className="w-full bg-primary hover:bg-primary-hover"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;
