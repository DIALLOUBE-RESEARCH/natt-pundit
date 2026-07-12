import type { AppLang } from "@/lib/locales";
import type { StitchStadiumKey } from "@/lib/uiAssets";

type StadiumRow = Record<AppLang, string>;

const STADIUMS: Record<StitchStadiumKey, StadiumRow> = {
  metlife: {
    en: "MetLife Stadium",
    fr: "MetLife Stadium",
    es: "Estadio MetLife",
    de: "MetLife-Stadion",
    pt: "Estadio MetLife",
    ru: "Stadion MetLife",
    ja: "メットライフ・スタジアム",
    zh: "大都会人寿体育场",
  },
  azteca: {
    en: "Estadio Azteca",
    fr: "Estadio Azteca",
    es: "Estadio Azteca",
    de: "Estadio Azteca",
    pt: "Estadio Azteca",
    ru: "Estadio Azteca",
    ja: "アステカスタジアム",
    zh: "阿兹特克体育场",
  },
  sofi: {
    en: "SoFi Stadium",
    fr: "SoFi Stadium",
    es: "Estadio SoFi",
    de: "SoFi-Stadion",
    pt: "Estadio SoFi",
    ru: "Stadion SoFi",
    ja: "SoFiスタジアム",
    zh: "SoFi体育场",
  },
  mercedes: {
    en: "Mercedes-Benz Stadium",
    fr: "Mercedes-Benz Stadium",
    es: "Estadio Mercedes-Benz",
    de: "Mercedes-Benz-Stadion",
    pt: "Estadio Mercedes-Benz",
    ru: "Stadion Mercedes-Benz",
    ja: "メルセデス・ベンツ・スタジアム",
    zh: "梅赛德斯-奔驰体育场",
  },
};

export function stitchStadiumLabel(key: StitchStadiumKey, lang: AppLang): string {
  const row = STADIUMS[key];
  return row[lang] ?? row.en;
}
