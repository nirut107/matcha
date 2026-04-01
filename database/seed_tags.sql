INSERT INTO tags (name) VALUES
('geek'),
('vegan'),
('fitness'),
('travel'),
('music'),
('coffee'),
('gaming'),
('movies'),
('reading'),
('coding'),
('art'),
('photography'),
('sports'),
('yoga'),
('hiking'),
('fashion'),
('foodie'),
('pets'),
('technology'),
('anime'),
('kpop'),
('cars'),
('nature'),
('startup'),
('finance'),
('crypto'),
('books'),
('movies'),
('series'),
('nightlife')
ON CONFLICT (name) DO NOTHING;


-- docker exec -i matcha_postgres psql -U matcha -d matcha_db < database/seed_tags.sql


-- ALTER TABLE pictures
-- ADD CONSTRAINT unique_user_position UNIQUE (user_id, position);
