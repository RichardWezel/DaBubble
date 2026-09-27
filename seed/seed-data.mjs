/**
 * Content of the demo chats.
 *
 * Everything in here ends up in Firestore with `isSeed: true` and no
 * `expiresAt`, which is what keeps it from being swept away by the TTL
 * policies that clean up visitor content.
 *
 * Timestamps are relative to the moment the seed runs (`daysAgo` + time of
 * day), so the conversations never look stale no matter when they were last
 * written.
 *
 * Post text is HTML - that is how the app stores and renders messages.
 */
import { readFileSync } from 'node:fs';

export const SEED_IDS = JSON.parse(readFileSync('src/config/seed-ids.json', 'utf8'));
const U = SEED_IDS.users;
const C = SEED_IDS.channels;

/** Epoch millis for "n days ago at HH:MM" local time. */
export function at(daysAgo, time) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

/** Shorthand for a reaction: r('👍', uid, uid, …) */
const r = (type, ...names) => ({ type, count: names.length, name: names });

export const users = [
  { id: U.frederik, name: 'Frederik Beck',   email: 'frederik.beck@beispiel.com',   avatar: 'profile-5.png', online: true },
  { id: U.steffen,  name: 'Steffen Hoffmann', email: 'steffen.hoffmann@beispiel.com', avatar: 'profile-3.png', online: true },
  { id: U.sofia,    name: 'Sofia Müller',    email: 'sofia.mueller@beispiel.com',   avatar: 'profile-4.png', online: true },
  { id: U.elias,    name: 'Elias Neumann',   email: 'elias.neumann@beispiel.com',   avatar: 'profile-1.png', online: true },
  { id: U.elise,    name: 'Elise Roth',      email: 'elise.roth@beispiel.com',      avatar: 'profile-2.png', online: false },
  { id: U.noah,     name: 'Noah Braun',      email: 'noah.braun@beispiel.com',      avatar: 'profile-6.png', online: true },
];

const everyone = [U.frederik, U.steffen, U.sofia, U.elias, U.elise, U.noah];

export const channels = [
  {
    id: C.lobby,
    name: 'Lobby',
    description: 'Ankommen, Smalltalk und alles, was in keinen anderen Channel passt.',
    owner: U.steffen,
    user: everyone,
    posts: [
      {
        author: U.steffen, daysAgo: 9, time: '09:12',
        text: '<p>Guten Morgen zusammen ☀️ Die Lobby ist ab jetzt unser Sammelpunkt. Hier landet alles, was nicht in einen Fachchannel gehört.</p>',
        emoticons: [r('👍', U.sofia, U.elias, U.noah), r('☀️', U.elise)],
      },
      {
        author: U.sofia, daysAgo: 9, time: '09:31',
        text: '<p>Sehr gut. Ich hatte langsam den Überblick verloren, wo ich was posten soll.</p>',
      },
      {
        author: U.noah, daysAgo: 8, time: '11:47',
        text: '<p>Kurze Frage in die Runde: Macht heute noch jemand Mittagspause um halb eins? Ich hätte Lust auf den Italiener um die Ecke 🍝</p>',
        emoticons: [r('🍝', U.elias, U.frederik)],
        thread: [
          { author: U.elias, daysAgo: 8, time: '11:52', text: '<p>Bin dabei. Ich muss nur vorher noch den Build durchbekommen.</p>' },
          { author: U.frederik, daysAgo: 8, time: '12:03', text: '<p>Ich stoße dazu, komme aber vielleicht zehn Minuten später.</p>' },
          { author: U.noah, daysAgo: 8, time: '12:05', text: '<p>Passt, wir halten dir einen Platz frei 👍</p>' },
        ],
      },
      {
        author: U.elise, daysAgo: 6, time: '08:20',
        text: '<p>Ich bin heute und morgen im Homeoffice, erreichbar bin ich normal über hier.</p>',
        emoticons: [r('👌', U.steffen)],
      },
      {
        author: U.steffen, daysAgo: 4, time: '16:40',
        text: '<p>Kleine Erinnerung: Freitag um 14 Uhr ist Retro. Bringt bitte je zwei Punkte mit, einen der gut lief und einen der genervt hat.</p>',
        emoticons: [r('👍', U.sofia, U.noah, U.elias, U.elise)],
      },
      {
        author: U.elias, daysAgo: 3, time: '10:05',
        text: '<p>Hat jemand die Doku zum neuen Deployment gesehen? Ich finde den Link nicht mehr.</p>',
        thread: [
          { author: U.sofia, daysAgo: 3, time: '10:11', text: '<p>Die liegt im #Entwicklerteam, Steffen hatte sie letzte Woche gepostet.</p>' },
          { author: U.elias, daysAgo: 3, time: '10:14', text: '<p>Gefunden, danke dir 🙏</p>' },
        ],
      },
      {
        author: U.frederik, daysAgo: 1, time: '09:02',
        text: '<p>Moin! Ich schaue mir heute die offenen Punkte aus der Retro an. Wenn jemand noch etwas ergänzen will, gerne hier.</p>',
        emoticons: [r('🚀', U.steffen, U.noah)],
      },
    ],
  },

  {
    id: C.entwicklerteam,
    name: 'Entwicklerteam',
    description: 'Technische Abstimmung, Code Reviews und alles rund um Releases.',
    owner: U.steffen,
    user: [U.frederik, U.steffen, U.sofia, U.elias, U.noah],
    posts: [
      {
        author: U.steffen, daysAgo: 12, time: '09:00',
        text: '<p>Ich habe die Deployment-Doku aktualisiert. Wichtigste Änderung: Wir bauen jetzt in zwei Schritten, erst Preview, dann Production.</p>',
        emoticons: [r('👍', U.elias, U.sofia, U.noah)],
      },
      {
        author: U.noah, daysAgo: 11, time: '14:22',
        text: '<p>Ich habe den Fehler beim Nachladen älterer Nachrichten gefunden. Wir haben beim Scrollen den Listener doppelt registriert, dadurch kamen manche Nachrichten zweimal an.</p>',
        emoticons: [r('🎉', U.steffen, U.sofia, U.elias, U.frederik), r('🐛', U.elias)],
        thread: [
          { author: U.sofia, daysAgo: 11, time: '14:35', text: '<p>Das erklärt die Duplikate, die ich letzte Woche im Testchannel hatte. Sehr gut gefunden!</p>' },
          { author: U.steffen, daysAgo: 11, time: '15:02', text: '<p>Kannst du beim Aufräumen gleich prüfen, ob wir die Listener beim Channelwechsel sauber abmelden? Ich habe den Verdacht, dass da noch welche offen bleiben.</p>' },
          { author: U.noah, daysAgo: 11, time: '15:18', text: '<p>Schaue ich mir an. Falls ja, packe ich das in denselben Branch.</p>' },
          { author: U.noah, daysAgo: 10, time: '09:40', text: '<p>Bestätigt, zwei Listener blieben offen. Ist gefixt, Branch ist bereit für Review.</p>', emoticons: [r('👏', U.steffen, U.sofia)] },
        ],
      },
      {
        author: U.elias, daysAgo: 8, time: '11:15',
        text: '<p>Ich würde die Nachrichten gern aus dem großen Array in eine eigene Collection ziehen. Aktuell schreiben wir bei jeder neuen Nachricht das komplette Array zurück.</p>',
        emoticons: [r('💡', U.sofia, U.noah)],
        thread: [
          { author: U.frederik, daysAgo: 8, time: '11:28', text: '<p>Der Punkt ist berechtigt. Wenn zwei Leute gleichzeitig schreiben, kann eine Nachricht verloren gehen.</p>' },
          { author: U.steffen, daysAgo: 8, time: '11:44', text: '<p>Einverstanden, aber lass uns das nicht mitten im Release anfangen. Ich setze es auf die Liste nach dem Sprint.</p>' },
          { author: U.elias, daysAgo: 8, time: '11:47', text: '<p>Passt für mich 👍</p>' },
        ],
      },
      {
        author: U.sofia, daysAgo: 6, time: '13:05',
        text: '<p>Review für Noahs Branch ist durch. Zwei kleine Anmerkungen, sonst sieht das gut aus.</p>',
        emoticons: [r('✅', U.noah)],
      },
      {
        author: U.noah, daysAgo: 6, time: '13:40',
        text: '<p>Beide eingearbeitet, danke. Ich merge nach dem Mittag.</p>',
      },
      {
        author: U.steffen, daysAgo: 5, time: '17:20',
        text: '<p>Release 1.4 ist draußen 🚀 Danke an alle, das war ein ordentliches Stück Arbeit.</p>',
        emoticons: [r('🚀', U.sofia, U.elias, U.noah, U.frederik), r('🎉', U.elise)],
      },
      {
        author: U.frederik, daysAgo: 2, time: '10:30',
        text: '<p>Ich habe die Ladezeiten nachgemessen: Wir sind von 2,1s auf 1,3s runter. Der größte Anteil kam durch das Lazy Loading der Emoji-Auswahl.</p>',
        emoticons: [r('📈', U.steffen, U.sofia)],
      },
      {
        author: U.elias, daysAgo: 1, time: '15:55',
        text: '<p>Kurzer Hinweis: Ich habe die Abhängigkeiten aktualisiert. Falls bei euch etwas seltsam ist, einmal <b>npm ci</b> laufen lassen.</p>',
        emoticons: [r('👍', U.noah)],
      },
    ],
  },

  {
    id: C.design,
    name: 'Design',
    description: 'Screens, Komponenten und Abstimmung zwischen Design und Umsetzung.',
    owner: U.elise,
    user: [U.frederik, U.elise, U.sofia, U.steffen],
    posts: [
      {
        author: U.elise, daysAgo: 10, time: '10:00',
        text: '<p>Die überarbeiteten Profilkarten sind fertig. Ich habe die Abstände vereinheitlicht und den Status deutlicher gemacht.</p>',
        emoticons: [r('❤️', U.sofia, U.frederik), r('👍', U.steffen)],
        thread: [
          { author: U.sofia, daysAgo: 10, time: '10:22', text: '<p>Sieht deutlich ruhiger aus als vorher. Ist der Grünton für "Aktiv" derselbe wie in der Navigation?</p>' },
          { author: U.elise, daysAgo: 10, time: '10:31', text: '<p>Ja, beide nutzen jetzt dasselbe Grün aus den Farbtokens. Vorher waren es zwei leicht unterschiedliche Werte.</p>', emoticons: [r('👌', U.sofia)] },
          { author: U.frederik, daysAgo: 10, time: '11:05', text: '<p>Super, dann kann ich das direkt so umsetzen.</p>' },
        ],
      },
      {
        author: U.sofia, daysAgo: 7, time: '09:45',
        text: '<p>Frage zur mobilen Ansicht: Soll die Seitenleiste ausklappbar bleiben oder komplett zu einem eigenen Screen werden?</p>',
        thread: [
          { author: U.elise, daysAgo: 7, time: '10:12', text: '<p>Eigener Screen. Ausklappen wird auf kleinen Geräten zu eng, das haben die Tests letztes Mal gezeigt.</p>' },
          { author: U.sofia, daysAgo: 7, time: '10:15', text: '<p>Verstanden, dann baue ich es so.</p>' },
        ],
      },
      {
        author: U.elise, daysAgo: 3, time: '14:10',
        text: '<p>Ich habe die Icons noch einmal auf 24px vereinheitlicht. Vorher waren drei Stück minimal größer, das ist in der Leiste aufgefallen.</p>',
        emoticons: [r('👀', U.frederik)],
      },
      {
        author: U.frederik, daysAgo: 2, time: '16:25',
        text: '<p>Umgesetzt und deployed. Die Leiste wirkt jetzt tatsächlich aufgeräumter.</p>',
        emoticons: [r('🙌', U.elise, U.sofia)],
      },
    ],
  },

  {
    id: C.testchannel,
    name: 'Testchannel',
    description: 'Zum Ausprobieren. Hier darf alles kaputtgehen.',
    owner: U.steffen,
    user: everyone,
    posts: [
      {
        author: U.steffen, daysAgo: 14, time: '08:30',
        text: '<p>Dieser Channel ist zum Ausprobieren da. Schreibt hier ruhig Unsinn, reagiert auf Nachrichten, startet Threads.</p>',
        emoticons: [r('🧪', U.noah, U.elias)],
      },
      {
        author: U.elias, daysAgo: 13, time: '12:00',
        text: '<p>Test <b>fett</b>, <i>kursiv</i> und eine Liste:</p><ul><li>erster Punkt</li><li>zweiter Punkt</li></ul>',
        emoticons: [r('✅', U.sofia)],
      },
      {
        author: U.noah, daysAgo: 5, time: '18:12',
        text: '<p>Emoji-Test 🎉🚀🐛☕️ — sieht alles korrekt aus.</p>',
        emoticons: [r('🚀', U.elias), r('☕️', U.steffen, U.frederik)],
      },
      {
        author: U.frederik, daysAgo: 1, time: '11:20',
        text: '<p>Thread-Test.</p>',
        thread: [
          { author: U.sofia, daysAgo: 1, time: '11:24', text: '<p>Antwort eins.</p>' },
          { author: U.frederik, daysAgo: 1, time: '11:26', text: '<p>Antwort zwei. Funktioniert 👍</p>' },
        ],
      },
    ],
  },
];

export const dms = [
  {
    participants: [U.frederik, U.steffen],
    posts: [
      {
        author: U.steffen, daysAgo: 14, time: '08:05',
        text: '<h3>🎉 Willkommen in unserem Team, Frederik!</h3><p>Schön, dass du da bist. Schau dich in Ruhe um — in der #Lobby stellen sich alle kurz vor, und im #Testchannel kannst du gefahrlos alles ausprobieren.</p><p>Wenn etwas unklar ist, schreib mir einfach hier.</p><p>Viele Grüße<br><b>Steffen</b></p>',
        emoticons: [r('🙏', U.frederik)],
      },
      { author: U.frederik, daysAgo: 14, time: '08:41', text: '<p>Danke dir! Ich schaue mich mal um.</p>' },
      { author: U.steffen, daysAgo: 4, time: '16:45', text: '<p>Denk an Freitag, Retro um 14 Uhr. Kannst du deine Messwerte zu den Ladezeiten mitbringen?</p>' },
      { author: U.frederik, daysAgo: 4, time: '17:02', text: '<p>Klar, ich bereite eine kurze Übersicht vor 👍</p>', emoticons: [r('👍', U.steffen)] },
    ],
  },
  {
    participants: [U.frederik, U.sofia],
    posts: [
      { author: U.sofia, daysAgo: 6, time: '13:12', text: '<p>Hast du kurz Zeit, über das Review von Noahs Branch zu schauen? Zwei Stellen bin ich mir unsicher.</p>' },
      { author: U.frederik, daysAgo: 6, time: '13:20', text: '<p>Ja, gib mir zehn Minuten.</p>' },
      { author: U.sofia, daysAgo: 6, time: '13:48', text: '<p>Perfekt, danke. Ich habe beides so übernommen wie besprochen.</p>', emoticons: [r('👌', U.frederik)] },
    ],
  },
  {
    participants: [U.frederik, U.noah],
    posts: [
      { author: U.noah, daysAgo: 2, time: '10:55', text: '<p>Deine Zahlen zu den Ladezeiten sind stark. Wie hast du gemessen?</p>' },
      { author: U.frederik, daysAgo: 2, time: '11:10', text: '<p>Lighthouse im Inkognito-Fenster, fünf Durchläufe, Median genommen. Einzelmessungen schwanken zu stark.</p>' },
      { author: U.noah, daysAgo: 2, time: '11:14', text: '<p>Macht Sinn, so mache ich es beim nächsten Mal auch 👍</p>' },
    ],
  },
  {
    // self-DM: the app supports writing notes to yourself
    participants: [U.frederik, U.frederik],
    posts: [
      { author: U.frederik, daysAgo: 3, time: '08:15', text: '<p>Notiz an mich: Vor der Retro noch die Messwerte von letzter Woche gegenprüfen.</p>' },
    ],
  },
];
