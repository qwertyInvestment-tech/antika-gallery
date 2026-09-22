import { Container } from "@/components/ui/Container";

export function Introduction() {
  return (
    <section className="flex min-h-[min(70vh,40rem)] items-center bg-ivory py-24 md:min-h-[min(72vh,44rem)] md:py-32 lg:py-40">
      <Container width="wide" className="lg:px-12">
        <div className="max-w-4xl md:ml-[8%] lg:ml-[12%]">
          <p className="text-[0.72rem] tracking-[0.32em] uppercase text-muted">ANTIKA</p>
          <h2 className="mt-8 font-serif text-[clamp(2.5rem,5.5vw,5.5rem)] font-medium leading-[0.95] tracking-tight">
            Предмети кои преживеале
            <br className="hidden sm:block" /> време, луѓе и промени.
          </h2>
          <p className="mt-10 max-w-xl text-[1.1rem] leading-8 text-charcoal/80 md:text-[1.15rem] md:leading-9">
            Предметите во ANTIKA се избираат внимателно. Не се прикажуваат како залиха, туку како конкретни
            примероци — секој со свој период, материјал и пат.
          </p>
        </div>
      </Container>
    </section>
  );
}
