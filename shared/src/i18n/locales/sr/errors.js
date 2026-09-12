/** Serbian server-side error copy. Keys mirror `en/errors.js`. */

export default {
  auth: {
    allFieldsRequired: "Sva polja su obavezna",
    invalidCredentials: "Ta imejl adresa i lozinka se ne poklapaju",
    useGoogle:
      "Ovaj nalog je napravljen preko Google-a. Prijavite se pomoću Google-a.",
    missingFields: "Nedostaju neka obavezna polja",
    phoneRequiredCustomer: "Broj telefona je obavezan za kupce",
    phoneRequiredCourier: "Broj telefona je obavezan za kurire",
    emailInUse: "Ta imejl adresa je već u upotrebi",
    accountExists: "Nalog sa ovom imejl adresom već postoji",
    fieldRequired: "Polje {{field}} je obavezno",
    hoursFormat: "Radno vreme mora biti u 24-časovnom formatu HH:MM",
    restaurantImageRequired: "Potrebna je bar jedna slika restorana",
    invalidCoordinates: "Te koordinate nisu ispravne",
    invalidVehicleType: "Ta vrsta vozila nije podržana",
    vehicleTypeRequired: "Vrsta vozila je obavezna za kurire",
    vehicleNumberRequired: "Broj vozila je obavezan",
    vehicleModelRequired: "Model vozila je obavezan",
    roleRequired: "Potrebna je ispravna uloga",
    userNotFound: "Nismo pronašli taj nalog",
    invalidPhone: "Taj broj telefona nije ispravan",
    passwordFieldsRequired: "Sva polja za lozinku su obavezna",
    passwordsMismatch: "Lozinke se ne poklapaju",
    currentPasswordIncorrect: "Vaša trenutna lozinka nije tačna",
    noUpdates: "Ništa nije poslato za izmenu",
    emailRequired: "Imejl adresa je obavezna",
    otpInvalid: "Taj kod nije ispravan ili je istekao",
    otpLocked: "Previše netačnih kodova. Zatražite novi.",
    resetTokenInvalid: "Taj link za resetovanje nije ispravan ili je istekao",
    passwordMustBeText: "Lozinka mora biti tekst",
    passwordTooShort: "Lozinka mora imati najmanje {{count}} znakova",
    passwordTooLong: "Ta lozinka je predugačka (najviše {{count}} bajtova)",
    missingCode: "Nedostaje kod za prijavu",
    signInLinkExpired: "Taj link za prijavu je istekao. Pokušajte ponovo.",
    noToken: "Morate biti prijavljeni",
    invalidToken: "Vaša sesija nije ispravna",
    userGone: "Vaš nalog više ne postoji",
    tokenRevoked: "Vaša sesija je prekinuta jer je lozinka promenjena",
    sessionInvalid: "Vaša sesija više nije ispravna",
  },

  role: {
    sellerRequired: "Pristup odbijen. Potreban je nalog prodavca.",
    customerRequired: "Pristup odbijen. Potreban je nalog kupca.",
    courierRequired: "Pristup odbijen. Potreban je nalog kurira.",
  },

  cart: {
    menuItemIdRequired: "Potreban je identifikator jela",
    menuItemNotFound: "To jelo više nije na meniju",
    notFound: "Vaša korpa je prazna",
    itemNotFound: "To jelo nije u vašoj korpi",
    quantityInvalid: "Količina mora biti 0 ili veća",
    differentRestaurant:
      "U vašoj korpi su jela iz drugog restorana. Prvo je ispraznite.",
  },

  address: {
    required: "Adresa i lokacija su obavezne",
    notFound: "Ta adresa nije pronađena",
    limitReached: "Možete sačuvati najviše {{count}} adresa",
  },

  favourite: {
    restaurantIdRequired: "Potreban je identifikator restorana",
    restaurantNotFound: "Taj restoran nije pronađen",
  },

  location: {
    coordinatesRequired: "Geografska širina i dužina su obavezne",
    coordinatesInvalid: "Te vrednosti geografske širine ili dužine nisu ispravne",
    queryRequired: "Potreban je pojam za pretragu",
    serviceUnavailable: "Servis za lokaciju trenutno nije dostupan",
    maxDistanceRange: "Taj poluprečnik pretrage je van dozvoljenog opsega",
    invalid: "Ta lokacija nije ispravna",
    noRestaurantsNearby: "Nijedan restoran još ne dostavlja do vas",
    nearbyFailed: "Nismo uspeli da učitamo restorane u vašoj blizini",
    permissionDenied:
      "Potrebna nam je vaša lokacija da bismo prikazali ko dostavlja do vas",
  },

  notification: {
    invalidToken: "Taj token za obaveštenja nije ispravan",
    invalidPlatform: "Ta platforma nije podržana",
  },

  order: {
    missingFields: "Nedostaju neka obavezna polja",
    cartEmpty: "Vaša korpa je prazna",
    addressNotFound: "Ta adresa za dostavu nije pronađena",
    restaurantUnavailable: "Taj restoran trenutno ne prima porudžbine",
    restaurantClosed: "Taj restoran je trenutno zatvoren",
    itemUnavailable: "{{name}} više nije dostupno",
    notFound: "Ta porudžbina nije pronađena",
    cancelNotAllowed: "Ova porudžbina je previše odmakla da bi se otkazala",
    statusConflict:
      "Neko je upravo ažurirao ovu porudžbinu. Osvežite i pokušajte ponovo.",
    invalidTransition: "To nije ispravan sledeći korak za ovu porudžbinu",
    restaurantNotFound: "Taj restoran nije pronađen",
  },

  rating: {
    deliveredOnly: "Možete oceniti samo dostavljene porudžbine",
    restaurantRange: "Ocena restorana mora biti ceo broj od 1 do 5",
    courierRange: "Ocena kurira mora biti ceo broj od 1 do 5",
    reviewTooLong: "Recenzija sme imati najviše {{count}} znakova",
    restaurantAlreadyRated: "Već ste ocenili ovaj restoran",
    courierAlreadyRated: "Već ste ocenili ovog kurira",
    noneProvided: "Nijedna ocena nije poslata",
  },

  courier: {
    profileNotFound: "Nismo pronašli vaš kurirski profil",
    notFound: "Taj kurir nije pronađen",
    notVerified: "Vaš nalog mora biti verifikovan pre nego što preuzmete porudžbine",
    notOnDuty: "Morate biti na smeni da biste prihvatali porudžbine",
    activeOrderExists: "Već imate aktivnu porudžbinu",
    orderUnavailable: "Ta porudžbina više nije dostupna",
    onDutyWithActiveOrder:
      "Ne možete stati na smenu dok je porudžbina još aktivna",
    nameEmpty: "Vaše ime ne sme biti prazno",
    phoneEmpty: "Vaš broj telefona ne sme biti prazan",
    noUpdates: "Ništa nije poslato za izmenu",
    invalidCoordinates: "Te koordinate nisu ispravne",
  },

  menuItem: {
    fieldsRequired: "Naziv, cena i kategorija su obavezni",
    pricePositive: "Cena mora biti pozitivan broj",
    restaurantNotFound: "Taj restoran nije pronađen",
    notAuthorized: "Ne možete menjati ovaj restoran",
    notFound: "To jelo nije pronađeno",
    imageRequired: "Potrebna je bar jedna slika",
  },

  restaurant: {
    notFound: "Taj restoran nije pronađen",
    invalidEmail: "Ta imejl adresa nije ispravna",
    invalidId: "Taj identifikator restorana nije ispravan",
    statsUnauthorized: "Ne možete videti statistiku ovog restorana",
    unauthorized: "Nemate pristup ovom restoranu",
  },

  promotion: {
    invalid: "{{reason}}",
    typeInvalid: "Akcija mora biti u procentima ili u fiksnom iznosu",
    valuePositive: "Popust mora biti veći od nule",
    maxPercent: "Akcija ne sme da skine više od {{max}}%",
    belowFloor: "Time bi cena jela pala ispod {{min}}",
    endsBeforeStart: "Akcija mora da se završi posle početka",
    labelTooLong: "Tekst oznake mora imati manje od {{max}} znakova",
  },

  schedule: {
    invalidJson: "Raspored mora biti ispravan JSON",
    notAnObject: "Raspored mora biti objekat sa danima u nedelji kao ključevima",
    invalidDay: '"{{day}}" nije dan u nedelji',
    dayNotAnObject: "Raspored za {{day}} mora biti objekat",
    invalidTime: "Radno vreme za {{day}} mora biti u 24-časovnom formatu HH:MM",
    noValues: "Raspored ne sadrži ništa za izmenu",
  },

  request: {
    notFound: "Nema API rute za {{method}} {{path}}",
    payloadTooLarge: "Sadržaj zahteva je prevelik",
    invalidId: '"{{path}}" nije ispravan {{kind}}',
    validationFailed: "Neke od poslatih vrednosti nisu ispravne",
    duplicate: "{{field}} je već zauzeto",
    invalidFieldName: '"{{field}}" nije dozvoljeno ime polja',
    invalidQueryParam: '"{{field}}" nije dozvoljen parametar upita',
    uploadTooLarge: "Taj fajl je prevelik",
    uploadTooMany: "Previše fajlova",
    uploadRejected: "To otpremanje je odbijeno",
    internal: "Nešto je pošlo naopako",
    generic: "Nešto je pošlo naopako",
  },

  account: {
    passwordRequired: "Unesite lozinku da biste potvrdili",
    passwordIncorrect: "Ta lozinka nije tačna",
    activeOrders:
      "Završite ili otkažite aktivne porudžbine pre brisanja naloga",
    restaurantActiveOrders:
      "Vaš restoran još ima porudžbine u toku. Prvo ih zatvorite.",
    courierActiveOrder: "Završite trenutnu dostavu pre brisanja naloga",
  },

  byCode: {
    NO_TOKEN: "Morate biti prijavljeni",
    INVALID_TOKEN: "Vaša sesija više nije ispravna",
    TOKEN_REVOKED: "Vaša sesija je prekinuta jer je lozinka promenjena",
    USER_GONE: "Vaš nalog više ne postoji",
    ORDER_STATUS_CONFLICT:
      "Neko je upravo ažurirao ovu porudžbinu. Osvežite i pokušajte ponovo.",
    INVALID_TRANSITION: "To nije ispravan sledeći korak za ovu porudžbinu",
    CANCEL_NOT_ALLOWED: "Ova porudžbina je previše odmakla da bi se otkazala",
    OTP_INVALID: "Taj kod nije ispravan ili je istekao",
    OTP_LOCKED: "Previše netačnih kodova. Zatražite novi.",
    RESET_TOKEN_INVALID: "Taj link za resetovanje nije ispravan ili je istekao",
    PASSWORD_INCORRECT: "Ta lozinka nije tačna",
    PASSWORD_REQUIRED: "Unesite lozinku da biste potvrdili",
    PASSWORD_TOO_SHORT: "Ta lozinka je prekratka",
    VALIDATION_FAILED: "Neke od poslatih vrednosti nisu ispravne",
    DUPLICATE: "Ta vrednost je već zauzeta",
    PAYLOAD_TOO_LARGE: "Sadržaj zahteva je prevelik",
    INTERNAL_ERROR: "Nešto je pošlo naopako",
    RATE_LIMITED: "Previše pokušaja. Sačekajte trenutak i pokušajte ponovo.",
    NETWORK: "Nismo uspeli da dođemo do servera",
  },
};
