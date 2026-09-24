/*
 * Comfort Base property configuration.
 * Add each client's real booking-page URL to `externalBookingUrl` below.
 * Keep an empty string until a verified URL is supplied; the website will
 * show a safe "Booking link coming soon" state instead of a broken link.
 */
window.COMFORT_BASE_PROPERTIES = {
  parkside: {
    slug: 'the-parkside-base',
    title: 'The Parkside Base',
    location: 'South Yarra · Melbourne',
    guests: 4,
    bedrooms: 2,
    bathrooms: 2,
    description: 'A thoughtfully prepared two-bedroom base near leafy parklands, neighbourhood dining and easy city connections. Designed for weekends, work trips and longer stays.',
    parking: 'One secure allocated space is included.',
    nearby: 'Royal Botanic Gardens · Chapel Street dining · Melbourne CBD · Arts Precinct',
    images: ['/assets/images/base-living-room-01.webp', '/assets/images/base-bedroom-01.webp', '/assets/images/comfort-base-hero.webp'],
    imageAlts: ['Sunlit living room with city view', 'Calm primary bedroom', 'Open-plan living and kitchen space'],
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
    images: ['/assets/images/comfort-base-hero.webp', '/assets/images/base-bedroom-01.webp', '/assets/images/base-living-room-01.webp'],
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
    images: ['/assets/images/base-bedroom-01.webp', '/assets/images/base-living-room-01.webp', '/assets/images/comfort-base-hero.webp'],
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
    images: ['/assets/images/comfort-base-hero.webp', '/assets/images/base-living-room-01.webp', '/assets/images/base-bedroom-01.webp'],
    imageAlts: ['Premium city apartment interior', 'Furnished living and work environment', 'Quiet bedroom for an extended assignment'],
    externalBookingUrl: ''
  }
};
