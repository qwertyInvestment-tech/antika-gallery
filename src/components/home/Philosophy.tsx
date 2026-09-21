import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export function Philosophy() {
  return (
    <Section className="py-24 md:py-32">
      <Container width="narrow">
        <p className="text-[0.72rem] tracking-[0.28em] uppercase text-muted">За колекцијата</p>
        <h2 className="mt-6 font-serif text-4xl leading-tight md:text-5xl">Секој предмет има приказна.</h2>
        <div className="mt-10 space-y-6 text-[1.08rem] leading-8 text-charcoal/85">
          <p>
            Предметите во ANTIKA се избираат внимателно. Не се прикажуваат како залиха, туку како конкретни
            примероци — секој со свој период, материјал и пат.
          </p>
          <p>
            Описот настојува да биде јасен: состојба, потекло и она што може да се каже без преувеличување.
            Каде што постои документација, таа се наведува. Каде што не постои, тоа останува видливо.
          </p>
        </div>
      </Container>
    </Section>
  );
}
