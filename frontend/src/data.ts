import { MenuItem, TagConfig } from './types';

export const DEFAULT_MENU: MenuItem[] = [
  {
    id: "m1",
    name: "Aether Truffle Burger",
    price: 24.00,
    category: "Mains",
    description: "Premium wagyu beef patty, black truffle aioli, aged gruyère, rocket, toasted brioche bun. Served with side greens.",
    image: "🍔",
    available: true,
    tags: ["halal"],
    prepTime: 18
  },
  {
    id: "m2",
    name: "Glazed Salmon Poke Bowl",
    price: 18.50,
    category: "Mains",
    description: "Fresh Atlantic salmon, sliced avocado, edamame, seaweed salad, sushi rice, spicy mayo, sesame seeds, and furikake.",
    image: "🥗",
    available: true,
    tags: ["gluten-free", "contains-seafood"],
    prepTime: 12
  },
  {
    id: "m3",
    name: "Smoked Mushroom Risotto",
    price: 21.00,
    category: "Mains",
    description: "Creamy arborio rice, wild forest mushrooms, fresh thyme, pecorino romano, and a rich white truffle oil drizzle.",
    image: "🍲",
    available: true,
    tags: ["vegetarian", "gluten-free"],
    prepTime: 20
  },
  {
    id: "d1",
    name: "Hibiscus Rose Elixir",
    price: 8.00,
    category: "Drinks",
    description: "Organic hibiscus flower tea infusion, rose water, fresh lemon, sparkling water, and a fresh mint sprig.",
    image: "🍹",
    available: true,
    tags: ["vegan", "gluten-free"],
    prepTime: 5
  },
  {
    id: "d2",
    name: "Ceremonial Matcha Latte",
    price: 7.50,
    category: "Drinks",
    description: "Whisked Kyoto ceremonial grade matcha, organic oat milk, and a light touch of raw agave nectar.",
    image: "🍵",
    available: true,
    tags: ["vegan", "gluten-free"],
    prepTime: 5
  },
  {
    id: "d3",
    name: "Classic Smoked Old Fashioned",
    price: 14.00,
    category: "Drinks",
    description: "Premium bourbon, aromatic bitters, sugar cube, orange peel, and cherry. Smoked in-glass with cherry wood chips.",
    image: "🥃",
    available: true,
    tags: ["contains-alcohol"],
    prepTime: 8
  },
  {
    id: "de1",
    name: "Molten Lava Cake",
    price: 12.00,
    category: "Desserts",
    description: "Rich Belgian dark chocolate cake with a warm molten core. Served with a scoop of vanilla bean gelato.",
    image: "🍰",
    available: true,
    tags: ["vegetarian", "contains-dairy"],
    prepTime: 14
  },
  {
    id: "de2",
    name: "Deconstructed Tiramisu",
    price: 11.00,
    category: "Desserts",
    description: "Espresso-soaked artisanal ladyfingers, whipped mascarpone cream, cocoa dust, and a drizzle of coffee liqueur syrup.",
    image: "🍨",
    available: true,
    tags: ["vegetarian", "contains-dairy", "contains-alcohol"],
    prepTime: 10
  },
  {
    id: "s1",
    name: "Parmesan Truffle Fries",
    price: 9.50,
    category: "Sides",
    description: "Hand-cut house potatoes, white truffle oil, freshly grated parmesan cheese, parsley, served with roasted garlic aioli.",
    image: "🍟",
    available: true,
    tags: ["vegetarian", "halal"],
    prepTime: 10
  },
  {
    id: "s2",
    name: "Crispy Calamari",
    price: 13.50,
    category: "Sides",
    description: "Lightly battered wild-caught calamari rings served with house-made spicy lemon herb dipping sauce.",
    image: "🍤",
    available: true,
    tags: ["contains-seafood", "spicy"],
    prepTime: 12
  }
];

export const TAG_CONFIG: Record<string, TagConfig> = {
  'vegetarian':     { label: '🌿 Vegetarian', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  'vegan':          { label: '🍃 Vegan',       color: '#10b981', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.2)' },
  'halal':          { label: '☪️ Halal',        color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  'gluten-free':    { label: '🌾 Gluten-Free',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
  'spicy':          { label: '🌶️ Spicy',        color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.2)' },
  'contains-alcohol': { label: '🍺 Alcohol',  color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)',  border: 'rgba(14,165,233,0.2)' },
  'contains-dairy': { label: '🥛 Dairy',       color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' },
  'contains-seafood': { label: '🦐 Seafood',   color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.2)' },
  'contains-nuts':  { label: '🥜 Nuts',         color: '#d97706', bg: 'rgba(217,119,6,0.08)',   border: 'rgba(217,119,6,0.2)' },
};
