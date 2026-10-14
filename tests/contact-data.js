"use strict";

// Test-only source of the expected contact values (D003). Never loaded by index.html.
// Changing a contact value: edit every occurrence in index.html and the value here.

window.EXPECTED_CONTACT = {
  phones: [
    { id: "main", display: "915 04 80 56", tel: "+34915048056" },
    { id: "mobile", display: "619 76 89 32", tel: "+34619768932" }
  ],
  whatsapp: { number: "34619768932", message: "Hola, quería pedir cita para mi coche." }, // placeholder
  address: "C. Juan Carlos I, 3, 28660 Boadilla del Monte",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Boadilla%20Motor%20Sport%2C%20C.%20Juan%20Carlos%20I%2C%203%2C%2028660%20Boadilla%20del%20Monte",
  reviewsUrl: "https://www.google.com/maps/search/?api=1&query=Boadilla%20Motor%20Sport%20Boadilla%20del%20Monte", // placeholder
  email: "info@boadillamotor.es",
  hours: [
    "Lunes a viernes: 9:00–14:00 y 15:30–19:00",
    "Sábados y domingos: cerrado"
  ] // placeholder
};
