import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/mongodb';

const seedSchedule = [
  { order: 0, time: '14:00', event: 'Eintreffen der Gäste vor der Orangerie', emoji: '👋', isBreak: false },
  { order: 1, time: '14:30', event: 'Standesamtliche Trauung im Lesesaal der Orangerie', emoji: '💍', isBreak: false },
  { order: 2, time: '15:00', event: 'Auszug aus dem Standesamt mit Gästen und Seifenblasen', emoji: '🫧', isBreak: false },
  { order: 3, time: '15:10', event: 'Beginn Fotoshooting aller Gäste', emoji: '📸', isBreak: false },
  { order: 4, time: '16:15', event: 'Fotoshooting Brautpaar', emoji: '💕', isBreak: false },
  { order: 5, time: '', event: 'Ab hier haben unsere Gäste ein wenig Zeit für sich', emoji: '⏰', isBreak: true },
  { order: 6, time: '17:20', event: 'Treffpunkt aller Gäste beim NOVA Essen & Trinken in Kempten', emoji: '📍', isBreak: false },
  { order: 7, time: '17:30', event: 'Brautpaar kommt zum Restaurant - Abendessen beginnt', emoji: '🍽️', isBreak: false },
];

const seedVenues = [
  {
    order: 0,
    name: 'Standesamt Orangerie Kempten',
    subtitle: 'Trauung',
    address: 'Lesesaal, Orangerieweg 20-22',
    city: '87439 Kempten (Allgäu)',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Orangerie+Kempten+Orangerieweg+20+87439+Kempten',
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2679.8!2d10.3156!3d47.7267!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x479c39f8a8b8b8b9%3A0x0!2sOrangerieweg%2020-22%2C%2087439%20Kempten!5e0!3m2!1sde!2sde!4v1',
  },
  {
    order: 1,
    name: 'NOVA Essen & Trinken',
    subtitle: 'Feier & Abendessen',
    address: 'Rathauspl. 21',
    city: '87435 Kempten (Allgäu)',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=NOVA+Essen+%26+Trinken+Rathauspl.+21+87435+Kempten',
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2679.8!2d10.3247!3d47.7267!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x479c39f8a8b8b8b9%3A0x0!2sRathauspl.%2021%2C%2087435%20Kempten!5e0!3m2!1sde!2sde!4v1',
  },
];

const seedMenuItems = [
  { type: 'food', order: 0, id: 'dreierlei-orientale', name: 'Dreierlei Orientale', category: 'Vorspeisen', description: 'Hausgemachte Aufstriche – Dattel-Honig-Creme, Schafskäse mit Oliven & eingelegte Tomaten, Hummus.' },
  { type: 'food', order: 1, id: 'rote-bete-carpaccio', name: 'Rote-Bete-Carpaccio', category: 'Vorspeisen', description: 'Fein geschnittene Rote Bete mit Pistazien-Zitronen-Pesto.' },
  { type: 'food', order: 2, id: 'burrata', name: 'Burrata', category: 'Vorspeisen', description: 'Cremige Burrata mit Pistazien-Zitronen-Pesto auf ofengebackenen Kirschtomaten.' },
  { type: 'food', order: 3, id: 'mercimek', name: 'Mercimek', category: 'Suppen', description: 'Türkische rote Linsensuppe mit Minze und Chiliflocken.' },
  { type: 'food', order: 4, id: 'pinsa-margherita', name: 'Pinsa Margherita Classico', category: 'Pinsa', description: 'Mit Mozzarellabällchen und Kirschtomaten.' },
  { type: 'food', order: 5, id: 'pinsa-griechisch', name: 'Pinsa Griechischer Genuss', category: 'Pinsa', description: 'Mit Feta, Oliven, Zwiebeln und Oregano.' },
  { type: 'food', order: 6, id: 'pinsa-serrano', name: 'Pinsa Serrano Classico', category: 'Pinsa', description: 'Mit Serrano-Schinken und Oregano.' },
  { type: 'food', order: 7, id: 'salat-nova', name: 'Salat Nova', category: 'Salate', description: 'Mischung aus frischen Blattsalaten, Karotten, Gurken, Weißkraut, Tomaten und roten Zwiebeln.' },
  { type: 'food', order: 8, id: 'panzanella', name: 'Panzanella', category: 'Salate', description: 'Lauwarmer italienischer Brotsalat mit Zucchini, Tomaten, Mozzarella und Parmesan.' },
  { type: 'food', order: 9, id: 'beilagensalat', name: 'Beilagensalat', category: 'Salate', description: 'Kleine Salatvariation.' },
  { type: 'food', order: 10, id: 'kaesspatzen', name: 'Allgäuer Kässpatzen', category: 'Heimat & Klassiker', description: 'Hausgemachte Spätzle mit würzigem Käse und Röstzwiebeln.' },
  { type: 'food', order: 11, id: 'koefte', name: 'Köfte', category: 'Fleisch', description: 'Hausgemachte Rinderköfte in Sesam-Tahin-Sauce mit Basmatireis.' },
  { type: 'food', order: 12, id: 'gnocchi', name: 'Gnocchi Mediterranea', category: 'Vegan', description: 'Gnocchi in aromatischer Tomaten-Kräutersauce mit Ofengemüse, Oliven und Kapern.' },
  { type: 'food', order: 13, id: 'risotto', name: 'Risotto al Limone', category: 'Vegan', description: 'Risotto mit gebratenen Zucchini und Kräutern.' },
  { type: 'food', order: 14, id: 'imam-bayildi', name: 'Imam Bayildi', category: 'Vegan', description: 'Gefüllte Aubergine mit mediterranem Gemüse und Tomatensugo.' },
  { type: 'food', order: 15, id: 'mediterrano', name: 'Mediterrano', category: 'Burger', description: 'Beef-Burger mit Mozzarella-Relish, Pistazien-Zitronen-Pesto und frischem Gemüse.' },
  { type: 'food', order: 16, id: 'seehechtfilet', name: 'Seehechtfilet al Cartoccio', category: 'Fisch', description: 'Im Backpapier gegart mit Tomaten, Zwiebeln, Oliven und Kartoffeln.' },
  { type: 'food', order: 17, id: 'manti-ravioli', name: 'Manti Ravioli alla Anatolia', category: 'Pasta & Risotto', description: 'Mini-Ravioli mit Hackfleischfüllung, Joghurt-Minz-Sauce und Chili-Butter.' },
  { type: 'food', order: 18, id: 'tortelli', name: 'Tortelli Ricotta-Spinat', category: 'Pasta & Risotto', description: 'Tortelli gefüllt mit Ricotta und Spinat, buttergeschwenkt mit Kräutern.' },
  { type: 'drink', order: 0, id: 'aqua-nova-sparkling', name: 'Aqua Nova (mit Kohlensäure)', category: 'Alkoholfreie Getränke', description: 'Premium Mineralwasser mit Kohlensäure.' },
  { type: 'drink', order: 1, id: 'aqua-nova-still', name: 'Aqua Nova (still)', category: 'Alkoholfreie Getränke', description: 'Premium Mineralwasser ohne Kohlensäure.' },
  { type: 'drink', order: 2, id: 'cola', name: 'Cola', category: 'Alkoholfreie Getränke', description: 'Klassisches Cola-Erfrischungsgetränk.' },
  { type: 'drink', order: 3, id: 'orangenlimonade', name: 'Orangenlimonade', category: 'Alkoholfreie Getränke', description: 'Orangenlimonade.' },
  { type: 'drink', order: 4, id: 'zitronenlimonade', name: 'Zitronenlimonade', category: 'Alkoholfreie Getränke', description: 'Zitronenlimonade.' },
  { type: 'drink', order: 5, id: 'spezi', name: 'Spezi', category: 'Alkoholfreie Getränke', description: 'Cola-Orangenlimonade-Mischgetränk.' },
  { type: 'drink', order: 6, id: 'cola-light', name: 'Coca Cola Light', category: 'Alkoholfreie Getränke', description: 'Zuckerreduzierte Cola.' },
  { type: 'drink', order: 7, id: 'holunderschorle', name: 'Holunderschorle', category: 'Alkoholfreie Getränke', description: 'Erfrischende Holunder-Schorle.' },
  { type: 'drink', order: 8, id: 'red-bull', name: 'Red Bull Energy Drink', category: 'Alkoholfreie Getränke', description: 'Energy Drink.' },
  { type: 'drink', order: 9, id: 'apfelsaft', name: 'Apfelsaft', category: 'Alkoholfreie Getränke', description: 'Naturtrüber Apfelsaft.' },
  { type: 'drink', order: 10, id: 'maracujanektar', name: 'Maracujanektar', category: 'Alkoholfreie Getränke', description: 'Maracuja-Nektar.' },
  { type: 'drink', order: 11, id: 'kirschnektar', name: 'Kirschnektar', category: 'Alkoholfreie Getränke', description: 'Kirschnektar.' },
  { type: 'drink', order: 12, id: 'saftschorle', name: 'Als Saftschorle', category: 'Alkoholfreie Getränke', description: 'Saft gemischt mit Mineralwasser.' },
  { type: 'drink', order: 13, id: 'eistee-pfirsich', name: 'Eistee Pfirsich', category: 'Alkoholfreie Getränke', description: 'Pfirsich-Eistee aus echtem Schwarztee.' },
  { type: 'drink', order: 14, id: 'kaffee', name: 'Tasse Kaffee', category: 'Heißgetränke', description: 'Klassischer Kaffee.' },
  { type: 'drink', order: 15, id: 'latte-macchiato', name: 'Latte Macchiato', category: 'Heißgetränke', description: 'Milchkaffee mit Espresso.' },
  { type: 'drink', order: 16, id: 'schwarzer-tee', name: 'Bio Schwarzer Tee', category: 'Heißgetränke', description: 'Darjeeling Schwarztee.' },
  { type: 'drink', order: 17, id: 'pfefferminztee', name: 'Bio Pfefferminztee', category: 'Heißgetränke', description: 'Pfefferminztee.' },
  { type: 'drink', order: 18, id: 'fruchtetee', name: 'Bio Früchtetee', category: 'Heißgetränke', description: 'Früchtetee.' },
  { type: 'drink', order: 19, id: 'radler', name: 'Radler', category: 'Biere', description: 'Bier mit Zitronenlimonade.' },
  { type: 'drink', order: 20, id: 'cola-weizen', name: 'Cola-Weizen', category: 'Biere', description: 'Weizenbier mit Cola.' },
];

const seedGuests = [
  { order: 0, name: 'Fatih Karaoglu', family: 'Karaoglu' },
  { order: 1, name: 'Lilly Ehmling', family: 'Ehmling' },
  { order: 2, name: 'Aysun Karaoglu', family: 'Karaoglu' },
  { order: 3, name: 'Ayhan Karaoglu', family: 'Karaoglu' },
  { order: 4, name: 'Furkan Karaoglu', family: 'Karaoglu' },
  { order: 5, name: 'Madeleine Ehmling', family: 'Ehmling' },
  { order: 6, name: 'Jörn Ehmling', family: 'Ehmling' },
  { order: 7, name: 'Jira Ehmling', family: 'Ehmling' },
  { order: 8, name: 'Jonas Ehmling', family: 'Ehmling' },
  { order: 9, name: 'Valentin Ehmling', family: 'Ehmling' },
  { order: 10, name: 'Johanna Wetzel', family: 'Wetzel' },
  { order: 11, name: 'Mariana Wetzel', family: 'Wetzel' },
  { order: 12, name: 'Fabian Schneider', family: 'Schneider' },
  { order: 13, name: 'Emin Kasan', family: 'Kasan' },
  { order: 14, name: 'Nurcan Kasan', family: 'Kasan' },
  { order: 15, name: 'Aleyna Kasan', family: 'Kasan' },
];

const seedSeating = {
  bride: 'Lilly Ehmling',
  groom: 'Fatih Karaoglu',
  bridesSide: ['Valentin Ehmling', 'Madeleine Ehmling', 'Jonas Ehmling', 'Jörn Ehmling', 'Jira Ehmling', 'Johanna Wetzel', 'Mariana Wetzel'],
  groomsSide: ['Aysun Karaoglu', 'Ayhan Karaoglu', 'Furkan Karaoglu', 'Aleyna Kasan', 'Nurcan Kasan', 'Emin Kasan', 'Fabian Schneider'],
};

export async function POST(request: NextRequest) {
  const pw = request.headers.get('x-admin-password');
  if (pw !== process.env.ADMIN_UPLOAD_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = await getDatabase();
    const seeded: string[] = [];
    const skipped: string[] = [];

    // Schedule
    const scheduleCount = await db.collection('schedule').countDocuments();
    if (scheduleCount === 0) {
      await db.collection('schedule').insertMany(seedSchedule);
      seeded.push('schedule');
    } else {
      skipped.push('schedule');
    }

    // Venues
    const venuesCount = await db.collection('venues').countDocuments();
    if (venuesCount === 0) {
      await db.collection('venues').insertMany(seedVenues);
      seeded.push('venues');
    } else {
      skipped.push('venues');
    }

    // Menu items
    const menuCount = await db.collection('menu_items').countDocuments();
    if (menuCount === 0) {
      await db.collection('menu_items').insertMany(seedMenuItems);
      seeded.push('menu_items');
    } else {
      skipped.push('menu_items');
    }

    // Guests
    const guestsCount = await db.collection('guests').countDocuments();
    if (guestsCount === 0) {
      await db.collection('guests').insertMany(seedGuests);
      seeded.push('guests');
    } else {
      skipped.push('guests');
    }

    // Seating (single doc)
    const seatingCount = await db.collection('seating').countDocuments();
    if (seatingCount === 0) {
      await db.collection('seating').insertOne(seedSeating);
      seeded.push('seating');
    } else {
      skipped.push('seating');
    }

    return NextResponse.json({ seeded, skipped });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
