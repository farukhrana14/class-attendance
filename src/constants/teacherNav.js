const sidebarItems = [
  { name: "Dashboard", path: "/teacher", icon: "📊", end: true  },
  { name: "Courses", path: "/teacher/courses", icon: "📚", end: true },
  { name: "Create Course", path: "/teacher/create-course", icon: "➕" },
  { name: "Manage Students", path: "/teacher/manage-students", icon: "👥" },
  { name: "Register Attendance", path: "/teacher/roll-call", icon: "📅" },
  { name: "Reports", path: "/teacher/reports", icon: "📈" },
  { name: "Settings", path: "/teacher/settings", icon: "⚙️", disabled: true },
];

export default sidebarItems;
