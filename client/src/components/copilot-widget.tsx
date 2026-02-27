import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, MessageCircle } from "lucide-react";

const COPILOT_BOT_URL =
  "https://copilotstudio.microsoft.com/environments/Default-1d2442c2-bedd-4c24-957c-cb3e90333ab3/bots/cr8c8_reasonAgent/canvas?__version__=2&enableFileAttachment=true";

export function CopilotWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-[100]" data-testid="copilot-widget">
      {open && (
        <div
          className="mb-3 w-[380px] h-[520px] rounded-2xl overflow-hidden shadow-2xl border border-border bg-background flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300"
          data-testid="copilot-panel"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="font-semibold text-sm">Copilot Assistant</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-primary-foreground hover:bg-white/20"
              onClick={() => setOpen(false)}
              data-testid="button-close-copilot"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <iframe
            src={COPILOT_BOT_URL}
            className="flex-1 w-full border-0"
            title="Copilot Assistant"
            allow="microphone; camera"
            data-testid="iframe-copilot"
          />
        </div>
      )}

      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105"
        onClick={() => setOpen(!open)}
        data-testid="button-open-copilot"
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </Button>
    </div>
  );
}
