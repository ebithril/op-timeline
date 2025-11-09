// Initialize One Piece Timeline database with sample data
// This script runs automatically when MongoDB container starts for the first time

db = db.getSiblingDB('one_piece_timeline');

print('Initializing One Piece Timeline database...');

// ============================================================================
// USERS - Create admin and editor users for development
// ============================================================================
print('Creating users...');

db.users.insertMany([
  {
    username: "admin",
    apiKey: "dev-admin-key-CHANGE-IN-PRODUCTION",
    role: "Admin",
    createdAt: NumberLong(Date.now()),
    isActive: true
  },
  {
    username: "editor",
    apiKey: "dev-editor-key-CHANGE-IN-PRODUCTION",
    role: "Editor",
    createdAt: NumberLong(Date.now()),
    isActive: true
  },
  {
    username: "viewer",
    apiKey: "dev-viewer-key-CHANGE-IN-PRODUCTION",
    role: "Viewer",
    createdAt: NumberLong(Date.now()),
    isActive: true
  }
]);

print('Users created: admin, editor, viewer');

// ============================================================================
// SAGAS - Major story arcs groupings
// ============================================================================
print('Creating sagas...');

const eastBlueSagaId = new ObjectId();
const alabastaSagaId = new ObjectId();
const skyIslandSagaId = new ObjectId();

db.sagas.insertMany([
  {
    _id: eastBlueSagaId,
    name: "East Blue Saga",
    description: "Luffy's journey begins in the East Blue, the weakest of the four seas",
    order: 1,
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  },
  {
    _id: alabastaSagaId,
    name: "Alabasta Saga",
    description: "The Straw Hats enter the Grand Line and help save the kingdom of Alabasta",
    order: 2,
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  },
  {
    _id: skyIslandSagaId,
    name: "Sky Island Saga",
    description: "The crew travels to the legendary Sky Island of Skypiea",
    order: 3,
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  }
]);

print('Sagas created');

// ============================================================================
// ARCS - Individual story arcs
// ============================================================================
print('Creating arcs...');

const romanceDawnArcId = new ObjectId();
const orangeTownArcId = new ObjectId();
const alabastaArcId = new ObjectId();

db.arcs.insertMany([
  {
    _id: romanceDawnArcId,
    name: "Romance Dawn",
    description: "Luffy begins his journey to become the Pirate King",
    sagaId: eastBlueSagaId,
    startChapter: 1,
    endChapter: 7,
    startDate: { year: 1522, month: 1, day: 1 },
    endDate: { year: 1522, month: 3, day: 1 },
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  },
  {
    _id: orangeTownArcId,
    name: "Orange Town",
    description: "Luffy meets Nami and fights Buggy the Clown",
    sagaId: eastBlueSagaId,
    startChapter: 8,
    endChapter: 21,
    startDate: { year: 1522, month: 3, day: 2 },
    endDate: { year: 1522, month: 4, day: 15 },
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  },
  {
    _id: alabastaArcId,
    name: "Alabasta",
    description: "The Straw Hats help Princess Vivi save her kingdom from Crocodile",
    sagaId: alabastaSagaId,
    startChapter: 155,
    endChapter: 217,
    startDate: { year: 1524, month: 2, day: 1 },
    endDate: { year: 1524, month: 4, day: 20 },
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  }
]);

print('Arcs created');

// ============================================================================
// ERAS - Historical time periods
// ============================================================================
print('Creating eras...');

db.eras.insertMany([
  {
    _id: new ObjectId(),
    name: "The Great Pirate Era",
    description: "Began with Gol D. Roger's execution, sparking the age of pirates",
    startDateType: "Exact",
    startDate: { year: 1500, month: 1, day: 1 },
    startCalculatedAbsoluteDate: 547500.0,
    startDisplayYear: 1500,
    endDateType: "Exact",
    endDate: { year: 1550, month: 12, day: 31 },
    endCalculatedAbsoluteDate: 565731.0,
    endDisplayYear: 1550,
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  },
  {
    _id: new ObjectId(),
    name: "The Void Century",
    description: "The lost 100 years of history that the World Government seeks to hide",
    startDateType: "Exact",
    startDate: { year: 900, month: 1, day: 1 },
    startCalculatedAbsoluteDate: 328500.0,
    startDisplayYear: 900,
    endDateType: "Exact",
    endDate: { year: 1000, month: 12, day: 31 },
    endCalculatedAbsoluteDate: 365231.0,
    endDisplayYear: 1000,
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  }
]);

print('Eras created');

// ============================================================================
// CHARACTERS - Main characters from the series
// ============================================================================
print('Creating characters...');

const luffyId = new ObjectId();
const zoroId = new ObjectId();
const namiId = new ObjectId();
const usoppId = new ObjectId();
const sanjiId = new ObjectId();

db.characters.insertMany([
  {
    _id: luffyId,
    name: "Monkey D. Luffy",
    aliases: ["Straw Hat Luffy"],
    birthDate: { year: 1505, month: 5, day: 5 },
    calculatedBirthDate: 549656.0,
    displayBirthYear: 1505,
    isAlive: true,
    affiliation: "Straw Hat Pirates",
    description: "Captain of the Straw Hat Pirates with the dream of becoming the Pirate King. Ate the Gum-Gum Fruit.",
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  },
  {
    _id: zoroId,
    name: "Roronoa Zoro",
    aliases: ["Pirate Hunter Zoro"],
    birthDate: { year: 1503, month: 11, day: 11 },
    calculatedBirthDate: 548934.0,
    displayBirthYear: 1503,
    isAlive: true,
    affiliation: "Straw Hat Pirates",
    description: "First mate of the Straw Hat Pirates. Master swordsman who fights with three swords.",
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  },
  {
    _id: namiId,
    name: "Nami",
    aliases: ["Cat Burglar Nami"],
    birthDate: { year: 1504, month: 7, day: 3 },
    calculatedBirthDate: 549218.0,
    displayBirthYear: 1504,
    isAlive: true,
    affiliation: "Straw Hat Pirates",
    description: "Navigator of the Straw Hat Pirates with the dream of mapping the entire world.",
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  },
  {
    _id: usoppId,
    name: "Usopp",
    aliases: ["God Usopp", "Sogeking"],
    birthDate: { year: 1505, month: 4, day: 1 },
    calculatedBirthDate: 549621.0,
    displayBirthYear: 1505,
    isAlive: true,
    affiliation: "Straw Hat Pirates",
    description: "Sniper of the Straw Hat Pirates. Known for his tall tales and marksmanship.",
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  },
  {
    _id: sanjiId,
    name: "Sanji",
    aliases: ["Black Leg Sanji"],
    birthDate: { year: 1503, month: 3, day: 2 },
    calculatedBirthDate: 548682.0,
    displayBirthYear: 1503,
    isAlive: true,
    affiliation: "Straw Hat Pirates",
    description: "Cook of the Straw Hat Pirates. Master of Black Leg Style martial arts.",
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  }
]);

print('Characters created');

// ============================================================================
// EVENTS - Key events in the timeline
// ============================================================================
print('Creating events...');

db.events.insertMany([
  {
    _id: new ObjectId(),
    name: "Luffy Eats the Gum-Gum Fruit",
    type: "Event",
    description: "Young Luffy accidentally eats the Gum-Gum Fruit (Gomu Gomu no Mi), gaining rubber powers but losing the ability to swim.",
    arcId: null,
    dateType: "Exact",
    exactDate: { year: 1510, month: 3, day: 15 },
    calculatedAbsoluteDate: 551298.0,
    displayYear: 1510,
    sources: [
      {
        sourceType: "Chapter",
        chapter: 1,
        notes: "Chapter 1 flashback",
        isPrimary: true
      }
    ],
    involvedCharacters: ["Monkey D. Luffy"],
    charactersBorn: [],
    charactersDied: [],
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin",
    version: 1,
    isDeleted: false
  },
  {
    _id: new ObjectId(),
    name: "Luffy Defeats Alvida",
    type: "Fight",
    description: "Luffy's first battle as a pirate, defeating Iron Mace Alvida and freeing Coby.",
    arcId: romanceDawnArcId,
    dateType: "Exact",
    exactDate: { year: 1522, month: 1, day: 1 },
    calculatedAbsoluteDate: 555530.0,
    displayYear: 1522,
    sources: [
      {
        sourceType: "Chapter",
        chapter: 2,
        notes: "Romance Dawn - First battle",
        isPrimary: true
      }
    ],
    involvedCharacters: ["Monkey D. Luffy"],
    charactersBorn: [],
    charactersDied: [],
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin",
    version: 1,
    isDeleted: false
  },
  {
    _id: new ObjectId(),
    name: "Zoro Joins the Straw Hat Pirates",
    type: "Meeting",
    description: "Roronoa Zoro becomes the first member to join Luffy's crew after being saved from execution.",
    arcId: romanceDawnArcId,
    dateType: "Exact",
    exactDate: { year: 1522, month: 1, day: 15 },
    calculatedAbsoluteDate: 555544.0,
    displayYear: 1522,
    sources: [
      {
        sourceType: "Chapter",
        chapter: 6,
        notes: "Zoro joins the crew",
        isPrimary: true
      }
    ],
    involvedCharacters: ["Monkey D. Luffy", "Roronoa Zoro"],
    charactersBorn: [],
    charactersDied: [],
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin",
    version: 1,
    isDeleted: false
  },
  {
    _id: new ObjectId(),
    name: "Nami Joins the Crew",
    type: "Meeting",
    description: "Nami temporarily joins Luffy's crew as navigator after meeting in Orange Town.",
    arcId: orangeTownArcId,
    dateType: "Exact",
    exactDate: { year: 1522, month: 3, day: 5 },
    calculatedAbsoluteDate: 555593.0,
    displayYear: 1522,
    sources: [
      {
        sourceType: "Chapter",
        chapter: 9,
        notes: "Nami's first appearance with the crew",
        isPrimary: true
      }
    ],
    involvedCharacters: ["Monkey D. Luffy", "Nami"],
    charactersBorn: [],
    charactersDied: [],
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin",
    version: 1,
    isDeleted: false
  },
  {
    _id: new ObjectId(),
    name: "Luffy Defeats Buggy",
    type: "Fight",
    description: "Luffy defeats Buggy the Clown in Orange Town, one of his earliest major opponents.",
    arcId: orangeTownArcId,
    dateType: "Exact",
    exactDate: { year: 1522, month: 3, day: 10 },
    calculatedAbsoluteDate: 555598.0,
    displayYear: 1522,
    sources: [
      {
        sourceType: "Chapter",
        chapter: 21,
        notes: "Luffy vs Buggy conclusion",
        isPrimary: true
      }
    ],
    involvedCharacters: ["Monkey D. Luffy"],
    charactersBorn: [],
    charactersDied: [],
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin",
    version: 1,
    isDeleted: false
  }
]);

print('Events created');

// ============================================================================
// LOCATIONS - Important places in the One Piece world
// ============================================================================
print('Creating locations...');

const eastBlueId = new ObjectId();
const grandLineId = new ObjectId();

db.locations.insertMany([
  {
    _id: eastBlueId,
    name: "East Blue",
    type: "Sea",
    parentLocationId: null,
    description: "Known as the weakest of the Four Seas. Luffy's birthplace and where his journey begins.",
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  },
  {
    _id: grandLineId,
    name: "Grand Line",
    type: "Sea",
    parentLocationId: null,
    description: "The most dangerous and unpredictable stretch of ocean in the world, where all pirates aim to sail.",
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  },
  {
    _id: new ObjectId(),
    name: "Foosha Village",
    type: "Island",
    parentLocationId: eastBlueId,
    description: "A small windmill village in the East Blue. Luffy's hometown.",
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  },
  {
    _id: new ObjectId(),
    name: "Orange Town",
    type: "Island",
    parentLocationId: eastBlueId,
    description: "A town in the East Blue that was terrorized by Buggy the Clown.",
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  },
  {
    _id: new ObjectId(),
    name: "Alabasta",
    type: "Island",
    parentLocationId: grandLineId,
    description: "A desert kingdom in the Grand Line. Home to Princess Vivi.",
    createdAt: NumberLong(Date.now()),
    createdBy: "admin",
    updatedAt: NumberLong(Date.now()),
    updatedBy: "admin"
  }
]);

print('Locations created');

// ============================================================================
// Summary
// ============================================================================
print('');
print('Database initialization complete!');
print('');
print('='.repeat(60));
print('DEVELOPMENT USERS CREATED:');
print('='.repeat(60));
print('Admin User:');
print('  Username: admin');
print('  API Key:  dev-admin-key-CHANGE-IN-PRODUCTION');
print('  Role:     Admin (full access)');
print('');
print('Editor User:');
print('  Username: editor');
print('  API Key:  dev-editor-key-CHANGE-IN-PRODUCTION');
print('  Role:     Editor (create/edit only)');
print('');
print('Viewer User:');
print('  Username: viewer');
print('  API Key:  dev-viewer-key-CHANGE-IN-PRODUCTION');
print('  Role:     Viewer (read only)');
print('');
print('='.repeat(60));
print('WARNING: These API keys are for DEVELOPMENT ONLY!');
print('Change them before deploying to production!');
print('='.repeat(60));
print('');
print('Sample data created:');
print('  - 3 Sagas');
print('  - 3 Arcs');
print('  - 2 Eras');
print('  - 5 Characters (Luffy, Zoro, Nami, Usopp, Sanji)');
print('  - 5 Events');
print('  - 5 Locations');
print('');
print('You can now start the backend and frontend servers!');
print('');
