/** Serbian seller-portal copy. */

export default {
  nav: {
    dashboard: "Pregled",
    orders: "Porudžbine",
    menu: "Meni",
    analytics: "Analitika",
    settings: "Podešavanja",
    portal: "Portal restorana",
  },

  dashboard: {
    title: "Pregled",
    greeting: "Drago nam je što vas vidimo, {{name}}",
    openNow: "Otvoreno za porudžbine",
    closedNow: "Zatvoreno",
    stats: {
      today: "Danas",
      week: "Ove nedelje",
      month: "Ovog meseca",
      orders: "Porudžbine",
      earnings: "Zarada",
      averageOrder: "Prosečna porudžbina",
      rating: "Ocena",
      pending: "Čeka vas",
    },
    liveOrders: "Porudžbine u toku",
    noLiveOrders: "Trenutno ništa nije u toku.",
  },

  orders: {
    title: "Porudžbine",
    tabs: {
      new: "Nove",
      active: "U toku",
      completed: "Završene",
      all: "Sve",
    },
    empty: {
      new: {
        title: "Nema novih porudžbina",
        description: "Nove porudžbine se pojavljuju ovde čim ih kupac napravi.",
      },
      active: {
        title: "Kuhinja je prazna",
        description: "Porudžbine koje ste potvrdili pojaviće se ovde.",
      },
      completed: {
        title: "Još nema završenih porudžbina",
        description: "Dostavljene i otkazane porudžbine su navedene ovde.",
      },
    },
    actions: {
      accept: "Prihvati",
      reject: "Odbij",
      startPreparing: "Počni pripremu",
      markReady: "Označi kao spremno",
      cancel: "Otkaži porudžbinu",
      viewDetails: "Prikaži detalje",
    },
    accepted: "Porudžbina #{{number}} je prihvaćena.",
    rejected: "Porudžbina #{{number}} je odbijena.",
    preparing: "Porudžbina #{{number}} se priprema.",
    ready: "Porudžbina #{{number}} je spremna za preuzimanje.",
    cancelled: "Porudžbina #{{number}} je otkazana.",
    rejectTitle: "Odbiti ovu porudžbinu?",
    rejectDescription: "Kupac se odmah obaveštava. Recite mu zašto.",
    rejectReasonLabel: "Razlog (opciono)",
    rejectReasonPlaceholder: "Nestalo sastojka, kuhinja je popunjena...",
    cancelTitle: "Otkazati ovu porudžbinu?",
    cancelDescription: "Kupac i dodeljeni kurir se odmah obaveštavaju.",
    customerNotes: "Napomena kupca",
    prepTime: "Procenjeno vreme pripreme",
    newOrderToast: "Nova porudžbina #{{number}}",
  },

  menu: {
    title: "Meni",
    subtitle: "Šta kupci mogu da poruče od vas.",
    addDish: "Dodaj jelo",
    editDish: "Izmeni jelo",
    deleteDish: "Obriši jelo",
    deleteTitle: "Obrisati ovo jelo?",
    deleteDescription:
      "Uklanja se iz vašeg menija. Ranije porudžbine zadržavaju svoj zapis o njemu.",
    available: "Dostupno",
    unavailable: "Rasprodato",
    toggleAvailability: "Dostupnost",
    markedAvailable: "{{name}} je ponovo na meniju.",
    markedUnavailable: "{{name}} je označeno kao rasprodato.",
    created: "{{name}} je dodato u vaš meni.",
    updated: "{{name}} je ažurirano.",
    deleted: "{{name}} je uklonjeno iz vašeg menija.",
    empty: {
      title: "Vaš meni je prazan",
      description: "Dodajte prvo jelo i kupci mogu da počnu da poručuju.",
    },
    filterAll: "Sve",
    searchPlaceholder: "Pretraži svoj meni",

    form: {
      nameLabel: "Naziv jela",
      namePlaceholder: "npr. Margarita",
      categoryLabel: "Kategorija",
      categoryPlaceholder: "Izaberite kategoriju",
      priceLabel: "Cena",
      pricePlaceholder: "0.00",
      descriptionLabel: "Opis",
      descriptionPlaceholder: "Šta sadrži i po čemu je dobro.",
      availableLabel: "Dostupno za poručivanje",
      imagesLabel: "Fotografije",
      imagesHint: "Prva fotografija je ona koju kupci vide na kartici. Najviše 6.",
      addImages: "Dodaj fotografije",
      removeImage: "Ukloni fotografiju",
      submitCreate: "Dodaj u meni",
      submitUpdate: "Sačuvaj izmene",
      submitting: "Čuvanje...",
    },
  },

  promotion: {
    legend: "Akcija",
    enableLabel: "Stavi ovo jelo na akciju",
    enableHint:
      "Snižena jela se prikupljaju u „Akcije u vašoj blizini“ na početnom ekranu kupca i nose oznaku popusta svuda gde se pojave.",
    typeLabel: "Vrsta popusta",
    percentOff: "Procenat popusta",
    amountOff: "Iznos popusta",
    preview:
      "Kupci plaćaju <0>{{discounted}}</0> umesto <1>{{original}}</1> — {{percent}}% popusta, ušteda od <2>{{saving}}</2> po jelu.",
    previewHint:
      "Postavite cenu i popust da vidite koliko će kupci platiti. Akcija ne sme da spusti cenu jela ispod {{min}}.",
    previewHintPercent:
      "Postavite cenu i popust da vidite koliko će kupci platiti. Akcija ne sme da spusti cenu jela ispod {{min}}, niti da pređe {{max}}%.",
    badgeLabel: "Tekst oznake (opciono)",
    badgePlaceholder: "npr. Vikend akcija",
    badgeHint: "Prikazuje se uz popust. Ostavite prazno da se vidi samo procenat.",
    scheduleTitle: "Neka traje određeni period (opciono)",
    scheduleHint: "Ostavite oba prazna i akcija traje dok je ne isključite.",
    startsAt: "Počinje",
    endsAt: "Završava se",
    active: "Na akciji",
  },

  analytics: {
    title: "Analitika",
    subtitle: "Kako restoran posluje.",
    range: {
      week: "Poslednjih 7 dana",
      month: "Poslednjih 30 dana",
      year: "Poslednjih 12 meseci",
    },
    revenue: "Prihod",
    orderCount: "Porudžbine",
    averageOrderValue: "Prosečna vrednost porudžbine",
    topDishes: "Najprodavanije",
    ordersByHour: "Porudžbine po satu",
    ordersByDay: "Porudžbine po danu",
    noData: "Još nema dovoljno podataka",
    noDataDescription: "Vratite se kada prođe nekoliko porudžbina.",
  },

  settings: {
    title: "Podešavanja",
    subtitle: "Podaci o vašem restoranu, onako kako ih kupci vide.",
    saved: "Vaše izmene su sačuvane.",
    saving: "Čuvanje...",

    profile: {
      heading: "Profil restorana",
      name: "Naziv",
      description: "Opis",
      cuisine: "Kuhinja",
      phone: "Telefon",
      email: "Imejl",
      logo: "Logo",
      cover: "Naslovna fotografija",
      gallery: "Fotografije",
    },

    location: {
      heading: "Lokacija",
      address: "Adresa",
      city: "Grad",
      zip: "Poštanski broj",
      pinHint: "Prevucite oznaku na mesto odakle kuriri preuzimaju.",
    },

    hours: {
      heading: "Radno vreme",
      subtitle: "Kupci mogu da poručuju samo dok ste otvoreni.",
      openAllDay: "Otvoreno 24 sata",
      closedAllDay: "Zatvoreno",
      opensAt: "Otvara se",
      closesAt: "Zatvara se",
      overnight: "Radi i posle ponoći",
      timezone: "Vremenska zona",
      timezoneHint: "Vaše radno vreme se računa u ovoj zoni, a ne u serverskoj.",
    },

    delivery: {
      heading: "Dostava",
      estimate: "Procena vremena dostave",
      estimateHint: "Ono što kupci vide na vašoj kartici, npr. 30-45.",
      acceptingOrders: "Prima porudžbine",
      acceptingOrdersHint:
        "Isključite da biste pauzirali nove porudžbine bez zatvaranja.",
    },
  },
};
