// Seeded providers. In demo mode each also gets a login (password: demo1234).
export const SEED_PROVIDERS = [
  {
    id: "seed_plumb", name: "Daniel Rivera", email: "daniel@quickserve.demo",
    photoURL: "images/provider-plumber.png", category: "plumbing",
    location: "Downtown", price: 55, experience: 9,
    bio: "Licensed master plumber specializing in leak repair, pipe installation and emergency call-outs. Fast, tidy and reliable.",
    rating: 4.9, ratingCount: 128, jobs: 340, published: true, createdAt: Date.now() - 90000000,
  },
  {
    id: "seed_elec", name: "Aisha Khan", email: "aisha@quickserve.demo",
    photoURL: "images/provider-electrician.png", category: "electrical",
    location: "Riverside", price: 65, experience: 7,
    bio: "Certified electrician for wiring, lighting, panel upgrades and smart-home installs. Safety-first, code-compliant work.",
    rating: 4.8, ratingCount: 96, jobs: 210, published: true, createdAt: Date.now() - 80000000,
  },
  {
    id: "seed_clean", name: "Maria Santos", email: "maria@quickserve.demo",
    photoURL: "images/provider-cleaner.png", category: "cleaning",
    location: "Uptown", price: 35, experience: 5,
    bio: "Detail-obsessed home & office cleaning. Deep cleans, move-in/out and recurring plans with eco-friendly products.",
    rating: 4.95, ratingCount: 204, jobs: 520, published: true, createdAt: Date.now() - 70000000,
  },
  {
    id: "seed_carp", name: "James Carter", email: "james@quickserve.demo",
    photoURL: "images/provider-carpenter.png", category: "carpentry",
    location: "Old Town", price: 60, experience: 12,
    bio: "Custom furniture, cabinetry, framing and repairs. 12 years of craftsmanship with a keen eye for finish quality.",
    rating: 4.7, ratingCount: 74, jobs: 180, published: true, createdAt: Date.now() - 60000000,
  },
  {
    id: "seed_paint", name: "Leo Martins", email: "leo@quickserve.demo",
    photoURL: "images/provider-painter.png", category: "painting",
    location: "Riverside", price: 45, experience: 6,
    bio: "Interior & exterior painting with clean lines and premium finishes. Free color consultation on every project.",
    rating: 4.6, ratingCount: 58, jobs: 150, published: true, createdAt: Date.now() - 50000000,
  },
  {
    id: "seed_garden", name: "Nadia Bloom", email: "nadia@quickserve.demo",
    photoURL: "images/provider-gardener.png", category: "gardening",
    location: "Greenfield", price: 40, experience: 8,
    bio: "Landscaping, lawn care, hedge trimming and seasonal garden design. Turning outdoor spaces into something you love.",
    rating: 4.85, ratingCount: 112, jobs: 300, published: true, createdAt: Date.now() - 40000000,
  },
];
