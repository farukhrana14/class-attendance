# Database Seeding Guide

This guide explains how to populate your Class Attendance System with test data for development and testing.

## 🎯 Why Seed Data?

- **Development Testing**: Test features without manually creating data
- **UI/UX Validation**: See how your interface handles realistic data volumes
- **Demo Preparation**: Show functionality with meaningful data
- **Edge Case Testing**: Test various scenarios (empty lists, full rosters, etc.)

## 🚀 Quick Start (Recommended)

### Method 1: Using the Web Interface

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the seeder page:
   ```
   http://localhost:5174/seed
   ```

3. Click "Seed Database with Test Data"

4. Wait for completion (30-60 seconds)

### Method 2: Browser Console

1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Copy and paste the contents of `scripts/seedData.js`
5. Run `seedTestData()`

## 📊 What Gets Created

### Users
- **1 Admin**: `admin@university.edu`
- **3 Teachers**: 
  - `alice.smith@university.edu` (CS courses)
  - `bob.johnson@university.edu` (Math courses)
  - `carol.white@university.edu` (Physics courses)
- **6+ Students**: Various students enrolled in different courses

### Courses
- **CS101**: Introduction to Computer Science
- **CS102**: Data Structures  
- **MATH201**: Calculus I
- **PHYS150**: Physics I

### Data
- **Course Enrollments**: Realistic student-course assignments
- **Attendance Records**: 5+ days of attendance data with realistic patterns
- **Pending Requests**: Sample pending student enrollment requests

## 🧪 Test Accounts

After seeding, you can log in with these accounts:

| Role | Email | Purpose |
|------|-------|---------|
| Admin | `admin@university.edu` | Test admin dashboard features |
| Teacher | `alice.smith@university.edu` | Test course management, roll call |
| Teacher | `bob.johnson@university.edu` | Test with different courses |
| Student | `john.doe@student.edu` | Test student dashboard, check-in |
| Student | `jane.smith@student.edu` | Test with multiple course enrollments |

## 🛡️ Safety Features

- **Development Only**: Seeder routes should be removed in production
- **Clear Warning**: UI warns about data deletion
- **Batch Operations**: Uses Firebase batch operations for efficiency
- **Error Handling**: Graceful error handling and status reporting

## 📂 File Structure

```
scripts/
├── seedDatabase.js     # Full-featured Node.js seeder
├── seedData.js         # Browser console seeder
src/components/
├── DatabaseSeeder.jsx  # React component seeder
```

## 🔧 Customization

### Adding More Data

Edit the data arrays in any seeder file:

```javascript
const students = [
  { email: "new.student@student.edu", name: "New Student", studentId: "ST999" },
  // Add more students...
];
```

### Changing Attendance Patterns

Modify the `getRandomStatus()` function:

```javascript
const getRandomStatus = () => {
  const rand = Math.random();
  if (rand < 0.8) return "present";  // 80% present
  if (rand < 0.95) return "late";    // 15% late  
  return "absent";                   // 5% absent
};
```

### Different Date Ranges

Change the attendance date range:

```javascript
// Generate attendance for last 30 days instead of 5
for (let i = 29; i >= 0; i--) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  // ...
}
```

## 🚨 Production Considerations

### Remove Seeder Routes

Before deploying to production, remove these lines from `main.jsx`:

```jsx
// Remove this route in production
<Route path="/seed" element={<DatabaseSeeder />} />
```

### Environment Protection

Add environment checks:

```javascript
// Only allow seeding in development
if (process.env.NODE_ENV !== 'production') {
  // Seeding code here
}
```

### Firestore Security Rules

Ensure your Firestore rules prevent unauthorized data manipulation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.token.email == userId;
    }
    // Restrict admin operations
    match /{document=**} {
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'admin';
    }
  }
}
```

## 🐛 Troubleshooting

### "Firebase not available" Error
- Make sure you're on a page where Firebase is initialized
- Check that your Firebase config is correct

### Permission Denied
- Verify your Firestore security rules allow the operations
- Check that you're authenticated with appropriate permissions

### Slow Performance
- The seeder creates many documents; this is normal
- Consider reducing the date range for attendance records

### Data Not Appearing
- Refresh the page after seeding
- Check browser console for errors
- Verify Firebase project connection

## 📈 Best Practices

1. **Seed Early**: Set up seeding before building features
2. **Realistic Data**: Use realistic names, emails, and patterns
3. **Version Control**: Keep seeder scripts in version control
4. **Documentation**: Document what test accounts do what
5. **Clean Slate**: Always start with cleared data for consistent testing

## 🔄 Clearing Data

To start fresh, the seeder automatically clears existing data. You can also manually clear collections in the Firebase Console.

---

**Note**: Always use seeded data responsibly and never in production environments with real user data.
