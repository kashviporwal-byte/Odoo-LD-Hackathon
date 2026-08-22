-- Seed file for GlobeTrotter Database
-- Seeding 15 cities and 30 activities

-- Clear existing data (optional / safe development environment step)
TRUNCATE TABLE trip_activities CASCADE;
TRUNCATE TABLE activities CASCADE;
TRUNCATE TABLE stops CASCADE;
TRUNCATE TABLE cities CASCADE;

-- Insert Cities
INSERT INTO cities (id, name, country, lat, lng, cost_index, popularity, region, image_url) VALUES
(1, 'Paris', 'France', 48.8566, 2.3522, 3, 5, 'Europe', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400'),
(2, 'Tokyo', 'Japan', 35.6762, 139.6503, 3, 5, 'Asia', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400'),
(3, 'Rome', 'Italy', 41.9028, 12.4964, 2, 5, 'Europe', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=400'),
(4, 'New York', 'United States', 40.7128, -74.0060, 3, 5, 'North America', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=400'),
(5, 'London', 'United Kingdom', 51.5074, -0.1278, 3, 5, 'Europe', 'https://images.unsplash.com/photo-1513635269975-59663e0ca1ad?auto=format&fit=crop&w=400'),
(6, 'Sydney', 'Australia', -33.8688, 151.2093, 3, 4, 'Oceania', 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=400'),
(7, 'Cairo', 'Egypt', 30.0444, 31.2357, 1, 4, 'Africa', 'https://images.unsplash.com/photo-1572252009286-268acec510d2?auto=format&fit=crop&w=400'),
(8, 'Rio de Janeiro', 'Brazil', -22.9068, -43.1729, 2, 4, 'South America', 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=400'),
(9, 'Barcelona', 'Spain', 41.3851, 2.1734, 2, 5, 'Europe', 'https://images.unsplash.com/photo-1583422409516-2895a77efedd?auto=format&fit=crop&w=400'),
(10, 'Amsterdam', 'Netherlands', 52.3676, 4.9041, 3, 4, 'Europe', 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=400'),
(11, 'Singapore', 'Singapore', 1.3521, 103.8198, 3, 5, 'Asia', 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=400'),
(12, 'Cape Town', 'South Africa', -33.9249, 18.4241, 1, 4, 'Africa', 'https://images.unsplash.com/photo-1376483440700-1c6670845625?auto=format&fit=crop&w=400'),
(13, 'Dubai', 'United Arab Emirates', 25.2048, 55.2708, 3, 5, 'Middle East', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=400'),
(14, 'Toronto', 'Canada', 43.6532, -79.3832, 3, 4, 'North America', 'https://images.unsplash.com/photo-1517935706615-2717063c2225?auto=format&fit=crop&w=400'),
(15, 'Mumbai', 'India', 19.0760, 72.8777, 1, 4, 'Asia', 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=400');

-- Restart City serial counter
SELECT setval('cities_id_seq', 15);

-- Insert Activities
INSERT INTO activities (id, city_id, name, category, description, image_url, est_cost, est_duration_mins) VALUES
-- Paris (City 1)
(1, 1, 'Eiffel Tower Summit Tour', 'sightseeing', 'Guided access to the top of the world-famous Eiffel Tower.', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400', 45.00, 120),
(2, 1, 'Louvre Museum Guided Walk', 'sightseeing', 'See the Mona Lisa and many classic works of art with an art historian.', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=400', 35.00, 180),
-- Tokyo (City 2)
(3, 2, 'Shibuya Crossing & Food Tour', 'food', 'Walk the busiest crossing and enjoy local street food snacks.', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400', 50.00, 150),
(4, 2, 'Senso-ji Asakusa Temple Tour', 'sightseeing', 'Explore Tokyos oldest and most iconic Buddhist temple.', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400', 10.00, 90),
-- Rome (City 3)
(5, 3, 'Colosseum & Forum Entry', 'sightseeing', 'Step back in time to the Roman Empire with skip-the-line entry.', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=400', 30.00, 180),
(6, 3, 'Pizza & Gelato Making Class', 'food', 'Learn from Roman chefs to knead dough and churn gelato.', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400', 55.00, 120),
-- New York (City 4)
(7, 4, 'Central Park Bike Rental', 'adventure', 'Bike around Central Parks lakes, castles, and famous bridges.', 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=400', 20.00, 120),
(8, 4, 'Empire State Building Observatory', 'sightseeing', 'Take in 360-degree views of the NYC skyline from the 86th floor.', 'https://images.unsplash.com/photo-1522083165195-342750297f4e?auto=format&fit=crop&w=400', 42.00, 90),
-- London (City 5)
(9, 5, 'London Eye Flight', 'sightseeing', 'High-altitude panoramic view over the Big Ben, Thames, and Westminster.', 'https://images.unsplash.com/photo-1513635269975-59663e0ca1ad?auto=format&fit=crop&w=400', 32.00, 60),
(10, 5, 'Tower of London & Crown Jewels', 'sightseeing', 'Discover the royal castle, dark histories, and view the royal jewels.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400', 38.00, 150),
-- Sydney (City 6)
(11, 6, 'Sydney Opera House Behind-the-Scenes', 'sightseeing', 'Step inside the historic sails on a premium guided walking tour.', 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=400', 40.00, 90),
(12, 6, 'Bondi Beach Surf Lesson', 'adventure', 'Learn to catch a wave with local Australian surf instructors.', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400', 65.00, 120),
-- Cairo (City 7)
(13, 7, 'Giza Pyramids & Sphinx Camel Ride', 'adventure', 'Ride a camel across the desert sands with the Pyramids in sight.', 'https://images.unsplash.com/photo-1572252009286-268acec510d2?auto=format&fit=crop&w=400', 25.00, 180),
(14, 7, 'Grand Egyptian Museum Tour', 'sightseeing', 'Explore thousands of ancient pharaonic treasures and mummies.', 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400', 15.00, 150),
-- Rio (City 8)
(15, 8, 'Christ the Redeemer Express Cog-Train', 'sightseeing', 'Ride up Corcovado mountain to stand at the base of the statue.', 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=400', 28.00, 120),
(16, 8, 'Sugarloaf Cable Car ride', 'adventure', 'Ascend high above the Guanabara bay for stunning ocean views.', 'https://images.unsplash.com/photo-1518638150341-db700a430501?auto=format&fit=crop&w=400', 32.00, 90),
-- Barcelona (City 9)
(17, 9, 'La Sagrada Familia Guided Entry', 'sightseeing', 'Witness Gaudi’s masterpiece cathedral and learn about its design.', 'https://images.unsplash.com/photo-1583422409516-2895a77efedd?auto=format&fit=crop&w=400', 26.00, 120),
(18, 9, 'Tapas & Wine Historical Quarter Tour', 'food', 'Taste local Catalonian delicacies and wines in historic taverns.', 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?auto=format&fit=crop&w=400', 48.00, 150),
-- Amsterdam (City 10)
(19, 10, 'Canal Ring Sightseeing Cruise', 'sightseeing', 'Glide past narrow merchant houses on a semi-open canal cruise.', 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=400', 22.00, 75),
(20, 10, 'Van Gogh Museum Skip-the-line', 'sightseeing', 'View the worlds largest collection of Van Goghs famous paintings.', 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=400', 24.00, 120),
-- Singapore (City 11)
(21, 11, 'Gardens by the Bay Double Dome Pass', 'sightseeing', 'Walk through the Cloud Forest and Flower Dome greenhouses.', 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=400', 28.00, 120),
(22, 11, 'Marina Bay Sands SkyPark Observation Deck', 'sightseeing', 'Look down on Singapore from 57 stories above ground level.', 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=400', 26.00, 60),
-- Cape Town (City 12)
(23, 12, 'Table Mountain Cableway Tickets', 'adventure', 'Ascend the flat-topped mountain for sweeping views of the Cape.', 'https://images.unsplash.com/photo-1376483440700-1c6670845625?auto=format&fit=crop&w=400', 25.00, 90),
(24, 12, 'Robben Island Museum Tour', 'sightseeing', 'Take a ferry ride and tour Nelson Mandelas prison cell.', 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=400', 30.00, 210),
-- Dubai (City 13)
(25, 13, 'Burj Khalifa Observation (124+125th Floor)', 'sightseeing', 'Stand on the worlds tallest observation deck in the skies.', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=400', 45.00, 90),
(26, 13, 'Desert Safari & BBQ Dinner Tour', 'adventure', 'Enjoy dune bashing, camel riding, and a barbecue desert show.', 'https://images.unsplash.com/photo-1489493887462-402b7264e919?auto=format&fit=crop&w=400', 60.00, 360),
-- Toronto (City 14)
(27, 14, 'CN Tower Observation Deck', 'sightseeing', 'Take an elevator up the famous tower to peer down the glass floor.', 'https://images.unsplash.com/photo-1517935706615-2717063c2225?auto=format&fit=crop&w=400', 35.00, 90),
(28, 14, 'Royal Ontario Museum Visit', 'sightseeing', 'Browse exhibits covering natural history, dinosaur fossils, and art.', 'https://images.unsplash.com/photo-1526976775576-f15901db93ae?auto=format&fit=crop&w=400', 20.00, 150),
-- Mumbai (City 15)
(29, 15, 'Gateway of India & Taj Mahal Palace Walk', 'sightseeing', 'Admire colonial era arches and hear the history of Southern Mumbai.', 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=400', 10.00, 90),
(30, 15, 'Elephanta Caves Boat Tour', 'sightseeing', 'Take a ferry to the island to see rock-cut cave temples.', 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=400', 22.00, 240);

-- Restart Activity serial counter
SELECT setval('activities_id_seq', 30);
