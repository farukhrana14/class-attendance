// deleteFirestoreWrongSeeds.cjs
const admin = require("firebase-admin");
const path = require("path");
const serviceAccount = require("./serviceAccountKey.json"); // download from Firebase Console > Project Settings > Service Accounts

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// --- SETTINGS ---
const COLLECTION = "users";
const FIELD = "enrolledCourses";
const DRY_RUN = false;     // true = preview only; no writes
const BATCH_SIZE = 450;    // keep < 500 per Firestore limits

(async function main() {
  console.log(`Scanning ${COLLECTION}/ ...`);
  const snap = await db.collection(COLLECTION).get();

  if (snap.empty) {
    console.log("No user documents found.");
    process.exit(0);
  }

  let toUpdate = [];
  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const current = data[FIELD];

    // Only update if the field exists and is non-empty (array with length > 0)
    // or if it exists but is not an array (normalize it to []).
    const needsUpdate =
      (Array.isArray(current) && current.length > 0) ||
      (current !== undefined && !Array.isArray(current));

    if (needsUpdate) {
      toUpdate.push(doc.ref);
    }
  }

  console.log(`Found ${toUpdate.length} document(s) needing ${FIELD} cleared.`);

  if (DRY_RUN) {
    toUpdate.forEach(ref => console.log(`DRY-RUN: would set ${ref.path}.${FIELD} = []`));
    console.log("No writes performed (DRY_RUN = true).");
    process.exit(0);
  }

  // Write in batches
  let processed = 0;
  while (toUpdate.length) {
    const chunk = toUpdate.splice(0, BATCH_SIZE);
    const batch = db.batch();
    chunk.forEach(ref => batch.update(ref, { [FIELD]: [] })); // keep field, empty array
    await batch.commit();
    processed += chunk.length;
    console.log(`Updated ${processed}/${processed + toUpdate.length}`);
  }

  console.log(`Done. Cleared ${FIELD} in ${processed} document(s) under ${COLLECTION}/.`);
  process.exit(0);
})().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});