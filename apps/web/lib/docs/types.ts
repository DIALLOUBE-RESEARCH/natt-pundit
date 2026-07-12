export type DocBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading3"; text: string }
  | { type: "list"; items: string[] }
  | { type: "alert"; text: string }
  | { type: "code"; text: string }
  | { type: "link"; label: string; href: string };

export type DocSection = {
  id: string;
  title: string;
  blocks: DocBlock[];
};

export type DocsPack = {
  title: string;
  lead: string;
  navAria: string;
  sections: DocSection[];
};
