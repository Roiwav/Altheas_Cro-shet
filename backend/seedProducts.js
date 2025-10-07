// seedProducts.js (place in /server or backend folder)
const mongoose = require("mongoose");
const Product = require("./models/Product");

// Array of products to insert. Images should be in /uploads/products/
const products = [
  { name: "Pink Tulips", price: 250, description: "Bright sunflowers for joyful moments.", image: "/uploads/products/1.jpg" },
  { name: "Purple Lily", price: 320, description: "Classic red roses for a romantic surprise.", image: "/uploads/products/2.jpg" },
  { name: "Tulips Shining", price: 290, description: "Elegant white lilies for every occasion.", image: "/uploads/products/3.jpg" },
  { name: "Rose Pink Charm", price: 270, description: "Sweet carnations to brighten someone’s day.", image: "/uploads/products/4.jpg" },
  { name: "Lily Treasure", price: 310, description: "Vibrant tulips full of color and love.", image: "/uploads/products/5.jpg" },
  { name: "Sundrop Harmony Passion", price: 380, description: "Soft and luxurious peonies for special moments.", image: "/uploads/products/6.jpg" },
  { name: "Tulips Blue Daylight", price: 220, description: "Cheerful daisies perfect for a fresh start.", image: "/uploads/products/7.jpg" },
  { name: "Tulips Red Passion", price: 420, description: "Exotic orchids to express elegance.", image: "/uploads/products/8.jpg" },
  { name: "Rose Bloom", price: 330, description: "A blend of seasonal flowers for any mood.", image: "/uploads/products/9.jpg" },
  { name: "Tulips Purple Charm", price: 295, description: "Soft pastel tones to calm and comfort.", image: "/uploads/products/10.jpg" },
  { name: "Tulips Purple Bloom", price: 340, description: "A warm mix of oranges and reds.", image: "/uploads/products/11.jpg" },
  { name: "Lily Harmony", price: 305, description: "Harmonious colors for peaceful vibes.", image: "/uploads/products/12.jpg" },
  { name: "Winter Whisper Bouquet", price: 390, description: "Cool blues and whites for a frosty feel.", image: "/uploads/products/13.jpg" },
  { name: "White Spring Fling", price: 260, description: "A lively burst of spring colors.", image: "/uploads/products/14.jpg" },
  { name: "Blossom Breeze Tulips", price: 280, description: "Light and airy blooms for fresh energy.", image: "/uploads/products/15.jpg" },
  { name: "Tulips Pinky White", price: 300, description: "Bold yellows and pinks to energize.", image: "/uploads/products/16.jpg" },
  { name: "Cherry Blossom Tulips", price: 370, description: "Soft cherry blossoms to soothe the soul.", image: "/uploads/products/17.jpg" },
  { name: "Carnation Love Bouquet", price: 340, description: "Lavender tones that relax and inspire.", image: "/uploads/products/18.jpg" },
  { name: "Lily Daylight", price: 315, description: "Berry hues and textures for sweet smiles.", image: "/uploads/products/19.jpg" },
  { name: "Tulips Fantasy", price: 399, description: "A dreamy mix of the rarest blooms.", image: "/uploads/products/20.jpg" },
  { name: "Lover Blooms", price: 350, description: "Golden-hued florals for sunny hearts.", image: "/uploads/products/21.jpg" },
  { name: "Mini Tulips", price: 385, description: "Deep colors for elegant evenings.", image: "/uploads/products/22.jpg" },
  { name: "Blush Beauty Bouquet", price: 290, description: "Blush-toned flowers that radiate charm.", image: "/uploads/products/23.jpg" },
  { name: "Cotton Clouds Tulips", price: 260, description: "Light whites and soft textures.", image: "/uploads/products/24.jpg" },
  { name: "Tulips Garden", price: 320, description: "Lush garden-inspired arrangement.", image: "/uploads/products/25.jpg" },
  { name: "Tulips Garden Bloom", price: 440, description: "Elegant orchid-focused bouquet.", image: "/uploads/products/26.jpg" },
  { name: "Pink Parade Tulips", price: 275, description: "Playful and bright pink blossoms.", image: "/uploads/products/27.jpg" },
  { name: "Sundrop Lily", price: 245, description: "Rustic wildflowers full of charm.", image: "/uploads/products/28.jpg" },
  { name: "Mixed Sunflower", price: 370, description: "Romantic and heartfelt.", image: "/uploads/products/29.jpg" },
  { name: "Special Mixed Sunflower", price: 310, description: "Cool tones with a refreshing vibe.", image: "/uploads/products/30.jpg" },
  { name: "Special Garden", price: 335, description: "Bold red roses in a classic look.", image: "/uploads/products/31.jpg" },
  { name: "Graceful Rose", price: 270, description: "Greenery-forward natural bouquet.", image: "/uploads/products/32.jpg" },
  { name: "Evening Glow", price: 360, description: "Warm sunset-inspired palette.", image: "/uploads/products/33.jpg" },
  { name: "Two-Lips", price: 305, description: "Soft peaches and pinks in harmony.", image: "/uploads/products/34.jpg" },
  { name: "Tulips Shine", price: 295, description: "A walk through a flower-filled field.", image: "/uploads/products/35.jpg" },
  { name: "Violet Dream", price: 385, description: "Rich violet blooms for luxury feel.", image: "/uploads/products/36.jpg" },
  { name: "Sunkissed Petals", price: 300, description: "Yellow tones with a sunny smile.", image: "/uploads/products/37.jpg" },
  { name: "Red Serenity", price: 330, description: "Subtle hues for quiet moments.", image: "/uploads/products/38.jpg" },
  { name: "Rose Bliss", price: 270, description: "A happy and colorful arrangement.", image: "/uploads/products/39.jpg" },
  { name: "Bold and Beautiful", price: 410, description: "Bright, bold colors that stand out.", image: "/uploads/products/40.jpg" },
  { name: "Rustic Romance", price: 345, description: "Earthy tones and soft textures.", image: "/uploads/products/41.jpg" },
  { name: "Sunflower Dreams", price: 230, description: "Simple and charming daisy bouquet.", image: "/uploads/products/42.jpg" },
  { name: "Chic Red", price: 265, description: "A pure and elegant all-white mix.", image: "/uploads/products/43.jpg" },
  { name: "Sunflower Pop", price: 290, description: "Bright contrasting colors that wow.", image: "/uploads/products/44.jpg" },
  { name: "Purple Pastel", price: 360, description: "Perfect for anniversaries and dates.", image: "/uploads/products/45.jpg" },
  { name: "Sunflower Bloom", price: 280, description: "Gentle pastel palette for calmness.", image: "/uploads/products/46.jpg" },
  { name: "Tulips Bloom", price: 350, description: "Peach and gold tones of early light.", image: "/uploads/products/47.jpg" },
  { name: "Pinky Rose", price: 400, description: "Regal purples and lush greens.", image: "/uploads/products/48.jpg" },
  { name: "Blue Tulips Bloom", price: 315, description: "Whispers of soft pink florals.", image: "/uploads/products/49.jpg" },
  { name: "Elegant Sunny", price: 370, description: "An all-time favorite of elegance.", image: "/uploads/products/50.jpg" },
];

async function seed() {
  // Replace with your actual MongoDB URI and db name
  await mongoose.connect("mongodb+srv://althea_croshet:test123@cluster0.duaboo1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", { useNewUrlParser: true, useUnifiedTopology: true });

  // Optional: Uncomment to clear out all existing products before seeding
  // await Product.deleteMany({});

  await Product.insertMany(products);
  console.log('Seeded 50 products!');
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
