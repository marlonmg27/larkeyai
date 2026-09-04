import { facebookAppId } from "@/lib/whatsapp/embedded-signup";
import type { Dict } from "./es";

export const en: Dict = {
  htmlLang: "en",
  currencyLocale: "en-US",

  common: {
    menu: "Menu",
    navigation: "Navigation",
    language: "Language",
    spanish: "Español",
    english: "English",
    switchToOther: "Español",
  },

  nav: {
    home: "Home",
    dashboard: "Dashboard",
    instructions: "Instructions",
    guide: "Setup guide",
    pricing: "Pricing",
    contact: "Contact",
    faq: "FAQ",
    login: "Log in",
    logout: "Log out",
    start: "Get started",
    loggedOut: "You have been logged out",
    howItWorks: "How it works",
  },

  hero: {
    badge: "An AI agent that works while you rest",
    h1: "Stop answering every message. Let your AI agent do it.",
    subtitle:
      "Larkey gives you an AI agent that handles your business WhatsApp — your main channel — and extends to Instagram, Telegram, Messenger and web apps. You watch every chat in real time and take over whenever you want.",
    primaryCta: "Get my AI agent",
    secondaryCta: "Log in",
    note: "Built for companies and independent professionals whose business runs on conversations.",
  },

  mockup: {
    online: "Online",
    today: "Today",
    messages: [
      "Hi, do you still have availability this week?",
      "Hi there! Yes, we do. What day works best for you?",
      "Could we do tomorrow at 5pm?",
      "Done — you're booked for tomorrow at 5pm. Want me to confirm here?",
    ],
  },

  how: {
    title: "How we work with you",
    subtitle:
      "You focus on selling and growing. We build and maintain the AI agent that answers for you.",
    steps: [
      {
        title: "Tell us about your business",
        description:
          "We talk with you to understand your product, your tone of voice and the questions you get every day. No endless forms, no jargon.",
      },
      {
        title: "We tune your AI agent",
        description:
          "Our team configures and trains an agent around the exact context of your operation. You never touch a line of code.",
      },
      {
        title: "It starts replying for you",
        description:
          "Your agent handles WhatsApp — your main channel — and can extend to Instagram, Telegram, Messenger and web apps. It answers leads, resolves questions and books appointments 24/7.",
      },
    ],
  },

  pricing: {
    sectionTitle: "Plans and pricing",
    sectionSubtitle:
      "Scale customer support without hiring. You pay for real messages, not promises. No lock-in and a 14-day free trial.",
    h1: "Pricing and plans",
    intro:
      "Scale customer support without hiring. Pay for real messages, no lock-in, and a 14-day free trial on every plan.",
    chooseCta: "Choose plan",
    trialCta: "Start free trial",
    monthly: "Monthly",
    yearly: "Yearly",
    recommended: "Most popular",
    perMonth: "month",
    perYear: "year",
    monthlyEquivalent: "billed yearly",
    messagesPerMonth: "messages / month",
    redirecting: "Redirecting…",
    loadError: "We couldn't load the plans",
    loadErrorHint: "Try reloading the page.",
    noPlans: "No plans are available right now. Get in touch if you need help.",
    packsTitle: "Extra message packs",
    packsSubtitle:
      "Running out of messages before the month ends? Buy an extra pack without changing your plan.",
    packsLoggedOut:
      "Message packs are purchased from your dashboard. Create an account or log in to see the available packs and prices.",
    tiers: {
      basic: {
        tagline: "Perfect to start automating your WhatsApp.",
        perks: [
          "AI agent tuned to your operation",
          "Main channel: WhatsApp",
          "Unified inbox",
          "Email support",
        ],
      },
      standard: {
        tagline: "The balance between volume and control.",
        perks: [
          "Everything in Basic",
          "Custom tone of voice and conversation flows",
          "WhatsApp + Instagram + Messenger",
          "Priority support",
        ],
      },
      pro: {
        tagline: "For businesses that get messages every single day.",
        perks: [
          "Everything in Standard",
          "WhatsApp, Instagram, Telegram, Messenger",
          "Integrations with your stack",
          "Guided onboarding",
        ],
      },
    },
    enterprise: {
      tagline: "For teams with high volume and custom requirements.",
      price: "Custom",
      priceNote: "Quoted around your operation",
      messages: "Custom message volume",
      perks: [
        "Message volume tailored to your traffic",
        "AI agents designed for your operation",
        "WhatsApp, Instagram, Telegram, Messenger and web apps",
        "Dedicated integrations with your stack",
        "Onboarding and a named account contact",
      ],
      cta: "Talk to sales",
    },
  },

  faq: {
    h1: "Frequently asked questions",
    subtitle: "Everything you need to know before getting started with Larkey.",
    items: [
      {
        question: "What is Larkey?",
        answer:
          "Larkey is a platform for AI conversational agents. We design and launch an agent tuned to your business context so it answers your messages — with WhatsApp as the main channel — without the business owner having to watch their phone all day.",
      },
      {
        question: "Do I need technical skills to use Larkey?",
        answer:
          "No. Larkey is built for anyone, with or without technical background. We handle the technical work and the training; you just tell us how your business runs.",
      },
      {
        question: "Which channels does the agent reply on?",
        answer:
          "WhatsApp is our flagship channel, because that is where most of our clients get messages. We can also extend it to Instagram, Telegram, Messenger and web apps depending on what you need.",
      },
      {
        question: "Can I read the conversations between the agent and my customers?",
        answer:
          "Yes. From your unified inbox you can read every interaction between your agent and your customers in real time, and take over the conversation with one click.",
      },
      {
        question: "Is the agent trained exclusively for my business?",
        answer:
          "That is the goal. We tune the agent to your context, tone and workflows so it answers like part of your team. The level of customization is agreed with you case by case.",
      },
      {
        question: "How is message usage counted?",
        answer:
          "Every message sent by your agent counts against your plan limit. Your dashboard shows usage in real time and lets you buy extra messages whenever you need them.",
      },
    ],
  },

  contact: {
    h1: "Contact us",
    intro:
      "Tell us how your business works and we'll help you launch your AI agent. We reply by email as soon as possible.",
    cardTitle: "Email us",
    cardDescription: "The fastest way to get started or to quote a custom plan.",
    quoteCta: "Request a quote",
    noWabaBefore: "Don't have a WhatsApp Business Account or a Meta app yet? Email us at",
    noWabaAfter: "and we'll walk you through it.",
  },

  guide: {
    h1: "How to connect your WhatsApp Business account",
    intro:
      "Before connecting your channel you need to generate an access token in Meta and grant permissions to Larkey. You only do this once.",
    cardTitle: "Generate your Meta access token",
    cardDescription:
      "You need admin access to your Meta Business Suite and a WhatsApp Business Account.",
    dashboardCta: "Go to dashboard",
    intro2:
      "Before connecting your WhatsApp you need to generate an access token in Meta and grant permissions to Larkey. You only do this once.",
    continueCta: "I have my token, continue",
    copy: "Copy",
    steps: [
      { text: "Open your Meta Business Suite and go to Settings → Apps → Add." },
      {
        text: "Click Request access and enter the Larkey app ID.",
        copies: [{ label: "Larkey app ID", value: facebookAppId }],
      },
      { text: "Create a system user with the admin role." },
      {
        text: "Click Connect assets: select the Larkey app and the WABA account you want to use, then grant permissions.",
      },
      { text: "Click Generate token and select the Larkey app." },
      {
        text: "Select these two permissions before generating the token:",
        copies: [
          { label: "Permission 1", value: "whatsapp_business_management" },
          { label: "Permission 2", value: "whatsapp_business_messaging" },
        ],
      },
      { text: "Copy the generated token and paste it into the Api Key field of the form." },
    ],
  },

  auth: {
    h1: "Client login",
    cardTitle: "Sign in to Larkey",
    cardDescription: "Log in or create an account to get started.",
    loginTab: "Log in",
    signupTab: "Sign up",
    email: "Email",
    password: "Password",
    phoneOptional: "Phone (optional)",
    loginSubmit: "Log in",
    loginLoading: "Signing in...",
    signupSubmit: "Create account",
    signupLoading: "Creating...",
    welcomeBack: "Welcome back!",
    accountCreated: "Account created! Check your email to confirm it.",
  },

  footer: {
    tagline:
      "AI conversational agents tuned to your business so they answer your messages for you — on WhatsApp today, on Instagram, Telegram, Messenger and web apps next. Optional Chatwoot integration lets you supervise every conversation.",
    links: "Links",
    contact: "Contact",
    legal: "Legal",
    privacy: "Privacy policy",
    terms: "Terms of service",
    rights: "All rights reserved.",
  },

  legal: {
    privacy: {
      h1: "Privacy policy",
      updated: "Last updated: August 2026",
      sections: [
        {
          title: "Data we collect",
          body: "We collect the data you give us when creating your account (email and, optionally, phone number), the data required to connect your messaging channels, and your plan's message usage information.",
        },
        {
          title: "How we use your data",
          body: "We use your data to run your AI agent, measure message usage, manage your subscription and provide support. We do not sell your data or share it with third parties for advertising.",
        },
        {
          title: "Your customers' conversations",
          body: "Conversations handled by your agent are processed so they can be answered and so you can supervise them from your inbox. You remain responsible for your own customers' data.",
        },
        {
          title: "Service providers",
          body: "We work with the infrastructure, messaging and payment providers required to run the service, including the WhatsApp Business Platform (Meta) and our payment processor.",
        },
        {
          title: "Your rights",
          body: "You can request access to, correction of, or deletion of your data by emailing us. We handle requests as quickly as possible.",
        },
        {
          title: "Contact",
          body: "For any privacy question, write to the contact email listed on this site.",
        },
      ],
    },
    terms: {
      h1: "Terms of service",
      updated: "Last updated: August 2026",
      sections: [
        {
          title: "The service",
          body: "Larkey designs, configures and operates AI conversational agents that answer messages on the channels you subscribe to, with WhatsApp as the main channel.",
        },
        {
          title: "Subscriptions and payments",
          body: "Plans are billed on a recurring basis (monthly or yearly) depending on the plan you choose. Each plan includes a monthly message allowance, and you can buy extra packs whenever you need them.",
        },
        {
          title: "Message usage",
          body: "Every message sent by your agent is deducted from your plan balance. The included allowance resets each billing period and does not roll over unless stated otherwise.",
        },
        {
          title: "Cancellation",
          body: "You can cancel your subscription at any time; the service continues until the end of the period you already paid for. There are no minimum commitment periods.",
        },
        {
          title: "Acceptable use",
          body: "You may not use Larkey to send spam, illegal content, or messages that breach the policies of the WhatsApp Business Platform or any other connected channel.",
        },
        {
          title: "Liability",
          body: "We do our best to keep the service available and the answers accurate, but an automated agent can make mistakes. We recommend supervising conversations that are critical to your business.",
        },
      ],
    },
  },

  breadcrumb: {
    home: "Home",
    pricing: "Pricing and plans",
    faq: "Frequently asked questions",
    contact: "Contact",
    guide: "WhatsApp setup guide",
    login: "Client login",
    privacy: "Privacy policy",
    terms: "Terms of service",
  },

  seo: {
    home: {
      title: "Larkey — AI WhatsApp Agents for Business",
      description:
        "Larkey builds AI agents that answer your business WhatsApp 24/7, qualify leads and book appointments while you stay in control.",
    },
    pricing: {
      title: "Pricing & Plans — Larkey WhatsApp AI Agents",
      description:
        "Compare Larkey plans and message packs. Pay per real message, no lock-in, 14-day free trial on every subscription.",
    },
    faq: {
      title: "FAQ — How Larkey WhatsApp AI Agents Work",
      description:
        "Answers about how the WhatsApp AI agent works, supported channels, customization and how message usage is counted.",
    },
    contact: {
      title: "Contact Larkey — Talk to Our Team",
      description:
        "Get in touch to launch your WhatsApp AI agent, request an Enterprise quote or get help with your WhatsApp Business Account.",
    },
    guide: {
      title: "WhatsApp Business API Setup Guide — Larkey",
      description:
        "Step-by-step guide to create your Meta system user, grant permissions and generate the access token Larkey needs.",
    },
    login: {
      title: "Log in — Larkey Client Area",
      description:
        "Log in to Larkey or create an account to activate your AI agent, track message usage and manage your subscription.",
    },
    privacy: {
      title: "Privacy Policy — Larkey",
      description:
        "How Larkey collects, uses and protects your account data and the conversations handled by your AI agent.",
    },
    terms: {
      title: "Terms of Service — Larkey",
      description:
        "Larkey terms of service: subscriptions, message usage, cancellation and responsibilities.",
    },
  },
};
