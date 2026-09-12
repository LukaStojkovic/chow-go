/** Serbian profile, saved addresses and account settings copy. */

export default {
  title: "Profil",
  greeting: "Zdravo, {{name}}",
  memberSince: "Sa nama od {{date}}",

  sections: {
    account: "Nalog",
    addresses: "Sačuvane adrese",
    preferences: "Podešavanja",
    support: "Pomoć i podrška",
    danger: "Nalog",
  },

  account: {
    name: "Ime",
    email: "Imejl",
    phone: "Broj telefona",
    photo: "Profilna fotografija",
    changePhoto: "Promeni fotografiju",
    removePhoto: "Ukloni fotografiju",
    edit: "Izmeni profil",
    saved: "Vaš profil je ažuriran.",
    password: "Lozinka",
    changePassword: "Promeni lozinku",
    currentPassword: "Trenutna lozinka",
    newPassword: "Nova lozinka",
    confirmPassword: "Potvrdite novu lozinku",
    passwordChanged: "Vaša lozinka je promenjena. Ostajete prijavljeni ovde.",
  },

  preferences: {
    theme: "Izgled",
    themeLight: "Svetlo",
    themeDark: "Tamno",
    themeSystem: "Kao na uređaju",
    language: "Jezik",
    languageDescription: "Koristi se u celoj aplikaciji i za obaveštenja o porudžbinama.",
    notifications: "Obaveštenja",
  },

  address: {
    heading: "Sačuvane adrese",
    subtitle: "Najviše {{max}} adresa. Podrazumevana se koristi pri plaćanju.",
    add: "Dodaj adresu",
    addTitle: "Dodaj adresu za dostavu",
    editTitle: "Izmeni ovu adresu",
    save: "Sačuvaj adresu",
    update: "Ažuriraj adresu",
    delete: "Obriši adresu",
    deleteTitle: "Obrisati ovu adresu?",
    deleteDescription: "Biće uklonjena iz vaših sačuvanih adresa.",
    setDefault: "Postavi kao podrazumevanu",
    isDefault: "Podrazumevana",
    limitReached: "Dostigli ste ograničenje od {{max}} sačuvanih adresa.",
    saved: "Adresa je sačuvana.",
    deleted: "Adresa je obrisana.",

    confirmLocation: "Potvrdi lokaciju",
    changeLocation: "Promeni lokaciju",
    selectedLocation: "Izabrana lokacija",
    locationSelected: "Lokacija je izabrana",
    droppedPin: "Postavljena oznaka",
    pinnedLocation: "Označena lokacija ({{lat}}, {{lng}})",
    customLabelPlaceholder: "Dajte naziv ovoj adresi",

    typeLabel: "Vrsta adrese",
    typePlaceholder: "Izaberite vrstu...",
    buildingName: "Naziv zgrade",
    buildingNamePlaceholder: "npr. Green Life Residence",
    floor: "Sprat",
    floorPlaceholder: "npr. 4",
    apartment: "Stan",
    apartmentPlaceholder: "npr. 12A",
    entrance: "Ulaz / Stepenište",
    entrancePlaceholder: "npr. A, B, levo",
    entranceHousePlaceholder: "npr. glavni ulaz",
    doorCode: "Broj vrata / kapije",
    doorCodePlaceholder: "npr. 42B",
    saveAs: "Sačuvaj kao",
    notes: "Napomene za dostavu",
    notesPlaceholder: "Šifra kapije, orijentiri, pozovite pre dostave...",

    empty: {
      title: "Nema sačuvanih adresa",
      description: "Dodajte jednu i plaćanje će biti mnogo brže.",
    },
  },

  delivery: {
    deliverTo: "Dostava na",
    change: "Promeni",
    choose: "Izaberite adresu za dostavu",
    detecting: "Tražimo vašu lokaciju...",
    useCurrent: "Koristi moju trenutnu lokaciju",
    denied: "Pristup lokaciji je isključen. Unesite adresu ručno.",
    unsupported: "Ovaj pregledač ne može da podeli vašu lokaciju.",
    searchPlaceholder: "Pretražite ulicu ili mesto",
    noResults: "Ništa ne odgovara toj pretrazi.",
    recent: "Nedavno",
  },

  becomeCourier: {
    cta: "Dostavljajte sa Chow & Go",
    description: "Zarađujte po sopstvenom rasporedu.",
  },

  deleteAccount: {
    title: "Obriši nalog",
    description: "Ovo briše vaš nalog i sve na njemu. Ne može se poništiti.",
    confirmLabel: "Unesite lozinku da biste potvrdili",
    confirm: "Obriši moj nalog",
    cancel: "Zadrži nalog",
    success: "Vaš nalog je obrisan.",
  },

  logOut: {
    action: "Odjavi se",
    title: "Odjaviti se?",
    description: "Moraćete ponovo da se prijavite da biste poručili.",
    confirm: "Odjavi se",
  },
};
