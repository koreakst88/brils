import ru from "./ru.json";
import en from "./en.json";
import ko from "./ko.json";
import { useAdminStore, type AdminLanguage } from "../store/useAdminStore";

const dictionaries = {
  ru,
  en,
  ko,
} as const;

function getNestedValue(source: Record<string, unknown>, key: string) {
  return key.split(".").reduce<unknown>((accumulator, part) => {
    if (typeof accumulator !== "object" || accumulator === null) {
      return undefined;
    }
    return (accumulator as Record<string, unknown>)[part];
  }, source);
}

export function useTranslation() {
  const language = useAdminStore((state) => state.language);
  const setLanguage = useAdminStore((state) => state.setLanguage);

  const t = (key: string): string => {
    const dictionary = dictionaries[language] as Record<string, unknown>;
    const fallbackDictionary = dictionaries.ru as Record<string, unknown>;

    const value =
      getNestedValue(dictionary, key) ?? getNestedValue(fallbackDictionary, key);

    return typeof value === "string" ? value : key;
  };

  return {
    language,
    setLanguage: (value: AdminLanguage) => setLanguage(value),
    t,
  };
}
