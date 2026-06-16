import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_MENU = [
  {
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

async function main() {
  console.log('Seeding menu data...');

  for (const item of DEFAULT_MENU) {
    const category = await prisma.category.upsert({
      where: { name: item.category },
      update: {},
      create: { name: item.category },
    });

    await prisma.menuItem.create({
      data: {
        name: item.name,
        price: item.price,
        description: item.description,
        image: item.image,
        available: item.available,
        tags: item.tags,
        prepTime: item.prepTime,
        categoryId: category.id,
      },
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
