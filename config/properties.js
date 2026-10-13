/*
 * Comfort Base property configuration.
 * Add each client's real booking-page URL to `externalBookingUrl` below.
 * Keep an empty string until a verified URL is supplied; the website will
 * show a safe "Booking link coming soon" state instead of a broken link.
 */
window.COMFORT_BASE_PROPERTIES = {
  sydney: {
    slug: 'the-sydney-base',
    title: 'The Sydney Base',
    location: 'Sydney · New South Wales',
    guests: null,
    bedrooms: null,
    bathrooms: null,
    detailsPending: true,
    description: 'Introducing The Sydney Base, our first Sydney listing. Explore the supplied location below; property details and original photography will be added soon.',
    parking: 'To be confirmed.',
    nearby: 'Explore the surrounding area using the map below. Local recommendations will be added once confirmed.',
    images: ['assets/images/sydney-base-placeholder.jpg'],
    imageAlts: ['AI-generated concept living room; not a photograph of The Sydney Base'],
    mapUrl: 'https://www.google.com/maps?q=-33.8700073,151.194134',
    mapEmbedUrl: 'https://www.google.com/maps?q=-33.8700073,151.194134&z=17&output=embed',
    externalBookingUrl: ''
  },
  riverside: {
    slug: 'the-riverside-base',
    title: 'The Riverside Base',
    location: 'Newstead · Brisbane',
    guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    description: 'A calm one-bedroom city base with generous living space, a comfortable work setup and easy access to Brisbane dining and riverside precincts.',
    parking: 'Parking information will be confirmed with the final property listing.',
    nearby: 'Brisbane Riverwalk · James Street · Fortitude Valley · Brisbane CBD',
    images: ['assets/images/comfort-base-hero.webp', 'assets/images/base-bedroom-01.webp', 'assets/images/base-living-room-01.webp'],
    imageAlts: ['Open-plan apartment overlooking the city', 'Warm primary bedroom', 'Light-filled living and dining space'],
    externalBookingUrl: ''
  },
  garden: {
    slug: 'the-garden-base',
    title: 'The Garden Base',
    location: 'Richmond · Melbourne',
    guests: 4,
    bedrooms: 2,
    bathrooms: 1,
    description: 'A relaxed base for longer Melbourne stays, pairing quiet bedrooms and practical everyday comforts with excellent neighbourhood connections.',
    parking: 'Parking information will be confirmed with the final property listing.',
    nearby: 'Bridge Road · Melbourne Cricket Ground · Yarra trails · Melbourne CBD',
    images: ['assets/images/base-bedroom-01.webp', 'assets/images/base-living-room-01.webp', 'assets/images/comfort-base-hero.webp'],
    imageAlts: ['Restful bedroom with leafy outlook', 'Comfortable furnished living room', 'Contemporary kitchen and living space'],
    externalBookingUrl: ''
  },
  executive: {
    slug: 'the-executive-base',
    title: 'The Executive Base',
    location: 'Sydney CBD · Sydney',
    guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    description: 'A composed, business-ready city base designed for focused work, comfortable downtime and straightforward access to central Sydney.',
    parking: 'Parking information will be confirmed with the final property listing.',
    nearby: 'Circular Quay · Barangaroo · Martin Place · Darling Harbour',
    images: ['assets/images/comfort-base-hero.webp', 'assets/images/base-living-room-01.webp', 'assets/images/base-bedroom-01.webp'],
    imageAlts: ['Premium city apartment interior', 'Furnished living and work environment', 'Quiet bedroom for an extended assignment'],
    externalBookingUrl: ''
  }
};
