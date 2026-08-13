import { MessageSquare, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatwootSetupGuide } from "@/components/dashboard/ChatwootSetupGuide";

function heading(status: string | null) {
  if (status === "connected")
    return {
      badge: (
        <Badge className="mb-2 w-fit bg-brand/15 text-brand hover:bg-brand/15">
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Conectado
        </Badge>
      ),
      title: "Tu WhatsApp está conectado",
      description:
        "Entra a tu plataforma de conversaciones para ver y responder los chats de tu asistente.",
    };
  if (status === "error")
    return {
      badge: (
        <Badge variant="destructive" className="mb-2 w-fit">
          <AlertCircle className="mr-1.5 h-3.5 w-3.5" /> Revisión necesaria
        </Badge>
      ),
      title: "Tu conexión necesita atención",
      description: "Entra a tu plataforma y revisa el inbox de WhatsApp para reintentar.",
    };
  return {
    badge: (
      <Badge className="mb-2 w-fit bg-brand/15 text-brand hover:bg-brand/15">
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> En proceso
      </Badge>
    ),
    title: "Estamos activando tu conexión",
    description: "Mientras tanto ya puedes entrar a tu plataforma de conversaciones.",
  };
}

export function ChatwootAccessCard({
  email,
  status,
}: {
  email: string;
  status: string | null;
}) {
  const h = heading(status);

  return (
    <Card className="border-brand/30">
      <CardHeader>
        {h.badge}
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-brand" />
          {h.title}
        </CardTitle>
        <CardDescription>{h.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChatwootSetupGuide email={email} status={status} />
      </CardContent>
    </Card>
  );
}
