/** Serbian sign-in, sign-up, password reset and Google role-flow copy. */

export default {
  fields: {
    email: "Imejl",
    emailPlaceholder: "vas@imejl.com",
    password: "Lozinka",
    confirmPassword: "Potvrdite lozinku",
    fullName: "Ime i prezime",
    phone: "Broj telefona",
    code: "Verifikacioni kod",
  },

  roles: {
    heading: "Kako ćete koristiti Chow & Go?",
    customer: "Kupac",
    customerDescription: "Poručujte hranu iz mesta u vašoj blizini.",
    seller: "Vlasnik restorana",
    sellerDescription: "Postavite svoj restoran i primajte porudžbine.",
    courier: "Kurir",
    courierDescription: "Dostavljajte porudžbine i zarađujte po svom rasporedu.",
  },

  login: {
    title: "Dobro došli nazad",
    description: "Prijavite se da pratite porudžbine i sačuvate omiljena mesta.",
    submit: "Prijavi se",
    submitting: "Prijavljivanje...",
    rememberMe: "Zapamti me",
    forgotPassword: "Zaboravili ste lozinku?",
    noAccount: "Nemate nalog?",
    orContinueWith: "Ili nastavite sa",
    continueWithGoogle: "Nastavi sa Google-om",
    success: "Dobro došli nazad, {{name}}.",
  },

  register: {
    title: "Pridružite se Chow & Go",
    description: "Napravite nalog i počnite da poručujete za nekoliko sekundi.",
    submit: "Registruj se",
    submitting: "Pravimo nalog...",
    complete: "Završi registraciju",
    haveAccount: "Već imate nalog?",
    success: "Vaš nalog je spreman.",
    photoLabel: "Profilna fotografija",
    photoHint: "Opciono, ali pomaže kuririma da vas prepoznaju.",
  },

  restaurant: {
    infoTitle: "Informacije o restoranu",
    infoDescription: "Recite nam nešto o svom restoranu",
    locationTitle: "Lokacija i radno vreme",
    locationDescription: "Gde se nalazite i kada primate porudžbine",
    imagesTitle: "Fotografije i opis",
    imagesDescription: "Dodajte fotografije i opišite svoj restoran",

    namePlaceholder: "Naziv restorana",
    phonePlaceholder: "Broj telefona",
    addressPlaceholder: "Adresa restorana",
    cityPlaceholder: "Grad",
    statePlaceholder: "Okrug / Pokrajina",
    zipPlaceholder: "Poštanski broj",
    cuisinePlaceholder: "Izaberite vrstu kuhinje",
    cuisineTypePlaceholder: "Vrsta kuhinje (npr. italijanska, kineska)",
    descriptionPlaceholder: "Opišite svoj restoran (najmanje 10 znakova)",
    imagesPlaceholder: "Otpremite fotografije restorana (1-5 slika)",

    mapHint: "Prevucite oznaku na mesto odakle kuriri preuzimaju.",
    openingTime: "Otvara se u",
    closingTime: "Zatvara se u",
    hoursHint: "Različito radno vreme po danima možete podesiti kasnije, u podešavanjima.",
  },

  reset: {
    title: "Resetovanje lozinke",
    emailDescription: "Unesite imejl da biste dobili verifikacioni kod",
    codeDescription: "Proverite imejl i pronađite šestocifreni kod",
    newPasswordDescription: "Izaberite novu lozinku",
    sendCode: "Pošalji kod",
    verifyCode: "Potvrdi kod",
    verifying: "Provera...",
    resendCode: "Pošalji kod ponovo",
    setPassword: "Postavi novu lozinku",
    backToLogin: "Nazad na prijavu",
    codeSent: "Poslali smo kod na {{email}}.",
    success: "Vaša lozinka je resetovana. Sada se možete prijaviti.",
    sendFailed: "Nismo uspeli da pošaljemo kod. Pokušajte ponovo.",
    verifyFailed: "Nismo uspeli da potvrdimo taj kod.",
    resetFailed: "Nismo uspeli da resetujemo vašu lozinku.",
  },

  google: {
    stepRole: "Izaberite svoju ulogu",
    stepContact: "Kontakt podaci",
    stepCourierInfo: "Kontakt i vozilo",
    stepDocuments: "Dokumenta",
    finishing: "Završavamo vaš nalog...",
    failed: "Nismo uspeli da završimo prijavu. Pokušajte ponovo.",
    cancelled: "Prijava je otkazana.",
  },

  guard: {
    signInRequired: "Prijavite se da biste nastavili",
    signInToOrder: "Prijavite se da dodate ovo u korpu",
    signInToFavourite: "Prijavite se da sačuvate omiljena mesta",
  },

  logout: {
    success: "Odjavljeni ste.",
  },
};
