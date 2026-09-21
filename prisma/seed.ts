import { ItemCondition, ItemStatus, Prisma, PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { formatItemReference } from "../src/lib/domain/reference-number";

const prisma = new PrismaClient();

const categories = [
  { slug: "moneti-i-banknoti", name: "Монети и банкноти", sortOrder: 1, description: "Мали предмети што носат имиња, симболи и граници. Секој примерок е посебен." },
  { slug: "casovnici", name: "Часовници", sortOrder: 2, description: "Часовници што се гледаат како предмети — механизми, патина и време што останало во куќиштето." },
  { slug: "umetnost", name: "Уметност", sortOrder: 3, description: "Слики и предмети избрани поради карактер, а не поради количина." },
  { slug: "keramika-i-porcelan", name: "Керамика и порцелан", sortOrder: 4, description: "Садови и чинии што го чуваат допирот на рацете што ги направиле." },
  { slug: "mebel", name: "Мебел", sortOrder: 5, description: "Помали парчиња мебел што можат да застанат сами, без да се претстават како залиха." },
  { slug: "knigi-i-dokumenti", name: "Книги и документи", sortOrder: 6, description: "Книги, бележници и хартија што го носат трагот на читање." },
  { slug: "nakit-i-predmeti", name: "Накит и предмети", sortOrder: 7, description: "Накит и ситни предмети што се гледаат одблиску." },
  { slug: "makedonsko-nasledstvo", name: "Македонско наследство", sortOrder: 8, description: "Предмети поврзани со место, материјал и сеќавање — без измислени историски тврдења." },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: category.sortOrder, isActive: true, description: category.description },
      create: category,
    });
  }

  await prisma.referenceCounter.upsert({
    where: { key: "item" },
    update: {},
    create: { key: "item", lastNumber: 0 },
  });

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME ?? "Администратор";

  const existingItems = await prisma.item.count();
  if (existingItems === 0) {
    const allCategories = await prisma.category.findMany();
    const bySlug = Object.fromEntries(allCategories.map((category) => [category.slug, category.id]));
    const demoNote = "Демо-предмет за развој. Не е понуда на реален антиквитет.";

    const demos: Array<{
      slug: string;
      title: string;
      category: string;
      price: string;
      status: ItemStatus;
      periodLabel: string;
      origin: string;
      material: string;
      condition: ItemCondition;
      image: string;
      imageAlt: string;
    }> = [
      { slug: "demo-dzeben-casovnik", title: "Џебен часовник (демо)", category: "casovnici", price: "24000", status: ItemStatus.AVAILABLE, periodLabel: "околу 1950", origin: "Швајцарија", material: "Месинг и емајл", condition: ItemCondition.VERY_GOOD, image: "/mock/pocket.png", imageAlt: "Демо џебен часовник" },
      { slug: "demo-mehanicki-casovnik", title: "Механички часовник (демо)", category: "casovnici", price: "18500", status: ItemStatus.PUBLISHED, periodLabel: "средина на XX век", origin: "Европа", material: "Челик", condition: ItemCondition.GOOD, image: "/mock/watch.png", imageAlt: "Демо механички часовник" },
      { slug: "demo-moneti", title: "Група стари монети (демо)", category: "moneti-i-banknoti", price: "6200", status: ItemStatus.AVAILABLE, periodLabel: "XIX–XX век", origin: "Балкан", material: "Метал", condition: ItemCondition.USED, image: "/mock/coins.png", imageAlt: "Демо монети" },
      { slug: "demo-banknota", title: "Истрошена банкнота (демо)", category: "moneti-i-banknoti", price: "2800", status: ItemStatus.RESERVED, periodLabel: "XX век", origin: "Европа", material: "Хартија", condition: ItemCondition.USED, image: "/mock/coins.png", imageAlt: "Демо банкнота" },
      { slug: "demo-maslo", title: "Мал мртва природа (демо)", category: "umetnost", price: "31000", status: ItemStatus.AVAILABLE, periodLabel: "XIX век", origin: "Европа", material: "Платно и масло", condition: ItemCondition.GOOD, image: "/mock/art.png", imageAlt: "Демо слика" },
      { slug: "demo-keramika", title: "Керамички сад (демо)", category: "keramika-i-porcelan", price: "5400", status: ItemStatus.AVAILABLE, periodLabel: "XX век", origin: "Медитеран", material: "Керамика", condition: ItemCondition.VERY_GOOD, image: "/mock/ceramic.png", imageAlt: "Демо керамика" },
      { slug: "demo-porcelan", title: "Порцеланска чинија (демо)", category: "keramika-i-porcelan", price: "4100", status: ItemStatus.SOLD, periodLabel: "околу 1920", origin: "Европа", material: "Порцелан", condition: ItemCondition.EXCELLENT, image: "/mock/porcelain.png", imageAlt: "Демо порцелан" },
      { slug: "demo-mebel", title: "Мала дрвена полица (демо)", category: "mebel", price: "27000", status: ItemStatus.DRAFT, periodLabel: "XX век", origin: "Балкан", material: "Дрво", condition: ItemCondition.RESTORATION, image: "/mock/heritage.png", imageAlt: "Демо мебел" },
      { slug: "demo-belezhnica", title: "Кожна бележница (демо)", category: "knigi-i-dokumenti", price: "3900", status: ItemStatus.AVAILABLE, periodLabel: "1930-ти", origin: "Виена", material: "Кожа и хартија", condition: ItemCondition.USED, image: "/mock/book.png", imageAlt: "Демо бележница" },
      { slug: "demo-kniga", title: "Стара книга (демо)", category: "knigi-i-dokumenti", price: "2200", status: ItemStatus.ARCHIVED, periodLabel: "XX век", origin: "Европа", material: "Хартија", condition: ItemCondition.USED, image: "/mock/book.png", imageAlt: "Демо книга" },
      { slug: "demo-privezok", title: "Сребрен привезок (демо)", category: "nakit-i-predmeti", price: "8700", status: ItemStatus.AVAILABLE, periodLabel: "XIX век", origin: "Балкан", material: "Сребро", condition: ItemCondition.GOOD, image: "/mock/jewelry.png", imageAlt: "Демо накит" },
      { slug: "demo-kutija", title: "Дрвена кутија (демо)", category: "nakit-i-predmeti", price: "3300", status: ItemStatus.PUBLISHED, periodLabel: "XX век", origin: "Балкан", material: "Дрво", condition: ItemCondition.VERY_GOOD, image: "/mock/jewelry.png", imageAlt: "Демо кутија" },
      { slug: "demo-kamen", title: "Камен фрагмент (демо)", category: "makedonsko-nasledstvo", price: "15000", status: ItemStatus.AVAILABLE, periodLabel: "неутврдено", origin: "Македонија", material: "Камен", condition: ItemCondition.USED, image: "/mock/heritage.png", imageAlt: "Демо камен" },
      { slug: "demo-sasud", title: "Земен сад (демо)", category: "makedonsko-nasledstvo", price: "9800", status: ItemStatus.SOLD, periodLabel: "неутврдено", origin: "Македонија", material: "Керамика", condition: ItemCondition.GOOD, image: "/mock/ceramic.png", imageAlt: "Демо сад" },
    ];

    let number = 0;
    for (const demo of demos) {
      number += 1;
      const item = await prisma.item.create({
        data: {
          referenceNumber: formatItemReference(number),
          slug: demo.slug,
          title: demo.title,
          categoryId: bySlug[demo.category],
          shortDescription: demoNote,
          description: `${demoNote} Описот е составен за визуелен и технички преглед на каталогот.`,
          price: new Prisma.Decimal(demo.price),
          currency: "MKD",
          status: demo.status,
          periodLabel: demo.periodLabel,
          origin: demo.origin,
          material: demo.material,
          condition: demo.condition,
          authenticityNotes: "Нема приложена документација за автентичност.",
          isDemo: true,
          publishedAt: demo.status === ItemStatus.DRAFT || demo.status === ItemStatus.ARCHIVED ? null : new Date(),
          soldAt: demo.status === ItemStatus.SOLD ? new Date() : null,
        },
      });

      const asset = await prisma.mediaAsset.create({
        data: {
          key: `seed/${demo.slug}.png`,
          url: demo.image,
          provider: "LOCAL",
          mimeType: "image/png",
          alt: demo.imageAlt,
        },
      });

      await prisma.itemImage.create({
        data: {
          itemId: item.id,
          assetId: asset.id,
          sortOrder: 0,
          isPrimary: true,
        },
      });
    }

    await prisma.referenceCounter.update({
      where: { key: "item" },
      data: { lastNumber: number },
    });
  }

  if (email && password) {
    const passwordHash = await hash(password, 12);
    await prisma.user.upsert({
      where: { email },
      update: { name, role: UserRole.SUPER_ADMIN, isActive: true, passwordHash },
      create: {
        email,
        name,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        passwordHash,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
