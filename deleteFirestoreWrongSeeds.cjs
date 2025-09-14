// deleteFirestoreWrongSeeds.cjs
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // download from Firebase Console > Project Settings > Service Accounts

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function cleanCourses() {
  const keepList = ["course1", "course2", "course3", "course4"];
  const snapshot = await db.collection("courses").get();

  for (const courseDoc of snapshot.docs) {
    const courseId = courseDoc.id;
    if (!keepList.includes(courseId)) {
      console.log(`🔥 Deleting course: ${courseId}`);
      await db.collection("courses").doc(courseId).delete();
    } else {
      console.log(`✅ Keeping course: ${courseId}`);
    }
  }

  console.log("✨ Cleanup finished!");
  process.exit(0);
}

cleanCourses().catch(err => {
  console.error("❌ Error during cleanup:", err);
  process.exit(1);
});
