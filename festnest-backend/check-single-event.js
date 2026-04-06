const mongoose = require('mongoose');
require('dotenv').config();
const Event = require('./models/Event');

async function checkEvent() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set. Ensure .env file exists.');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    
    const eventId = '69d1280bde96fff9e9023808';
    const event = await Event.findById(eventId)
      .populate('organizer');
    
    console.log('\n=== EVENT DETAILS ===');
    console.log('Event found:', !!event);
    if (event) {
      console.log('ID:', event._id);
      console.log('Title:', event.title);
      console.log('Status:', event.status);
      console.log('Organizer:', event.organizer);
      console.log('Organizer._id:', event.organizer?._id);
      console.log('Organizer.organizationName:', event.organizer?.organizationName);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}
checkEvent();
