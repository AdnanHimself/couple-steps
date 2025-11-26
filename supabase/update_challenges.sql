-- Delete dependent records first to avoid foreign key constraints
DELETE FROM user_challenges;
DELETE FROM couple_challenges;

-- Delete all existing challenges
DELETE FROM challenges;

-- Insert new challenges
INSERT INTO challenges (title, description, goal, type, image_url, duration_days) VALUES
('Central Park Stroll', 'A relaxing walk through NYC''s green heart. Perfect for a weekend.', 13000, 'solo', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80', 1),
('Eiffel Tower Climb', 'Equivalent to climbing the Iron Lady 10 times!', 16500, 'solo', 'https://images.unsplash.com/photo-1511739001486-6bfe10ce7859?w=800&q=80', 2),
('Golden Gate Crossing', 'Walk the iconic bridge there and back again.', 7100, 'solo', 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80', 3),
('Marathon Runner', 'Complete the classic 42km distance at your own pace.', 55000, 'solo', 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&q=80', 5),
('Grand Canyon Rim', 'A breathtaking journey along the edge of the world.', 50000, 'solo', 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80', 7),
('Hadrian''s Wall', 'Patrol the ancient Roman frontier in Northern England.', 153000, 'solo', 'https://images.unsplash.com/photo-1564858852033-255d65418b48?w=800&q=80', 14),
('Mount Fuji Ascent', 'The sacred climb to the summit of Japan.', 30000, 'solo', 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800&q=80', 20),
('Inca Trail', 'The legendary path to the lost city of Machu Picchu.', 70000, 'solo', 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80', 30),
('Iceland Ring Road', 'A complete tour of fire and ice.', 1750000, 'solo', 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800&q=80', 45),
('Walk to the ISS', 'The distance from Earth to the Space Station''s orbit!', 535000, 'solo', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', 90),
('Romantic Paris Stroll', 'Explore the City of Lights together, hand in hand.', 26000, 'couple', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80', 5),
('Venice Canals', 'Get lost in the winding streets and bridges of Venice.', 20000, 'couple', 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800&q=80', 10),
('Aloha Hawaii', 'An island hopping adventure through paradise.', 236000, 'couple', 'https://images.unsplash.com/photo-1542259649-4d969828c57b?w=800&q=80', 21),
('Paris to London', 'Connecting two great capitals across the channel.', 450000, 'couple', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80', 30),
('Great Wall Section', 'Conquer a 100km section of the dragon of stone.', 130000, 'couple', 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80', 60),
('Berlin to Rome', 'A grand European tour crossing the Alps.', 1968000, 'couple', 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800&q=80', 90),
('Sahara Crossing', 'Survive the endless sands as a team.', 2100000, 'couple', 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80', 120),
('Route 66', 'The ultimate American road trip.', 5170000, 'couple', 'https://images.unsplash.com/photo-1525016281788-29984955700d?w=800&q=80', 180),
('Amazon Expedition', 'A journey through the heart of the jungle.', 8400000, 'couple', 'https://images.unsplash.com/photo-1572252821143-066749960dd8?w=800&q=80', 240),
('Around the Moon', 'A giant leap for your relationship.', 14300000, 'couple', 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=800&q=80', 365);
