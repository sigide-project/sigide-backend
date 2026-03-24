'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const userId1 = uuidv4();
const userId2 = uuidv4();
const userId3 = uuidv4();
const userId4 = uuidv4();

const itemIds = Array.from({ length: 15 }, () => uuidv4());
const addressIds = Array.from({ length: 8 }, () => uuidv4());
const savedItemIds = Array.from({ length: 8 }, () => uuidv4());

module.exports = {
  async up(queryInterface) {
    const hash = await bcrypt.hash('password123', 10);

    await queryInterface.bulkInsert('users', [
      { id: userId1, username: 'arjun_mehta', name: 'Arjun Mehta', email: 'arjun@sigide.dev', phone: '9876543210', password_hash: hash, rating: 4.5, role: 'user', created_at: new Date(), updated_at: new Date() },
      { id: userId2, username: 'priya_nair', name: 'Priya Nair', email: 'priya@sigide.dev', phone: '9123456780', password_hash: hash, rating: 4.8, role: 'admin', created_at: new Date(), updated_at: new Date() },
      { id: userId3, username: 'rahul_sharma', name: 'Rahul Sharma', email: 'rahul@sigide.dev', phone: '9988776655', password_hash: hash, rating: 4.2, role: 'user', created_at: new Date(), updated_at: new Date() },
      { id: userId4, username: 'sneha_reddy', name: 'Sneha Reddy', email: 'sneha@sigide.dev', phone: '9112233445', password_hash: hash, rating: 4.9, role: 'user', created_at: new Date(), updated_at: new Date() },
    ]);

    const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    await queryInterface.bulkInsert('items', [
      // 1. Lost wallet - Indiranagar (Central Bangalore)
      { id: itemIds[0], user_id: userId1, type: 'lost', status: 'open', title: 'Black leather wallet', category: 'wallet', description: 'Lost near Indiranagar metro station. Has Axis bank cards and driving license inside. Brown leather with initials AM.', image_urls: '{}', location_name: 'Indiranagar Metro Station, Bengaluru', reward_amount: 500, lost_found_at: daysAgo(1), created_at: daysAgo(1), updated_at: daysAgo(1) },
      
      // 2. Found phone - Cubbon Park (Central)
      { id: itemIds[1], user_id: userId2, type: 'found', status: 'open', title: 'iPhone 14 Pro found', category: 'electronics', description: 'Found on a bench at Cubbon Park near the bandstand. Black color with clear case. Screen locked.', image_urls: '{}', location_name: 'Cubbon Park Bandstand, Bengaluru', reward_amount: 0, lost_found_at: daysAgo(2), created_at: daysAgo(2), updated_at: daysAgo(2) },
      
      // 3. Lost pet - Koramangala (South)
      { id: itemIds[2], user_id: userId3, type: 'lost', status: 'open', title: 'Golden Retriever missing', category: 'pets', description: 'Male Golden Retriever, 3 years old, named Max. Wearing blue collar with tag. Very friendly. Last seen near Sony World Junction.', image_urls: '{}', location_name: 'Koramangala Sony World Junction, Bengaluru', reward_amount: 10000, lost_found_at: daysAgo(0), created_at: daysAgo(0), updated_at: daysAgo(0) },
      
      // 4. Found documents - Whitefield (East - far)
      { id: itemIds[3], user_id: userId4, type: 'found', status: 'open', title: 'Passport and documents found', category: 'documents', description: 'Found a blue folder containing Indian passport, Aadhar card, and some certificates near Phoenix Mall Whitefield parking.', image_urls: '{}', location_name: 'Phoenix Mall Whitefield, Bengaluru', reward_amount: 0, lost_found_at: daysAgo(3), created_at: daysAgo(3), updated_at: daysAgo(3) },
      
      // 5. Lost laptop bag - Electronic City (South - far)
      { id: itemIds[4], user_id: userId1, type: 'lost', status: 'open', title: 'Dell laptop bag with laptop', category: 'electronics', description: 'Black Dell laptop bag containing Dell XPS 15, charger, mouse, and work documents. Lost in Infosys Electronic City campus cafeteria.', image_urls: '{}', location_name: 'Infosys Electronic City, Bengaluru', reward_amount: 15000, lost_found_at: daysAgo(1), created_at: daysAgo(1), updated_at: daysAgo(1) },
      
      // 6. Found keys - MG Road (Central)
      { id: itemIds[5], user_id: userId2, type: 'found', status: 'claimed', title: 'Car keys with BMW logo', category: 'keys', description: 'Found BMW car keys with house keys attached near MG Road metro station exit. Has a small teddy bear keychain.', image_urls: '{}', location_name: 'MG Road Metro Station, Bengaluru', reward_amount: 0, lost_found_at: daysAgo(5), created_at: daysAgo(5), updated_at: daysAgo(2) },
      
      // 7. Lost jewelry - Jayanagar (South)
      { id: itemIds[6], user_id: userId4, type: 'lost', status: 'open', title: 'Gold mangalsutra chain', category: 'jewelry', description: 'Lost 22 carat gold mangalsutra with black beads near Jayanagar 4th block complex. Family heirloom, great sentimental value.', image_urls: '{}', location_name: 'Jayanagar 4th Block, Bengaluru', reward_amount: 25000, lost_found_at: daysAgo(2), created_at: daysAgo(2), updated_at: daysAgo(2) },
      
      // 8. Found bag - Marathahalli (East)
      { id: itemIds[7], user_id: userId3, type: 'found', status: 'open', title: 'Ladies handbag found', category: 'bags', description: 'Brown leather ladies handbag found near Marathahalli bridge bus stop. Contains makeup items and some cash. No ID found inside.', image_urls: '{}', location_name: 'Marathahalli Bridge, Bengaluru', reward_amount: 0, lost_found_at: daysAgo(1), created_at: daysAgo(1), updated_at: daysAgo(1) },
      
      // 9. Lost watch - HSR Layout (South)
      { id: itemIds[8], user_id: userId1, type: 'lost', status: 'resolved', title: 'Rolex Submariner watch', category: 'accessories', description: 'Lost Rolex Submariner with black dial and steel bracelet. Serial number available for verification. Lost at HSR Sector 1 gym.', image_urls: '{}', location_name: 'HSR Layout Sector 1, Bengaluru', reward_amount: 50000, lost_found_at: daysAgo(10), created_at: daysAgo(10), updated_at: daysAgo(3) },
      
      // 10. Found bicycle - Yelahanka (North - far)
      { id: itemIds[9], user_id: userId2, type: 'found', status: 'open', title: 'Trek mountain bicycle', category: 'vehicles', description: 'Found red Trek mountain bike abandoned near Yelahanka New Town lake. Good condition, has gear issues. Kept safely.', image_urls: '{}', location_name: 'Yelahanka New Town Lake, Bengaluru', reward_amount: 0, lost_found_at: daysAgo(4), created_at: daysAgo(4), updated_at: daysAgo(4) },
      
      // 11. Lost glasses - BTM Layout (South)
      { id: itemIds[10], user_id: userId3, type: 'lost', status: 'open', title: 'Ray-Ban prescription glasses', category: 'accessories', description: 'Lost Ray-Ban Wayfarer prescription glasses with -2.5 power. Black frame in a brown leather case. Lost near BTM Layout water tank.', image_urls: '{}', location_name: 'BTM Layout 2nd Stage, Bengaluru', reward_amount: 1000, lost_found_at: daysAgo(3), created_at: daysAgo(3), updated_at: daysAgo(3) },
      
      // 12. Found tablet - Bannerghatta Road (South)
      { id: itemIds[11], user_id: userId4, type: 'found', status: 'open', title: 'iPad Air found in auto', category: 'electronics', description: 'Found iPad Air 5th gen in auto rickshaw near Meenakshi Mall Bannerghatta Road. Rose gold color with pink case. Auto driver handed it to me.', image_urls: '{}', location_name: 'Meenakshi Mall Bannerghatta, Bengaluru', reward_amount: 0, lost_found_at: daysAgo(0), created_at: daysAgo(0), updated_at: daysAgo(0) },
      
      // 13. Lost camera - Lalbagh (Central)
      { id: itemIds[12], user_id: userId1, type: 'lost', status: 'open', title: 'Canon DSLR camera', category: 'electronics', description: 'Lost Canon EOS 5D Mark IV with 24-70mm lens near Lalbagh Glass House during flower show. Memory card has important wedding photos.', image_urls: '{}', location_name: 'Lalbagh Botanical Garden, Bengaluru', reward_amount: 20000, lost_found_at: daysAgo(6), created_at: daysAgo(6), updated_at: daysAgo(6) },
      
      // 14. Found wallet - Hebbal (North)
      { id: itemIds[13], user_id: userId2, type: 'found', status: 'claimed', title: 'Brown wallet with foreign currency', category: 'wallet', description: 'Found brown leather wallet near Hebbal flyover. Contains USD, EUR notes and multiple international cards. Name visible on cards.', image_urls: '{}', location_name: 'Hebbal Flyover, Bengaluru', reward_amount: 0, lost_found_at: daysAgo(7), created_at: daysAgo(7), updated_at: daysAgo(1) },
      
      // 15. Lost hearing aid - Malleshwaram (North-Central)
      { id: itemIds[14], user_id: userId4, type: 'lost', status: 'open', title: 'Phonak hearing aid', category: 'medical', description: 'Lost Phonak Audeo hearing aid (right ear) silver color near Malleshwaram 8th Cross Sankey Tank area. Elderly person needs it urgently.', image_urls: '{}', location_name: 'Malleshwaram Sankey Tank, Bengaluru', reward_amount: 5000, lost_found_at: daysAgo(1), created_at: daysAgo(1), updated_at: daysAgo(1) },
    ]);

    // Set location geometry via raw SQL - coordinates spread across Bangalore
    await queryInterface.sequelize.query(`
      UPDATE items SET location = ST_SetSRID(ST_MakePoint(77.6411, 12.9784), 4326) WHERE id = '${itemIds[0]}';
      UPDATE items SET location = ST_SetSRID(ST_MakePoint(77.5946, 12.9766), 4326) WHERE id = '${itemIds[1]}';
      UPDATE items SET location = ST_SetSRID(ST_MakePoint(77.6245, 12.9352), 4326) WHERE id = '${itemIds[2]}';
      UPDATE items SET location = ST_SetSRID(ST_MakePoint(77.7480, 12.9698), 4326) WHERE id = '${itemIds[3]}';
      UPDATE items SET location = ST_SetSRID(ST_MakePoint(77.6701, 12.8456), 4326) WHERE id = '${itemIds[4]}';
      UPDATE items SET location = ST_SetSRID(ST_MakePoint(77.6066, 12.9756), 4326) WHERE id = '${itemIds[5]}';
      UPDATE items SET location = ST_SetSRID(ST_MakePoint(77.5838, 12.9308), 4326) WHERE id = '${itemIds[6]}';
      UPDATE items SET location = ST_SetSRID(ST_MakePoint(77.6974, 12.9591), 4326) WHERE id = '${itemIds[7]}';
      UPDATE items SET location = ST_SetSRID(ST_MakePoint(77.6389, 12.9116), 4326) WHERE id = '${itemIds[8]}';
      UPDATE items SET location = ST_SetSRID(ST_MakePoint(77.5967, 13.1007), 4326) WHERE id = '${itemIds[9]}';
      UPDATE items SET location = ST_SetSRID(ST_MakePoint(77.6146, 12.9166), 4326) WHERE id = '${itemIds[10]}';
      UPDATE items SET location = ST_SetSRID(ST_MakePoint(77.5973, 12.8763), 4326) WHERE id = '${itemIds[11]}';
      UPDATE items SET location = ST_SetSRID(ST_MakePoint(77.5855, 12.9507), 4326) WHERE id = '${itemIds[12]}';
      UPDATE items SET location = ST_SetSRID(ST_MakePoint(77.5919, 13.0358), 4326) WHERE id = '${itemIds[13]}';
      UPDATE items SET location = ST_SetSRID(ST_MakePoint(77.5713, 12.9972), 4326) WHERE id = '${itemIds[14]}';
    `);

    // Insert saved items - users saving items (both their own and others')
    await queryInterface.bulkInsert('saved_items', [
      // Arjun saves some items (including his own and others')
      { id: savedItemIds[0], user_id: userId1, item_id: itemIds[1], created_at: daysAgo(1), updated_at: daysAgo(1) }, // Arjun saves iPhone found by Priya
      { id: savedItemIds[1], user_id: userId1, item_id: itemIds[2], created_at: daysAgo(0), updated_at: daysAgo(0) }, // Arjun saves Golden Retriever missing
      
      // Priya saves some items
      { id: savedItemIds[2], user_id: userId2, item_id: itemIds[0], created_at: daysAgo(1), updated_at: daysAgo(1) }, // Priya saves Arjun's lost wallet
      { id: savedItemIds[3], user_id: userId2, item_id: itemIds[6], created_at: daysAgo(2), updated_at: daysAgo(2) }, // Priya saves lost mangalsutra
      
      // Rahul saves some items
      { id: savedItemIds[4], user_id: userId3, item_id: itemIds[4], created_at: daysAgo(1), updated_at: daysAgo(1) }, // Rahul saves lost laptop bag
      { id: savedItemIds[5], user_id: userId3, item_id: itemIds[12], created_at: daysAgo(5), updated_at: daysAgo(5) }, // Rahul saves lost camera
      
      // Sneha saves some items (including her own)
      { id: savedItemIds[6], user_id: userId4, item_id: itemIds[6], created_at: daysAgo(2), updated_at: daysAgo(2) }, // Sneha saves her own lost mangalsutra
      { id: savedItemIds[7], user_id: userId4, item_id: itemIds[9], created_at: daysAgo(3), updated_at: daysAgo(3) }, // Sneha saves found bicycle
    ]);

    // Insert user addresses
    await queryInterface.bulkInsert('addresses', [
      // Arjun Mehta - 2 addresses
      { id: addressIds[0], user_id: userId1, label: 'Home', address_line1: '42, 3rd Cross Road', address_line2: 'Indiranagar 1st Stage', city: 'Bengaluru', state: 'Karnataka', postal_code: '560038', country: 'India', is_default: true, lat: 12.9784, lng: 77.6411, created_at: new Date(), updated_at: new Date() },
      { id: addressIds[1], user_id: userId1, label: 'Office', address_line1: 'WeWork Galaxy', address_line2: '43, Residency Road', city: 'Bengaluru', state: 'Karnataka', postal_code: '560025', country: 'India', is_default: false, lat: 12.9716, lng: 77.6099, created_at: new Date(), updated_at: new Date() },
      
      // Priya Nair - 2 addresses
      { id: addressIds[2], user_id: userId2, label: 'Home', address_line1: '156, 5th Main Road', address_line2: 'Koramangala 4th Block', city: 'Bengaluru', state: 'Karnataka', postal_code: '560034', country: 'India', is_default: true, lat: 12.9352, lng: 77.6245, created_at: new Date(), updated_at: new Date() },
      { id: addressIds[3], user_id: userId2, label: 'Parents House', address_line1: '23, MG Road', address_line2: 'Near Trinity Circle', city: 'Bengaluru', state: 'Karnataka', postal_code: '560001', country: 'India', is_default: false, lat: 12.9756, lng: 77.6066, created_at: new Date(), updated_at: new Date() },
      
      // Rahul Sharma - 2 addresses
      { id: addressIds[4], user_id: userId3, label: 'Home', address_line1: '78, HSR Layout', address_line2: 'Sector 1, Near BDA Complex', city: 'Bengaluru', state: 'Karnataka', postal_code: '560102', country: 'India', is_default: true, lat: 12.9116, lng: 77.6389, created_at: new Date(), updated_at: new Date() },
      { id: addressIds[5], user_id: userId3, label: 'Work', address_line1: 'Infosys Campus', address_line2: 'Electronic City Phase 1', city: 'Bengaluru', state: 'Karnataka', postal_code: '560100', country: 'India', is_default: false, lat: 12.8456, lng: 77.6701, created_at: new Date(), updated_at: new Date() },
      
      // Sneha Reddy - 2 addresses
      { id: addressIds[6], user_id: userId4, label: 'Home', address_line1: '234, Jayanagar 4th Block', address_line2: 'Near Cool Joint', city: 'Bengaluru', state: 'Karnataka', postal_code: '560041', country: 'India', is_default: true, lat: 12.9308, lng: 77.5838, created_at: new Date(), updated_at: new Date() },
      { id: addressIds[7], user_id: userId4, label: 'Studio', address_line1: '12, Whitefield Main Road', address_line2: 'Near Phoenix Mall', city: 'Bengaluru', state: 'Karnataka', postal_code: '560066', country: 'India', is_default: false, lat: 12.9698, lng: 77.7480, created_at: new Date(), updated_at: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('saved_items', null, {});
    await queryInterface.bulkDelete('addresses', null, {});
    await queryInterface.bulkDelete('items', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};