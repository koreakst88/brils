export {};

declare global {
  interface TelegramWebAppUser {
    id?: number;
  }

  interface TelegramWebAppInitDataUnsafe {
    user?: TelegramWebAppUser;
  }

  interface TelegramWebApp {
    ready?: () => void;
    expand?: () => void;
    setHeaderColor?: (color: string) => void;
    setBackgroundColor?: (color: string) => void;
    disableVerticalSwipes?: () => void;
    close?: () => void;
    initDataUnsafe?: TelegramWebAppInitDataUnsafe;
    BackButton?: {
      show: () => void;
      hide: () => void;
      onClick: (callback: () => void) => void;
      offClick: (callback: () => void) => void;
    };
    MainButton?: {
      setText: (text: string) => void;
      show: () => void;
      hide: () => void;
      onClick: (callback: () => void) => void;
      offClick: (callback: () => void) => void;
    };
  }

  interface TelegramNamespace {
    WebApp?: TelegramWebApp;
  }

  interface Window {
    Telegram?: TelegramNamespace;
  }
}
