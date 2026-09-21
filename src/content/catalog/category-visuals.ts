// Визуелни fallback слики од Phase 1 mock. Имињата на категориите доаѓаат од базата.

export const categoryVisuals: Record<string, { src: string; alt: string; size: "large" | "medium" | "wide" | "small" | "type" }> = {
  casovnici: { src: "/mock/watch.png", alt: "Механички часовник", size: "large" },
  "moneti-i-banknoti": { src: "/mock/coins.png", alt: "Стари монети", size: "medium" },
  umetnost: { src: "/mock/art.png", alt: "Уметничко дело", size: "medium" },
  "makedonsko-nasledstvo": { src: "/mock/heritage.png", alt: "Камена архитектура и наследство", size: "wide" },
  "keramika-i-porcelan": { src: "/mock/ceramic.png", alt: "Керамички сад", size: "small" },
  "knigi-i-dokumenti": { src: "/mock/book.png", alt: "Стара книга", size: "type" },
  mebel: { src: "/mock/heritage.png", alt: "Дрвен предмет", size: "small" },
  "nakit-i-predmeti": { src: "/mock/jewelry.png", alt: "Накит", size: "medium" },
};

export const categoryEditorials: Record<string, string> = {
  casovnici: "Часовници што се гледаат како предмети — механизми, патина и време што останало во куќиштето.",
  "moneti-i-banknoti": "Мали предмети што носат имиња, симболи и граници. Секој примерок е посебен.",
  umetnost: "Слики и предмети избрани поради карактер, а не поради количина.",
  "keramika-i-porcelan": "Садови и чинии што го чуваат допирот на рацете што ги направиле.",
  mebel: "Помали парчиња мебел што можат да застанат сами, без да се претстават како залиха.",
  "knigi-i-dokumenti": "Книги, бележници и хартија што го носат трагот на читање.",
  "nakit-i-predmeti": "Накит и ситни предмети што се гледаат одблиску.",
  "makedonsko-nasledstvo": "Предмети поврзани со место, материјал и сеќавање — без измислени историски тврдења.",
};
