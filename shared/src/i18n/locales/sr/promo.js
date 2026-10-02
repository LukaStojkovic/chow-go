export default {
  push: {
    voucherTitle: "Dobili ste vaučer",
    voucherBody: "{{amount}} popusta na sledeću porudžbinu. Kod: {{code}}",
    voucherBodyFreeDelivery: "Besplatna dostava za sledeću porudžbinu. Kod: {{code}}",
  },

  checkout: {
    title: "Promo kod",
    label: "Promo kod",
    placeholder: "Unesite kod",
    apply: "Primeni",
    remove: "Ukloni kod",
    applied: "Kod {{code}} je primenjen",
    saving: "Štedite {{amount}}",
    yourVouchers: "Vaši vaučeri",
    useVoucher: "Iskoristi {{code}}",
    failed: "Taj kod nije mogao da se primeni",
    dropped: "Vaš promo kod je uklonjen: {{reason}}",
  },

  discount: {
    percentage: "{{value}}% popusta",
    percentageCapped: "{{value}}% popusta, najviše {{max}}",
    fixed: "{{amount}} popusta",
    free_delivery: "Besplatna dostava",
  },

  conditions: {
    minSubtotal: "Za porudžbine preko {{amount}}",
    endsAt: "Važi do {{date}}",
    firstOrderOnly: "Samo za prvu porudžbinu",
    perCustomer_one: "{{count}} korišćenje po kupcu",
    perCustomer_few: "{{count}} korišćenja po kupcu",
    perCustomer_other: "{{count}} korišćenja po kupcu",
  },

  vouchers: {
    title: "Moji vaučeri",
    description: "Kodovi izdati vama. Primenite ih pri plaćanju.",
    empty: "Trenutno nemate vaučere.",
    copy: "Kopiraj kod",
    copied: "Kod je kopiran",
  },

  manage: {
    title: "Promo kodovi",
    description: "Kodovi koje kupci unose pri plaćanju. Popust na vaše kodove umanjuje vaš prihod od hrane.",
    adminDescription: "Kodove platforme plaća platforma. Kodovi restorana su ovde radi nadzora.",
    create: "Novi kod",
    edit: "Izmeni kod",
    save: "Sačuvaj kod",
    cancel: "Otkaži",
    saved: "Kod je sačuvan",
    updated: "Kod je ažuriran",
    empty: "Još nema promo kodova",
    emptyDescription: "Napravite kod za akciju za nove ili stalne kupce.",
    lockedNotice: "Ovaj kod je već korišćen, pa se popust više ne može menjati. Napravite novi kod.",
    archiveConfirm: "Arhivirati {{code}}? Kupci ga više neće moći koristiti, a ovo se ne može poništiti.",
    loadFailed: "Nismo uspeli da učitamo vaše promo kodove",
  },

  fields: {
    code: "Kod",
    codeHint: "4-24 slova, cifre ili crtice. Ovo kupci kucaju.",
    label: "Opis",
    labelHint: "Prikazuje se kupcu, npr. \"Prolećna akcija\".",
    type: "Popust",
    value: "Vrednost",
    valuePercent: "Procenat popusta",
    valueAmount: "Iznos popusta ({{currency}})",
    maxDiscount: "Najveći popust ({{currency}})",
    maxDiscountHint: "Opciona gornja granica za procentualni popust.",
    minSubtotal: "Minimalna porudžbina ({{currency}})",
    startsAt: "Počinje",
    endsAt: "Ističe",
    maxRedemptions: "Ukupno korišćenja",
    maxRedemptionsHint: "Ostavite prazno za neograničeno.",
    perCustomerLimit: "Korišćenja po kupcu",
    firstOrderOnly: "Samo prva porudžbina",
    currency: "Valuta",
    validDays: "Važi (dana)",
  },

  types: {
    percentage: "Procenat",
    fixed: "Fiksni iznos",
    free_delivery: "Besplatna dostava",
  },

  columns: {
    code: "Kod",
    owner: "Vlasnik",
    discount: "Popust",
    uses: "Korišćenja",
    validity: "Važi",
    status: "Status",
    actions: "Radnje",
  },

  status: {
    active: "Aktivan",
    paused: "Pauziran",
    archived: "Arhiviran",
  },

  actions: {
    pause: "Pauziraj",
    resume: "Nastavi",
    archive: "Arhiviraj",
    edit: "Izmeni",
    stats: "Rezultati",
  },

  uses: {
    unlimited: "{{used}} iskorišćeno",
    limited: "{{used}} / {{max}}",
  },

  validity: {
    always: "Bez roka",
    until: "Do {{date}}",
    from: "Od {{date}}",
    range: "{{from}} - {{to}}",
  },

  stats: {
    title: "Rezultati za {{code}}",
    orders: "Porudžbine",
    delivered: "Dostavljeno",
    discountGiven: "Dati popust",
    revenue: "Prihod od hrane",
  },

  scope: {
    all: "Svi kodovi",
    platform: "Platforma",
    restaurant: "Restoran",
    personal: "Lični vaučer",
  },

  admin: {
    issueVoucher: "Izdaj vaučer",
    issueTitle: "Izdavanje vaučera za {{orderNumber}}",
    issueDescription: "Kod za jednokratnu upotrebu za kupca ove porudžbine, na trošak platforme.",
    issued: "Vaučer {{code}} je izdat",
    pauseReason: "Zašto se ovaj kod pauzira?",
    reason: "Razlog",
    reasonPlaceholder: "Beleži se u dnevniku izmena",
  },
};
