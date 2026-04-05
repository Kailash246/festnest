const mongoose = require('mongoose');
require('dotenv').config();
const Event = require('./models/Event');
const Organizer = require('./models/Organizer');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\n=== CHECKING DATABASE ===\n');
    
    // All events
    console.log('Total events:', await Event.countDocuments());
    
    // All organizers
    const orgs = await Organizer.find();
    console.log('Total organizers:', orgs.length);
    
    // Check IIT organizer
    const org = await Organizer.findOne({ organizationName: /IIT/i });
    if (org) {
      console.log('\nIIT Organizer found:', org._id, org.organizationName);
      const events = await Event.find({ organizer: org._id });
      console.log('Events for this organizer:', events.length);
      events.forEach(e => console.log(`  - ${e._id}: ${e.title} (${e.status})`));
    } else {
      console.log('\nNo IIT organizer found. Available organizers:');
      orgs.forEach(o => console.log(`  - ${o._id}: ${o.organizationName}`));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}
check();
