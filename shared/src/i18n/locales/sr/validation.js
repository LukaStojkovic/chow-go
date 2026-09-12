/** Serbian form validation messages. */

export default {
  required: "Ovo polje je obavezno",

  auth: {
    nameRequired: "Ime je obavezno",
    ownNameRequired: "Vaše ime je obavezno",
    emailRequired: "Imejl je obavezan",
    emailInvalid: "Unesite ispravnu imejl adresu",
    passwordRequired: "Lozinka je obavezna",
    passwordMin: "Lozinka mora imati najmanje {{count}} znakova",
    passwordMax: "Lozinka ne sme biti duža od {{count}} znakova",
    passwordsMismatch: "Lozinke se ne poklapaju",
    phoneRequired: "Broj telefona je obavezan",
    phoneMin: "Broj telefona mora imati najmanje {{count}} cifara",
    phoneMax: "Broj telefona ne sme imati više od {{count}} cifara",
    phoneInvalid: "Broj telefona sadrži nedozvoljene znakove",
    fullNameMin: "Ime i prezime mora imati najmanje {{count}} znakova",
    fullNameMax: "Ime i prezime ne sme biti duže od {{count}} znakova",
    codeLength: "Unesite {{count}}-cifreni kod",
    roleRequired: "Izaberite kako želite da koristite Chow & Go",
  },

  profile: {
    imageRequired: "Profilna fotografija je obavezna",
    imageType: "Izaberite sliku",
    imageSize: "Slika mora biti manja od {{size}} MB",
  },

  restaurant: {
    nameRequired: "Naziv restorana je obavezan",
    phoneRequired: "Broj telefona restorana je obavezan",
    addressRequired: "Adresa je obavezna",
    cityRequired: "Grad je obavezan",
    zipRequired: "Poštanski broj je obavezan",
    cuisineRequired: "Izaberite vrstu kuhinje",
    descriptionRequired: "Napišite kupcima šta nudite",
    descriptionMin: "Opis mora imati najmanje {{count}} znakova",
    locationRequired: "Označite svoju lokaciju na mapi",
    openingRequired: "Vreme otvaranja je obavezno",
    closingRequired: "Vreme zatvaranja je obavezno",
    timeFormat: "Koristite format HH:MM",
    imagesRequired: "Potrebna je bar jedna slika",
    imagesMax: "Najviše {{count}} slika",
  },

  address: {
    labelRequired: "Dajte naziv ovoj adresi",
    streetRequired: "Adresa je obavezna",
    cityRequired: "Grad je obavezan",
    typeRequired: "Izaberite o kakvom se mestu radi",
    pinRequired: "Postavite oznaku na mapi",
    notesMax: "Napomene ne smeju biti duže od {{count}} znakova",
  },

  courier: {
    vehicleTypeRequired: "Izaberite čime dostavljate",
    vehicleNumberRequired: "Broj vozila je obavezan",
    vehicleNumberMax: "Broj vozila ne sme biti duži od {{count}} znakova",
    vehicleModelRequired: "Model vozila je obavezan",
    vehicleModelMax: "Model vozila ne sme biti duži od {{count}} znakova",
    licenseNumberRequired: "Broj vozačke dozvole je obavezan",
    licenseNumberMax: "Broj vozačke dozvole ne sme biti duži od {{count}} znakova",
    licenseNotExpired: "Vozačka dozvola ne sme biti istekla",
    registrationNumberRequired: "Broj saobraćajne dozvole je obavezan",
    registrationNumberMax:
      "Broj saobraćajne dozvole ne sme biti duži od {{count}} znakova",
    registrationNotExpired: "Saobraćajna dozvola ne sme biti istekla",
    insuranceNumberRequired: "Broj polise osiguranja je obavezan",
    insuranceNumberMax: "Broj polise ne sme biti duži od {{count}} znakova",
    insuranceNotExpired: "Osiguranje ne sme biti isteklo",
    paymentMethodRequired: "Način plaćanja je obavezan",
  },

  menuItem: {
    nameRequired: "Naziv jela je obavezan",
    categoryRequired: "Izaberite kategoriju",
    priceRequired: "Cena je obavezna",
    pricePositive: "Cena mora biti pozitivan broj",
    descriptionRequired: "Opis je obavezan",
    imagesRequired: "Potrebna je bar jedna slika",
    imagesMax: "Dozvoljeno je najviše {{count}} slika",
    imageUnsupported: "Nepodržana slika",
  },

  promotion: {
    valueRequired: "Unesite koliki je popust ili isključite akciju",
    maxPercent: "Najviše {{max}}% popusta",
    belowFloor: "Time cena pada ispod {{min}}. Smanjite popust.",
    endsBeforeStart: "Akcija mora da se završi posle početka",
    labelMax: "Tekst oznake mora biti kraći od {{max}} znakova",
  },

  order: {
    notesMax: "Napomena ne sme biti duža od {{count}} znakova",
    ratingRequired: "Prvo izaberite ocenu",
  },
};
