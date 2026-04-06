--
-- PostgreSQL database dump
--

\restrict 5GFhGBWVLZCeN8mYoAbtcC9rrfWSgrRACnWEM8EKE5bR9MQW1Jp6NslG9AKs6fi

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: matcha
--

INSERT INTO public.users (id, email, username, password_hash, first_name, last_name, google_id, is_verified, is_online, last_connection, created_at) VALUES (1, 'Colleen_Barrows@yahoo.com', 'Vicente47', 'hashed_password', NULL, NULL, NULL, true, false, '2026-04-06 11:23:53.203791', '2026-04-06 11:23:53.203791');
INSERT INTO public.users (id, email, username, password_hash, first_name, last_name, google_id, is_verified, is_online, last_connection, created_at) VALUES (2, 'Emelia_Halvorson@yahoo.com', 'Winifred.Hackett79', 'hashed_password', NULL, NULL, NULL, true, false, '2026-04-06 11:24:29.370206', '2026-04-06 11:24:29.370206');
INSERT INTO public.users (id, email, username, password_hash, first_name, last_name, google_id, is_verified, is_online, last_connection, created_at) VALUES (3, 'Macie63@gmail.com', 'Brain_Legros99', 'hashed_password', NULL, NULL, NULL, true, false, '2026-04-06 11:24:29.581367', '2026-04-06 11:24:29.581367');
INSERT INTO public.users (id, email, username, password_hash, first_name, last_name, google_id, is_verified, is_online, last_connection, created_at) VALUES (4, 'Guy97@yahoo.com', 'Lionel.Reilly', 'hashed_password', NULL, NULL, NULL, true, false, '2026-04-06 11:24:29.744758', '2026-04-06 11:24:29.744758');
INSERT INTO public.users (id, email, username, password_hash, first_name, last_name, google_id, is_verified, is_online, last_connection, created_at) VALUES (5, 'Brittany.Fritsch@gmail.com', 'Emma24', 'hashed_password', NULL, NULL, NULL, true, false, '2026-04-06 11:24:29.857741', '2026-04-06 11:24:29.857741');
INSERT INTO public.users (id, email, username, password_hash, first_name, last_name, google_id, is_verified, is_online, last_connection, created_at) VALUES (6, 'Ismael.Jaskolski2@yahoo.com', 'Sally.OHara12', 'hashed_password', NULL, NULL, NULL, true, false, '2026-04-06 11:24:30.065007', '2026-04-06 11:24:30.065007');
INSERT INTO public.users (id, email, username, password_hash, first_name, last_name, google_id, is_verified, is_online, last_connection, created_at) VALUES (7, 'Monique.Grady55@gmail.com', 'Maurice59', 'hashed_password', NULL, NULL, NULL, true, false, '2026-04-06 11:24:30.215795', '2026-04-06 11:24:30.215795');
INSERT INTO public.users (id, email, username, password_hash, first_name, last_name, google_id, is_verified, is_online, last_connection, created_at) VALUES (8, 'Patti.Herzog49@yahoo.com', 'Garrett62', 'hashed_password', NULL, NULL, NULL, true, false, '2026-04-06 11:24:30.347786', '2026-04-06 11:24:30.347786');
INSERT INTO public.users (id, email, username, password_hash, first_name, last_name, google_id, is_verified, is_online, last_connection, created_at) VALUES (9, 'Jeffrey.Gislason54@hotmail.com', 'Antwon58', 'hashed_password', NULL, NULL, NULL, true, false, '2026-04-06 11:24:30.460781', '2026-04-06 11:24:30.460781');
INSERT INTO public.users (id, email, username, password_hash, first_name, last_name, google_id, is_verified, is_online, last_connection, created_at) VALUES (10, 'Elmer.Grady@gmail.com', 'Kailee86', 'hashed_password', NULL, NULL, NULL, true, false, '2026-04-06 11:24:30.643379', '2026-04-06 11:24:30.643379');
INSERT INTO public.users (id, email, username, password_hash, first_name, last_name, google_id, is_verified, is_online, last_connection, created_at) VALUES (11, 'Kyle_Lockman40@yahoo.com', 'Darryl_Johns', 'hashed_password', NULL, NULL, NULL, true, false, '2026-04-06 11:24:30.805407', '2026-04-06 11:24:30.805407');


--
-- Data for Name: blocks; Type: TABLE DATA; Schema: public; Owner: matcha
--



--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: matcha
--



--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: matcha
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: matcha
--



--
-- Data for Name: pictures; Type: TABLE DATA; Schema: public; Owner: matcha
--

INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (1, 2, 'https://picsum.photos/seed/2-1/500/500', true, 1, '2026-04-06 11:24:29.425564');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (2, 2, 'https://picsum.photos/seed/2-2/500/500', false, 2, '2026-04-06 11:24:29.444514');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (3, 2, 'https://picsum.photos/seed/2-3/500/500', false, 3, '2026-04-06 11:24:29.463677');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (4, 3, 'https://picsum.photos/seed/3-1/500/500', true, 1, '2026-04-06 11:24:29.618565');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (5, 4, 'https://picsum.photos/seed/4-1/500/500', true, 1, '2026-04-06 11:24:29.78263');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (6, 4, 'https://picsum.photos/seed/4-2/500/500', false, 2, '2026-04-06 11:24:29.801729');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (7, 5, 'https://picsum.photos/seed/5-1/500/500', true, 1, '2026-04-06 11:24:29.895669');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (8, 5, 'https://picsum.photos/seed/5-2/500/500', false, 2, '2026-04-06 11:24:29.913709');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (9, 5, 'https://picsum.photos/seed/5-3/500/500', false, 3, '2026-04-06 11:24:29.933747');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (10, 5, 'https://picsum.photos/seed/5-4/500/500', false, 4, '2026-04-06 11:24:29.952609');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (11, 5, 'https://picsum.photos/seed/5-5/500/500', false, 5, '2026-04-06 11:24:29.971618');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (12, 6, 'https://picsum.photos/seed/6-1/500/500', true, 1, '2026-04-06 11:24:30.102635');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (13, 6, 'https://picsum.photos/seed/6-2/500/500', false, 2, '2026-04-06 11:24:30.121595');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (14, 7, 'https://picsum.photos/seed/7-1/500/500', true, 1, '2026-04-06 11:24:30.253637');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (15, 7, 'https://picsum.photos/seed/7-2/500/500', false, 2, '2026-04-06 11:24:30.272615');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (16, 8, 'https://picsum.photos/seed/8-1/500/500', true, 1, '2026-04-06 11:24:30.385688');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (17, 8, 'https://picsum.photos/seed/8-2/500/500', false, 2, '2026-04-06 11:24:30.404627');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (18, 8, 'https://picsum.photos/seed/8-3/500/500', false, 3, '2026-04-06 11:24:30.422595');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (19, 9, 'https://picsum.photos/seed/9-1/500/500', true, 1, '2026-04-06 11:24:30.498691');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (20, 9, 'https://picsum.photos/seed/9-2/500/500', false, 2, '2026-04-06 11:24:30.517496');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (21, 9, 'https://picsum.photos/seed/9-3/500/500', false, 3, '2026-04-06 11:24:30.535389');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (22, 9, 'https://picsum.photos/seed/9-4/500/500', false, 4, '2026-04-06 11:24:30.553308');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (23, 9, 'https://picsum.photos/seed/9-5/500/500', false, 5, '2026-04-06 11:24:30.5713');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (24, 10, 'https://picsum.photos/seed/10-1/500/500', true, 1, '2026-04-06 11:24:30.679316');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (25, 10, 'https://picsum.photos/seed/10-2/500/500', false, 2, '2026-04-06 11:24:30.697247');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (26, 10, 'https://picsum.photos/seed/10-3/500/500', false, 3, '2026-04-06 11:24:30.715363');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (27, 10, 'https://picsum.photos/seed/10-4/500/500', false, 4, '2026-04-06 11:24:30.733257');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (28, 10, 'https://picsum.photos/seed/10-5/500/500', false, 5, '2026-04-06 11:24:30.751346');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (29, 11, 'https://picsum.photos/seed/11-1/500/500', true, 1, '2026-04-06 11:24:30.841245');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (30, 11, 'https://picsum.photos/seed/11-2/500/500', false, 2, '2026-04-06 11:24:30.859427');
INSERT INTO public.pictures (id, user_id, url, is_profile, "position", created_at) VALUES (31, 11, 'https://picsum.photos/seed/11-3/500/500', false, 3, '2026-04-06 11:24:30.877426');


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: matcha
--

INSERT INTO public.profiles (user_id, gender, preference, age, first_name, last_name, biography, fame_rating, latitude, longitude, location_text, is_setup, created_at) VALUES (2, 'female', 'both', 25, 'Jovany', 'Hilpert', 'Allatus corrumpo ipsum sto triumphus dedico demonstro sumptus valde triumphus.', 65, 13.85651226775382, 100.87004523692414, 'Bangkok, Thailand', false, '2026-04-06 11:24:29.38915');
INSERT INTO public.profiles (user_id, gender, preference, age, first_name, last_name, biography, fame_rating, latitude, longitude, location_text, is_setup, created_at) VALUES (3, 'male', 'female', 30, 'Morton', 'Herman', 'Cubitum conqueror consuasor facilis urbanus saepe inventore amissio abbas.', 51, 13.790921863379813, 100.78103026269306, 'Bangkok, Thailand', false, '2026-04-06 11:24:29.599854');
INSERT INTO public.profiles (user_id, gender, preference, age, first_name, last_name, biography, fame_rating, latitude, longitude, location_text, is_setup, created_at) VALUES (4, 'female', 'male', 19, 'Leticia', 'Runte', 'Clarus tabella villa cena molestias crastinus reiciendis teneo caste condico.', 39, 13.513071369996991, 100.76830074862039, 'Bangkok, Thailand', false, '2026-04-06 11:24:29.763793');
INSERT INTO public.profiles (user_id, gender, preference, age, first_name, last_name, biography, fame_rating, latitude, longitude, location_text, is_setup, created_at) VALUES (5, 'male', 'male', 50, 'Jeanette', 'Ankunding', 'Quo magni callide adicio altus theatrum tametsi vivo tergum utpote.', 63, 13.879489814732032, 100.87183972194613, 'Bangkok, Thailand', false, '2026-04-06 11:24:29.876654');
INSERT INTO public.profiles (user_id, gender, preference, age, first_name, last_name, biography, fame_rating, latitude, longitude, location_text, is_setup, created_at) VALUES (6, 'female', 'both', 19, 'Craig', 'Hudson', 'Tres pax cito omnis tempora cui cenaculum.', 93, 13.761400969029882, 100.42343292537602, 'Bangkok, Thailand', false, '2026-04-06 11:24:30.083857');
INSERT INTO public.profiles (user_id, gender, preference, age, first_name, last_name, biography, fame_rating, latitude, longitude, location_text, is_setup, created_at) VALUES (7, 'male', 'male', 50, 'Megan', 'Reinger', 'Odit volup coepi ademptio aeger sublime deduco suppono comitatus.', 30, 13.533210970205817, 100.36128863574976, 'Bangkok, Thailand', false, '2026-04-06 11:24:30.234932');
INSERT INTO public.profiles (user_id, gender, preference, age, first_name, last_name, biography, fame_rating, latitude, longitude, location_text, is_setup, created_at) VALUES (8, 'female', 'male', 41, 'Margie', 'Turner', 'Sit cimentarius aranea vae basium campana tricesimus ipsum aranea.', 51, 13.57470856322276, 100.56409318000371, 'Bangkok, Thailand', false, '2026-04-06 11:24:30.366831');
INSERT INTO public.profiles (user_id, gender, preference, age, first_name, last_name, biography, fame_rating, latitude, longitude, location_text, is_setup, created_at) VALUES (9, 'female', 'male', 26, 'Frank', 'Vandervort', 'Veritatis cum dens adsuesco contego.', 53, 13.841629816192137, 100.70931875836519, 'Bangkok, Thailand', false, '2026-04-06 11:24:30.479763');
INSERT INTO public.profiles (user_id, gender, preference, age, first_name, last_name, biography, fame_rating, latitude, longitude, location_text, is_setup, created_at) VALUES (10, 'male', 'both', 27, 'Carl', 'Leffler', 'Aduro tendo creta conturbo animi.', 29, 13.8087263914914, 100.72872199058203, 'Bangkok, Thailand', false, '2026-04-06 11:24:30.661417');
INSERT INTO public.profiles (user_id, gender, preference, age, first_name, last_name, biography, fame_rating, latitude, longitude, location_text, is_setup, created_at) VALUES (11, 'male', 'male', 49, 'Jerel', 'Collier', 'Vinculum vorax alo dolorem articulus nostrum speculum deprecator tergo.', 18, 13.883917356802955, 100.65676604678882, 'Bangkok, Thailand', false, '2026-04-06 11:24:30.823493');


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: matcha
--



--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: matcha
--



--
-- Data for Name: swipes; Type: TABLE DATA; Schema: public; Owner: matcha
--



--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: matcha
--

INSERT INTO public.tags (id, name) VALUES (1, 'geek');
INSERT INTO public.tags (id, name) VALUES (2, 'vegan');
INSERT INTO public.tags (id, name) VALUES (3, 'fitness');
INSERT INTO public.tags (id, name) VALUES (4, 'travel');
INSERT INTO public.tags (id, name) VALUES (5, 'music');
INSERT INTO public.tags (id, name) VALUES (6, 'coffee');
INSERT INTO public.tags (id, name) VALUES (7, 'gaming');
INSERT INTO public.tags (id, name) VALUES (8, 'movies');
INSERT INTO public.tags (id, name) VALUES (9, 'reading');
INSERT INTO public.tags (id, name) VALUES (10, 'coding');
INSERT INTO public.tags (id, name) VALUES (11, 'art');
INSERT INTO public.tags (id, name) VALUES (12, 'photography');
INSERT INTO public.tags (id, name) VALUES (13, 'sports');
INSERT INTO public.tags (id, name) VALUES (14, 'yoga');
INSERT INTO public.tags (id, name) VALUES (15, 'hiking');
INSERT INTO public.tags (id, name) VALUES (16, 'fashion');
INSERT INTO public.tags (id, name) VALUES (17, 'foodie');
INSERT INTO public.tags (id, name) VALUES (18, 'pets');
INSERT INTO public.tags (id, name) VALUES (19, 'technology');
INSERT INTO public.tags (id, name) VALUES (20, 'anime');
INSERT INTO public.tags (id, name) VALUES (21, 'kpop');
INSERT INTO public.tags (id, name) VALUES (22, 'cars');
INSERT INTO public.tags (id, name) VALUES (23, 'nature');
INSERT INTO public.tags (id, name) VALUES (24, 'startup');
INSERT INTO public.tags (id, name) VALUES (25, 'finance');
INSERT INTO public.tags (id, name) VALUES (26, 'crypto');
INSERT INTO public.tags (id, name) VALUES (27, 'books');
INSERT INTO public.tags (id, name) VALUES (28, 'series');
INSERT INTO public.tags (id, name) VALUES (29, 'nightlife');


--
-- Data for Name: user_tags; Type: TABLE DATA; Schema: public; Owner: matcha
--

INSERT INTO public.user_tags (user_id, tag_id) VALUES (2, 22);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (2, 18);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (2, 2);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (2, 15);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (2, 10);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (3, 7);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (3, 23);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (3, 22);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (3, 6);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (3, 21);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (4, 19);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (4, 2);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (5, 14);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (5, 12);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (5, 6);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (5, 29);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (6, 6);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (6, 12);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (6, 10);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (6, 17);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (7, 6);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (7, 23);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (7, 8);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (8, 14);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (9, 3);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (9, 24);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (9, 4);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (10, 23);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (10, 29);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (11, 29);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (11, 1);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (11, 14);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (11, 20);
INSERT INTO public.user_tags (user_id, tag_id) VALUES (11, 5);


--
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: matcha
--



--
-- Name: blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: matcha
--

SELECT pg_catalog.setval('public.blocks_id_seq', 1, false);


--
-- Name: matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: matcha
--

SELECT pg_catalog.setval('public.matches_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: matcha
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: matcha
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: pictures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: matcha
--

SELECT pg_catalog.setval('public.pictures_id_seq', 31, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: matcha
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 1, false);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: matcha
--

SELECT pg_catalog.setval('public.reports_id_seq', 1, false);


--
-- Name: swipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: matcha
--

SELECT pg_catalog.setval('public.swipes_id_seq', 1, false);


--
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: matcha
--

SELECT pg_catalog.setval('public.tags_id_seq', 116, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: matcha
--

SELECT pg_catalog.setval('public.users_id_seq', 11, true);


--
-- Name: visits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: matcha
--

SELECT pg_catalog.setval('public.visits_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict 5GFhGBWVLZCeN8mYoAbtcC9rrfWSgrRACnWEM8EKE5bR9MQW1Jp6NslG9AKs6fi

