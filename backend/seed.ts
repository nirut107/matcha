import { faker } from '@faker-js/faker';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
dotenv.config();

const client = new Client({
  connectionString: "postgresql://matcha:matcha123@localhost:5432/matcha_db",
});

const TAGS = [
  'geek',
  'vegan',
  'fitness',
  'travel',
  'music',
  'coffee',
  'gaming',
  'movies',
  'reading',
  'coding',
  'art',
  'photography',
  'sports',
  'yoga',
  'hiking',
  'fashion',
  'foodie',
  'pets',
  'technology',
  'anime',
  'kpop',
  'cars',
  'nature',
  'startup',
  'finance',
  'crypto',
  'books',
  'series',
  'nightlife',
];

async function seed() {
  await client.connect();

  console.log('Seeding...');

  for (const tag of TAGS) {
    await client.query(
      `INSERT INTO tags (name) VALUES ($1) ON CONFLICT DO NOTHING`,
      [tag],
    );
  }

  const tagRes = await client.query(`SELECT * FROM tags`);
  const tagIds = tagRes.rows.map((t) => t.id);

  for (let i = 0; i < 500; i++) {
    // =====================
    // USER
    // =====================
    const email = faker.internet.email();
    const username = faker.internet.username();

    const userRes = await client.query(
      `
      INSERT INTO users (
        email, username, password_hash, is_verified
      )
      VALUES ($1, $2, $3, true)
      RETURNING id
      `,
      [email, username, 'hashed_password'],
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
        fame_rating, latitude, longitude, location_text,
        first_name, last_name -- Add these two!
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
        faker.person.firstName(), // $10
        faker.person.lastName(), // $11
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

type UserRow = {
  id: number;
};

async function createRealUserWithActivity() {
  console.log("start resl user")
  const username = 'testuser';
  const email = 'real@example.com';
  const rawPassword = 'test123';
  const password_hash = await bcrypt.hash(rawPassword, 10);

  const userRes = await client.query(
    `
    INSERT INTO users (username, email, password_hash, is_verified)
    VALUES ($1, $2, $3, true)
    RETURNING id
    `,
    [username, email, password_hash],
  );

  const userId = userRes.rows[0].id;

  await client.query(
    `
    INSERT INTO profiles (
      user_id, gender, preference, age, biography,
      fame_rating, latitude, longitude, location_text,
      first_name, last_name
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `,
    [
      userId,
      'male',
      'both',
      25,
      'I am a real seeded user',
      50,
      13.75,
      100.5,
      'Bangkok, Thailand',
      'Real',
      'User',
    ],
  );

  const users = await client.query<UserRow>(
    `SELECT id FROM users WHERE id != $1`,
    [userId],
  );

  const shuffled = faker.helpers.shuffle<UserRow>(users.rows);

  const likes = shuffled.slice(0, 7);
  const passes = shuffled.slice(7, 9);

  for (const u of likes) {
    await client.query(
      `
      INSERT INTO swipes (swiper_id, target_id, action)
      VALUES ($1, $2, 'like')
      ON CONFLICT (swiper_id, target_id)
      DO UPDATE SET action = 'like'
      `,
      [userId, u.id],
    );
  }

  for (const u of passes) {
    await client.query(
      `
      INSERT INTO swipes (swiper_id, target_id, action)
      VALUES ($1, $2, 'pass')
      ON CONFLICT (swiper_id, target_id)
      DO UPDATE SET action = 'pass'
      `,
      [userId, u.id],
    );
  }

  console.log(`Real user created: ${userId}`);
}

seed();
createRealUserWithActivity();
