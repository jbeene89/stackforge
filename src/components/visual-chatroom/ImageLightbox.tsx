import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ImageLightboxProps {
  image: string | null;
  onClose: () => void;
}

export default function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  return (
    <AnimatePresence>
      {image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.img
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            src={image}
            alt="Expanded view"
            className="max-w-full max-h-full object-contain rounded-xl"
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="backdrop-blur"
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement("a");
                link.href = image;
                link.download = `chatroom-${Date.now()}.png`;
                link.click();
              }}
            >
              <Download className="h-4 w-4 mr-1" /> Save
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
