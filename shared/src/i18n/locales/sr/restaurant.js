/** Serbian restaurant, menu and opening-hours copy. */

export default {
  availability: {
    notAccepting: "Ovaj restoran trenutno ne prima porudžbine.",
    closedUntil: "Trenutno zatvoreno. Otvara se ponovo u {{time}}.",
    closedNoSlot: "Trenutno zatvoreno. Pogledajte radno vreme za sledeći termin.",
    open: "Otvoreno",
    closed: "Zatvoreno",
    unavailable: "Nedostupno",
  },

  hours: {
    heading: "Radno vreme",
    closed: "Zatvoreno",
    allDay: "Otvoreno 24 sata",
    range: "{{from}} - {{to}}",
    today: "Danas",
    overnight: "Radi do ujutru",
  },

  menu: {
    heading: "Meni",
    untitledDish: "Stavka menija",
    otherCategory: "Ostalo",
    sectionNav: "Pređi na deo menija",
    empty: {
      title: "Meni je još prazan",
      description: "Ovaj restoran još nije dodao nijedno jelo.",
    },
    searchPlaceholder: "Pretraži ovaj meni",
    noMatches: "Ništa u ovom meniju ne odgovara pojmu „{{query}}“.",
    soldOut: "Rasprodato",
    addToBasket: "Dodaj u korpu",
    addNamed: "Dodaj {{name}} u korpu",
    closedCannotAdd: "Restoran je zatvoren",
  },

  info: {
    heading: "Informacije o restoranu",
    about: "O restoranu",
    address: "Adresa",
    phone: "Telefon",
    cuisine: "Kuhinja",
    deliveryEstimate: "Vreme dostave",
    deliveryFee: "Cena dostave",
    distance: "Udaljenost",
    viewInfo: "Info o restoranu",
  },

  favourite: {
    add: "Dodaj {{name}} u omiljene",
    remove: "Ukloni {{name}} iz omiljenih",
    added: "{{name}} je dodat u vaše omiljene.",
    removed: "{{name}} je uklonjen iz vaših omiljenih.",
  },

  notFound: {
    title: "Restoran nije pronađen",
    description: "Ovaj restoran ne postoji ili više nije na listi.",
    action: "Nazad na pregled",
  },

  error: {
    title: "Nismo uspeli da učitamo ovaj restoran",
    description: "Proverite internet vezu i pokušajte ponovo.",
  },

  favourites: {
    title: "Omiljeno",
    subtitle: "Mesta koja ste sačuvali za kasnije.",
    subtitleEmpty: "Restorani koje sačuvate pojaviće se ovde",
    loading: "Učitavanje sačuvanih restorana",
    savedCount_one: "{{count}} sačuvan restoran",
    savedCount_few: "{{count}} sačuvana restorana",
    savedCount_other: "{{count}} sačuvanih restorana",
    empty: {
      title: "Još nema omiljenih",
      description: "Dodirnite srce na bilo kom restoranu da ga sačuvate ovde za sledeći put.",
      action: "Pronađi restorane",
    },
  },

  reorder: {
    heading: "Poručite ponovo",
    subtitle: "Vaše nedavne dostave, na jedan dodir",
    adding: "Dodavanje u korpu",
  },

  nearby: {
    heading: "Restorani u vašoj blizini",
    count_one: "{{count}} dostavlja na vašu adresu",
    count_few: "{{count}} dostavljaju na vašu adresu",
    count_other: "{{count}} dostavlja na vašu adresu",
    loadError: "Nismo uspeli da učitamo restorane u vašoj blizini.",
    empty: {
      title: "Ovde još niko ne dostavlja",
      description:
        "Nijedan restoran trenutno ne pokriva ovu adresu. Probajte drugu sačuvanu adresu ili se vratite malo kasnije.",
    },
  },

  newInTown: {
    heading: "Novo u gradu",
    subtitle: "Pridružili se u poslednjih 30 dana i dostavljaju do vas",
  },

  popular: {
    heading: "Popularno upravo sada",
    subtitle: "Najporučivanije u vašoj blizini ove nedelje",
    loadError: "Nismo uspeli da učitamo popularna jela.",
  },

  promotions: {
    heading: "Akcije u vašoj blizini",
    subtitle: "Sniženo u restoranima koji dostavljaju na vašu adresu",
    loadError: "Nismo uspeli da osvežimo trenutne akcije.",
    badge: "{{value}}% popusta",
    srPrefix: "Akcija:",
  },
};
