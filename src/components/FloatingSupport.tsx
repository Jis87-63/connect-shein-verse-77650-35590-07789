import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SupportDialog } from "./SupportDialog";

export const FloatingSupport = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg animate-glow bg-primary hover:bg-primary/90 z-40"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
      <SupportDialog open={open} onOpenChange={setOpen} />
    </>
  );
};
