/**
 * Administratorska konzola.
 */
export default {
  title: "Administratorska konzola",
  subtitle: "Odobravajte restorane, proveravajte kurire, suspendujte naloge. Svaka izmena se beleži.",
  openConsole: "Otvori administratorsku konzolu",

  overview: {
    pendingRestaurants: "Restorani na čekanju",
    pendingCouriers: "Kuriri na čekanju",
    suspendedUsers: "Suspendovani nalozi",
    activeOrders: "Porudžbine u toku",
  },

  tabs: {
    restaurants: "Restorani",
    couriers: "Kuriri",
    users: "Nalozi",
    orders: "Porudžbine",
    audit: "Dnevnik izmena",
  },

  filters: {
    all: "Sve",
    search: "Pretraga po imenu, imejlu ili telefonu",
  },

  restaurantStatus: {
    pending: "Čeka odobrenje",
    approved: "Aktivan",
    rejected: "Odbijen",
    suspended: "Suspendovan",
  },
  courierStatus: {
    pending: "Na čekanju",
    verified: "Proveren",
    rejected: "Odbijen",
  },

  columns: {
    name: "Naziv",
    owner: "Vlasnik",
    city: "Grad",
    status: "Status",
    joined: "Pridružio se",
    email: "Imejl",
    phone: "Telefon",
    role: "Uloga",
    vehicle: "Vozilo",
    deliveries: "Dostave",
    actions: "Radnje",
    when: "Kada",
    admin: "Administrator",
    action: "Radnja",
    target: "Cilj",
    reason: "Razlog",
  },

  actions: {
    approve: "Odobri",
    reject: "Odbij",
    suspend: "Suspenduj",
    reinstate: "Vrati",
    verify: "Potvrdi",
    resetToPending: "Vrati na čekanje",
    suspendAccount: "Suspenduj nalog",
    unsuspendAccount: "Ukini suspenziju",
    cancelOrder: "Otkaži porudžbinu",
  },

  reason: {
    title: "{{action}}: {{name}}",
    label: "Razlog",
    placeholder: "Šta se desilo, za dnevnik izmena",
    required: "Za ovo je razlog obavezan.",
    optional: "Nije obavezno, ali pomaže onome ko kasnije čita dnevnik.",
    confirm: "Potvrdi",
    cancel: "Otkaži",
  },

  orders: {
    hint: "Završava bilo koju nedovršenu porudžbinu, oslobađa kurira i obaveštava sve uključene.",
    orderId: "ID porudžbine",
    orderIdPlaceholder: "ID porudžbine iz baze ili tiketa podrške",
  },

  suspendedSince: "Suspendovan {{date}}",
  adminBadge: "Administrator",
  saved: "Sačuvano",
  failed: "To nije uspelo",
  loadFailed: "Nije moguće učitati ovu listu",
  empty: "Ovde nema ničega",
  page: "Strana {{page}} od {{pages}}",
  previous: "Prethodna",
  next: "Sledeća",
};
