import { getSessionUser } from "@/lib/auth/session";
import { listFavoriteItems } from "@/server/services/favorite-service";
import { FavoritesList } from "@/components/customer/FavoritesList";
import { CustomerNav } from "@/components/customer/CustomerNav";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { ItemPreview } from "@/components/editorial/ItemPreview";
import { toPreviewModel } from "@/lib/catalog/present";
import { SiteShell } from "@/components/layout/SiteShell";
import { Container } from "@/components/ui/Container";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Омилени — ANTIKA",
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const user = await getSessionUser();
  const items = user ? await listFavoriteItems(user.id) : null;

  return (
    <SiteShell>
      <Container width="wide" className="py-16 md:py-24">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">Омилени</p>
        <h1 className="mt-5 font-serif text-5xl md:text-6xl">Зачувани предмети</h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-muted">
          Предметите што ги зачувате остануваат тука, дури и ако подоцна бидат продадени.
        </p>
        {user ? <CustomerNav /> : null}
        <div className="mt-14">
          {items ? (
            items.length === 0 ? (
              <CatalogEmpty
                title="Сè уште немате зачувано предмети."
                description="Зачувајте предмети што сакате повторно да ги видите — дури и ако подоцна бидат продадени."
                cta="Разгледај ја колекцијата"
              />
            ) : (
              <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-14">
                {items.map((item) => (
                  <ItemPreview key={item.id} {...toPreviewModel(item)} />
                ))}
              </div>
            )
          ) : (
            <FavoritesList />
          )}
        </div>
      </Container>
    </SiteShell>
  );
}
