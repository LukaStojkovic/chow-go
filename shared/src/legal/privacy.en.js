// Privacy Policy, English. Same shape as terms.en.js. Every statement here
// describes what the code does; keep it that way when the code changes.
export default {
  title: "Privacy Policy",
  intro: [
    "This policy explains what personal data Chow & Go collects, why, who receives it, how long it is kept, and your rights. The controller is {company}, {address}, registration number {registrationNumber}. Questions and requests: {privacyEmail}.",
    "We process personal data under the Law on Personal Data Protection of the Republic of Serbia (\"Službeni glasnik RS\", no. 87/2018).",
  ],
  sections: [
    {
      heading: "1. What we collect",
      blocks: [
        "From everyone with an account:",
        [
          "name, email address, and a password (stored only as a one-way hash) or your Google account id if you sign in with Google;",
          "phone number (required for customers, so the restaurant and courier can reach you);",
          "profile photo, if you add one or sign in with Google;",
          "your language and display preferences;",
          "if you use the mobile app and allow notifications, a push notification token for your device and a random id for that installation.",
        ],
        "Customers, additionally: saved delivery addresses (up to five, including any door code, floor and notes you enter, and the address's map coordinates), your basket, your orders (dishes, special instructions, notes, amounts, times), favourite restaurants, and the ratings and reviews you leave.",
        "Sellers: the restaurant's name, description, address and location, phone, email, opening hours, photos and menu.",
        "Couriers: name, phone, email, photo, vehicle type, model and registration plate, driving licence, vehicle registration and insurance numbers and expiry dates, verification status, delivery statistics, and, while you are delivering, your current location.",
        "We do not store your IP address with your account or your orders. It is used, in memory only, to limit repeated sign-in attempts.",
      ],
    },
    {
      heading: "2. Location",
      blocks: [
        [
          "Customers: when you tap to use your location, your device's position is used to find restaurants near you and to fill in your address. It is kept on your device for the next visit. It is stored on our servers only as part of an address you save or an order you place.",
          "Couriers: while you have an active delivery, the app sends your location to us every few seconds, including in the background with the screen off (with a visible notification on Android). We keep only your latest position, never a history of your route. It is shown to that order's customer and restaurant, and used to offer you new orders nearby. Sharing stops when the delivery is delivered, cancelled or released, when you sign out, or when you revoke the permission.",
        ],
      ],
    },
    {
      heading: "3. Why we use it, and on what basis",
      blocks: [
        [
          "To provide the service you signed up for (performance of a contract): creating your account, taking and routing orders, passing your order to the restaurant and courier, delivery tracking, support, and complaints.",
          "To keep the service safe and working (legitimate interest): preventing fraud and abuse, limiting sign-in attempts, investigating errors and crashes, and keeping an audit trail of actions our staff take on accounts.",
          "With your consent: push notifications and access to your device's location and photos, which you can withdraw at any time in your device settings.",
          "To meet legal obligations: keeping transaction records for as long as accounting and tax law require, and answering lawful requests from authorities.",
        ],
        "We do not sell personal data, do not use it for advertising, and do not use third-party analytics or advertising trackers.",
      ],
    },
    {
      heading: "4. Who sees your data",
      blocks: [
        [
          "The restaurant you order from sees your name, phone number, email address, delivery address and order, to prepare and hand it over. It sees your name and photo next to any rating you leave.",
          "Couriers see the approximate area of an order before accepting it; unverified couriers see only a rough location. Once a courier accepts your order they see your name, phone number, email address and full delivery details, including any door code you entered.",
          "You see the name, phone number, photo, vehicle type and live location of the courier delivering to you.",
          "Our staff see account and order details when needed to run the service, handle complaints, verify couriers and approve restaurants.",
        ],
      ],
    },
    {
      heading: "5. Service providers",
      blocks: [
        "We use these providers to run Chow & Go. Each receives only what its part of the service needs:",
        [
          "Database hosting (MongoDB): all account and order data. [Name the provider and region.]",
          "Cloudinary: photos you upload (profile, restaurant, menu).",
          "Google: sign-in with Google (your Google name, email and photo), fonts on the website (your browser's IP address when it loads them), and Gmail, which sends password reset codes to your email address.",
          "Expo (and Google Firebase Cloud Messaging on Android): delivering push notifications to your device, with the notification's text and your device token.",
          "Sentry: error and crash reports from the app and servers, which contain technical details about the error and your device. Request bodies, cookies and sign-in tokens are removed before a report is sent.",
          "OpenStreetMap Nominatim and LocationIQ: turning coordinates into an address and suggesting addresses as you type (coordinates rounded to about 11 metres, or the text you type). These requests are made by our server, not your device.",
          "Stadia Maps and OpenFreeMap: map images, loaded directly by your browser or app, which therefore receives your IP address.",
          "OSRM (router.project-osrm.org): drawing the route between the courier and your address, from the two points' coordinates.",
        ],
        "Several of these providers are based outside Serbia, including in the United States. Where data is transferred abroad, we rely on the transfer mechanisms the Law on Personal Data Protection provides, such as standard contractual clauses. [Confirm each provider's transfer basis.]",
      ],
    },
    {
      heading: "6. How long we keep it",
      blocks: [
        [
          "Your account, addresses and preferences: until you delete your account.",
          "Orders: kept, because they are also the restaurant's and courier's business records and are needed for accounting. When you delete your account they are anonymised (see section 8).",
          "In-app notifications: deleted automatically after 90 days.",
          "Password reset codes: valid for 5 minutes and single-use.",
          "Server logs: they never contain your email, phone, address or door code. [State the hosting provider's log retention period.]",
          "Records of staff actions on accounts: kept for accountability.",
        ],
      ],
    },
    {
      heading: "7. Cookies and storage on your device",
      blocks: [
        "The website uses only cookies that are strictly necessary for it to work, so it does not ask for cookie consent:",
        [
          "jwt: keeps you signed in (7 days, or 30 if you choose to stay signed in);",
          "connect.sid and g_oauth_nonce: used only while you sign in with Google, and to protect that sign-in from forgery.",
        ],
        "The website and app also store your theme, language, recent searches and chosen delivery location on your device, so they are remembered next time. The mobile app keeps your sign-in in the device's secure storage.",
      ],
    },
    {
      heading: "8. Deleting your account",
      blocks: [
        "You can delete your account in your settings. Deletion is immediate and cannot be undone. Your name, email, phone number, photo, saved addresses, basket, notifications and push tokens are removed, and you are signed out everywhere.",
        "Your past orders remain in anonymised form: the delivery address, notes, special instructions and the text of your reviews are removed, while totals, dates and star ratings are kept, because they form part of the restaurant's and courier's records and averages. For couriers, identity documents, vehicle details, location and delivery notes are removed. For sellers, the restaurant is taken offline and its contact details removed.",
      ],
    },
    {
      heading: "9. Your rights",
      blocks: [
        "You have the right to:",
        [
          "access your data, and receive a copy in a portable format (use \"Download my data\" in your settings);",
          "correct inaccurate data (most of it you can edit yourself in your settings);",
          "have your data erased (delete your account, or write to us);",
          "restrict or object to processing based on our legitimate interests;",
          "withdraw consent at any time, without affecting processing that happened before;",
          "lodge a complaint with the Commissioner for Information of Public Importance and Personal Data Protection (www.poverenik.rs).",
        ],
        "Write to {privacyEmail} to exercise any of them. We will answer within 30 days.",
      ],
    },
    {
      heading: "10. Security",
      blocks: [
        "Passwords are stored as one-way hashes, connections are encrypted, sign-in sessions can be revoked and end when you change your password, and staff access is limited and logged. No system is perfectly secure; if a breach puts your rights at risk, we will tell you and the Commissioner as the law requires.",
      ],
    },
    {
      heading: "11. Children",
      blocks: [
        "Chow & Go is not intended for anyone under 15, and we do not knowingly collect data from them. If you believe a child under 15 has an account, contact us and we will delete it.",
      ],
    },
    {
      heading: "12. Changes",
      blocks: [
        "We will publish any change to this policy here with a new date and, for significant changes, tell you in the app before they take effect.",
      ],
    },
  ],
};
