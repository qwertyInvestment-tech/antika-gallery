# ANTIKA — COMMERCE DECISION (Phase 5A)

Статус: **предлог врз постоечката имплементација. Не е production code. Не е одобрен Commerce.**

Овој документ не воведува нови модели и не менува business правила. Ги опишува фактите од Phase 0–4 и ги одделува одлуките што **не смеат да се претпостават**.

---

## 1. Што веќе постои (факти)

### Unique inventory

- Еден `Item` = еден физички предмет (`referenceNumber`, на пр. `ANT-000013`).
- Нема quantity / stock.
- `SOLD` е терминален продажен статус (`SOLD → *` не е дозволен).
- Продадениот предмет останува јавно видлив како архива.

### Customer flow денес (Phase 4)

Јавниот пат за интерес кон конкретен предмет е:

**AVAILABLE → Inquiry („Заинтересиран сум за овој предмет“) → admin NEW → CONTACTED → CLOSED**

- Inquiry се дозволува само ако `isPurchasableStatus` = `AVAILABLE`.
- RESERVED: јавно „не е достапен за купување“, без inquiry CTA.
- SOLD: јавно архивски банер, без inquiry CTA.
- Нема checkout, плаќање, кошничка функционалност, customer account за купување.

Wanted request (`ItemRequest`) е барање за предмет што **не е** во колекцијата. Тоа не е продажба.

### Admin inventory денес (Phase 2)

Admin може рачно да го смени статусот на предмет, вклучувајќи:

- AVAILABLE → RESERVED (`reserveItemAction`)
- AVAILABLE / RESERVED → SOLD (`markSoldAction`)
- RESERVED → AVAILABLE (враќање во продажба)

`Item.reservedUntil` постои во Prisma, но **никој сервис не го пишува**. Нема expiration job.

`Item.soldAt` се поставува при премин во SOLD.

### Schema stubs (Phase 0, не се користат)

Постојат модели што **немаат application logic**:

- `Order` (`PENDING | CONFIRMED | PAID | FULFILLED | CANCELLED`)
- `OrderItem` (snapshot: `title`, `reference`, `price`, `currency`; `@@unique([orderId, itemId])`)
- `User.role = CUSTOMER` (нема customer dashboard / регистрација)
- `Favorite` е врзан за `User` во база; Phase 4 омилените се anonymous `localStorage`

`/кошничка` е placeholder: „Нарачката и кошничката ќе се градат во посебна фаза.“

Нема payment env, payment provider, адреса на галерија, телефон за испорака, или дефинирана цена за delivery.

### Concurrency денес

Двајца customers можат да испратат inquiry за истиот AVAILABLE предмет. Inquiry **не го менува** статусот на Item. Заклучувањето на уникатниот предмет не постои на ниво на трансакција.

---

## 2. A. Sales model

### Што е веќе кодирано во производот

Живиот јавен пат е **inquiry-led**, не cart-led.

Тоа одговара на уникатен антиквитет: еден предмет, човечки разговор, потоа admin одлука.

### Предлог за Phase 5 (inferred — бара одобрение)

**Модел 1 (препорачан врз Phase 4): Inquiry → Reservation → Confirmation → SOLD**

```
Customer  AVAILABLE предмет
    → Inquiry (постои)
Admin     NEW → CONTACTED (постои)
Admin     AVAILABLE → RESERVED  (постои рачно; во Phase 5 да се врзе со inquiry)
Admin     потврда на продажба
    → Order snapshot (постоечки Order/OrderItem stub)
    → Item RESERVED → SOLD (постои)
```

**Модел 2 (Cart → Checkout → Payment) не е имплементиран.** Постои само placeholder `/кошничка` и неупотребен `Order` модел. За уникатен предмет кошничка со повеќе ставки е можна, но **не е тековниот customer CTA**.

**Хибрид:** јавно останува Inquiry; кошничка/checkout се одложува до експлицитно одобрение. Не се вклучува online payment во првиот Commerce чекор освен ако сопственикот не го бара.

### Одлука што не смее да се претпостави

- Дали customer некогаш ќе купува без човечки контакт (self-serve checkout).
- Дали еден customer смее да нарача повеќе уникатни предмети во една Order.

---

## 3. B. Reservation

### Факти

| Прашање | Што постои денес |
|---|---|
| Кога станува RESERVED | Само admin, рачно. Inquiry не резервира. |
| Колку трае | Не е дефинирано. |
| Expiration | Поле `reservedUntil` постои, не се користи. Нема cron/job. |
| Што при expiration | Не е дефинирано. |
| Admin може рачно да reserve | Да. |
| Customer може да cancel | Не. Нема customer reservation UI. |
| Конфликт меѓу двајца | Inquiry не заклучува. Два NEW inquiries на ист Item се дозволени. |

Дозволени премини (domain):

- AVAILABLE → RESERVED, SOLD, PUBLISHED, DRAFT, ARCHIVED
- RESERVED → AVAILABLE, SOLD, ARCHIVED
- SOLD → (ништо)

### Предлог за Phase 5 (inferred — бара одобрение)

- Резервацијата останува **admin-controlled**, врзана за конкретен Inquiry + Item.
- Додека е RESERVED, други customers не добиваат inquiry CTA (веќе така е на public page).
- Expiration: **не се вклучува автоматски** додека сопственикот не одреди рок. Полето `reservedUntil` да се користи само ако се одобри TTL.
- Customer cancel: **не** во првиот Commerce чекор (нема accounts).
- Конфликт: при RESERVE/SOLD, трансакција мора да успее само ако Item е сè уште AVAILABLE (за reserve) / RESERVED или AVAILABLE (за sold), инаку 409.

### Одлуки што бараат сопственик

1. Дали резервацијата истекува (на пр. 48h / 7 дена / никогаш)?
2. Дали истекот автоматски враќа RESERVED → AVAILABLE?
3. Дали inquiry автоматски го прави предметот RESERVED, или само admin?
4. Дали вториот inquiry за веќе резервиран предмет се одбива или се прима како waitlist?

---

## 4. C. Order

### Факти

`Order` + `OrderItem` се подготвени за snapshot на продажба:

- `orderNumber` уникатен
- customer: `customerName`, `email`, `phone`, optional `userId`
- `city`, `address`, `notes`
- `total`, `currency` (default MKD)
- line: `itemId`, `title`, `reference`, `price`, `currency`
- еден предмет не може двапати во иста нарачка (`@@unique([orderId, itemId])`)
- статуси: PENDING, CONFIRMED, PAID, FULFILLED, CANCELLED

Нема сервис, акција, admin UI или тестови за Order.

### Предлог за Phase 5 (inferred — бара одобрение)

Кога admin ја потврдува продажбата:

1. Креирај `Order` + еден `OrderItem` со price snapshot од тековниот `Item.price`.
2. Поврзи го со Inquiry (ќе треба **нова релација** Inquiry↔Order или поле на Order — тоа е schema промена во Phase 5, не сега).
3. Трансакциски: Item → SOLD + `soldAt`.
4. Не бриши Item. Не враќај SOLD → AVAILABLE.

Постоечкиот `OrderStatus` вклучува `PAID`. Тоа не значи дека мора да има online payment. `PAID` може да значи „уплатено рачно“ ако така се одлучи.

### Одлуки што бараат сопственик

1. Дали секоја продажба мора да има Order запис, или SOLD на Item е доволен додека нема сметководство?
2. Кој го издава `orderNumber` (нов counter како `ANT-…` / `ORD-…`)?
3. Дали CANCELLED ја враќа ставката RESERVED → AVAILABLE (дозволено од domain) или останува RESERVED до admin?
4. Дали една Order смее повеќе уникатни предмети?

---

## 5. D. Payment

### Факти

Нема payment provider, API клучеви, webhook, или UI за плаќање.

Нема документирани банкарски детали во апликацијата (Phase 4 забрани измислување на телефон/адреса/email).

### Предлог

**Не интегрирај payment provider во првиот Commerce.**

Првиот чекор: **рачна потврда** (банкарски трансфер / готово / договор во галерија), админот означува платено/продадено.

Апстракција (`Payment` / status на Order) може да се додаде во Phase 5 само ако сопственикот сака запис. Provider (Stripe, PayPal, локална каса) е посебна одлука.

### Одлуки што бараат сопственик

1. Online payment: да / не / подоцна.
2. Прифатени методи: трансфер, готово, подигање, друго.
3. Дали предметот се продава пред или по уплата.

---

## 6. E. Shipping / pickup

### Факти

`Order.city` и `Order.address` постојат како полиња. Нема shipping status, carrier, tracking, pickup slot, или работно време/адреса на галерија во конфигурација.

### Предлог

Не имплементирај shipping engine во првиот Commerce.

Испорака/подигање се **админ белешка + контакт со customer** додека нема реални податоци за локација и цени.

### Одлуки што бараат сопственик

1. Само подигање, само домашна достава, или обете?
2. Меѓународна испорака: да / не (правни и царински последици за антиквитети).
3. Дали цената на достава влегува во `Order.total`?

---

## 7. F. Concurrency (CRITICAL)

### Ризик денес

Двајца можат да прашат за истиот AVAILABLE предмет. Admin може да го продаде додека друг сè уште мисли дека е достапен.

### Задолжително за Phase 5 (техничко, не business invention)

Секоја мутација RESERVE или SOLD мора да биде во `prisma.$transaction` со услов на тековен статус, на пр.:

- reserve: `UPDATE … WHERE id = $id AND status = AVAILABLE`
- sold: `UPDATE … WHERE id = $id AND status IN (AVAILABLE, RESERVED)`
- ако `count = 0` → конфликт, без промена.

Дополнително (препорака, schema во Phase 5):

- најмногу една **активна** резервација по Item (не повеќе OPEN orders за истиот `itemId`).
- не создавај втор `OrderItem` за Item што е веќе SOLD.

Inquiry сам по себе не мора да биде уникатен по Item+email освен постоечката in-memory duplicate заштита.

---

## 8. Што Phase 5 смее / не смее да прави (ако се одобри овој документ)

### Смее (минимален Commerce врз моделот 1)

- Врска Inquiry → Item reservation (admin).
- Transactional RESERVE / SOLD.
- Опционално: креирање `Order` + `OrderItem` snapshot при SOLD (reuse на постоечките модели).
- Admin листа на резервирани / продадени (без дуплирање на item engine).
- Тестови за конфликт и невалидни премини.

### Не смее без нова експлицитна наредба

- Cart / checkout UI (освен ако сопственикот избере модел 2).
- Payment provider.
- Customer accounts, password reset, dashboard.
- Email/WhatsApp автоматизација.
- Shipping calculator.
- Редизајн на Phase 1/3.
- Автоматски reservation TTL без одобрен рок.
- Враќање SOLD → AVAILABLE.

---

## 9. Open decisions (блокери за имплементација)

Phase 5 не смее да почне додека сопственикот не потврди барем:

| # | Одлука | Предлог од кодот (не финално) |
|---|---|---|
| D1 | Sales model 1, 2, или хибрид? | **1 — Inquiry-led** |
| D2 | Inquiry автоматски RESERVE или само admin? | **Само admin** |
| D3 | Reservation TTL? | **Нема, додека не се каже рок** |
| D4 | Задолжителен Order запис при SOLD? | **Да, reuse `Order`/`OrderItem`** |
| D5 | Online payment во првиот Commerce? | **Не** |
| D6 | Повеќе предмети во една Order? | **Не — еден предмет = една продажба** |
| D7 | Pickup vs delivery? | **Не се кодира до реални податоци** |
| D8 | Customer cancel на резервација? | **Не, нема accounts** |

---

## 10. Mapping на постоечки модели (reuse)

| Концепт | Постоечки модел | Не креирај дупликат |
|---|---|---|
| Предмет | `Item` | — |
| Интерес за предмет | `Inquiry` | не втор Inquiry |
| Барање што го нема | `ItemRequest` | — |
| Резервација | `Item.status = RESERVED` + `reservedUntil` | не Reservation табела освен ако TTL/party мора да се чуваат одделно |
| Продажба | `Item.status = SOLD` + `soldAt` + `Order`/`OrderItem` | не втор SoldRecord |
| Купувач | `Inquiry` / `Order` полиња; подоцна `User` CUSTOMER | не Customer табела сега |
| Омилени | localStorage + `Favorite` за accounts | — |

Ако резервацијата мора да знае **кој** ја држи (inquiry id, email, истек), тогаш или:

- се проширува `Item` (`reservedByInquiryId`, се пишува `reservedUntil`), или
- се воведува тенка `Reservation` врзана 1:1 со активен Item.

Тоа е schema одлука за Phase 5, не за 5A код.

---

## 11. Proposed happy path (за одобрение)

```
AVAILABLE
  customer: Inquiry
  admin: CONTACTED
  admin: RESERVE (transaction, only if still AVAILABLE)
RESERVED
  јавно: без purchase CTA
  admin: потврда → Order snapshot + SOLD
SOLD
  јавно: архива
  нема враќање во продажба
```

Неуспех / конфликт: вториот admin или подоцнежен checkout добива јасна грешка, предметот останува кај првата успешна трансакција.

---

## 12. Phase 5A conclusion

Commerce во ANTIKA **веќе е нацртан како gallery inquiry + admin inventory**, не како Shopify cart.

Препорака: Phase 5 имплементира **модел 1** врз постоечките `Item`, `Inquiry`, `Order`, `OrderItem`, со задолжителен concurrency lock.

Не се имплементира сè до експлицитно одобрение на овој документ и одговорите на D1–D8.
