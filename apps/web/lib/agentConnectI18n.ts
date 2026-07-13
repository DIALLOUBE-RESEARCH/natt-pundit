import type { AppLang } from "@/lib/locales";

export type AgentConnectCopy = {
  connectAgentPill: string;
  connectAgentCta: string;
  modalTitle: string;
  modalLead: string;
  tabCursor: string;
  tabClaude: string;
  tabOther: string;
  openInCursor: string;
  openInClaudeWeb: string;
  openInClaudeApp: string;
  copyClaudeCodeCommand: string;
  copyConfig: string;
  copyMcpUrl: string;
  copyCommand: string;
  copiedToast: string;
  copiedUrlToast: string;
  copiedNameToast: string;
  cursorOpenToast: string;
  claudeWebToast: string;
  claudeAppToast: string;
  claudeCodeToast: string;
  cursorHint: string;
  claudeHint: string;
  otherHint: string;
  publicRepoLabel: string;
  mcpLiveBanner: string;
  comingSoon: string;
  close: string;
  mcpUrlMissing: string;
  claudeWebFieldsTitle: string;
  claudeWebNameLabel: string;
  claudeWebUrlLabel: string;
  claudeWebOAuthEmpty: string;
  claudeWebGuideTitle: string;
  claudeWebSteps: string[];
  claudeCodeGuideTitle: string;
  claudeCodeSteps: string[];
  claudeWebAfterTitle: string;
  claudeWebAfterSteps: string[];
  claudeWebNoOAuth: string;
  claudeWebCopyPrompt: string;
  claudeWebFirstPrompt: string;
};

const en: AgentConnectCopy = {
  connectAgentPill: "Agent",
  connectAgentCta: "Connect your Agent",
  modalTitle: "Connect your Agent",
  modalLead: "TxLINE World Cup data in your AI assistant — one-click setup.",
  tabCursor: "Cursor",
  tabClaude: "Claude",
  tabOther: "Other",
  openInCursor: "Open in Cursor",
  openInClaudeWeb: "Claude.ai (web)",
  openInClaudeApp: "Open in Claude app",
  copyClaudeCodeCommand: "Copy Claude Code command",
  copyConfig: "Copy JSON configuration",
  copyMcpUrl: "Copy MCP URL only",
  copyCommand: "Copy command",
  copiedToast: "Copied",
  copiedUrlToast: "MCP URL copied",
  copiedNameToast: "Connector name copied",
  cursorOpenToast:
    "Cursor will open with NattPundit pre-filled. If tools do not appear, restart Cursor (Settings > Tools & MCP).",
  claudeWebToast:
    "MCP URL copied. Connector form opens with Name + URL prefilled — tap Add to confirm, then enable in a new chat.",
  claudeAppToast:
    "Opening Claude app — add-connector form prefilled. Tap Add, then start a new chat and enable the connector.",
  claudeCodeToast:
    "Command copied! Paste in a terminal, run it, then check with: claude mcp list",
  cursorHint: "One click installs NattPundit via cursor:// deeplink.",
  claudeHint:
    "Claude web or Claude Code — name and URL below. No OAuth (public data). Start with get_pundit_manifest.",
  otherHint: "Generic fallback for any MCP client (Windsurf, Claude Desktop, etc.).",
  publicRepoLabel: "GitHub repository",
  mcpLiveBanner: "MCP server live — pick Cursor, Claude web, or Claude Code.",
  comingSoon: "MCP server coming soon — URL is pre-configured.",
  close: "Close",
  mcpUrlMissing: "MCP URL not configured.",
  claudeWebFieldsTitle: "Fields to enter in Claude.ai",
  claudeWebNameLabel: "Name",
  claudeWebUrlLabel: "MCP URL",
  claudeWebOAuthEmpty: "OAuth / Client ID: leave empty",
  claudeWebGuideTitle: "Claude.ai setup (follow in order)",
  claudeWebSteps: [
    "Click Claude.ai (web) above — the MCP URL is copied and Connectors opens.",
    "In Claude: Add → Custom connector.",
    "Name: type exactly Natt Pundit (see box above).",
    "MCP URL: paste the URL from the box above.",
    "Leave OAuth / Client ID empty — public data, no login.",
    "Click Add — Natt Pundit should show a green checkmark in the list.",
    "Open a new chat (required for all 20 tools, not ~5).",
    "In the chat: + → Connectors → enable Natt Pundit.",
  ],
  claudeCodeGuideTitle: "Claude Code setup (terminal)",
  claudeCodeSteps: [
    "Copy the command below (server name is natt-pundit).",
    "Open a terminal — run the command outside an active claude session.",
    "Paste and press Enter.",
    "Verify: claude mcp list — natt-pundit should show Connected.",
    "Or start claude, run /mcp, and confirm natt-pundit with tools loaded.",
    "No OAuth or API key needed.",
  ],
  claudeWebAfterTitle: "Once connected, send this first message",
  claudeWebAfterSteps: [
    "Ask Claude to call get_pundit_manifest, then get_wc_fixtures.",
    "Example: list World Cup matches, edge SETUP/HOLD, or live scores.",
  ],
  claudeWebNoOAuth: "No OAuth or API key — skip Advanced settings.",
  claudeWebCopyPrompt: "Copy first message",
  claudeWebFirstPrompt:
    "Call get_pundit_manifest, then get_wc_fixtures and summarize the World Cup matches available.",
};

const fr: AgentConnectCopy = {
  connectAgentPill: "Agent",
  connectAgentCta: "Connecter votre Agent",
  modalTitle: "Connecter votre Agent",
  modalLead: "Donnees TxLINE Coupe du Monde dans votre assistant IA — installation en un clic.",
  tabCursor: "Cursor",
  tabClaude: "Claude",
  tabOther: "Autre",
  openInCursor: "Ouvrir dans Cursor",
  openInClaudeWeb: "Claude.ai (site web)",
  openInClaudeApp: "Ouvrir dans l'app Claude",
  copyClaudeCodeCommand: "Copier commande Claude Code",
  copyConfig: "Copier la configuration JSON",
  copyMcpUrl: "Copier l'URL MCP seule",
  copyCommand: "Copier la commande",
  copiedToast: "Copie",
  copiedUrlToast: "URL MCP copiee",
  copiedNameToast: "Nom du connecteur copie",
  cursorOpenToast:
    "Cursor va s'ouvrir avec NattPundit pre-rempli. Si les tools n'apparaissent pas, redemarre Cursor (Settings > Tools & MCP).",
  claudeWebToast:
    "URL MCP copiee. Formulaire connecteur pre-rempli — valide avec Ajouter, puis nouveau chat.",
  claudeAppToast:
    "Ouverture app Claude — formulaire pre-rempli. Valide Ajouter, puis nouveau chat + active le connecteur.",
  claudeCodeToast:
    "Commande copiee ! Colle dans un terminal, execute, puis verifie avec : claude mcp list",
  cursorHint: "Un clic installe NattPundit via le deeplink cursor://.",
  claudeHint:
    "Claude web ou Claude Code — nom et URL ci-dessous. Pas d'OAuth (data publique). Commence par get_pundit_manifest.",
  otherHint: "Fallback generique (Windsurf, Claude Desktop, autre client MCP).",
  publicRepoLabel: "Depot GitHub public",
  mcpLiveBanner: "Serveur MCP en ligne — choisis Cursor, Claude web ou Claude Code.",
  comingSoon: "Serveur MCP bientot disponible — URL pre-configuree.",
  close: "Fermer",
  mcpUrlMissing: "URL MCP non configuree.",
  claudeWebFieldsTitle: "Champs a saisir dans Claude.ai",
  claudeWebNameLabel: "Nom",
  claudeWebUrlLabel: "URL MCP",
  claudeWebOAuthEmpty: "OAuth / Client ID : laisser vide",
  claudeWebGuideTitle: "Installation Claude.ai (dans l'ordre)",
  claudeWebSteps: [
    "Clique Claude.ai (site web) ci-dessus — l'URL MCP est copiee et Connectors s'ouvre.",
    "Dans Claude : Ajouter → Connecteur personnalise.",
    "Nom : tape exactement Natt Pundit (voir encadre ci-dessus).",
    "URL MCP : colle l'URL de l'encadre ci-dessus.",
    "Laisse OAuth / Client ID vide — donnees publiques, pas de login.",
    "Clique Ajouter — Natt Pundit doit avoir une coche verte dans la liste.",
    "Ouvre un nouveau chat (obligatoire pour les 20 tools, pas seulement ~5).",
    "Dans le chat : + → Connecteurs → active Natt Pundit.",
  ],
  claudeCodeGuideTitle: "Installation Claude Code (terminal)",
  claudeCodeSteps: [
    "Copie la commande ci-dessous (nom serveur : natt-pundit).",
    "Ouvre un terminal — execute hors session claude active.",
    "Colle et valide avec Entree.",
    "Verifie : claude mcp list — natt-pundit doit afficher Connected.",
    "Ou lance claude, tape /mcp, et confirme natt-pundit avec les tools charges.",
    "Pas d'OAuth ni de cle API.",
  ],
  claudeWebAfterTitle: "Une fois connecte, envoie ce premier message",
  claudeWebAfterSteps: [
    "Demande a Claude d'appeler get_pundit_manifest puis get_wc_fixtures.",
    "Exemple : liste des matchs, edge SETUP/HOLD, ou scores live.",
  ],
  claudeWebNoOAuth: "Pas d'OAuth ni de cle API — ignore Parametres avances.",
  claudeWebCopyPrompt: "Copier le premier message",
  claudeWebFirstPrompt:
    "Appelle get_pundit_manifest, puis get_wc_fixtures et resume les matchs Coupe du Monde disponibles.",
};

const es: AgentConnectCopy = {
  ...en,
  connectAgentPill: "Agent",
  connectAgentCta: "Conectar tu Agente",
  modalTitle: "Conectar tu Agente",
  modalLead: "Datos TxLINE del Mundial en tu asistente IA — configuracion en un clic.",
  tabOther: "Otro",
  openInCursor: "Abrir en Cursor",
  openInClaudeWeb: "Claude.ai (web)",
  copyClaudeCodeCommand: "Copiar comando Claude Code",
  copyConfig: "Copiar configuracion JSON",
  copyMcpUrl: "Copiar solo URL MCP",
  copiedToast: "Copiado",
  copiedUrlToast: "URL MCP copiada",
  copiedNameToast: "Nombre del conector copiado",
  claudeWebToast:
    "URL copiada. En Connectors: Nombre = Natt Pundit, pega la URL, OAuth vacio.",
  claudeCodeToast: "Comando copiado. Pegalo en la terminal y ejecuta: claude mcp list",
  claudeHint: "Claude web o Claude Code — nombre y URL abajo. Sin OAuth.",
  otherHint: "Fallback generico (Windsurf, Claude Desktop, otro cliente MCP).",
  mcpLiveBanner: "Servidor MCP en linea — elige Cursor, Claude web o Claude Code.",
  close: "Cerrar",
  mcpUrlMissing: "URL MCP no configurada.",
  claudeWebFieldsTitle: "Campos en Claude.ai",
  claudeWebNameLabel: "Nombre",
  claudeWebUrlLabel: "URL MCP",
  claudeWebOAuthEmpty: "OAuth / Client ID: dejar vacio",
  claudeWebGuideTitle: "Configuracion Claude.ai (en orden)",
  claudeWebSteps: [
    "Pulsa Claude.ai (web) arriba — se copia la URL y se abre Connectors.",
    "En Claude: Anadir → Conector personalizado.",
    "Nombre: escribe exactamente Natt Pundit (ver recuadro arriba).",
    "URL MCP: pega la URL del recuadro.",
    "OAuth / Client ID vacio — datos publicos.",
    "Anadir — Natt Pundit con marca verde en la lista.",
    "Chat nuevo (necesario para 20 tools).",
    "En el chat: + → Conectores → activa Natt Pundit.",
  ],
  claudeCodeGuideTitle: "Claude Code (terminal)",
  claudeCodeSteps: [
    "Copia el comando abajo (nombre servidor: natt-pundit).",
    "Abre una terminal fuera de una sesion claude.",
    "Pega y ejecuta.",
    "Verifica: claude mcp list — natt-pundit Connected.",
    "O inicia claude y usa /mcp.",
    "Sin OAuth ni API key.",
  ],
  claudeWebAfterTitle: "Cuando este conectado, envia este primer mensaje",
  claudeWebAfterSteps: [
    "Pide a Claude get_pundit_manifest y luego get_wc_fixtures.",
    "Ejemplo: partidos del Mundial, edge SETUP/HOLD o scores en vivo.",
  ],
  claudeWebNoOAuth: "Sin OAuth — omite ajustes avanzados.",
  claudeWebCopyPrompt: "Copiar primer mensaje",
  claudeWebFirstPrompt:
    "Llama get_pundit_manifest, luego get_wc_fixtures y resume los partidos del Mundial disponibles.",
};

const de: AgentConnectCopy = {
  ...en,
  connectAgentPill: "Agent",
  connectAgentCta: "Agent verbinden",
  modalTitle: "Agent verbinden",
  modalLead: "TxLINE WM-Daten in deinem KI-Assistenten — Ein-Klick-Setup.",
  tabOther: "Andere",
  openInCursor: "In Cursor offnen",
  openInClaudeWeb: "Claude.ai (Web)",
  copyClaudeCodeCommand: "Claude-Code-Befehl kopieren",
  copyConfig: "JSON-Konfiguration kopieren",
  copyMcpUrl: "Nur MCP-URL kopieren",
  copiedToast: "Kopiert",
  copiedUrlToast: "MCP-URL kopiert",
  copiedNameToast: "Connector-Name kopiert",
  claudeCodeToast: "Befehl kopiert. Im Terminal einfugen, dann: claude mcp list",
  mcpLiveBanner: "MCP-Server live — Cursor, Claude Web oder Claude Code wahlen.",
  close: "Schliessen",
  mcpUrlMissing: "MCP-URL nicht konfiguriert.",
  claudeWebFieldsTitle: "Felder in Claude.ai",
  claudeWebNameLabel: "Name",
  claudeWebUrlLabel: "MCP-URL",
  claudeWebOAuthEmpty: "OAuth / Client ID: leer lassen",
  claudeWebGuideTitle: "Claude.ai Einrichtung (der Reihe nach)",
  claudeWebSteps: [
    "Claude.ai (Web) oben klicken — URL wird kopiert, Connectors oeffnet sich.",
    "In Claude: Hinzufuegen → Benutzerdefinierter Connector.",
    "Name: genau Natt Pundit eingeben (siehe Kasten oben).",
    "MCP-URL: URL aus dem Kasten einfuegen.",
    "OAuth / Client ID leer — oeffentliche Daten.",
    "Hinzufuegen — Natt Pundit mit gruenem Haken.",
    "Neuen Chat oeffnen (alle 20 Tools).",
    "Im Chat: + → Connectors → Natt Pundit aktivieren.",
  ],
  claudeCodeGuideTitle: "Claude Code (Terminal)",
  claudeCodeSteps: [
    "Befehl unten kopieren (Servername: natt-pundit).",
    "Terminal oeffnen — ausserhalb einer claude-Sitzung.",
    "Einfuegen und Enter.",
    "Pruefen: claude mcp list — natt-pundit Connected.",
    "Oder claude starten und /mcp nutzen.",
    "Kein OAuth oder API-Key.",
  ],
  claudeWebAfterTitle: "Nach dem Verbinden diese erste Nachricht senden",
  claudeWebAfterSteps: [
    "Claude soll get_pundit_manifest und get_wc_fixtures aufrufen.",
    "Beispiel: WM-Spiele, SETUP/HOLD Edge oder Live-Scores.",
  ],
  claudeWebNoOAuth: "Kein OAuth — erweiterte Einstellungen leer lassen.",
  claudeWebCopyPrompt: "Erste Nachricht kopieren",
  claudeWebFirstPrompt:
    "Rufe get_pundit_manifest auf, dann get_wc_fixtures und fasse die WM-Spiele zusammen.",
};

const pt: AgentConnectCopy = {
  ...en,
  connectAgentPill: "Agent",
  connectAgentCta: "Conectar seu Agente",
  modalTitle: "Conectar seu Agente",
  tabOther: "Outro",
  openInCursor: "Abrir no Cursor",
  copyConfig: "Copiar configuracao JSON",
  copyMcpUrl: "Copiar apenas URL MCP",
  copiedToast: "Copiado",
  copiedUrlToast: "URL MCP copiada",
  copiedNameToast: "Nome do conector copiado",
  copyClaudeCodeCommand: "Copiar comando Claude Code",
  mcpLiveBanner: "Servidor MCP no ar — escolha Cursor, Claude web ou Claude Code.",
  close: "Fechar",
  mcpUrlMissing: "URL MCP nao configurada.",
  claudeWebFieldsTitle: "Campos no Claude.ai",
  claudeWebNameLabel: "Nome",
  claudeWebUrlLabel: "URL MCP",
  claudeWebOAuthEmpty: "OAuth / Client ID: deixar vazio",
  claudeWebGuideTitle: "Configuracao Claude.ai (em ordem)",
  claudeWebSteps: [
    "Clique Claude.ai (web) acima — URL copiada e Connectors abre.",
    "No Claude: Adicionar → Conector personalizado.",
    "Nome: digite exatamente Natt Pundit (ver caixa acima).",
    "URL MCP: cole a URL da caixa.",
    "OAuth / Client ID vazio — dados publicos.",
    "Adicionar — Natt Pundit com visto verde.",
    "Chat novo (20 tools).",
    "No chat: + → Conectores → ative Natt Pundit.",
  ],
  claudeCodeGuideTitle: "Claude Code (terminal)",
  claudeCodeSteps: [
    "Copie o comando abaixo (nome: natt-pundit).",
    "Abra um terminal fora de uma sessao claude.",
    "Cole e execute.",
    "Verifique: claude mcp list — natt-pundit Connected.",
    "Ou inicie claude e use /mcp.",
    "Sem OAuth ou API key.",
  ],
  claudeWebAfterTitle: "Depois de conectar, envie esta primeira mensagem",
  claudeWebAfterSteps: [
    "Peça get_pundit_manifest e depois get_wc_fixtures.",
    "Exemplo: jogos do Mundial, edge SETUP/HOLD ou placares ao vivo.",
  ],
  claudeWebNoOAuth: "Sem OAuth — ignore configuracoes avancadas.",
  claudeWebCopyPrompt: "Copiar primeira mensagem",
  claudeWebFirstPrompt:
    "Chama get_pundit_manifest, depois get_wc_fixtures e resume os jogos do Mundial.",
};

const ru: AgentConnectCopy = {
  ...en,
  connectAgentPill: "Агент",
  connectAgentCta: "Подключить агента",
  modalTitle: "Подключить агента",
  tabOther: "Другое",
  openInCursor: "Открыть в Cursor",
  openInClaudeWeb: "Claude.ai (веб)",
  copyClaudeCodeCommand: "Копировать команду Claude Code",
  copyConfig: "Копировать JSON-конфигурацию",
  copyMcpUrl: "Копировать только URL MCP",
  copiedToast: "Скопировано",
  copiedUrlToast: "URL MCP скопирован",
  copiedNameToast: "Имя коннектора скопировано",
  mcpLiveBanner: "MCP в сети — Cursor, Claude web или Claude Code.",
  close: "Закрыть",
  mcpUrlMissing: "URL MCP не настроен.",
  claudeWebFieldsTitle: "Поля в Claude.ai",
  claudeWebNameLabel: "Имя",
  claudeWebUrlLabel: "URL MCP",
  claudeWebOAuthEmpty: "OAuth / Client ID: оставить пустым",
  claudeWebGuideTitle: "Настройка Claude.ai (по шагам)",
  claudeWebSteps: [
    "Нажми Claude.ai (веб) выше — URL скопируется, откроется Connectors.",
    "В Claude: Добавить → Пользовательский коннектор.",
    "Имя: введи точно Natt Pundit (см. блок выше).",
    "URL MCP: вставь URL из блока.",
    "OAuth / Client ID пусто — публичные данные.",
    "Добавить — Natt Pundit с зеленой галочкой.",
    "Новый чат (все 20 tools).",
    "В чате: + → Connectors → включи Natt Pundit.",
  ],
  claudeCodeGuideTitle: "Claude Code (терминал)",
  claudeCodeSteps: [
    "Скопируй команду ниже (имя сервера: natt-pundit).",
    "Открой терминал вне сессии claude.",
    "Вставь и выполни.",
    "Проверь: claude mcp list — natt-pundit Connected.",
    "Или запусти claude и /mcp.",
    "Без OAuth и API key.",
  ],
  claudeWebAfterTitle: "После подключения отправь первое сообщение",
  claudeWebAfterSteps: [
    "Попроси Claude вызвать get_pundit_manifest и get_wc_fixtures.",
    "Пример: матчи ЧМ, edge SETUP/HOLD или live-счет.",
  ],
  claudeWebNoOAuth: "Без OAuth — расширенные настройки не нужны.",
  claudeWebCopyPrompt: "Копировать первое сообщение",
  claudeWebFirstPrompt:
    "Вызови get_pundit_manifest, затем get_wc_fixtures и кратко опиши матчи ЧМ.",
};

const ja: AgentConnectCopy = {
  ...en,
  connectAgentPill: "Agent",
  connectAgentCta: "エージェントを接続",
  modalTitle: "エージェントを接続",
  tabOther: "その他",
  openInCursor: "Cursorで開く",
  openInClaudeWeb: "Claude.ai（Web）",
  copyClaudeCodeCommand: "Claude Codeコマンドをコピー",
  copyConfig: "JSON設定をコピー",
  copyMcpUrl: "MCP URLのみコピー",
  copiedToast: "コピーしました",
  copiedUrlToast: "MCP URLをコピーしました",
  copiedNameToast: "コネクタ名をコピーしました",
  mcpLiveBanner: "MCP稼働中 — Cursor、Claude Web、または Claude Code。",
  close: "閉じる",
  mcpUrlMissing: "MCP URLが未設定です。",
  claudeWebFieldsTitle: "Claude.aiで入力する項目",
  claudeWebNameLabel: "名前",
  claudeWebUrlLabel: "MCP URL",
  claudeWebOAuthEmpty: "OAuth / Client ID: 空欄",
  claudeWebGuideTitle: "Claude.ai セットアップ（順番に）",
  claudeWebSteps: [
    "上の Claude.ai（Web）— URLコピー＋Connectorsを開く。",
    "Claudeで：追加 → カスタムコネクタ。",
    "名前：正確に Natt Pundit（上のボックス参照）。",
    "MCP URL：ボックスのURLを貼り付け。",
    "OAuth / Client ID は空欄。",
    "追加 — 一覧に Natt Pundit の緑チェック。",
    "新しいチャット（20 tools）。",
    "チャットで：+ → Connectors → Natt Pundit を有効化。",
  ],
  claudeCodeGuideTitle: "Claude Code（ターミナル）",
  claudeCodeSteps: [
    "下のコマンドをコピー（サーバー名: natt-pundit）。",
    "claudeセッション外でターミナルを開く。",
    "貼り付けて実行。",
    "確認: claude mcp list — natt-pundit Connected。",
    "または claude 起動後 /mcp。",
    "OAuth・API key不要。",
  ],
  claudeWebAfterTitle: "接続後、最初のメッセージを送信",
  claudeWebAfterSteps: [
    "get_pundit_manifest と get_wc_fixtures を呼ぶよう依頼。",
    "例：W杯試合一覧、SETUP/HOLD edge、ライブスコア。",
  ],
  claudeWebNoOAuth: "OAuth不要 — 詳細設定はスキップ。",
  claudeWebCopyPrompt: "最初のメッセージをコピー",
  claudeWebFirstPrompt:
    "get_pundit_manifest を呼び、次に get_wc_fixtures でW杯試合を要約して。",
};

const zh: AgentConnectCopy = {
  ...en,
  connectAgentPill: "Agent",
  connectAgentCta: "连接你的 Agent",
  modalTitle: "连接你的 Agent",
  tabOther: "其他",
  openInCursor: "在 Cursor 中打开",
  openInClaudeWeb: "Claude.ai（网页）",
  copyClaudeCodeCommand: "复制 Claude Code 命令",
  copyConfig: "复制 JSON 配置",
  copyMcpUrl: "仅复制 MCP URL",
  copiedToast: "已复制",
  copiedUrlToast: "MCP URL 已复制",
  copiedNameToast: "连接器名称已复制",
  mcpLiveBanner: "MCP 已上线 — 选择 Cursor、Claude 网页或 Claude Code。",
  close: "关闭",
  mcpUrlMissing: "MCP URL 未配置。",
  claudeWebFieldsTitle: "Claude.ai 填写项",
  claudeWebNameLabel: "名称",
  claudeWebUrlLabel: "MCP URL",
  claudeWebOAuthEmpty: "OAuth / Client ID：留空",
  claudeWebGuideTitle: "Claude.ai 配置（按顺序）",
  claudeWebSteps: [
    "点击上方 Claude.ai（网页）— 复制 URL 并打开 Connectors。",
    "在 Claude：添加 → 自定义连接器。",
    "名称：准确输入 Natt Pundit（见上方框）。",
    "MCP URL：粘贴框内 URL。",
    "OAuth / Client ID 留空。",
    "点击添加 — 列表中 Natt Pundit 显示绿色勾。",
    "打开新对话（20 个 tools）。",
    "在对话中：+ → Connectors → 启用 Natt Pundit。",
  ],
  claudeCodeGuideTitle: "Claude Code（终端）",
  claudeCodeSteps: [
    "复制下方命令（服务器名：natt-pundit）。",
    "在 claude 会话外打开终端。",
    "粘贴并运行。",
    "验证：claude mcp list — natt-pundit Connected。",
    "或启动 claude 后运行 /mcp。",
    "无需 OAuth 或 API key。",
  ],
  claudeWebAfterTitle: "连接后发送第一条消息",
  claudeWebAfterSteps: [
    "让 Claude 调用 get_pundit_manifest 和 get_wc_fixtures。",
    "例如：世界杯赛程、SETUP/HOLD edge 或实时比分。",
  ],
  claudeWebNoOAuth: "无需 OAuth — 跳过高级设置。",
  claudeWebCopyPrompt: "复制首条消息",
  claudeWebFirstPrompt:
    "调用 get_pundit_manifest，然后 get_wc_fixtures 并总结可用世界杯比赛。",
};

const COPY: Record<AppLang, AgentConnectCopy> = {
  en,
  fr,
  es,
  de,
  pt,
  ru,
  ja,
  zh,
};

export function agentConnectCopy(lang: AppLang): AgentConnectCopy {
  return COPY[lang] ?? COPY.en;
}
