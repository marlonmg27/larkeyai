import { facebookAppId } from "@/lib/whatsapp/embedded-signup";

export const es = {
  htmlLang: "es",
  currencyLocale: "es-MX",

  common: {
    menu: "Menú",
    navigation: "Navegación",
    language: "Idioma",
    spanish: "Español",
    english: "English",
    switchToOther: "English",
  },

  nav: {
    home: "Inicio",
    dashboard: "Dashboard",
    instructions: "Instrucciones",
    guide: "Guía",
    pricing: "Precios",
    contact: "Contacto",
    faq: "FAQ",
    login: "Iniciar sesión",
    logout: "Cerrar sesión",
    start: "Empezar",
    loggedOut: "Sesión cerrada",
    howItWorks: "Cómo funciona",
  },

  hero: {
    badge: "Atención al cliente potenciada con IA",
    h1: "Ahora puedes conectar WhatsApp como canal de mensajería",
    subtitle:
      "Larkey te da un asistente inteligente para manejar a tus clientes, las herramientas necesarias para realizar cualquier función adicional que desees y una plataforma para conectar múltiples canales de mensajería",
    primaryCta: "Quiero mi asistente",
    secondaryCta: "Iniciar sesión",
    note: "Para empresas y profesionales independientes.",
  },

  mockup: {
    online: "En línea",
    today: "Hoy",
    messages: [
      "Hola, ¿siguen disponibles para esta semana?",
      "¡Hola! Sí, tenemos espacio. ¿Qué día te viene mejor?",
      "¿Podría ser mañana a las 5pm?",
      "Perfecto, te dejo agendado mañana a las 5pm. ¿Te confirmo por aquí?",
    ],
  },

  how: {
    title: "Cómo trabajamos contigo",
    subtitle: "Ponte en contacto y adaptamos de manera precisa un asistente a tus necesidades.",
    steps: [
      {
        title: "Ya tengo todo listo",
        description:
          "Si ya tienes tus instrucciones e ideas definidas para empezar de forma inmediata, solo necesitas una cuenta de WhatsApp Business. Sigue la guía para conectar tu cuenta e indícale tus reglas a tu asistente",
      },
      {
        title: "Afinamos tu asistente",
        description:
          "Si quieres que tu agente haga mas cosas que simplemente conversar, ponte en contacto conmigo y haré un asistente especializado en tu negocio y capaz de realizar cualquier tarea.",
      },
      {
        title: "Empieza a responder por ti",
        description: "Tu asistente atiende, responde prospectos, resuelve dudas y agenda citas 24/7.",
      },
    ],
  },

  pricing: {
    sectionTitle: "Planes y precios",
    sectionSubtitle:
      "Escala tu atención sin contratar más gente. Pagas por mensajes reales, no por promesas. Sin permanencia y 14 días de prueba gratis.",
    h1: "Precios y planes",
    intro:
      "Escala tu atención sin contratar más gente. Pagas por mensajes reales, sin permanencia y con 14 días de prueba gratis.",
    chooseCta: "Elegir plan",
    trialCta: "Empezar prueba gratis",
    monthly: "Mensual",
    yearly: "Anual",
    recommended: "Recomendado",
    perMonth: "mes",
    perYear: "año",
    monthlyEquivalent: "facturado anual",
    messagesPerMonth: "mensajes / mes",
    redirecting: "Redirigiendo…",
    loadError: "No pudimos cargar los planes",
    loadErrorHint: "Intenta recargar la página.",
    noPlans: "No hay planes disponibles en este momento. Escríbenos si necesitas ayuda.",
    packsTitle: "Paquetes de mensajes adicionales",
    packsSubtitle: "Si te quedas corto de mensajes en el mes, compra un paquete extra sin cambiar de plan.",
    packsLoggedOut:
      "Los paquetes de mensajes se compran desde tu panel. Crea tu cuenta o inicia sesión para ver los paquetes disponibles y sus precios.",
    tiers: {
      basic: {
        tagline: "Ideal para empezar a automatizar tu WhatsApp.",
        perks: ["Asistente afinado a tus instrucciones", "Canal de mensajería: WhatsApp"],
      },
      standard: {
        tagline: "El equilibrio entre volumen y control.",
        perks: [
          "Todo lo del plan Basic",
          "Ajustes de tono y flujos personalizados",
          "WhatsApp + Instagram + Messenger",
          "Soporte prioritario",
        ],
      },
      pro: {
        tagline: "Para negocios que reciben mensajes cada día.",
        perks: [
          "Todo lo del plan Standard",
          "WhatsApp, Instagram, Telegram, Messenger",
          "Integraciones a tu stack",
          "Onboarding acompañado",
        ],
      },
    },
    enterprise: {
      tagline: "Para equipos con alto volumen y necesidades a medida.",
      price: "Personalizado",
      priceNote: "Cotización según tu operación",
      messages: "Mensajes a medida",
      perks: [
        "Mensajes a medida según tu volumen",
        "Asistentes diseñados para tu operación",
        "WhatsApp, Instagram, Telegram, Messenger y WebApps",
        "Integraciones dedicadas a tu stack",
        "Onboarding y cuenta asignada",
      ],
      cta: "Contactar ventas",
    },
  },

  faq: {
    h1: "Preguntas frecuentes",
    subtitle: "Todo lo que necesitas saber antes de empezar con Larkey.",
    items: [
      {
        question: "¿Qué es Larkey?",
        answer:
          "Larkey es una plataforma de asistentes conversacionales. Diseñamos y ponemos en marcha un asistente afinado al contexto de tu negocio para que responda tus mensajes — con WhatsApp como canal principal — sin que el dueño del negocio tenga que estar pendiente del celular.",
      },
      {
        question: "¿Tengo que saber de tecnología para usar Larkey?",
        answer:
          "No. Larkey está pensado para cualquier persona, con conocimientos técnicos avanzados o cero. Nosotros nos encargamos de la parte técnica y del entrenamiento; tú solo nos cuentas cómo funciona tu negocio.",
      },
      {
        question: "¿En qué canales responde el asistente?",
        answer:
          "WhatsApp es nuestro producto estrella, porque es donde la mayoría de nuestros clientes recibe mensajes. También podemos extenderlo a Instagram, Telegram, Messenger y WebApps según lo que necesites.",
      },
      {
        question: "¿Puedo ver las conversaciones del asistente con mis clientes?",
        answer:
          "Sí. Desde tu bandeja unificada puedes leer en tiempo real cada interacción entre tu asistente y tus clientes. Si lo necesitas, tomas el control de la conversación con un solo clic.",
      },
      {
        question: "¿El asistente está entrenado exclusivamente para mi negocio?",
        answer:
          "Ese es el objetivo. Ajustamos el asistente a tu contexto, tono y flujos para que responda como parte de tu equipo. El nivel de personalización se acuerda contigo según tu caso.",
      },
      {
        question: "¿Cómo se cuenta el consumo de mensajes?",
        answer:
          "Cada mensaje enviado por tu asistente cuenta contra el límite de tu plan. Desde tu panel puedes ver el consumo en tiempo real y comprar mensajes adicionales cuando lo necesites.",
      },
    ],
  },

  contact: {
    h1: "Contacto",
    intro:
      "Cuéntanos cómo funciona tu negocio y te ayudamos a poner en marcha tu asistente. Respondemos por correo lo antes posible.",
    cardTitle: "Escríbenos por email",
    cardDescription: "La vía más rápida para empezar o cotizar un plan a medida.",
    quoteCta: "Solicitar cotización",
    noWabaBefore: "¿Aún no tienes una WhatsApp Business Account o una app de Meta? Escríbenos a",
    noWabaAfter: "y te acompañamos en el proceso.",
  },

  guide: {
    h1: "Guía para conectar tu WhatsApp",
    intro:
      "Antes de conectar tu canal necesitas generar un token de acceso en Meta y otorgarle permisos a Larkey. Sigue estos pasos una sola vez.",
    cardTitle: "Generar tu token en Meta",
    cardDescription: "Necesitas acceso de administrador a tu Meta Business Suite y una WhatsApp Business Account.",
    dashboardCta: "Ir al Dashboard",
    intro2:
      "Antes de conectar tu WhatsApp necesitas generar un token de acceso en Meta y darle permisos a Larkey. Sigue estos pasos una sola vez.",
    continueCta: "Ya tengo mi token, continuar",
    copy: "Copiar",
    steps: [
      { text: "Entra a tu Meta Business Suite y ve a Configuración → Apps → botón Agregar." },
      {
        text: "Presiona Solicitar acceso e ingresa el ID de la app de Larkey.",
        copies: [{ label: "ID de la app Larkey", value: facebookAppId }],
      },
      { text: "Crea un usuario del sistema de tipo admin." },
      {
        text: "Presiona Conectar activos: selecciona la app Larkey y la cuenta WABA que quieres usar, y otórgale permisos.",
      },
      { text: "Presiona Generar token y selecciona la app Larkey." },
      {
        text: "Marca estos dos permisos antes de generar el token:",
        copies: [
          { label: "Permiso 1", value: "whatsapp_business_management" },
          { label: "Permiso 2", value: "whatsapp_business_messaging" },
        ],
      },
      { text: "Copia el token generado y úsalo en el campo Api Key del formulario." },
    ] as { text: string; copies?: { label: string; value: string }[] }[],
  },

  auth: {
    h1: "Acceso de clientes",
    cardTitle: "Accede a Larkey",
    cardDescription: "Inicia sesión o crea una cuenta para empezar.",
    loginTab: "Iniciar sesión",
    signupTab: "Registrarse",
    email: "Email",
    password: "Contraseña",
    phoneOptional: "Teléfono (opcional)",
    loginSubmit: "Iniciar sesión",
    loginLoading: "Entrando...",
    signupSubmit: "Crear cuenta",
    signupLoading: "Creando...",
    welcomeBack: "¡Bienvenido de vuelta!",
    accountCreated: "¡Cuenta creada! Revisa tu email para confirmar.",
  },

  footer: {
    tagline:
      "Asistentes conversacionales afinados a tu negocio, para que respondan tus mensajes por ti — hoy en WhatsApp, mañana en Instagram, Telegram, Messenger y WebApps. Incluye integración opcional con Chatwoot para supervisar tus conversaciones.",
    links: "Links",
    contact: "Contacto",
    legal: "Legal",
    privacy: "Aviso de privacidad",
    terms: "Términos y condiciones",
    rights: "Todos los derechos reservados.",
  },

  legal: {
    privacy: {
      h1: "Aviso de privacidad",
      updated: "Última actualización: agosto de 2026",
      sections: [
        {
          title: "Datos que recopilamos",
          body: "Recopilamos los datos que nos proporcionas al crear tu cuenta (correo electrónico y, opcionalmente, teléfono), los datos necesarios para conectar tus canales de mensajería y la información de consumo de mensajes de tu plan.",
        },
        {
          title: "Cómo usamos tus datos",
          body: "Usamos tus datos para operar tu asistente conversacional, medir tu consumo de mensajes, gestionar tu suscripción y darte soporte. No vendemos tus datos ni los compartimos con terceros para publicidad.",
        },
        {
          title: "Conversaciones de tus clientes",
          body: "Las conversaciones que tu asistente atiende se procesan para poder responderlas y para que puedas supervisarlas desde tu bandeja. Tú sigues siendo el responsable de los datos de tus propios clientes.",
        },
        {
          title: "Proveedores",
          body: "Trabajamos con proveedores de infraestructura, mensajería y pagos necesarios para operar el servicio, incluidos WhatsApp Business Platform (Meta) y nuestro procesador de pagos.",
        },
        {
          title: "Tus derechos",
          body: "Puedes solicitar el acceso, la corrección o la eliminación de tus datos escribiéndonos por correo. Atendemos las solicitudes lo antes posible.",
        },
        {
          title: "Contacto",
          body: "Para cualquier duda sobre privacidad, escríbenos al correo de contacto que aparece en este sitio.",
        },
      ],
    },
    terms: {
      h1: "Términos y condiciones",
      updated: "Última actualización: agosto de 2026",
      sections: [
        {
          title: "El servicio",
          body: "Larkey diseña, configura y opera asistentes conversacionales que responden mensajes en los canales que contrates, con WhatsApp como canal principal.",
        },
        {
          title: "Suscripciones y pagos",
          body: "Los planes se cobran de forma recurrente (mensual o anual) según el plan elegido. Cada plan incluye un número de mensajes al mes; puedes comprar paquetes adicionales cuando lo necesites.",
        },
        {
          title: "Consumo de mensajes",
          body: "Cada mensaje enviado por tu asistente se descuenta del saldo de tu plan. El saldo incluido se reinicia en cada periodo de facturación y no es acumulable salvo que se indique lo contrario.",
        },
        {
          title: "Cancelación",
          body: "Puedes cancelar tu suscripción en cualquier momento; el servicio continúa hasta el final del periodo ya pagado. No hay periodos mínimos de permanencia.",
        },
        {
          title: "Uso aceptable",
          body: "No puedes usar Larkey para enviar spam, contenido ilegal o mensajes que incumplan las políticas de WhatsApp Business Platform o de los demás canales conectados.",
        },
        {
          title: "Responsabilidad",
          body: "Hacemos nuestro mejor esfuerzo para mantener el servicio disponible y las respuestas correctas, pero un asistente automatizado puede equivocarse. Te recomendamos supervisar las conversaciones críticas para tu negocio.",
        },
      ],
    },
  },

  seo: {
    home: {
      title: "Larkey — Asistentes de IA que responden tu WhatsApp",
      description:
        "Larkey crea asistentes conversacionales que atienden tu WhatsApp y otros canales 24/7. Tú supervisas, el asistente responde.",
    },
    pricing: {
      title: "Precios y planes — Larkey",
      description:
        "Planes de suscripción de Larkey y paquetes de mensajes adicionales. Pagas por mensajes reales, sin permanencia y con 14 días de prueba.",
    },
    faq: {
      title: "Preguntas frecuentes — Larkey",
      description:
        "Respuestas sobre cómo funciona el asistente de WhatsApp, canales disponibles, personalización y cómo se cuentan los mensajes.",
    },
    contact: {
      title: "Contacto — Larkey",
      description:
        "Escríbenos para activar tu asistente de WhatsApp, pedir una cotización Enterprise o resolver dudas sobre tu WhatsApp Business Account.",
    },
    guide: {
      title: "Guía para conectar WhatsApp — Larkey",
      description:
        "Pasos para generar tu token de acceso en Meta Business Suite y conectar tu WhatsApp Business con Larkey.",
    },
    login: {
      title: "Iniciar sesión — Larkey",
      description:
        "Inicia sesión en Larkey o crea tu cuenta para activar tu asistente, revisar tu consumo de mensajes y gestionar tu plan.",
    },
    privacy: {
      title: "Aviso de privacidad — Larkey",
      description:
        "Cómo Larkey recopila, usa y protege los datos de tu cuenta y de las conversaciones gestionadas por tu asistente.",
    },
    terms: {
      title: "Términos y condiciones — Larkey",
      description:
        "Condiciones de uso del servicio Larkey: suscripciones, consumo de mensajes, cancelación y responsabilidades.",
    },
  },
};

export type Dict = typeof es;
