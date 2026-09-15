/**
 * Serbian order copy.
 *
 * Plural keys carry three forms - `_one` (1, 21, 31...), `_few` (2-4, 22-24...)
 * and `_other` - because that is what `Intl.PluralRules` reports for `sr`.
 * English only needs two, so the plural families in this file and in `en/` are
 * deliberately different sizes; the locale check knows to compare the base key.
 */

export default {
  short: {
    pending: "Čeka potvrdu",
    confirmed: "Potvrđeno",
    preparing: "Priprema se",
    ready: "Spremno",
    assigned: "Kurir dodeljen",
    picked_up: "Preuzeto",
    in_transit: "Na putu",
    delivered: "Dostavljeno",
    cancelled: "Otkazano",
    rejected: "Odbijeno",
  },
  timeline: {
    received: "Poslato",
    confirmed: "Potvrđeno",
    preparing: "Kuva se",
    assigned: "Kurir",
    on_the_way: "Na putu",
    delivered: "Dostavljeno",
  },

  status: {
    pending: {
      label: "Čeka se potvrda",
      description: "Restoran je primio vašu porudžbinu i uskoro će je potvrditi.",
    },
    confirmed: {
      label: "Porudžbina je potvrđena",
      description: "Restoran je prihvatio vašu porudžbinu.",
    },
    preparing: {
      label: "U pripremi",
      description: "Vaša hrana se upravo priprema.",
    },
    ready: {
      label: "Spremno za preuzimanje",
      description: "Vaša porudžbina je spakovana i čeka kurira.",
    },
    assigned: {
      label: "Kurir je na putu do restorana",
      description: "Kurir je preuzeo vašu porudžbinu i kreće po nju.",
    },
    picked_up: {
      label: "Preuzeto",
      description: "Kurir ima vašu porudžbinu i kreće na put.",
    },
    in_transit: {
      label: "Na putu do vas",
      description: "Vaš kurir je na putu. Pratite ga na mapi ispod.",
    },
    delivered: {
      label: "Dostavljeno",
      description: "Vaša porudžbina je stigla. Prijatno.",
    },
    cancelled: {
      label: "Otkazano",
      description: "Ova porudžbina je otkazana.",
    },
    rejected: {
      label: "Restoran je odbio porudžbinu",
      description: "Restoran nije mogao da prihvati ovu porudžbinu.",
    },
  },

  step: {
    received: {
      label: "Porudžbina poslata",
      description: "Poslali smo vašu porudžbinu restoranu.",
    },
    confirmed: {
      label: "Potvrđeno",
      description: "Restoran je prihvatio vašu porudžbinu.",
    },
    preparing: {
      label: "Priprema",
      description: "Vaša hrana se priprema.",
    },
    assigned: {
      label: "Kurir dodeljen",
      description: "Kurir preuzima vašu porudžbinu.",
    },
    on_the_way: {
      label: "Na putu",
      description: "Vaša porudžbina je krenula ka vama.",
    },
    delivered: {
      label: "Dostavljeno",
      description: "Vaša porudžbina je stigla.",
    },
  },

  payment: {
    cash: "Plaćanje pouzećem",
    card: "Kartica",
    wallet: "Novčanik",
  },

  courier: {
    fallbackName: "Vaš kurir",
    deliveringBy: "Dostava: {{vehicle}}",
    vehicle: {
      bike: "Bicikl",
      scooter: "Skuter",
      motorcycle: "Motor",
      car: "Automobil",
    },
  },

  address: {
    apartment: "Stan {{value}}",
    floor: "Sprat {{value}}",
  },

  number: "Porudžbina #{{number}}",
  itemCount_one: "{{count}} stavka",
  itemCount_few: "{{count}} stavke",
  itemCount_other: "{{count}} stavki",

  placedRelative: {
    today: "Danas, {{time}}",
    yesterday: "Juče, {{time}}",
    older: "{{date}}, {{time}}",
  },

  ago: {
    justNow: "Upravo sada",
    hours: "pre {{count}} h",
    days: "pre {{count}} d",
  },

  eta: {
    label: "Procenjeno vreme dolaska",
    minutes_one: "{{count}} min",
    minutes_few: "{{count}} min",
    minutes_other: "{{count}} min",
    arriving: "Stiže svakog trenutka",
    unknown: "Još se računa",
  },

  list: {
    title: "Vaše porudžbine",
    subtitle: "Sve što ste poručili, najnovije prvo.",
    guestTitle: "Prijavite se da vidite svoje porudžbine",
    guestDescription: "Vaša istorija porudžbina je vezana za nalog.",
    tabs: {
      active: "Aktivne",
      past: "Prethodne",
      all: "Sve",
    },
    empty: {
      active: {
        title: "Nema porudžbina u toku",
        description:
          "Kada napravite porudžbinu, pojaviće se ovde da biste mogli da je pratite.",
        action: "Pronađite nešto za jelo",
      },
      past: {
        title: "Ovde još nema ničega",
        description: "Vaše dostavljene i otkazane porudžbine biće prikazane ovde.",
      },
    },
    error: {
      title: "Nismo uspeli da učitamo vaše porudžbine",
      description: "Proverite internet vezu i pokušajte ponovo.",
    },
  },

  history: {
    loading: "Učitavanje vaših porudžbina",
    filterLabel: "Filtriraj porudžbine",
    showAll: "Prikaži sve porudžbine",
    pagesLabel: "Stranice istorije porudžbina",
    pageOf: "Strana {{current}} od {{total}}",
    error: {
      description: "Ovo je problem sa vezom, a ne sa vašim porudžbinama.",
    },
    tabs: {
      all: "Sve",
      active: "Aktivne",
      delivered: "Dostavljene",
      cancelled: "Otkazane",
    },
    empty: {
      all: {
        title: "Još nema porudžbina",
        description:
          "Kada napravite prvu porudžbinu, biće ovde, spremna da je poručite ponovo.",
      },
      active: {
        title: "Ništa nije u toku",
        description: "Trenutno nemate porudžbina koje se pripremaju ili su na putu.",
      },
      delivered: {
        title: "Još nema dostavljenih porudžbina",
        description: "Porudžbine se pojavljuju ovde kada stignu.",
      },
      cancelled: {
        title: "Nema otkazanih porudžbina",
        description: "Ovde nema ničega - baš kako i treba.",
      },
    },
  },

  detail: {
    title: "Porudžbina",
    itemsHeading: "Vaša porudžbina",
    helpContact: "Pišite nam na {{email}}",
    noLongerActive: "Ova porudžbina više nije aktivna.",
    cancelled: "Porudžbina je otkazana",
    cancelFailed: "Otkazivanje nije uspelo",
    placeFailed: "Slanje porudžbine nije uspelo",
    restaurantLost: "Izgubili smo vezu sa restoranom",
    restaurantLostHint: "Otvorite korpu ponovo i pokušajte opet.",
    confirmSoon: "{{name}} će je potvrditi za koji trenutak.",
    confirmSoonFallback: "Restoran će je potvrditi za koji trenutak.",
    awaitingConfirmation: "Čeka potvrdu",
    numbered: "Porudžbina #{{number}}",
    summaryHeading: "Pregled plaćanja",
    deliveryHeading: "Dostava",
    notesHeading: "Napomene za dostavu",
    restaurantNotes: "Napomena za restoran",
    placedAt: "Poručeno {{value}}",
    notFound: {
      title: "Porudžbina nije pronađena",
      description: "Ova porudžbina ne postoji ili pripada drugom nalogu.",
    },
    error: {
      title: "Nismo uspeli da prikažemo ovu porudžbinu",
      description: "Proverite internet vezu i pokušajte ponovo.",
      connection: "Veza je prekinuta usput. Vaša porudžbina nije ugrožena.",
    },
    noAddress: "Nema zabeležene adrese",
    placed: "Vaša porudžbina je poslata.",
    placeFailedLong:
      "Slanje porudžbine nije uspelo. Ništa nije naplaćeno - pokušajte ponovo.",
    cancelledSuccess: "Porudžbina je otkazana",
    cancelFailedShort: "Otkazivanje porudžbine nije uspelo",
    noReasonRefund: "Razlog nije naveden. Ako ste naplaćeni, novac će biti vraćen.",
    cancelledByCustomerShort: "Kupac je otkazao",
    totalToPay: "Ukupno za plaćanje",
    estimatedDelivery: "Procenjena dostava",
    youSave: "Uštedeli ste",
  },

  actions: {
    track: "Prati porudžbinu",
    reorder: "Poruči ponovo",
    rate: "Oceni porudžbinu",
    cancel: "Otkaži porudžbinu",
    viewReceipt: "Prikaži račun",
    callRestaurant: "Pozovi restoran",
    callCourier: "Pozovi kurira",
    help: "Zatraži pomoć",
  },

  cancel: {
    title: "Otkazati ovu porudžbinu?",
    description: "Restoran će odmah biti obavešten. Ovo ne možete poništiti.",
    confirm: "Da, otkaži",
    dismiss: "Zadrži",
    reasonHint: "Recite restoranu zašto - stiže im na ekran u kuhinji.",
    reasons: {
      changedMind: "Predomislio sam se",
      byMistake: "Poručeno greškom",
      tooLong: "Predugo traje",
      other: "Nešto drugo",
    },
    reasonPlaceholder: "Recite im zašto",
    success: "Vaša porudžbina je otkazana.",
    tooLate:
      "Ova porudžbina je previše odmakla da bi se ovde otkazala - restoran to obično najbrže reši.",
    longDescription:
      "Restoranu će biti javljeno da prekine pripremu. Ovo ne možete poništiti - morali biste da napravite novu porudžbinu.",
    cancelling: "Otkazivanje...",
  },

  support: {
    getHelp: "Zatraži pomoć oko porudžbine",
    shortTitle: "Podrška",
    messageCourier: "Pošalji poruku kuriru",
    title: "Pomoć za porudžbinu #{{number}}",
    description:
      "Nešto nije u redu sa ovom porudžbinom? Restoran to obično najbrže reši dok se porudžbina još priprema.",
    callNamed: "Pozovi {{name}}",
  },

  reorder: {
    success: "Vraćeno u vašu korpu.",
    replacedBasket: "Vaša korpa je zamenjena ovom porudžbinom.",
    unavailable: "Neka jela više nisu dostupna pa su izostavljena.",
    allUnavailable: "Ništa iz ove porudžbine trenutno nije dostupno.",
  },

  rating: {
    title: "Kako je bilo?",
    subtitle: "Vaša ocena pomaže restoranu {{name}} i drugim kupcima.",
    restaurantHeading: "Hrana",
    courierHeading: "Dostava",
    commentLabel: "Želite li nešto da dodate?",
    commentPlaceholder: "Napišite šta je bilo dobro, a šta nije.",
    foodPlaceholder: "Kakva je bila hrana? (opciono)",
    deliveryPlaceholder: "Kakva je bila dostava? (opciono)",
    submitting: "Slanje vaše recenzije",
    submit: "Pošalji recenziju",
    skip: "Ne sada",
    success: "Hvala na povratnoj informaciji.",
    alreadyRated: "Već ste ocenili ovu porudžbinu.",
    scores: {
      1: "Loše",
      2: "Nije bilo sjajno",
      3: "U redu",
      4: "Dobro",
      5: "Odlično",
    },
    notGreat: "Nije bilo sjajno",
    tapToRate: "Dodirnite da ocenite",
    activeHeading: "Sve što je na putu do vas",
    pastHeading: "Dostavljene i otkazane porudžbine",
    emptyActive: "Nema aktivnih porudžbina",
    emptyPast: "Nema prethodnih porudžbina",
    emptyActiveHint: "Kada poručite, možete je pratiti ovde od kuhinje do vaših vrata.",
    emptyPastHint: "Dostavljene i otkazane porudžbine se pojavljuju ovde.",
    thanks: "Hvala na povratnoj informaciji",
    submitFailed: "Slanje ocene nije uspelo",
    stars_one: "{{count}} zvezdica",
    stars_few: "{{count}} zvezdice",
    stars_other: "{{count}} zvezdica",
    submitted: "Hvala na vašoj oceni.",
    submitFailedShort: "Slanje ocene nije uspelo",
    yourReview: "Vaša ocena",
    howDidItGo: "Kako je prošlo?",
    thanksHelps: "Hvala - ovo pomaže drugima da izaberu.",
    helpsOthers:
      "Vaša ocena pomaže restoranu i kuriru, a drugima olakšava izbor.",
  },

  confirmed: {
    title: "Porudžbina je poslata",
    subtitle: "{{name}} je primio vašu porudžbinu i potvrdiće je za koji trenutak.",
    trackAction: "Pratite porudžbinu",
    homeAction: "Nastavi pregledanje",
    loading: "Učitavanje vaše porudžbine",
    heading: "Vaša porudžbina je na putu do restorana",
    orderNumber: "Broj porudžbine",
    placed: "Poručeno",
    payingBy: "Način plaćanja",
    payingByValue: "Način plaćanja: {{method, lowercase}}",
    error: {
      title: "Nismo uspeli da učitamo vašu porudžbinu",
      description:
        "Vaša porudžbina je poslata - ova stranica samo nije uspela da je preuzme. Nalazi se u istoriji porudžbina.",
    },
    confirmSoonLong:
      "{{name}} će je potvrditi u narednih nekoliko minuta. Javljamo vam čim se to desi.",
    fallbackRestaurant: "Restoran",
  },

  tracking: {
    title: "Praćenje",
    mapHeading: "Mapa porudžbine",
    mapUnavailable: "Mapa trenutno nije dostupna.",
    courierHeading: "Vaš kurir",
    courierPending: "Kurir će biti dodeljen čim hrana bude spremna.",
    liveLocation: "Lokacija uživo",
    lastUpdated: "Ažurirano {{value}}",
    arrivedTitle: "Vaša porudžbina je stigla",
    arrivedBody: "Prijatno.",
  },

  /** Push i sačuvana obaveštenja, na jeziku primaoca. */
  notification: {
    preparingBody: "Vaša porudžbina se priprema",
    readyBody: "Vaša porudžbina je spremna",
    order_placed: {
      title: "Nova porudžbina",
      body: "Porudžbina #{{number}} čeka vašu potvrdu",
    },
    order_available: {
      title: "Dostupna dostava",
      body: "Porudžbina #{{number}} je spremna za preuzimanje",
    },
    order_confirmed: {
      title: "Porudžbina potvrđena",
      body: "Vaša porudžbina #{{number}} je potvrđena",
    },
    order_rejected: {
      title: "Porudžbina odbijena",
      body: "Vaša porudžbina #{{number}} je odbijena",
    },
    order_preparing: {
      title: "U pripremi",
      body: "Porudžbina #{{number}} se priprema",
    },
    order_ready: {
      title: "Porudžbina spremna",
      body: "Porudžbina #{{number}} je spremna i čeka kurira",
    },
    order_cancelled: {
      title: "Porudžbina otkazana",
      body: "Restoran je otkazao vašu porudžbinu #{{number}}",
    },
    order_assigned: {
      title: "Kurir dodeljen",
      body: "Kurir preuzima porudžbinu #{{number}}",
    },
    order_picked_up: {
      title: "Preuzeto",
      body: "Porudžbina #{{number}} je krenula iz restorana",
    },
    order_in_transit: {
      title: "Na putu",
      body: "Porudžbina #{{number}} je na putu do vas",
    },
    order_delivered: {
      title: "Dostavljeno",
      body: "Porudžbina #{{number}} je dostavljena",
    },
    rejectedFallbackReason: "Restoran je odbio porudžbinu",
    cancelledFallbackReason: "Restoran je otkazao porudžbinu",
    noReason: "Razlog nije naveden",
    rejectedWithReason: "Vaša porudžbina #{{number}} je odbijena: {{reason}}",
    cancelledWithReason: "Vaša porudžbina #{{number}} je otkazana: {{reason}}",
    cancelledByCustomer: "Kupac je otkazao porudžbinu #{{number}}",
    readyForPickup: "Vaša porudžbina #{{number}} je spremna za preuzimanje",
    newOrderValue: "Porudžbina #{{number}} - {{total}}",
    channelOrders: "Obaveštenja o porudžbinama",
    channelOrdersHint: "Potvrde, preuzimanja i dostave za porudžbine u toku.",
    channelPromotions: "Ponude i novosti",
    channelPromotionsHint: "Akcije i novi restorani. Nikada obaveštenja o porudžbinama.",
  },
};
