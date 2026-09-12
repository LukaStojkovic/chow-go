/** Serbian basket and checkout copy. */

export default {
  title: "Korpa",
  open: "Otvori korpu",
  a11yWithCount: "Korpa, {{items}}",
  a11yEmpty: "Korpa, prazna",
  itemCount_one: "{{count}} stavka",
  itemCount_few: "{{count}} stavke",
  itemCount_other: "{{count}} stavki",

  empty: {
    title: "Vaša korpa je prazna",
    description: "Dodajte jelo i pojaviće se ovde.",
    action: "Pregledaj restorane",
  },

  line: {
    quantity: "Količina",
    increase: "Dodaj još jedno",
    decrease: "Ukloni jedno",
    remove: "Ukloni {{name}}",
    removed: "{{name}} je uklonjeno iz korpe.",
    unavailable: "Više nije dostupno",
  },

  summary: {
    title: "Pregled porudžbine",
    subtotal: "Međuzbir",
    deliveryFee: "Dostava",
    serviceFee: "Naknada za uslugu",
    priorityFee: "Prioritetna dostava",
    tip: "Napojnica kuriru",
    tax: "Porez",
    total: "Ukupno",
    savings: "Uštedeli ste {{amount}}",
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
    confirm: "Započni novu korpu",
  },

  added: "{{name}} je dodato u korpu.",
  goToCheckout: "Idi na plaćanje",

  checkout: {
    title: "Plaćanje",
    loading: "Učitavanje vaše porudžbine",
    placeOrder: "Poruči",
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
    },

    notes: {
      title: "Napomene za dostavu",
      description: "Sve što restoran ili kurir treba da znaju.",
      label: "Napomene za dostavu",
      placeholder:
        "Interfon ne radi - molim pozovite. Ostavite ispred vrata ako se niko ne javi.",
      count: "{{used}}/{{max}} znakova",
    },
  },
};
