import type { AppLang } from "@/lib/locales";
import { teamNameKey } from "@/lib/countryFlags";

type TeamRow = Record<AppLang, string>;

/** TxLINE / FIFA WC team names — keyed by normalized English API name. */
const TEAMS: Record<string, TeamRow> = {
  algeria: { en: "Algeria", fr: "Algerie", es: "Argelia", de: "Algerien", pt: "Argelia", ru: "Alzhir", ja: "Algeria", zh: "阿尔及利亚" },
  argentina: { en: "Argentina", fr: "Argentine", es: "Argentina", de: "Argentinien", pt: "Argentina", ru: "Argentina", ja: "アルゼンチン", zh: "阿根廷" },
  australia: { en: "Australia", fr: "Australie", es: "Australia", de: "Australien", pt: "Australia", ru: "Avstraliya", ja: "オーストラリア", zh: "澳大利亚" },
  austria: { en: "Austria", fr: "Autriche", es: "Austria", de: "Oesterreich", pt: "Austria", ru: "Avstriya", ja: "オーストリア", zh: "奥地利" },
  belgium: { en: "Belgium", fr: "Belgique", es: "Belgica", de: "Belgien", pt: "Belgica", ru: "Belgiya", ja: "ベルギー", zh: "比利时" },
  "bosnia and herzegovina": { en: "Bosnia and Herzegovina", fr: "Bosnie-Herzegovine", es: "Bosnia y Herzegovina", de: "Bosnien und Herzegowina", pt: "Bosnia e Herzegovina", ru: "Bosniya i Gertsegovina", ja: "ボスニア・ヘルツェゴビナ", zh: "波黑" },
  brazil: { en: "Brazil", fr: "Bresil", es: "Brasil", de: "Brasilien", pt: "Brasil", ru: "Braziliya", ja: "ブラジル", zh: "巴西" },
  "cabo verde": { en: "Cabo Verde", fr: "Cap-Vert", es: "Cabo Verde", de: "Kap Verde", pt: "Cabo Verde", ru: "Kabo-Verde", ja: "カーボベルデ", zh: "佛得角" },
  canada: { en: "Canada", fr: "Canada", es: "Canada", de: "Kanada", pt: "Canada", ru: "Kanada", ja: "カナダ", zh: "加拿大" },
  cameroon: { en: "Cameroon", fr: "Cameroun", es: "Camerun", de: "Kamerun", pt: "Camaroes", ru: "Kamerun", ja: "カメルーン", zh: "喀麦隆" },
  chile: { en: "Chile", fr: "Chili", es: "Chile", de: "Chile", pt: "Chile", ru: "Chili", ja: "チリ", zh: "智利" },
  colombia: { en: "Colombia", fr: "Colombie", es: "Colombia", de: "Kolumbien", pt: "Colombia", ru: "Kolumbiya", ja: "コロンビア", zh: "哥伦比亚" },
  "congo dr": { en: "Congo DR", fr: "RD Congo", es: "RD Congo", de: "DR Kongo", pt: "RD Congo", ru: "DR Kongo", ja: "コンゴDR", zh: "刚果（金）" },
  "costa rica": { en: "Costa Rica", fr: "Costa Rica", es: "Costa Rica", de: "Costa Rica", pt: "Costa Rica", ru: "Kosta-Rika", ja: "コスタリカ", zh: "哥斯达黎加" },
  "cote divoire": { en: "Cote d'Ivoire", fr: "Cote d'Ivoire", es: "Costa de Marfil", de: "Elfenbeinkueste", pt: "Costa do Marfim", ru: "Kot-d'Ivuar", ja: "コートジボワール", zh: "科特迪瓦" },
  croatia: { en: "Croatia", fr: "Croatie", es: "Croacia", de: "Kroatien", pt: "Croacia", ru: "Khorvatiya", ja: "クロアチア", zh: "克罗地亚" },
  curacao: { en: "Curacao", fr: "Curacao", es: "Curazao", de: "Curacao", pt: "Curacao", ru: "Kyurasao", ja: "キュラソー", zh: "库拉索" },
  czechia: { en: "Czechia", fr: "Tchequie", es: "Chequia", de: "Tschechien", pt: "Chequia", ru: "Chekhiya", ja: "チェコ", zh: "捷克" },
  denmark: { en: "Denmark", fr: "Danemark", es: "Dinamarca", de: "Daenemark", pt: "Dinamarca", ru: "Daniya", ja: "デンマーク", zh: "丹麦" },
  ecuador: { en: "Ecuador", fr: "Equateur", es: "Ecuador", de: "Ecuador", pt: "Equador", ru: "Ekvador", ja: "エクアドル", zh: "厄瓜多尔" },
  egypt: { en: "Egypt", fr: "Egypte", es: "Egipto", de: "Aegypten", pt: "Egito", ru: "Egipet", ja: "エジプト", zh: "埃及" },
  england: { en: "England", fr: "Angleterre", es: "Inglaterra", de: "England", pt: "Inglaterra", ru: "Angliya", ja: "イングランド", zh: "英格兰" },
  france: { en: "France", fr: "France", es: "Francia", de: "Frankreich", pt: "Franca", ru: "Frantsiya", ja: "フランス", zh: "法国" },
  germany: { en: "Germany", fr: "Allemagne", es: "Alemania", de: "Deutschland", pt: "Alemanha", ru: "Germaniya", ja: "ドイツ", zh: "德国" },
  ghana: { en: "Ghana", fr: "Ghana", es: "Ghana", de: "Ghana", pt: "Gana", ru: "Gana", ja: "ガーナ", zh: "加纳" },
  greece: { en: "Greece", fr: "Grece", es: "Grecia", de: "Griechenland", pt: "Grecia", ru: "Gretsiya", ja: "ギリシャ", zh: "希腊" },
  haiti: { en: "Haiti", fr: "Haiti", es: "Haiti", de: "Haiti", pt: "Haiti", ru: "Gaiti", ja: "ハイチ", zh: "海地" },
  iran: { en: "Iran", fr: "Iran", es: "Iran", de: "Iran", pt: "Ira", ru: "Iran", ja: "イラン", zh: "伊朗" },
  iraq: { en: "Iraq", fr: "Irak", es: "Irak", de: "Irak", pt: "Iraque", ru: "Irak", ja: "イラク", zh: "伊拉克" },
  ireland: { en: "Ireland", fr: "Irlande", es: "Irlanda", de: "Irland", pt: "Irlanda", ru: "Irlandiya", ja: "アイルランド", zh: "爱尔兰" },
  italy: { en: "Italy", fr: "Italie", es: "Italia", de: "Italien", pt: "Italia", ru: "Italiya", ja: "イタリア", zh: "意大利" },
  jamaica: { en: "Jamaica", fr: "Jamaique", es: "Jamaica", de: "Jamaika", pt: "Jamaica", ru: "Yamayka", ja: "ジャマイカ", zh: "牙买加" },
  japan: { en: "Japan", fr: "Japon", es: "Japon", de: "Japan", pt: "Japao", ru: "Yaponiya", ja: "日本", zh: "日本" },
  jordan: { en: "Jordan", fr: "Jordanie", es: "Jordania", de: "Jordanien", pt: "Jordania", ru: "Iordaniya", ja: "ヨルダン", zh: "约旦" },
  mexico: { en: "Mexico", fr: "Mexique", es: "Mexico", de: "Mexiko", pt: "Mexico", ru: "Meksika", ja: "メキシコ", zh: "墨西哥" },
  morocco: { en: "Morocco", fr: "Maroc", es: "Marruecos", de: "Marokko", pt: "Marrocos", ru: "Marokko", ja: "モロッコ", zh: "摩洛哥" },
  netherlands: { en: "Netherlands", fr: "Pays-Bas", es: "Paises Bajos", de: "Niederlande", pt: "Paises Baixos", ru: "Niderlandy", ja: "オランダ", zh: "荷兰" },
  "new zealand": { en: "New Zealand", fr: "Nouvelle-Zelande", es: "Nueva Zelanda", de: "Neuseeland", pt: "Nova Zelandia", ru: "Novaya Zelandiya", ja: "ニュージーランド", zh: "新西兰" },
  nigeria: { en: "Nigeria", fr: "Nigeria", es: "Nigeria", de: "Nigeria", pt: "Nigeria", ru: "Nigeriya", ja: "ナイジェリア", zh: "尼日利亚" },
  "northern ireland": { en: "Northern Ireland", fr: "Irlande du Nord", es: "Irlanda del Norte", de: "Nordirland", pt: "Irlanda do Norte", ru: "Severnaya Irlandiya", ja: "北アイルランド", zh: "北爱尔兰" },
  norway: { en: "Norway", fr: "Norvege", es: "Noruega", de: "Norwegen", pt: "Noruega", ru: "Norvegiya", ja: "ノルウェー", zh: "挪威" },
  panama: { en: "Panama", fr: "Panama", es: "Panama", de: "Panama", pt: "Panama", ru: "Panama", ja: "パナマ", zh: "巴拿马" },
  paraguay: { en: "Paraguay", fr: "Paraguay", es: "Paraguay", de: "Paraguay", pt: "Paraguai", ru: "Paragvay", ja: "パラグアイ", zh: "巴拉圭" },
  peru: { en: "Peru", fr: "Perou", es: "Peru", de: "Peru", pt: "Peru", ru: "Peru", ja: "ペルー", zh: "秘鲁" },
  poland: { en: "Poland", fr: "Pologne", es: "Polonia", de: "Polen", pt: "Polonia", ru: "Polsha", ja: "ポーランド", zh: "波兰" },
  portugal: { en: "Portugal", fr: "Portugal", es: "Portugal", de: "Portugal", pt: "Portugal", ru: "Portugaliya", ja: "ポルトガル", zh: "葡萄牙" },
  qatar: { en: "Qatar", fr: "Qatar", es: "Catar", de: "Katar", pt: "Catar", ru: "Katar", ja: "カタール", zh: "卡塔尔" },
  romania: { en: "Romania", fr: "Roumanie", es: "Rumania", de: "Rumaenien", pt: "Romenia", ru: "Rumyniya", ja: "ルーマニア", zh: "罗马尼亚" },
  "saudi arabia": { en: "Saudi Arabia", fr: "Arabie saoudite", es: "Arabia Saudita", de: "Saudi-Arabien", pt: "Arabia Saudita", ru: "Saudovskaya Arabiya", ja: "サウジアラビア", zh: "沙特阿拉伯" },
  scotland: { en: "Scotland", fr: "Ecosse", es: "Escocia", de: "Schottland", pt: "Escocia", ru: "Shotlandiya", ja: "スコットランド", zh: "苏格兰" },
  senegal: { en: "Senegal", fr: "Senegal", es: "Senegal", de: "Senegal", pt: "Senegal", ru: "Senegal", ja: "セネガル", zh: "塞内加尔" },
  serbia: { en: "Serbia", fr: "Serbie", es: "Serbia", de: "Serbien", pt: "Servia", ru: "Serbiya", ja: "セルビア", zh: "塞尔维亚" },
  "south africa": { en: "South Africa", fr: "Afrique du Sud", es: "Sudafrica", de: "Suedafrika", pt: "Africa do Sul", ru: "Yuzhnaya Afrika", ja: "南アフリカ", zh: "南非" },
  "south korea": { en: "South Korea", fr: "Coree du Sud", es: "Corea del Sur", de: "Suedkorea", pt: "Coreia do Sul", ru: "Yuzhnaya Koreya", ja: "韓国", zh: "韩国" },
  spain: { en: "Spain", fr: "Espagne", es: "Espana", de: "Spanien", pt: "Espanha", ru: "Ispaniya", ja: "スペイン", zh: "西班牙" },
  sweden: { en: "Sweden", fr: "Suede", es: "Suecia", de: "Schweden", pt: "Suecia", ru: "Shvetsiya", ja: "スウェーデン", zh: "瑞典" },
  switzerland: { en: "Switzerland", fr: "Suisse", es: "Suiza", de: "Schweiz", pt: "Suica", ru: "Shveytsariya", ja: "スイス", zh: "瑞士" },
  tunisia: { en: "Tunisia", fr: "Tunisie", es: "Tunez", de: "Tunesien", pt: "Tunisia", ru: "Tunis", ja: "チュニジア", zh: "突尼斯" },
  turkey: { en: "Turkey", fr: "Turquie", es: "Turquia", de: "Tuerkei", pt: "Turquia", ru: "Turtsiya", ja: "トルコ", zh: "土耳其" },
  ukraine: { en: "Ukraine", fr: "Ukraine", es: "Ucrania", de: "Ukraine", pt: "Ucrania", ru: "Ukraina", ja: "ウクライナ", zh: "乌克兰" },
  "united states": { en: "United States", fr: "Etats-Unis", es: "Estados Unidos", de: "Vereinigte Staaten", pt: "Estados Unidos", ru: "SShA", ja: "アメリカ", zh: "美国" },
  uruguay: { en: "Uruguay", fr: "Uruguay", es: "Uruguay", de: "Uruguay", pt: "Uruguai", ru: "Urugvay", ja: "ウルグアイ", zh: "乌拉圭" },
  uzbekistan: { en: "Uzbekistan", fr: "Ouzbekistan", es: "Uzbekistan", de: "Usbekistan", pt: "Uzbequistao", ru: "Uzbekistan", ja: "ウズベキスタン", zh: "乌兹别克斯坦" },
  wales: { en: "Wales", fr: "Pays de Galles", es: "Gales", de: "Wales", pt: "Pais de Gales", ru: "Uels", ja: "ウェールズ", zh: "威尔士" },
};

const KEY_ALIASES: Record<string, string> = {
  usa: "united states",
  us: "united states",
  "czech republic": "czechia",
  "ivory coast": "cote divoire",
  "cape verde": "cabo verde",
  "dr congo": "congo dr",
  "congo drc": "congo dr",
  "democratic republic of congo": "congo dr",
  drc: "congo dr",
  "korea republic": "south korea",
  southkorea: "south korea",
  turkiye: "turkey",
  "ir iran": "iran",
  saudiarabia: "saudi arabia",
  "bosnia herzegovina": "bosnia and herzegovina",
};

function resolveTeamKey(team: string): string | null {
  const n = teamNameKey(team);
  if (!n) return null;
  if (TEAMS[n]) return n;
  const compact = n.replace(/ /g, "");
  if (TEAMS[compact]) return compact;
  if (KEY_ALIASES[n]) return KEY_ALIASES[n];
  if (KEY_ALIASES[compact]) return KEY_ALIASES[compact];
  if (/united\s*states|^usa$/.test(n)) return "united states";
  if (/korea/.test(n)) return "south korea";
  if (/congo/.test(n)) return "congo dr";
  if (/ivoire|ivory/.test(n)) return "cote divoire";
  if (/cape\s*verde|cabo\s*verde/.test(n)) return "cabo verde";
  if (/czech/.test(n)) return "czechia";
  if (/bosnia/.test(n)) return "bosnia and herzegovina";
  if (/turk/.test(n)) return "turkey";
  if (/iran/.test(n)) return "iran";
  return null;
}

/** Localized country / team label (display). */
export function teamLabel(team: string, lang: AppLang): string {
  const key = resolveTeamKey(team);
  if (!key) return team.trim();
  const row = TEAMS[key];
  return row[lang] ?? row.en ?? team.trim();
}
