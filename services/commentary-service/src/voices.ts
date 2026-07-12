import type { CommentaryLang } from "@natt-pundit/natt-core";

export type VoiceConfig = {
  languageCode: string;
  name: string;
};

/** Google Cloud TTS voices (F76N §3.7). */
export const VOICE_BY_LANG: Record<CommentaryLang, VoiceConfig> = {
  en: { languageCode: "en-US", name: "en-US-Neural2-D" },
  fr: { languageCode: "fr-FR", name: "fr-FR-Neural2-B" },
  es: { languageCode: "es-ES", name: "es-ES-Neural2-F" },
  de: { languageCode: "de-DE", name: "de-DE-Neural2-D" },
  pt: { languageCode: "pt-BR", name: "pt-BR-Neural2-A" },
  ru: { languageCode: "ru-RU", name: "ru-RU-Wavenet-D" },
  ja: { languageCode: "ja-JP", name: "ja-JP-Neural2-D" },
  zh: { languageCode: "cmn-CN", name: "cmn-CN-Wavenet-D" },
};
