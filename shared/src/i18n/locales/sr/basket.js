/** Serbian basket and checkout copy. */

export default {
  title: "Korpa",
  open: "Otvori korpu",
  a11yWithCount: "Korpa, {{items}}",
  a11yEmpty: "Korpa, prazna",
  openWithCount: "Prikaži korpu, {{items}}, {{total}}",
  panelDescription: "Pregledajte i izmenite stavke u korpi pre plaćanja.",
  loading: "Učitavanje korpe",
  viewMenu: "Prikaži meni",
  soldOutBody: "Kuhinji je ovo ponestalo danas. Trebalo bi da se vrati sutra.",
  kitchenNote: "Napomena za kuhinju (opciono)",
  kitchenNotePlaceholder: "Bez luka, dodatne salvete, alergije...",
  kitchenNoteHint: "Opciono - alergije, želje, bilo šta što kuhinja treba da zna.",
  kitchenNoteShortPlaceholder: "Bez krastavaca, ekstra ljuto…",
  itemCount_one: "{{count}} stavka",
  itemCount_few: "{{count}} stavke",
  itemCount_other: "{{count}} stavki",

  empty: {
    title: "Vaša korpa je prazna",
    description: "Dodajte nešto iz restorana u vašoj blizini i pojaviće se ovde.",
    action: "Pregledaj restorane",
  },

  line: {
    quantity: "Količina",
    increase: "Dodaj još jedno",
    decrease: "Ukloni jedno",
    remove: "Ukloni {{name}}",
    removed: "{{name}} je uklonjeno iz korpe.",
    unavailable: "Više nije dostupno",
    instructions: "Posebne napomene:",
    deal: "Akcija",
    addFailedLong: "Dodavanje stavke nije uspelo. Pokušajte ponovo.",
    updateFailedLong: "Ažuriranje količine nije uspelo.",
    removeFailedLong: "Uklanjanje stavke nije uspelo.",
    clearFailedLong: "Pražnjenje korpe nije uspelo.",
    instructionsHint:
      "Restoran će se potruditi, ali ne može uvek da ispuni svaki zahtev.",
    reorderPartialWithSkipped:
      "{{added}} dodato. {{skipped}} više nije dostupno.",
  },

  summary: {
    subtotal: "Međuzbir",
    deliveryFee: "Dostava",
    serviceFee: "Naknada za uslugu",
    priorityFee: "Prioritetna dostava",
    tip: "Napojnica kuriru",
    tax: "Porez",
    total: "Ukupno",
    includesFees: "Uključuje sve naknade",
    title: "Pregled cene",
    extrasAtCheckout: "Napojnica i eventualna prioritetna naknada dodaju se pri plaćanju.",
    savings: "Uštedeli ste {{amount}}",
    discount: "Popust",
    hintLabel: "Šta je {{label}}? {{hint}}",
    deliveryFeeHint: "Fiksna naknada koja pokriva dostavu vaše porudžbine.",
    serviceFeeHint: "Pokriva rad platforme, obradu plaćanja i podršku.",
    priorityFeeHint: "Stavlja vašu porudžbinu na početak reda za kurire.",
  },

  clear: {
    action: "Isprazni korpu",
    title: "Isprazniti korpu?",
    description: "Sva jela iz nje biće uklonjena. Ovo se ne može poništiti.",
    confirm: "Da, isprazni",
    success: "Vaša korpa je prazna.",
  },

  differentRestaurant: {
    title: "Započeti novu korpu?",
    description:
      "U vašoj korpi su jela iz restorana {{current}}. Dodavanjem ovoga korpa se prazni i počinjete iznova sa restoranom {{next}}.",
    confirm: "Isprazni korpu i nastavi",
    keep: "Zadrži moju korpu",
    anotherRestaurant: "drugog restorana",
    addBody: "U vašoj korpi su stavke iz restorana {{current}}. Dodavanjem ovog jela korpa se prazni.",
    reorderBody: "U vašoj korpi su stavke iz restorana {{current}}. Ponovnim poručivanjem korpa se prazni.",
    emptyAndAdd: "Isprazni korpu i dodaj",
    emptyAndReorder: "Isprazni korpu i poruči ponovo",
    body: "U vašoj korpi su stavke iz restorana <0>{{current}}</0>. Možete poručivati samo iz jednog restorana odjednom, pa će te stavke biti uklonjene.",
    bodyWithNext: "U vašoj korpi su stavke iz restorana <0>{{current}}</0>. Možete poručivati samo iz jednog restorana odjednom, pa će te stavke biti uklonjene i zamenjene vašom porudžbinom iz restorana {{next}}.",
  },

  heading: "Vaša korpa sadrži stavke iz drugog restorana",
  addedToBasket: "Dodato u korpu",
  addItem: "Dodaj · {{price}}",
  addFailed: "Dodavanje stavke nije uspelo",
  replaceFailed: "Zamena korpe nije uspela",
  updateFailed: "Ažuriranje korpe nije uspelo",
  removeFailed: "Uklanjanje stavke nije uspelo",
  removeItem: "Ukloni stavku",
  decreaseQuantity: "Smanji količinu",
  increaseQuantity: "Povećaj količinu",
  reorderNoneAvailable: "Nijedna od ovih stavki više nije dostupna",
  reorderPartial_one: "{{count}} stavka dodata",
  reorderPartial_few: "{{count}} stavke dodate",
  reorderPartial_other: "{{count}} stavki dodato",
  reorderUnavailable: "{{names}} više nije dostupno.",
  added: "{{name}} je dodato u korpu.",
  goToCheckout: "Idi na plaćanje",
  chooseAddress: "Izaberite adresu za dostavu",
  orderingFrom: "Poručujete iz",
  addMore: "Dodaj još stavki",

  checkout: {
    title: "Plaćanje",
    loading: "Učitavanje vaše porudžbine",
    placeOrder: "Poruči",
    editOrder: "Izmeni porudžbinu",
    secureHint: "Vaši podaci se šalju preko šifrovane veze.",
    placing: "Slanje porudžbine",
    terms:
      "Slanjem porudžbine prihvatate naše Uslove korišćenja i Politiku privatnosti. Možete otkazati bez naknade sve dok kurir ne preuzme hranu.",

    error: {
      title: "Došlo je do problema pri plaćanju",
      description:
        "Vaša korpa je sačuvana i ništa nije naplaćeno. Pokušajte ponovo za koji trenutak.",
    },

    empty: {
      title: "Nema šta da se plati",
      description:
        "Vaša korpa je prazna. Pronađite nešto što vam prija i pojaviće se ovde.",
      action: "Pregledaj restorane",
    },

    blockers: {
      address: "Izaberite adresu za dostavu da biste nastavili.",
      payment: "Izaberite kako želite da platite.",
      restaurant: "Izgubili smo podatke o restoranu - osvežite stranicu.",
    },

    address: {
      title: "Adresa za dostavu",
      description: "Gde kurir treba da donese vašu porudžbinu?",
      change: "Promeni adresu",
      add: "Dodaj adresu",
      none: "Adresa još nije izabrana.",
      emptyTitle: "Još nema adrese za dostavu",
      emptyDescription: "Dodajte adresu da kurir zna gde da donese vašu porudžbinu.",
    },

    speed: {
      title: "Brzina dostave",
      description: "Obično {{estimate}} iz ovog restorana.",
      legend: "Izaberite brzinu dostave",
      included: "Uključeno",
    },

    payment: {
      title: "Plaćanje",
      description: "Plaćate kada porudžbina stigne.",
      legend: "Izaberite način plaćanja",
    },

    tip: {
      title: "Napojnica kuriru",
      description: "Opciono, i u celosti ide osobi koja donosi vašu porudžbinu.",
      none: "Bez napojnice",
      customLabel: "Proizvoljan iznos napojnice",
      customPlaceholder: "Drugo",
      shortDescription: "100% ide osobi koja donosi porudžbinu",
    },

    notes: {
      title: "Napomene za dostavu",
      description: "Sve što restoran ili kurir treba da znaju.",
      label: "Napomene za dostavu",
      placeholder:
        "Interfon ne radi - molim pozovite. Ostavite ispred vrata ako se niko ne javi.",
      count: "{{used}}/{{max}} znakova",
      shortPlaceholder: "Alergije, šifra interfona, bilo šta drugo",
    },
  },
};
