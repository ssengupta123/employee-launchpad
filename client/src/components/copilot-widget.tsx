import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, MessageCircle, Loader2 } from "lucide-react";

const BOT_ID = "cr8c8_reasonAgent";
const ENVIRONMENT_ID = "Default-1d2442c2-bedd-4c24-957c-cb3e90333ab3";
const TOKEN_ENDPOINT = `https://default1d2442c2bedd4c24957ccb3e90333a.b3.environment.api.powerplatform.com/powervirtualagents/botsbyschema/${BOT_ID}/directline/token?api-version=2022-03-01-preview`;

export function CopilotWidget() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInitialized = useRef(false);

  useEffect(() => {
    if (!open || chatInitialized.current) return;

    const loadChat = async () => {
      setLoading(true);
      try {
        const tokenRes = await fetch(TOKEN_ENDPOINT);
        const tokenData = await tokenRes.json();
        const token = tokenData.token;

        const scriptId = "botframework-webchat-script";
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement("script");
          script.id = scriptId;
          script.src = "https://cdn.botframework.com/botframework-webchat/latest/webchat.js";
          document.head.appendChild(script);
        }

        await new Promise<void>((resolve) => {
          if ((window as any).WebChat) { resolve(); return; }
          script!.onload = () => resolve();
        });

        const store = (window as any).WebChat.createStore({}, ({ dispatch }: any) => (next: any) => (action: any) => {
          if (action.type === "DIRECT_LINE/CONNECT_FULFILLED") {
            dispatch({ type: "WEB_CHAT/SEND_EVENT", payload: { name: "startConversation", type: "event" } });
          }
          return next(action);
        });

        const styleOptions = {
          hideUploadButton: false,
          botAvatarBackgroundColor: "#2AABB3",
          botAvatarInitials: "RG",
          userAvatarBackgroundColor: "#1a1a1a",
          userAvatarInitials: "You",
          bubbleBackground: "#f0f0f0",
          bubbleBorderRadius: 12,
          bubbleFromUserBackground: "#2AABB3",
          bubbleFromUserTextColor: "#ffffff",
          bubbleFromUserBorderRadius: 12,
          rootHeight: "100%",
          rootWidth: "100%",
        };

        if (chatContainerRef.current) {
          (window as any).WebChat.renderWebChat(
            {
              directLine: (window as any).WebChat.createDirectLine({ token }),
              store,
              styleOptions,
            },
            chatContainerRef.current
          );
          chatInitialized.current = true;
        }
      } catch (err) {
        console.error("Failed to load Copilot chat:", err);
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [open]);

  useEffect(() => {
    if (!open) {
      chatInitialized.current = false;
      if (chatContainerRef.current) {
        chatContainerRef.current.innerHTML = "";
      }
    }
  }, [open]);

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
              <span className="font-semibold text-sm">Reason Agent</span>
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
          <div ref={chatContainerRef} className="flex-1 w-full overflow-hidden" data-testid="chat-container">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
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
