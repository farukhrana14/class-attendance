          const handleSave = async () => {
            try {
              const savePromises = students.map(async (student) => {
                const userDocRef = doc(db, "users", student.email);
                await setDoc(userDocRef, {
                  ...student,
                  enrolledCourses: arrayUnion(courseName),
                }, { merge: true });
              });

              await Promise.all(savePromises);
              console.log("Students saved successfully with course name added to enrolledCourses.");
            } catch (err) {
              console.error("Error saving students:", err);
            }
          };