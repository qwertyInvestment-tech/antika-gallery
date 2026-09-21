"use client";

import { CatalogErrorState } from "@/components/catalog/CatalogErrorState";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { Container } from "@/components/ui/Container";

export default function RootError() {
  return (
    <SiteFrame>
      <Container width="narrow">
        <CatalogErrorState />
      </Container>
    </SiteFrame>
  );
}
