import { faker } from '@faker-js/faker';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const TAGS = [
  'coding', 'coffee', 'music', 'travel', 'fitness',
  'movies', 'gaming', 'art', 'food', 'photography',
];

async function seed() {
  await client.connect();

  console.log('Seeding...');

  // 👉 insert tags
  for (const tag of TAGS) {
    await client.query(
      `INSERT INTO tags (name) VALUES ($1) ON CONFLICT DO NOTHING`,
      [tag],
    );
  }

  const tagRes = await client.query(`SELECT * FROM tags`);
  const tagIds = tagRes.rows.map(t => t.id);

  for (let i = 0; i < 500; i++) {
    // =====================
    // USER
    // =====================
    const email = faker.internet.email();
    const username = faker.internet.username();

    const userRes = await client.query(
      `
      INSERT INTO users (
        email, username, password_hash, first_name, last_name, is_verified
      )
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id
      `,
      [
        email,
        username,
        'hashed_password',
        faker.person.firstName(),
        faker.person.lastName(),
      ],
    );

    const userId = userRes.rows[0].id;

    // =====================
    // PROFILE
    // =====================
    function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }
      
    const latitude = randomInRange(13.5, 13.9);
    const longitude = randomInRange(100.3, 100.9);

    await client.query(
      `
      INSERT INTO profiles (
        user_id, gender, preference, age, biography,
        fame_rating, latitude, longitude, location_text
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [
        userId,
        faker.helpers.arrayElement(['male', 'female']),
        faker.helpers.arrayElement(['male', 'female', 'both']),
        faker.number.int({ min: 18, max: 50 }),
        faker.lorem.sentence(),
        faker.number.int({ min: 0, max: 100 }),
        latitude,
        longitude,
        'Bangkok, Thailand',
      ],
    );

    // =====================
    // PICTURES (1–5)
    // =====================
    const picCount = faker.number.int({ min: 1, max: 5 });

    for (let p = 1; p <= picCount; p++) {
      await client.query(
        `
        INSERT INTO pictures (user_id, url, is_profile, position)
        VALUES ($1, $2, $3, $4)
        `,
        [
          userId,
          `https://picsum.photos/seed/${userId}-${p}/500/500`, // 🔥 mock images
          p === 1,
          p,
        ],
      );
    }

    // =====================
    // TAGS (1–5)
    // =====================
    const userTagCount = faker.number.int({ min: 1, max: 5 });

    const shuffled = faker.helpers.shuffle(tagIds).slice(0, userTagCount);

    for (const tagId of shuffled) {
      await client.query(
        `
        INSERT INTO user_tags (user_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        `,
        [userId, tagId],
      );
    }

    if (i % 50 === 0) {
      console.log(`Inserted ${i} users...`);
    }
  }

  await client.end();

  console.log('✅ Seeding complete');
}

seed();