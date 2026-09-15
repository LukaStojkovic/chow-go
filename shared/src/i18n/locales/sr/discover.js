/** Serbian discovery, search and home-feed copy. */

export default {
  pageHeading: "Restorani i jela koja dostavljaju na adresu {{address}}",
  categoryRailLabel: "Filtriraj po kategoriji",

  search: {
    placeholder: "Pretražite restorane ili jela",
    label: "Pretraga restorana i jela",
    clear: "Obriši pretragu",
    hintPlaceholder: "Probajte restoran, kuhinju ili jelo",
    startOver: "Započni novu pretragu",
    removeRecent: "Ukloni {{term}} iz nedavnih pretraga",
    announce: "Pronađeno: {{restaurants}} i {{dishes}}",
    matches_one: "{{count}} rezultat",
    matches_few: "{{count}} rezultata",
    matches_other: "{{count}} rezultata",
    error: {
      title: "Pretraga ne odgovara",
      description: "Nismo uspeli da izvršimo pretragu. Vaš upit je sačuvan - pokušajte ponovo.",
    },
    noFilterMatches: {
      title: "Nema rezultata sa ovim filterima",
      description: "Vaši filteri su isključili sve rezultate. Ublažite ih da biste videli više.",
    },
    heading: "Pretraga",
    resultsFor: "Rezultati za „{{query}}“",
    recent: "Nedavne pretrage",
    clearRecent: "Obriši nedavne pretrage",
    noResults: {
      title: 'Ništa nije pronađeno za "{{query}}"',
      description:
        "Proverite kako je napisano, probajte širi pojam ili pogledajte šta trenutno dostavlja do vas.",
    },
    prompt: {
      title: "Šta tražite?",
      description: "Pretražujte po restoranu, jelu ili kuhinji.",
    },
    restaurantsHeading: "Restorani",
    dishesHeading: "Jela",
    countRestaurants_one: "{{count}} restoran",
    countRestaurants_few: "{{count}} restorana",
    countRestaurants_other: "{{count}} restorana",
    countDishes_one: "{{count}} jelo",
    countDishes_few: "{{count}} jela",
    countDishes_other: "{{count}} jela",
  },

  feed: {
    allTitle: "Sva jela u vašoj blizini",
    allDishes: "Sva jela",
    allSubtitle: "Sve što se dostavlja do vas",
    loadError: "Nismo uspeli da učitamo jela iz ove kategorije.",
    loadMoreError: "Nismo uspeli da učitamo još jela.",
    emptyAllTitle: "Nema jela u blizini",
    emptyAllBody:
      "Trenutno nijedan restoran ne dostavlja na ovu adresu. Probajte drugu adresu.",
    emptyCategoryTitle: "Nema ničega iz kategorije {{category, lowercase}} u blizini",
    emptyCategoryBody: "Ništa iz ove kategorije trenutno nije dostupno na vašoj adresi.",
    showAll: "Prikaži sva jela",
    loadMore: "Učitaj još",
    loadingMore: "Učitavanje još jela",
  },

  filters: {
    openNow: "Otvoreno sada",
    liveNow: "Aktivno sada",
    browseDeals: "Pogledaj ponude",
    freeDelivery: "Besplatna dostava",
    sortBy: "Sortiraj po",
    clearAll: "Poništi filtere",
    clear_one: "Poništi {{count}} filter",
    clear_few: "Poništi {{count}} filtera",
    clear_other: "Poništi {{count}} filtera",
  },
};
