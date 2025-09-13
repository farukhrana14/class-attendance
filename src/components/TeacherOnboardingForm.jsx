import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function TeacherOnboardingForm({ user, onSuccess }) {
  const [form, setForm] = useState({
    name: user?.displayName || "",
    mobile: "",
    email: user?.email || "",
    university: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!form.name || !form.mobile || !form.email || !form.university) {
        setError("All fields are required.");
        setLoading(false);
        return;
      }
      const userDocRef = doc(db, "users", form.email);
      await setDoc(userDocRef, {
        name: form.name,
        mobile: form.mobile,
        email: form.email,
        university: form.university,
        role: "teacher",
        statusApproval: "pending",
      }, { merge: true });
      if (onSuccess) onSuccess(form.name);
    } catch (err) {
      setError("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4">Teacher Onboarding</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-left text-gray-700 font-medium mb-1">Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-left text-gray-700 font-medium mb-1">Mobile Number</label>
            <input type="text" name="mobile" value={form.mobile} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-left text-gray-700 font-medium mb-1">Email ID</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-2" required disabled />
          </div>
          <div>
            <label className="block text-left text-gray-700 font-medium mb-1">University Name</label>
            <input type="text" name="university" value={form.university} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
