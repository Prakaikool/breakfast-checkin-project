// ===========================================
// DATABASE SEED - Sample data for development
// ===========================================
// Run: npm run db:seed

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...\n');

    // ---- Create Staff ----
    // Passwords meet the enforced policy: min 8 chars, uppercase, lowercase, number.
    // Change these immediately after the first login in production.
    const adminPin = await bcrypt.hash('Admin@2026', 10);
    const staffPin = await bcrypt.hash('Staff@2026', 10);

    const admin = await prisma.staff.upsert({
        where: { email: 'sandra@hotel.com' },
        update: { pinHash: adminPin },
        create: {
            name: 'Sandra Wickström',
            email: 'sandra@hotel.com',
            pinHash: adminPin,
            role: 'ADMIN'
        }
    });

    const staff1 = await prisma.staff.upsert({
        where: { email: 'erik@hotel.com' },
        update: { pinHash: staffPin },
        create: {
            name: 'Erik Lindgren',
            email: 'erik@hotel.com',
            pinHash: staffPin,
            role: 'ENTRANCE'
        }
    });

    console.log('Staff created:', admin.name, staff1.name);

    // ---- Create Rooms ----
    const roomNumbers = [
        '101', '102', '103', '104', '105',
        '112',
        '201', '202', '203', '205', '207',
        '210',
        '303', '305', '308',
        '401', '410', '415',
        '430',
        '501', '510',
        '525',
        '601', '615',
        '618',
        '701', '720',
        '742',
        '801', '810',
        '816',
        '901', '910', '920',
        '1001', '1004', '1010',
        // 20 new rooms
        '106', '108',
        '204', '206', '208',
        '301', '302', '310',
        '402', '405', '420',
        '502', '515', '520',
        '602', '610',
        '702', '710',
        '802', '820',
    ];

    for (const num of roomNumbers) {
        await prisma.room.upsert({
            where: { roomNumber: num },
            update: {},
            create: {
                roomNumber: num,
                floor: Math.floor(parseInt(num) / 100),
                maxGuests: 4,
                status: 'OCCUPIED'
            }
        });
    }
    console.log('Rooms created:', roomNumbers.length);

    // ---- Create Guests (idempotent: wipe and re-create) ----
    // Use midnight-only dates so the API date filters match reliably
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const checkOutDate = new Date(todayMidnight);
    checkOutDate.setDate(todayMidnight.getDate() + 7);

    // Remove existing guests to avoid duplicates on re-seed
    await prisma.guest.deleteMany({});
    console.log('Existing guests cleared');

    const guestData = [
        // Floor 1
        { name: 'James Harrington',    room: '101', isChild: false },
        { name: 'Claire Harrington',   room: '101', isChild: false },
        { name: 'Sophie Harrington',   room: '101', isChild: true  },
        { name: 'Nils Bergman',        room: '102', isChild: false },
        { name: 'Frida Bergman',       room: '102', isChild: false },
        { name: 'Lucas Bergman',       room: '102', isChild: true  },
        { name: 'Isabella Bergman',    room: '102', isChild: true  },
        { name: 'Robert Chen',         room: '103', isChild: false },
        { name: 'Susan Chen',          room: '103', isChild: false },
        { name: 'Michael Torres',      room: '104', isChild: false },
        { name: 'Patricia Torres',     room: '104', isChild: false },
        { name: 'Diego Torres',        room: '104', isChild: true  },
        { name: 'Fatima Al-Rashid',    room: '105', isChild: false },
        { name: 'Johan Lindqvist',     room: '112', isChild: false },

        // Floor 2
        { name: 'Karl Eriksson',       room: '201', isChild: false },
        { name: 'Ingrid Eriksson',     room: '201', isChild: false },
        { name: 'David Müller',        room: '202', isChild: false },
        { name: 'Heike Müller',        room: '202', isChild: false },
        { name: 'Tim Müller',          room: '202', isChild: true  },
        { name: 'Yuki Tanaka',         room: '203', isChild: false },
        { name: 'Kenji Tanaka',        room: '203', isChild: false },
        { name: 'Aiko Tanaka',         room: '203', isChild: true  },
        { name: 'Samuel Okonkwo',      room: '205', isChild: false },
        { name: 'Amara Okonkwo',       room: '205', isChild: false },
        { name: 'Chisom Okonkwo',      room: '205', isChild: true  },
        { name: 'Lars Gustafsson',     room: '207', isChild: false },
        { name: 'Helena Gustafsson',   room: '207', isChild: false },
        { name: 'Viktor Gustafsson',   room: '207', isChild: true  },
        { name: 'Astrid Gustafsson',   room: '207', isChild: true  },
        { name: 'Björn Nilsson',       room: '210', isChild: false },

        // Floor 3
        { name: 'Alex Garham',         room: '303', isChild: false },
        { name: 'Alex Jr. Garham',     room: '303', isChild: true  },
        { name: 'Priya Sharma',        room: '305', isChild: false },
        { name: 'Raj Sharma',          room: '305', isChild: false },
        { name: 'Anya Sharma',         room: '305', isChild: true  },
        { name: 'Oliver Johansson',    room: '308', isChild: false },
        { name: 'Cecilia Johansson',   room: '308', isChild: false },

        // Floor 4
        { name: 'Thomas Leblanc',      room: '401', isChild: false },
        { name: 'Marie Leblanc',       room: '401', isChild: false },
        { name: 'Hugo Leblanc',        room: '401', isChild: true  },
        { name: 'Camille Leblanc',     room: '401', isChild: true  },
        { name: 'Erika Holm',          room: '410', isChild: false },
        { name: 'Pontus Holm',         room: '410', isChild: false },
        { name: 'William Park',        room: '415', isChild: false },
        { name: 'Jenny Park',          room: '415', isChild: false },
        { name: 'Noah Park',           room: '415', isChild: true  },
        { name: 'Maria Svensson',      room: '430', isChild: false },

        // Floor 5
        { name: 'Ahmed Hassan',        room: '501', isChild: false },
        { name: 'Layla Hassan',        room: '501', isChild: false },
        { name: 'Zara Hassan',         room: '501', isChild: true  },
        { name: 'Omar Hassan',         room: '501', isChild: true  },
        { name: 'Gunnar Pettersson',   room: '510', isChild: false },
        { name: 'Ella Peterson',       room: '525', isChild: false },
        { name: 'Tom Peterson',        room: '525', isChild: false },

        // Floor 6
        { name: 'Luca Bianchi',        room: '601', isChild: false },
        { name: 'Giulia Bianchi',      room: '601', isChild: false },
        { name: 'Marco Bianchi',       room: '601', isChild: true  },
        { name: 'Katarina Lindberg',   room: '615', isChild: false },
        { name: 'Anders Lindberg',     room: '615', isChild: false },
        { name: 'Emma Björk',          room: '618', isChild: false },

        // Floor 7
        { name: 'Hans Weber',          room: '701', isChild: false },
        { name: 'Greta Weber',         room: '701', isChild: false },
        { name: 'Felix Weber',         room: '701', isChild: true  },
        { name: 'Elena Popescu',       room: '720', isChild: false },
        { name: 'Andrei Popescu',      room: '720', isChild: false },
        { name: 'Per Andersson',       room: '742', isChild: false },
        { name: 'Anna Andersson',      room: '742', isChild: false },
        { name: 'Leo Andersson',       room: '742', isChild: true  },
        { name: 'Mia Andersson',       room: '742', isChild: true  },

        // Floor 8
        { name: 'Charlotte Dupont',    room: '801', isChild: false },
        { name: 'Pierre Dupont',       room: '801', isChild: false },
        { name: 'Madeleine Dupont',    room: '801', isChild: true  },
        { name: 'Rolf Magnusson',      room: '810', isChild: false },
        { name: 'Karin Magnusson',     room: '810', isChild: false },
        { name: 'Linnea Karlsson',     room: '816', isChild: false },
        { name: 'Oscar Karlsson',      room: '816', isChild: false },
        { name: 'Maja Karlsson',       room: '816', isChild: true  },
        { name: 'Elias Karlsson',      room: '816', isChild: true  },

        // Floor 9
        { name: 'George Mitchell',     room: '901', isChild: false },
        { name: 'Barbara Mitchell',    room: '901', isChild: false },
        { name: 'Jack Mitchell',       room: '901', isChild: true  },
        { name: 'Sophia Mitchell',     room: '901', isChild: true  },
        { name: 'Jin-Ho Kim',          room: '910', isChild: false },
        { name: 'Soo-Yeon Kim',        room: '910', isChild: false },
        { name: 'Min-Ji Kim',          room: '910', isChild: true  },
        { name: 'Valentina Cruz',      room: '920', isChild: false },
        { name: 'Carlos Cruz',         room: '920', isChild: false },
        { name: 'Isabella Cruz',       room: '920', isChild: true  },

        // New rooms
        { name: 'Stefan Borg',         room: '106',  isChild: false },
        { name: 'Annika Borg',         room: '106',  isChild: false },
        { name: 'Tove Borg',           room: '106',  isChild: true  },
        { name: 'Patrick Dubois',      room: '108',  isChild: false },
        { name: 'Sylvie Dubois',       room: '108',  isChild: false },
        { name: 'Chloe Dubois',        room: '108',  isChild: true  },
        { name: 'Noah Dubois',         room: '108',  isChild: true  },
        { name: 'Mikael Lund',         room: '204',  isChild: false },
        { name: 'Sandra Lund',         room: '204',  isChild: false },
        { name: 'Tobias Lund',         room: '204',  isChild: true  },
        { name: 'Hiroshi Yamamoto',    room: '206',  isChild: false },
        { name: 'Yoko Yamamoto',       room: '206',  isChild: false },
        { name: 'Hana Yamamoto',       room: '206',  isChild: true  },
        { name: 'Reza Ahmadi',         room: '208',  isChild: false },
        { name: 'Maryam Ahmadi',       room: '208',  isChild: false },
        { name: 'Daria Ahmadi',        room: '208',  isChild: true  },
        { name: 'Aleksei Volkov',      room: '301',  isChild: false },
        { name: 'Natalia Volkova',     room: '301',  isChild: false },
        { name: 'Ivan Volkov',         room: '301',  isChild: true  },
        { name: 'Marta Kowalski',      room: '302',  isChild: false },
        { name: 'Pawel Kowalski',      room: '302',  isChild: false },
        { name: 'Zofia Kowalski',      room: '302',  isChild: true  },
        { name: 'Filip Kowalski',      room: '302',  isChild: true  },
        { name: 'Sven Holmberg',       room: '310',  isChild: false },
        { name: 'Britta Holmberg',     room: '310',  isChild: false },
        { name: 'Jonas Holmberg',      room: '310',  isChild: true  },
        { name: 'Daniela Moreno',      room: '402',  isChild: false },
        { name: 'Ricardo Moreno',      room: '402',  isChild: false },
        { name: 'Ana Moreno',          room: '402',  isChild: true  },
        { name: 'Peter Braun',         room: '405',  isChild: false },
        { name: 'Katrin Braun',        room: '405',  isChild: false },
        { name: 'Leon Braun',          room: '405',  isChild: true  },
        { name: 'Luisa Braun',         room: '405',  isChild: true  },
        { name: 'Olga Ivanova',        room: '420',  isChild: false },
        { name: 'Dmitri Ivanov',       room: '420',  isChild: false },
        { name: 'Anna Ivanova',        room: '420',  isChild: true  },
        { name: 'Mehmet Yilmaz',       room: '502',  isChild: false },
        { name: 'Ayse Yilmaz',         room: '502',  isChild: false },
        { name: 'Emre Yilmaz',         room: '502',  isChild: true  },
        { name: 'Deniz Yilmaz',        room: '502',  isChild: true  },
        { name: 'Caitlin Murphy',      room: '515',  isChild: false },
        { name: 'Sean Murphy',         room: '515',  isChild: false },
        { name: 'Ciara Murphy',        room: '515',  isChild: true  },
        { name: 'Antoine Bernard',     room: '520',  isChild: false },
        { name: 'Isabelle Bernard',    room: '520',  isChild: false },
        { name: 'Theo Bernard',        room: '520',  isChild: true  },
        { name: 'Lucie Bernard',       room: '520',  isChild: true  },
        { name: 'Markus Klein',        room: '602',  isChild: false },
        { name: 'Anna Klein',          room: '602',  isChild: false },
        { name: 'Paul Klein',          room: '602',  isChild: true  },
        { name: 'Kwame Asante',        room: '610',  isChild: false },
        { name: 'Abena Asante',        room: '610',  isChild: false },
        { name: 'Kofi Asante',         room: '610',  isChild: true  },
        { name: 'Esi Asante',          room: '610',  isChild: true  },
        { name: 'Rafael Silva',        room: '702',  isChild: false },
        { name: 'Beatriz Silva',       room: '702',  isChild: false },
        { name: 'Gabriel Silva',       room: '702',  isChild: true  },
        { name: 'Ling Wei',            room: '710',  isChild: false },
        { name: 'Fang Wei',            room: '710',  isChild: false },
        { name: 'Xiao Wei',            room: '710',  isChild: true  },
        { name: 'Min Wei',             room: '710',  isChild: true  },
        { name: 'Hamid Karimi',        room: '802',  isChild: false },
        { name: 'Leila Karimi',        room: '802',  isChild: false },
        { name: 'Sara Karimi',         room: '802',  isChild: true  },
        { name: 'James O\'Brien',      room: '820',  isChild: false },
        { name: 'Catherine O\'Brien',  room: '820',  isChild: false },
        { name: 'Liam O\'Brien',       room: '820',  isChild: true  },
        { name: 'Emma O\'Brien',       room: '820',  isChild: true  },

        // Floor 10
        { name: 'Henrik Strand',       room: '1001', isChild: false },
        { name: 'Malin Strand',        room: '1001', isChild: false },
        { name: 'Alicia Strand',       room: '1001', isChild: true  },
        { name: 'Nina Rossi',          room: '1004', isChild: false },
        { name: 'Marco Rossi',         room: '1004', isChild: false },
        { name: 'Sara Rossi',          room: '1004', isChild: true  },
        { name: 'Elizabeth Thornton',  room: '1010', isChild: false },
        { name: 'Edward Thornton',     room: '1010', isChild: false },
    ];

    for (const g of guestData) {
        const room = await prisma.room.findUnique({
            where: { roomNumber: g.room }
        });
        if (!room) {
            console.warn(`Room ${g.room} not found - skipping guest ${g.name}`);
            continue;
        }

        await prisma.guest.create({
            data: {
                name: g.name,
                roomId: room.id,
                guestType: 'HOTEL',
                isChild: g.isChild,
                checkInDate: todayMidnight,
                checkOutDate,
                hasBreakfast: true
            }
        });
    }
    console.log('Guests created:', guestData.length);

    // ---- Create Spa Members ----
    const spaMembers = [
        { memberId: 'SPA-001', name: 'Lilly Polly',    type: 'SPA' as const },
        { memberId: 'SPA-002', name: 'Erik Johansson', type: 'VIP' as const },
        { memberId: 'SPA-003', name: 'Anna Bergström', type: 'SPA' as const },
        { memberId: 'SPA-004', name: 'Marcus Hedlund', type: 'VIP' as const },
        { memberId: 'SPA-005', name: 'Emma Björk',     type: 'SPA' as const }
    ];

    for (const m of spaMembers) {
        await prisma.spaMember.upsert({
            where: { memberId: m.memberId },
            update: {},
            create: {
                memberId: m.memberId,
                name: m.name,
                memberType: m.type,
                isActive: m.memberId !== 'SPA-004',
                totalVisits: Math.floor(Math.random() * 30) + 5
            }
        });
    }
    console.log('Spa members created:', spaMembers.length);

    // ---- Create Kitchen Items (idempotent: wipe and re-create) ----
    await prisma.kitchenItem.deleteMany({});

    const kitchenItems = [
        { name: 'Scrambled Eggs',  status: 'AVAILABLE' as const },
        { name: 'Bacon',           status: 'AVAILABLE' as const },
        { name: 'Pancakes',        status: 'LOW'       as const },
        { name: 'Fresh Bread',     status: 'AVAILABLE' as const },
        { name: 'Orange Juice',    status: 'AVAILABLE' as const },
        { name: 'Smoked Salmon',   status: 'LOW'       as const },
        { name: 'Yogurt & Granola',status: 'AVAILABLE' as const },
        { name: 'Croissants',      status: 'SOLD_OUT'  as const },
        { name: 'Oatmeal',         status: 'AVAILABLE' as const },
        { name: 'Fresh Fruit',     status: 'AVAILABLE' as const }
    ];

    for (let i = 0; i < kitchenItems.length; i++) {
        await prisma.kitchenItem.create({
            data: { ...kitchenItems[i], sortOrder: i }
        });
    }
    console.log('Kitchen items created:', kitchenItems.length);

    // ---- Create today's breakfast session ----
    await prisma.breakfastSession.upsert({
        where: { sessionDate: todayMidnight },
        update: {},
        create: {
            sessionDate: todayMidnight,
            startTime: '07:00',
            endTime: '10:30',
            status: 'OPEN'
        }
    });
    console.log("Today's breakfast session created");

    // ---- Create example Instruction Sections ----
    await prisma.instructionSection.deleteMany({});

    const instructionSections = [
        {
            sortOrder: 1,
            title: 'Guest Check-In Procedure',
            content: `Follow these steps every time a guest arrives at the breakfast entrance:

1. Greet the guest with a smile - "Good morning, welcome to breakfast!"
2. Ask for their room number.
3. Search the room in the Check-In system (type room number or guest name).
4. Verify the guest's name matches what is on screen.
5. Confirm breakfast eligibility - the system shows a green "Breakfast" badge if included.
6. Set the correct count of adults and children using the +/– buttons.
7. Press the green Check-In button and wait for the success confirmation.
8. If the room is already checked in, the system will warn you - do NOT override unless a supervisor approves it.

Note: Never allow a guest in without completing a successful check-in. If you are unsure, call your supervisor immediately.`,
        },
        {
            sortOrder: 2,
            title: 'Duplicate Check-In Handling',
            content: `A "Duplicate" warning means the room has already been checked in today.

What to do:
- Ask the guest politely if they have already visited breakfast today.
- If they say YES → remind them that breakfast is included once per stay per day and guide them to available seating.
- If they say NO and believe it is an error → call the supervisor or hotel manager immediately. Do NOT override on your own.

Override is only allowed when:
✔ A supervisor or manager is present and approves it verbally.
✔ There is a clear system error (e.g., the session was reset or a technical issue occurred).

All overrides are logged in the system with your name and time.`,
        },
        {
            sortOrder: 3,
            title: 'Breakfast Eligibility Rules',
            content: `Who is eligible for breakfast?

HOTEL GUESTS
- Guests with "Breakfast Included" in their booking → Check-In normally.
- Guests without breakfast → Politely redirect them to the reception to purchase a breakfast add-on.

SPA & VIP MEMBERS
- Members with an active membership → Check-In with member scan at the Spa Verify terminal.
- Expired or inactive members → They cannot enter. Direct them to the reception.

CHILDREN
- Children under 4: Free (do not count them in the system).
- Children 4–12: Count as "Children" using the child counter.
- Children 13+: Count as "Adults".

EXTERNAL GUESTS
- Not allowed unless pre-approved by hotel management and marked in the system as EXTERNAL type.

When in doubt → do not check in. Contact your supervisor.`,
        },
        {
            sortOrder: 4,
            title: 'Kitchen Communication & Crowd Levels',
            content: `The system automatically tracks the current crowd level. Kitchen staff should monitor the Public Display screen at all times.

Crowd levels and what they mean:

LOW - Light flow. Prepare normal quantities. No rush.
MODERATE - Normal busy period. Increase production of hot items (eggs, bacon, pancakes). Check buffer stock.
BUSY - Peak traffic. All hands on deck. Prioritise speed. Alert the supervisor if items run low.

How to flag a kitchen item as low or sold out:
1. Go to the Kitchen page in the system.
2. Find the item.
3. Change its status to "Low" or "Sold Out".
4. The change appears instantly on the Public Display.

Always restock before marking an item as available again. Never mark an item available if it will run out in under 15 minutes.`,
        },
        {
            sortOrder: 5,
            title: 'VIP Guest Handling',
            content: `VIP guests require extra attention and a higher standard of service.

How to identify a VIP guest:
- The system shows a gold "VIP" badge next to their name.
- Reception will often notify staff before service begins.

What to do:
1. Greet VIP guests by name - "Good morning, Mr./Ms. [Last Name]."
2. Escort them to a reserved or preferred table if available.
3. Inform the kitchen immediately so they can prepare any pre-arranged special items.
4. Log any VIP-related notes in the Daily Log under the "VIP" category.
5. Do not discuss VIP guest details with other guests or non-essential staff.

Complaints from VIP guests must be escalated to the hotel manager immediately - do not attempt to resolve them on your own.`,
        },
        {
            sortOrder: 6,
            title: 'Hygiene & Food Safety Standards',
            content: `All breakfast staff must follow these hygiene standards at all times.

Personal hygiene:
- Wash hands thoroughly before starting your shift and after any break.
- Wear clean gloves when handling open food items.
- Tie back long hair and wear a hat or net if required.
- Do not work if you are experiencing illness (vomiting, diarrhea, fever).

Food station hygiene:
- Sanitize all contact surfaces at the start of service and every hour during service.
- Replace serving utensils every 30 minutes or immediately if dropped.
- Keep hot food above 60°C and cold food below 5°C at all times.
- Report any temperature deviations to the kitchen supervisor immediately.

Spills & contamination:
- Clean up spills immediately. Use the correct cleaning products (see kitchen cabinet labels).
- If food contamination is suspected (foreign objects, cross-contamination), remove the item from service and alert the kitchen manager at once.

Failure to follow food safety standards can result in immediate disciplinary action.`,
        },
        {
            sortOrder: 7,
            title: 'Shift Handover Checklist',
            content: `Complete this checklist at the end of every shift before leaving.

System tasks:
☐ All check-ins for the shift are completed and accurate.
☐ Any overrides are logged with reason and supervisor approval noted.
☐ Kitchen item statuses are up to date (no falsely "Available" items).
☐ Daily Log is updated with any incidents, VIP notes, or shift observations.
☐ Reminders marked as completed (or re-scheduled if not done).

Physical tasks:
☐ Breakfast station is cleaned and restocked for the next shift.
☐ Food items are stored correctly (temperature, labelling).
☐ Tables and chairs are reset to standard layout.
☐ Any damaged equipment is reported to maintenance via the Daily Log.

Hand over verbally to the incoming staff member and confirm they have read today's Daily Log before leaving.`,
        },
    ];

    for (const section of instructionSections) {
        await prisma.instructionSection.create({ data: section });
    }
    console.log('Instruction sections created:', instructionSections.length);

    console.log('\n✅ Seed complete!');
    console.log('\n🔑 Login credentials:');
    console.log('   Admin:  sandra@hotel.com / Password: Admin@2026');
    console.log('   Staff:  erik@hotel.com   / Password: Staff@2026');
    console.log('\n🔍 Test searches on Check-In page:');
    console.log('   Room:  303, 525, 816, 742, 112');
    console.log('   Name:  karlsson, peterson, andersson, garham');
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
