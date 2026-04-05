/* ============================================================
   FESTNEST — utils/seed.js
   Database seeder — populates MongoDB with sample data
   Run: npm run seed
   ============================================================ */

'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

const Admin     = require('../models/Admin');
const Student   = require('../models/Student');
const Organizer = require('../models/Organizer');
const Event     = require('../models/Event');

/* ════════════════════════════════════════
   SEED DATA
   ════════════════════════════════════════ */

const USERS = [
  {
    firstName: 'Admin',
    lastName:  'FestNest',
    email:     'admin@festnest.in',
    password:  'Admin@1234',
    role:      'admin',
    phone:     '9999900000',
    isVerified: true,
    isActive:   true,
  },
  {
    firstName: 'Priya',
    lastName:  'Mehta',
    email:     'priya@iitb.ac.in',
    password:  'Organizer@1234',
    role:      'organizer',
    organizationName: 'IIT Bombay Technical Council',
    city:      'Mumbai',
    state:     'Maharashtra',
    phone:     '9876543210',
    isVerified: true,
    isActive:   true,
  },
  {
    firstName: 'Rohit',
    lastName:  'Singh',
    email:     'rohit@du.ac.in',
    password:  'Organizer@1234',
    role:      'organizer',
    organizationName: 'DU Cultural Committee',
    city:      'New Delhi',
    state:     'Delhi',
    phone:     '8765432109',
    isVerified: true,
    isActive:   true,
  },
  {
    firstName: 'Kavya',
    lastName:  'Rajan',
    email:     'kavya@nit.ac.in',
    password:  'Organizer@1234',
    role:      'organizer',
    organizationName: 'NIT Trichy E-Cell',
    city:      'Trichy',
    state:     'Tamil Nadu',
    phone:     '7654321098',
    isVerified: true,
    isActive:   true,
  },
  {
    firstName: 'Aditya',
    lastName:  'Kumar',
    email:     'aditya@vit.ac.in',
    password:  'Organizer@1234',
    role:      'organizer',
    organizationName: 'VIT Robotics Club',
    city:      'Vellore',
    state:     'Tamil Nadu',
    phone:     '6543210987',
    isVerified: true,
    isActive:   true,
  },
  {
    firstName: 'Arjun',
    lastName:  'Sharma',
    email:     'arjun@jntu.ac.in',
    password:  'Student@1234',
    role:      'student',
    college:   'JNTU Kakinada',
    branch:    'Computer Science & Engineering',
    year:      '3rd Year',
    phone:     '9876543210',
    city:      'Kakinada',
    state:     'Andhra Pradesh',
    interests: ['Hackathon', 'Technical', 'Workshop'],
    isActive:  true,
  },
  {
    firstName: 'Sneha',
    lastName:  'Iyer',
    email:     'sneha@vit.ac.in',
    password:  'Student@1234',
    role:      'student',
    college:   'VIT Vellore',
    branch:    'Electronics & Communication',
    year:      '2nd Year',
    phone:     '8765432109',
    city:      'Vellore',
    state:     'Tamil Nadu',
    interests: ['Cultural', 'Workshop'],
    isActive:  true,
  },
];

const buildEvents = (organizerMap) => [
  {
    title:       'HackSpark 2025',
    description: 'HackSpark is IIT Bombay\'s flagship 48-hour hackathon. Build solutions for real-world problems across tracks including AI/ML, FinTech, CleanTech, and Web3. Open to all undergraduate and postgraduate students across India. Top teams get PPO opportunities from sponsor companies.',
    category:    'Hackathon',
    mode:        'Offline',
    startDate:   new Date('2025-03-28'),
    endDate:     new Date('2025-03-30'),
    registrationDeadline: new Date('2025-03-20'),
    college:     'IIT Bombay',
    location: {
      city:    'Mumbai',
      state:   'Maharashtra',
      venue:   'Gymkhana Grounds, IIT Bombay, Powai',
      country: 'India',
    },
    prizes: {
      first:  '₹50,000',
      second: '₹30,000',
      third:  '₹20,000',
      pool:   '₹1,00,000',
      other:  'PPO opportunities from sponsors + goodies + certificates',
    },
    registrationFee:  '₹200/team',
    registrationLink: 'https://hackspark.iitb.ac.in/register',
    eligibility: '• Open to all undergraduate & postgraduate students\n• Teams of 2–4 members\n• Any college in India\n• All technical backgrounds welcome',
    rules:       '• No pre-built projects allowed\n• Code must be pushed to GitHub by deadline\n• Bring your own laptop and charger\n• Final presentations on Day 3\n• Decisions of jury panel are final',
    contact: {
      name:    'Priya Mehta',
      phone:   '+91 98765 43210',
      email:   'hackspark@iitb.ac.in',
      website: 'https://hackspark.iitb.ac.in',
    },
    tags:        ['#hackathon', '#iit', '#coding', '#ai', '#fintech', '#cleantech', '#web3'],
    organizer:   organizerMap['priya@iitb.ac.in'],
    organizerName: 'Priya Mehta',
    status:      'approved',
    badge:       'mega',
    isFeatured:  true,
    posterUrl:   '',
    views:       1842,
    saves:       342,
    registrations: 186,
  },
  {
    title:       "Culturama '25",
    description: "Delhi University's biggest annual cultural extravaganza featuring dance, music, drama, fashion show, and fine arts competitions across 3 thrilling days. Over 5,000 participants expected from 200+ colleges across North India. Outstation participants get subsidised accommodation.",
    category:    'Cultural',
    mode:        'Offline',
    startDate:   new Date('2025-04-05'),
    endDate:     new Date('2025-04-07'),
    registrationDeadline: new Date('2025-04-01'),
    college:     'Delhi University',
    location: {
      city:    'New Delhi',
      state:   'Delhi',
      venue:   'North Campus, Delhi University',
      country: 'India',
    },
    prizes: {
      first:  '₹25,000',
      second: '₹15,000',
      third:  '₹10,000',
      pool:   '₹50,000',
      other:  'Trophies + certificates for all event winners',
    },
    registrationFee:  'Free',
    registrationLink: 'https://culturama.du.ac.in',
    eligibility: '• Open to students from any recognized college\n• Both individual and group events\n• Bring college ID on all 3 days\n• Registration per event, not per fest',
    rules:       '• Report 30 minutes before your event slot\n• Props and costumes self-arranged\n• Judges\' decision is final\n• Outstation accommodation requests: 7 days before fest',
    contact: {
      name:    'Rohit Singh',
      phone:   '+91 87654 32109',
      email:   'culturama@du.ac.in',
      website: 'https://culturama.du.ac.in',
    },
    tags:        ['#cultural', '#dance', '#music', '#drama', '#arts', '#fashion', '#du'],
    organizer:   organizerMap['rohit@du.ac.in'],
    organizerName: 'Rohit Singh',
    status:      'approved',
    badge:       'trending',
    isFeatured:  false,
    posterUrl:   '',
    views:       2310,
    saves:       521,
    registrations: 423,
  },
  {
    title:       'CodeQuest National',
    description: 'A national-level competitive programming contest hosted by NIT Trichy. Solve algorithmic challenges across 5 difficulty tiers over 3 hours. Platform uses a Codeforces-style custom judge with support for Python, Java, C, C++ and Kotlin. Open to all college students across India.',
    category:    'Technical',
    mode:        'Online',
    startDate:   new Date('2025-04-12'),
    registrationDeadline: new Date('2025-04-10'),
    college:     'NIT Trichy',
    location: {
      city:    'Online',
      state:   '',
      venue:   '',
      country: 'India',
      onlineLink: 'https://codequest.nit.ac.in/contest',
    },
    prizes: {
      first:  '₹35,000',
      second: '₹25,000',
      third:  '₹15,000',
      pool:   '₹75,000',
      other:  'Amazon gift vouchers for top 10 + merit certificates',
    },
    registrationFee:  '₹100/person',
    registrationLink: 'https://codequest.nit.ac.in/register',
    eligibility: '• Individual event only — no teams\n• Any college student in India\n• No branch restrictions\n• Beginner to expert — all levels welcome',
    rules:       '• Languages: Python 3, Java, C, C++, Kotlin\n• Duration: 3 hours from start time\n• Internet allowed — external human help strictly prohibited\n• Automated judge — no manual scoring\n• Top scorers invited to final offline round',
    contact: {
      name:    'Kavya Rajan',
      phone:   '+91 76543 21098',
      email:   'codequest@nit.ac.in',
      website: 'https://codequest.nit.ac.in',
    },
    tags:        ['#coding', '#nit', '#competitive', '#programming', '#online', '#algorithms', '#cp'],
    organizer:   organizerMap['kavya@nit.ac.in'],
    organizerName: 'Kavya Rajan',
    status:      'approved',
    badge:       'new',
    posterUrl:   '',
    views:       987,
    saves:       198,
    registrations: 312,
  },
  {
    title:       'Robo Wars 3.0',
    description: "Combat robotics at its finest. Build your best fighting bot and battle it out in VIT's iconic arena. Multiple weight categories and exciting combat formats over 3 action-packed days. India's premier college robotics competition with over 120 teams from 60+ colleges last year.",
    category:    'Technical',
    mode:        'Offline',
    startDate:   new Date('2025-04-18'),
    endDate:     new Date('2025-04-20'),
    registrationDeadline: new Date('2025-04-10'),
    college:     'VIT Vellore',
    location: {
      city:    'Vellore',
      state:   'Tamil Nadu',
      venue:   'VIT University Main Campus, Tech Park Arena',
      country: 'India',
    },
    prizes: {
      first:  '₹30,000',
      second: '₹20,000',
      third:  '₹10,000',
      pool:   '₹60,000',
      other:  'Best Design Award ₹5,000 + Best Rookie Award',
    },
    registrationFee:  '₹500/team',
    registrationLink: 'https://robowars.vit.ac.in/register',
    eligibility: '• Teams of 3–5 members\n• Any college student in India\n• Bot must comply with weight category specs\n• Prior robotics experience preferred but not mandatory',
    rules:       '• No chemical, biological, or discharge weapons\n• Remote controlled only — no autonomous combat\n• Pit access opens 2 hours before match\n• Weight check mandatory before every round\n• Replacement parts allowed between rounds',
    contact: {
      name:    'Aditya Kumar',
      phone:   '+91 65432 10987',
      email:   'robowars@vit.ac.in',
      website: 'https://robowars.vit.ac.in',
    },
    tags:        ['#robotics', '#vit', '#engineering', '#combat', '#hardware', '#mechatronics', '#bot'],
    organizer:   organizerMap['aditya@vit.ac.in'],
    organizerName: 'Aditya Kumar',
    status:      'approved',
    badge:       'trending',
    posterUrl:   '',
    views:       1563,
    saves:       287,
    registrations: 142,
  },
  {
    title:       'Spandan Sports Meet',
    description: "Annual inter-college sports championship featuring cricket, football, basketball, volleyball, badminton, table tennis, and athletics. India's largest medical college sports event. Open to students from all streams — not just medical students.",
    category:    'Sports',
    mode:        'Offline',
    startDate:   new Date('2025-05-02'),
    endDate:     new Date('2025-05-04'),
    registrationDeadline: new Date('2025-04-25'),
    college:     'AIIMS Delhi',
    location: {
      city:    'New Delhi',
      state:   'Delhi',
      venue:   'AIIMS Sports Complex, Ansari Nagar',
      country: 'India',
    },
    prizes: {
      first:  '₹15,000',
      second: '₹10,000',
      third:  '₹5,000',
      pool:   '₹30,000',
      other:  'Rolling trophy + medals for all event winners',
    },
    registrationFee:  '₹300/team',
    registrationLink: 'https://spandan.aiims.edu/register',
    eligibility: '• Valid college ID proof required on all days\n• Min 15 players per team for cricket\n• Medical certificate required for athletics\n• Open to all undergraduate and postgraduate students',
    rules:       '• Follow fair play rules strictly\n• Doping tests may be conducted randomly\n• Umpire/referee decisions are final\n• Teams must arrive 30 min before match\n• No replacements after team list submission',
    contact: {
      name:    'Dr. Suman Rao',
      phone:   '+91 54321 09876',
      email:   'spandan@aiims.edu',
      website: 'https://spandan.aiims.edu',
    },
    tags:        ['#sports', '#aiims', '#cricket', '#basketball', '#athletics', '#football', '#volleyball'],
    organizer:   organizerMap['priya@iitb.ac.in'],
    organizerName: 'Sports Committee AIIMS',
    status:      'approved',
    badge:       'mega',
    posterUrl:   '',
    views:       876,
    saves:       143,
    registrations: 98,
  },
  {
    title:       'ML Summit India',
    description: 'A one-day intensive ML workshop by IISc researchers and industry practitioners from Google DeepMind and Microsoft Research. Learn PyTorch, production model deployment on AWS, and build your first end-to-end ML pipeline. Limited to 200 seats — register early.',
    category:    'Workshop',
    mode:        'Hybrid',
    startDate:   new Date('2025-05-10'),
    registrationDeadline: new Date('2025-05-05'),
    college:     'IISc Bangalore',
    location: {
      city:    'Bangalore',
      state:   'Karnataka',
      venue:   'Faculty Hall, IISc Main Campus, CV Raman Road',
      country: 'India',
      onlineLink: 'https://mlsummit.iisc.ac.in/zoom',
    },
    prizes: {
      first:  'Best Project ₹10,000',
      second: 'Certificate of Excellence',
      third:  'Certificate of Completion',
      pool:   '₹10,000',
      other:  'Free GPU credits + course material + 6-month mentorship access',
    },
    registrationFee:  '₹99',
    registrationLink: 'https://mlsummit.iisc.ac.in/register',
    eligibility: '• Prior Python programming knowledge required\n• Laptop with Python 3.8+ and pip\n• Any college student or working professional\n• Online and offline modes both available',
    rules:       '• Laptop mandatory for in-person attendees\n• Free GPU compute provided during sessions\n• All datasets and materials included in fee\n• Certificate issued on completion of project\n• Recording access for 30 days post-event',
    contact: {
      name:    'Dr. Anitha Rao',
      phone:   '+91 43210 98765',
      email:   'mlsummit@iisc.ac.in',
      website: 'https://mlsummit.iisc.ac.in',
    },
    tags:        ['#ai', '#ml', '#workshop', '#iisc', '#deeplearning', '#pytorch', '#aws', '#python'],
    organizer:   organizerMap['kavya@nit.ac.in'],
    organizerName: 'IISc AI Research Group',
    status:      'approved',
    badge:       'new',
    posterUrl:   '',
    views:       654,
    saves:       187,
    registrations: 134,
  },
  {
    title:       'E-Cell Startup Pitch',
    description: "IIM Ahmedabad's annual entrepreneurship summit — pitch your startup idea to a panel of top VCs, angel investors and successful founders. The ultimate stage for student entrepreneurs across India. Selected teams get 3-month incubation support.",
    category:    'Technical',
    mode:        'Offline',
    startDate:   new Date('2025-05-15'),
    endDate:     new Date('2025-05-16'),
    registrationDeadline: new Date('2025-05-05'),
    college:     'IIM Ahmedabad',
    location: {
      city:    'Ahmedabad',
      state:   'Gujarat',
      venue:   'IIMA Campus, Vastrapur, Ahmedabad',
      country: 'India',
    },
    prizes: {
      first:  '₹1,00,000',
      second: '₹60,000',
      third:  '₹40,000',
      pool:   '₹2,00,000',
      other:  '3-month incubation + VC introductions for top 5 teams',
    },
    registrationFee:  '₹500/team',
    registrationLink: 'https://ecell.iima.ac.in/pitch',
    eligibility: '• Teams of 2–5 members\n• Startup must be less than 2 years old\n• Any college or recently graduated (within 2 years)\n• All domains: tech, social, agri, fintech, etc.',
    rules:       '• 10-minute pitch + 5-minute Q&A per team\n• Working prototype strongly preferred\n• Business plan PDF required at registration\n• Equity stake NOT taken by organizers\n• NDA available on request for sensitive IP',
    contact: {
      name:    'Sneha Patel',
      phone:   '+91 32109 87654',
      email:   'ecell@iima.ac.in',
      website: 'https://ecell.iima.ac.in',
    },
    tags:        ['#startup', '#entrepreneurship', '#iim', '#pitch', '#vc', '#business', '#founder'],
    organizer:   organizerMap['priya@iitb.ac.in'],
    organizerName: 'IIM Ahmedabad E-Cell',
    status:      'approved',
    badge:       'mega',
    isFeatured:  true,
    posterUrl:   '',
    views:       1120,
    saves:       265,
    registrations: 87,
  },
  {
    title:       'Abhimanyu Chess Open',
    description: 'Inter-college chess championship with rapid and blitz formats. Open to all college students. FIDE-rated tournament directed by a certified arbiter. Top finishers get FIDE rating points added to their profiles. Beginners welcome — separate category available.',
    category:    'Sports',
    mode:        'Offline',
    startDate:   new Date('2025-05-20'),
    registrationDeadline: new Date('2025-05-17'),
    college:     'Delhi College of Engineering',
    location: {
      city:    'New Delhi',
      state:   'Delhi',
      venue:   'DCE Seminar Hall, Bawana Road, Delhi',
      country: 'India',
    },
    prizes: {
      first:  '₹8,000',
      second: '₹5,000',
      third:  '₹2,000',
      pool:   '₹15,000',
      other:  'FIDE rating points + trophies + medals',
    },
    registrationFee:  '₹50/person',
    registrationLink: 'https://chess.dce.edu/register',
    eligibility: '• Any college student with valid ID\n• All skill levels welcome\n• Separate Open and Novice categories\n• No team event — individual only',
    rules:       '• Swiss system, 7 rounds rapid chess (15+10 time control)\n• FIDE rules strictly apply\n• Phones must be switched off during games\n• Late arrivals forfeit after 15 minutes\n• Arbiter decisions are final',
    contact: {
      name:    'Ravi Kumar',
      phone:   '+91 21098 76543',
      email:   'chess@dce.edu',
      website: 'https://chess.dce.edu',
    },
    tags:        ['#chess', '#sports', '#fide', '#dce', '#rapid', '#blitz', '#tournament'],
    organizer:   organizerMap['rohit@du.ac.in'],
    organizerName: 'DCE Chess Club',
    status:      'approved',
    badge:       'new',
    posterUrl:   '',
    views:       432,
    saves:       76,
    registrations: 54,
  },
];

/* ════════════════════════════════════════
   SEED FUNCTION
   ════════════════════════════════════════ */
const seed = async () => {
  try {
    console.log('\n🌱 FestNest Database Seeder');
    console.log('════════════════════════════\n');

    /* Connect */
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    /* Clear existing data from all collections */
    console.log('🗑  Clearing existing data...');
    await Admin.deleteMany({});
    await Student.deleteMany({});
    await Organizer.deleteMany({});
    await Event.deleteMany({});
    console.log('   Admins cleared');
    console.log('   Students cleared');
    console.log('   Organizers cleared');
    console.log('   Events cleared\n');

    /* Separate USERS by role */
    const adminUsers = USERS.filter(u => u.role === 'admin');
    const studentUsers = USERS.filter(u => u.role === 'student');
    const organizerUsers = USERS.filter(u => u.role === 'organizer');

    /* Create admins */
    console.log('👑 Creating admins...');
    const createdAdmins = [];
    for (const adminData of adminUsers) {
      const admin = await Admin.create({
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        email: adminData.email,
        password: adminData.password,  /* Will be hashed by pre-save hook */
        phone: adminData.phone || '',
        isActive: adminData.isActive,
      });
      createdAdmins.push(admin);
      console.log(`   ✓ Admin: ${admin.email}`);
    }

    /* Create students */
    console.log('\n👤 Creating students...');
    const createdStudents = [];
    for (const studentData of studentUsers) {
      const student = await Student.create({
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        email: studentData.email,
        password: studentData.password,  /* Will be hashed by pre-save hook */
        college: studentData.college,
        year: studentData.year,
        branch: studentData.branch || '',
        phone: studentData.phone || '',
        city: studentData.city || '',
        state: studentData.state || '',
        interests: studentData.interests || [],
        isActive: studentData.isActive,
        isVerified: studentData.isVerified,
      });
      createdStudents.push(student);
      console.log(`   ✓ Student: ${student.email}`);
    }

    /* Create organizers */
    console.log('\n🏢 Creating organizers...');
    const createdOrganizers = [];
    for (const orgData of organizerUsers) {
      const organizer = await Organizer.create({
        organizationName: orgData.organizationName,
        email: orgData.email,
        password: orgData.password,  /* Will be hashed by pre-save hook */
        city: orgData.city || '',
        state: orgData.state || '',
        phone: orgData.phone || '',
        branch: orgData.branch || '',
        isActive: orgData.isActive,
        isVerified: orgData.isVerified,
      });
      createdOrganizers.push(organizer);
      console.log(`   ✓ Organizer: ${organizer.email}`);
    }

    /* Build email → ObjectId map for organizers */
    const organizerMap = {};
    createdOrganizers.forEach(o => { organizerMap[o.email] = o._id; });

    /* Create events */
    console.log('\n🎉 Creating events...');
    const events = buildEvents(organizerMap);
    const createdEvents = [];
    for (const eventData of events) {
      const event = await Event.create(eventData);
      createdEvents.push(event);
      console.log(`   ✓ [${event.status.padEnd(8)}] ${event.title}`);
    }

    /* Add 2 saved events to first student user */
    const student = createdStudents[0];
    if (student && createdEvents.length >= 2) {
      student.savedEvents = [createdEvents[0]._id, createdEvents[2]._id];
      await student.save({ validateBeforeSave: false });
      console.log(`\n🔖 Added 2 saved events to ${student.firstName}'s account`);
    }

    console.log('\n════════════════════════════');
    console.log('✅ Seed completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   Admins     created: ${createdAdmins.length}`);
    console.log(`   Students   created: ${createdStudents.length}`);
    console.log(`   Organizers created: ${createdOrganizers.length}`);
    console.log(`   Events     created: ${createdEvents.length}\n`);
    console.log('🔑 Login credentials:');
    console.log('   Admin:     admin@festnest.in       / Admin@1234');
    console.log('   Organizer: priya@iitb.ac.in        / Organizer@1234');
    console.log('   Student:   arjun@jntu.ac.in        / Student@1234\n');
    console.log('🚀 Start server: npm run dev');
    console.log('📡 API Base:    http://localhost:5000/api\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    if (err.errors) {
      Object.values(err.errors).forEach(e => console.error('  -', e.message));
    }
    console.error('Stack:', err.stack);
    process.exit(1);
  }
};

seed();
