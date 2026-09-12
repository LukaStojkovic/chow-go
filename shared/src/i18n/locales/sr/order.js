/**
 * Serbian order copy.
 *
 * Plural keys carry three forms - `_one` (1, 21, 31...), `_few` (2-4, 22-24...)
 * and `_other` - because that is what `Intl.PluralRules` reports for `sr`.
 * English only needs two, so the plural families in this file and in `en/` are
 * deliberately different sizes; the locale check knows to compare the base key.
 */

export default {
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

  detail: {
    title: "Porudžbina",
    itemsHeading: "Vaša porudžbina",
    summaryHeading: "Pregled plaćanja",
    deliveryHeading: "Dostava",
    notesHeading: "Napomene za dostavu",
    restaurantNotes: "Napomena za restoran",
    placedAt: "Poručeno {{value}}",
    notFound: {
      title: "Porudžbina nije pronađena",
      description: "Ova porudžbina ne postoji ili nije vaša.",
    },
    error: {
      title: "Nismo uspeli da prikažemo ovu porudžbinu",
      description: "Proverite internet vezu i pokušajte ponovo.",
    },
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
    dismiss: "Zadrži porudžbinu",
    success: "Vaša porudžbina je otkazana.",
    tooLate:
      "Ova porudžbina je previše odmakla da bi se ovde otkazala - restoran to obično najbrže reši.",
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
    submit: "Pošalji ocenu",
    skip: "Ne sada",
    success: "Hvala na povratnoj informaciji.",
    alreadyRated: "Već ste ocenili ovu porudžbinu.",
    stars_one: "{{count}} zvezdica",
    stars_few: "{{count}} zvezdice",
    stars_other: "{{count}} zvezdica",
  },

  confirmed: {
    title: "Porudžbina je poslata",
    subtitle: "{{name}} je primio vašu porudžbinu i potvrdiće je za koji trenutak.",
    trackAction: "Pratite porudžbinu",
    homeAction: "Nazad na pregled",
  },

  tracking: {
    title: "Praćenje",
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
  },
};
