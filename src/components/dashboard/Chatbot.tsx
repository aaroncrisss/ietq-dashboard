import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WEBHOOK_URL = "https://myn8n.aaroncristech.cloud/webhook-test/dashboard-ietq";
const MAX_MESSAGE_LENGTH = 2000;
const REQUEST_TIMEOUT = 30000;

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sanitizeHTML = (text: string): string => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const extractMessageFromResponse = (data: any): string => {
    if (typeof data === "string") return data;
    
    if (data.output) return String(data.output);
    if (data.message) return String(data.message);
    if (data.data?.message) return String(data.data.message);
    if (data.result?.message) return String(data.result.message);
    if (data.choices?.[0]?.message?.content) return String(data.choices[0].message.content);
    if (Array.isArray(data) && data.length > 0) {
      if (data[0].message) return String(data[0].message);
      if (data[0].text) return String(data[0].text);
    }
    
    return "No recibí contenido para mostrar.";
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    if (input.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Mensaje muy largo. Máximo ${MAX_MESSAGE_LENGTH} caracteres.`);
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      role: "assistant",
      content: "escribiendo...",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, typingMessage]);

    let retries = 1;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        // POST request with JSON body
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage.content,
            timestamp: userMessage.timestamp.toISOString(),
            dashboard_context: "registro_iglesia",
            user_session: `${Date.now()}-${Math.random()}`,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          setMessages(prev => prev.slice(0, -1));
          toast.error("Límite de solicitudes alcanzado. Intenta más tarde.");
          setIsLoading(false);
          return;
        }

        if (response.status === 402) {
          setMessages(prev => prev.slice(0, -1));
          toast.error("Es necesario agregar fondos. Contacta al administrador.");
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        let data: any;

        if (contentType?.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        const assistantContent = extractMessageFromResponse(data);

        setMessages(prev => {
          const filtered = prev.filter(m => m.content !== "escribiendo...");
          return [
            ...filtered,
            {
              role: "assistant",
              content: sanitizeHTML(assistantContent),
              timestamp: new Date(),
            },
          ];
        });

        setIsLoading(false);
        return;

      } catch (error: any) {
        lastError = error;
        
        if (error.name === "AbortError") {
          console.error("Request timeout");
        } else {
          console.error("Chat error:", error);
        }

        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(1.5, attempt)));
        }
      }
    }

    setMessages(prev => prev.slice(0, -1));
    setMessages(prev => [
      ...prev,
      {
        role: "assistant",
        content: "No pude obtener respuesta del agente. Reintentá o probá más tarde.",
        timestamp: new Date(),
      },
    ]);
    setIsLoading(false);
    
    toast.error("Error al conectar con el chatbot");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 h-14 w-14 rounded-full bg-gradient-primary shadow-glow hover:shadow-xl transition-all animate-glow-pulse z-40"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 left-6 w-96 h-[600px] border-0 shadow-glass backdrop-blur-glass bg-gradient-glass flex flex-col animate-scale-in z-40">
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Asistente Iglesia</h3>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-gradient-primary text-primary-foreground"
                      : "bg-card-glass text-card-foreground border border-border"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-border bg-background/50">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
                className="min-h-[60px] max-h-[120px] resize-none bg-background/50 border-border"
                disabled={isLoading}
                aria-label="Campo de mensaje del chat"
                maxLength={MAX_MESSAGE_LENGTH}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-primary hover:shadow-glow transition-all"
                size="icon"
                aria-label="Enviar mensaje"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Shift+Enter para nueva línea
            </p>
          </div>
        </Card>
      )}
    </>
  );
}
