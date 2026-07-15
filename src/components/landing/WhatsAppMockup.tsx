const messages = [
  { id: 1, type: "in", text: "Hola, ¿tienen esta casa en venta?", delay: 0 },
  { id: 2, type: "out", text: "¡Hola! Sí, la tenemos disponible. ¿Te gustaría agendar una visita?", delay: 0.2 },
  { id: 3, type: "in", text: "¿Podría ser mañana a las 5pm?", delay: 0.4 },
  { id: 4, type: "out", text: "Perfecto, te confirmo la cita para mañana a las 5pm. Te esperamos.", delay: 0.6 },
];

export function WhatsAppMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-[2.5rem] border-8 border-foreground/10 bg-card shadow-2xl">
      <div className="bg-brand px-5 pb-4 pt-10">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-brand-foreground">
            <span className="text-sm font-semibold">L</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-foreground">Larkey Inmobiliaria</p>
            <p className="text-xs text-brand-foreground/80">En línea</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 bg-muted/30 p-4 pb-8">
        <div className="flex justify-center">
          <span className="rounded-full bg-background/80 px-3 py-1 text-[10px] text-muted-foreground">
            Hoy
          </span>
        </div>

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.8 + msg.delay, ease: "easeOut" }}
            className={`flex ${msg.type === "out" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                msg.type === "out" ? "whatsapp-bubble-out" : "whatsapp-bubble-in"
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.5 }}
          className="flex justify-start"
        >
          <div className="whatsapp-bubble-in max-w-[80%] px-4 py-2.5 text-sm leading-relaxed shadow-sm">
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.3s]" />
            </span>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-card px-4 py-3">
        <div className="h-9 flex-1 rounded-full bg-muted" />
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-brand-foreground">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
      </div>
    </div>
  );
}
