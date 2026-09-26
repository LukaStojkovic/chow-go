// Politika privatnosti, srpski (latinica). Isti oblik kao privacy.en.js.
export default {
  title: "Politika privatnosti",
  intro: [
    "Ova politika objašnjava koje lične podatke Chow & Go prikuplja, zašto, ko ih prima, koliko dugo se čuvaju i koja su vaša prava. Rukovalac je {company}, {address}, matični broj {registrationNumber}. Pitanja i zahtevi: {privacyEmail}.",
    "Lične podatke obrađujemo u skladu sa Zakonom o zaštiti podataka o ličnosti Republike Srbije (\"Službeni glasnik RS\", br. 87/2018).",
  ],
  sections: [
    {
      heading: "1. Šta prikupljamo",
      blocks: [
        "Od svakog ko ima nalog:",
        [
          "ime, imejl adresu i lozinku (čuvamo je samo kao jednosmerni heš) ili identifikator Google naloga ako se prijavljujete preko Google-a;",
          "broj telefona (obavezan za kupce, kako bi vas restoran i kurir mogli kontaktirati);",
          "profilnu fotografiju, ako je dodate ili se prijavite preko Google-a;",
          "jezik i podešavanja prikaza;",
          "ako koristite mobilnu aplikaciju i dozvolite obaveštenja, token za obaveštenja vašeg uređaja i nasumični identifikator te instalacije.",
        ],
        "Kupci, dodatno: sačuvane adrese za dostavu (najviše pet, uključujući šifru vrata, sprat i napomene koje unesete, i koordinate adrese na mapi), korpu, porudžbine (jela, posebne napomene, napomene, iznosi, vreme), omiljene restorane i ocene i recenzije koje ostavite.",
        "Prodavci: naziv, opis, adresu i lokaciju restorana, telefon, imejl, radno vreme, fotografije i meni.",
        "Kuriri: ime, telefon, imejl, fotografiju, vrstu, model i registarsku oznaku vozila, brojeve i datume isteka vozačke dozvole, saobraćajne dozvole i osiguranja, status provere, statistiku dostava i, dok dostavljate, trenutnu lokaciju.",
        "IP adresu ne čuvamo uz vaš nalog ni uz porudžbine. Koristi se, samo u memoriji, za ograničavanje ponovljenih pokušaja prijave.",
      ],
    },
    {
      heading: "2. Lokacija",
      blocks: [
        [
          "Kupci: kada dodirnete opciju da se koristi vaša lokacija, položaj uređaja koristi se za pronalaženje restorana u blizini i popunjavanje adrese. Čuva se na vašem uređaju za sledeću posetu. Na našim serverima čuva se samo kao deo adrese koju sačuvate ili porudžbine koju pošaljete.",
          "Kuriri: dok imate aktivnu dostavu, aplikacija nam šalje vašu lokaciju na svakih nekoliko sekundi, i u pozadini sa isključenim ekranom (uz vidljivo obaveštenje na Androidu). Čuvamo samo vaš poslednji položaj, nikada istoriju kretanja. Prikazuje se kupcu i restoranu te porudžbine i koristi se da vam ponudimo nove porudžbine u blizini. Deljenje prestaje kada je dostava isporučena, otkazana ili vraćena, kada se odjavite ili kada opozovete dozvolu.",
        ],
      ],
    },
    {
      heading: "3. Zašto ih koristimo i po kom osnovu",
      blocks: [
        [
          "Da bismo pružili uslugu za koju ste se registrovali (izvršenje ugovora): otvaranje naloga, prijem i usmeravanje porudžbina, prosleđivanje porudžbine restoranu i kuriru, praćenje dostave, podrška i reklamacije.",
          "Da bi usluga bila bezbedna i ispravna (legitimni interes): sprečavanje prevara i zloupotreba, ograničavanje pokušaja prijave, otkrivanje grešaka i padova aplikacije i evidencija radnji koje naše osoblje preduzima nad nalozima.",
          "Uz vaš pristanak: obaveštenja i pristup lokaciji i fotografijama na uređaju, što možete u svakom trenutku opozvati u podešavanjima uređaja.",
          "Radi ispunjenja zakonskih obaveza: čuvanje evidencije o transakcijama onoliko dugo koliko propisi o računovodstvu i porezima zahtevaju, i odgovaranje na zakonite zahteve organa.",
        ],
        "Lične podatke ne prodajemo, ne koristimo ih za oglašavanje i ne koristimo analitiku ili oglasne alate trećih strana.",
      ],
    },
    {
      heading: "4. Ko vidi vaše podatke",
      blocks: [
        [
          "Restoran od kog poručujete vidi vaše ime, broj telefona, imejl adresu, adresu za dostavu i porudžbinu, da bi je pripremio i predao. Uz ocenu koju ostavite vidi vaše ime i fotografiju.",
          "Kuriri pre prihvatanja vide približnu oblast porudžbine; neprovereni kuriri vide samo grubu lokaciju. Kada kurir prihvati vašu porudžbinu, vidi vaše ime, broj telefona, imejl adresu i sve podatke za dostavu, uključujući šifru vrata ako ste je uneli.",
          "Vi vidite ime, broj telefona, fotografiju, vrstu vozila i trenutnu lokaciju kurira koji vam dostavlja.",
          "Naše osoblje vidi podatke o nalogu i porudžbinama kada je to potrebno za rad usluge, rešavanje reklamacija, proveru kurira i odobravanje restorana.",
        ],
      ],
    },
    {
      heading: "5. Pružaoci usluga (obrađivači)",
      blocks: [
        "Za rad usluge Chow & Go koristimo sledeće pružaoce. Svaki dobija samo ono što mu je potrebno za njegov deo usluge:",
        [
          "Hosting baze podataka (MongoDB): svi podaci o nalozima i porudžbinama. [Navedite pružaoca i region.]",
          "Cloudinary: fotografije koje otpremite (profil, restoran, meni).",
          "Google: prijava preko Google-a (vaše ime, imejl i fotografija sa Google naloga), fontovi na veb-sajtu (IP adresa vašeg pregledača kada ih učitava) i Gmail, preko kog se šalju kodovi za promenu lozinke na vašu imejl adresu.",
          "Expo (i Google Firebase Cloud Messaging na Androidu): isporuka obaveštenja na vaš uređaj, sa tekstom obaveštenja i tokenom uređaja.",
          "Sentry: izveštaji o greškama i padovima aplikacije i servera, sa tehničkim podacima o grešci i vašem uređaju. Sadržaj zahteva, kolačići i tokeni za prijavu uklanjaju se pre slanja izveštaja.",
          "OpenStreetMap Nominatim i LocationIQ: pretvaranje koordinata u adresu i predlaganje adresa dok kucate (koordinate zaokružene na oko 11 metara, odnosno tekst koji kucate). Ove zahteve šalje naš server, a ne vaš uređaj.",
          "Stadia Maps i OpenFreeMap: slike mape koje vaš pregledač ili aplikacija učitavaju direktno, pa te usluge dobijaju vašu IP adresu.",
          "OSRM (router.project-osrm.org): iscrtavanje rute između kurira i vaše adrese, na osnovu koordinata te dve tačke.",
        ],
        "Neki od ovih pružalaca nalaze se van Srbije, uključujući Sjedinjene Američke Države. Kada se podaci prenose u inostranstvo, oslanjamo se na mehanizme prenosa koje predviđa Zakon o zaštiti podataka o ličnosti, poput standardnih ugovornih klauzula. [Potvrdite osnov prenosa za svakog pružaoca.]",
      ],
    },
    {
      heading: "6. Koliko dugo čuvamo podatke",
      blocks: [
        [
          "Nalog, adrese i podešavanja: dok ne obrišete nalog.",
          "Porudžbine: čuvaju se, jer su to i poslovne evidencije restorana i kurira i potrebne su za računovodstvo. Kada obrišete nalog, anonimizuju se (videti odeljak 8).",
          "Obaveštenja u aplikaciji: automatski se brišu posle 90 dana.",
          "Kodovi za promenu lozinke: važe 5 minuta i mogu se iskoristiti samo jednom.",
          "Serverski logovi: nikada ne sadrže vaš imejl, telefon, adresu ni šifru vrata. [Navedite rok čuvanja logova kod pružaoca hostinga.]",
          "Evidencija radnji osoblja nad nalozima: čuva se radi odgovornosti.",
        ],
      ],
    },
    {
      heading: "7. Kolačići i skladište na uređaju",
      blocks: [
        "Veb-sajt koristi samo kolačiće koji su neophodni za njegov rad, pa ne traži pristanak za kolačiće:",
        [
          "jwt: održava vašu prijavu (7 dana, ili 30 ako izaberete da ostanete prijavljeni);",
          "connect.sid i g_oauth_nonce: koriste se samo tokom prijave preko Google-a i za zaštitu te prijave od zloupotrebe.",
        ],
        "Veb-sajt i aplikacija na vašem uređaju čuvaju i temu, jezik, nedavne pretrage i izabranu lokaciju za dostavu, kako bi ih zapamtili za sledeći put. Mobilna aplikacija prijavu čuva u zaštićenom skladištu uređaja.",
      ],
    },
    {
      heading: "8. Brisanje naloga",
      blocks: [
        "Nalog možete obrisati u podešavanjima. Brisanje je trenutno i ne može se opozvati. Vaše ime, imejl, broj telefona, fotografija, sačuvane adrese, korpa, obaveštenja i tokeni za obaveštenja se uklanjaju, a vi se odjavljujete sa svih uređaja.",
        "Prethodne porudžbine ostaju u anonimizovanom obliku: uklanjaju se adresa za dostavu, napomene, posebne napomene uz jela i tekst vaših recenzija, dok se iznosi, datumi i ocene zvezdicama čuvaju, jer su deo evidencije i proseka restorana i kurira. Kod kurira se uklanjaju lični dokumenti, podaci o vozilu, lokacija i napomene uz dostave. Kod prodavaca se restoran isključuje, a njegovi kontakt podaci uklanjaju.",
      ],
    },
    {
      heading: "9. Vaša prava",
      blocks: [
        "Imate pravo da:",
        [
          "pristupite svojim podacima i dobijete kopiju u prenosivom obliku (koristite \"Preuzmi moje podatke\" u podešavanjima);",
          "ispravite netačne podatke (većinu možete sami izmeniti u podešavanjima);",
          "zahtevate brisanje podataka (obrišite nalog ili nam pišite);",
          "ograničite obradu ili uložite prigovor na obradu zasnovanu na našem legitimnom interesu;",
          "opozovete pristanak u svakom trenutku, bez uticaja na obradu koja je pre toga izvršena;",
          "podnesete pritužbu Povereniku za informacije od javnog značaja i zaštitu podataka o ličnosti (www.poverenik.rs).",
        ],
        "Za ostvarivanje bilo kog od ovih prava pišite na {privacyEmail}. Odgovorićemo u roku od 30 dana.",
      ],
    },
    {
      heading: "10. Bezbednost",
      blocks: [
        "Lozinke se čuvaju kao jednosmerni heševi, veze su šifrovane, prijave se mogu opozvati i prestaju kada promenite lozinku, a pristup osoblja je ograničen i evidentiran. Nijedan sistem nije potpuno bezbedan; ako povreda podataka ugrozi vaša prava, obavestićemo vas i Poverenika kako zakon propisuje.",
      ],
    },
    {
      heading: "11. Deca",
      blocks: [
        "Chow & Go nije namenjen osobama mlađim od 15 godina i od njih svesno ne prikupljamo podatke. Ako mislite da dete mlađe od 15 godina ima nalog, javite nam se i obrisaćemo ga.",
      ],
    },
    {
      heading: "12. Izmene",
      blocks: [
        "Svaku izmenu ove politike objavićemo ovde sa novim datumom, a o značajnim izmenama obavestićemo vas u aplikaciji pre nego što stupe na snagu.",
      ],
    },
  ],
};
