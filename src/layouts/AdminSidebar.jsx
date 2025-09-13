import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const sidebarItems = [
  { name: "Overview", path: "/admin" },
  { name: "+ Teachers", isManage: true, key: "teachers" },
  { name: "+ Students", isManage: true, key: "students" },
  { name: "+ Courses", isManage: true, key: "courses" },
];

const subMenus = {
  teachers: [
    { name: "Add / Remove", path: "/admin/teacher/manage" },
    { name: "Approve", path: "/admin/teacher/approve" },
    { name: "Report", path: "/admin/teacher/report" },
  ],
  students: [
    { name: "Add / Remove", path: "/admin/students/manage" },
    { name: "Approve", path: "/admin/students/approve" },
    { name: "Report", path: "/admin/students/report" },
  ],
  courses: [
    { name: "Add / Remove", path: "/admin/courses/manage" },
    { name: "Approve", path: "/admin/courses/approve" },
    { name: "Report", path: "/admin/courses/report" },
  ],
};

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, logout } = useAuth();
  const [openSubMenu, setOpenSubMenu] = React.useState(null);
  const [activeMenu, setActiveMenu] = React.useState("Overview");

  React.useEffect(() => {
    const currentPath = location.pathname;
    const currentItem = sidebarItems.find(item => item.path === currentPath);
    if (currentItem) {
      setActiveMenu(currentItem.name);
    }
  }, [location.pathname]);

  const handleMenuClick = (item) => {
    setActiveMenu(item.name);
    if (item.path) {
      navigate(item.path);
    }
  };

  const handleSubMenuToggle = (key) => {
    setOpenSubMenu(openSubMenu === key ? null : key);
  };

  const handleSignOut = () => {
    logout();
    setTimeout(() => {
      navigate("/");
    }, 100);
  };

  return (
    <aside className="w-60 bg-white shadow-md flex flex-col">
      <div className="px-6 py-8">
        <div className="text-2xl font-bold border-b border-gray-200 pb-4">
          Admin Dashboard
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Welcome, {userData?.name}
        </div>
        <button
          onClick={handleSignOut}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Sign Out
        </button>
      </div>
      <nav className="flex flex-col flex-grow">
        {sidebarItems.map((item) => (
          item.isManage ? (
            <div key={item.name}>
              <button
                onClick={() => handleSubMenuToggle(item.key)}
                className="text-left px-3 py-2 text-blue-600 font-bold hover:underline focus:outline-none w-full grid grid-cols-[auto_min-content] gap-0 items-center"
                style={{ margin: '8px 0' }}
              >
                <span className="flex items-center">{item.name}</span>
                <span className={`-ml-2 transition-transform inline-block ${openSubMenu === item.key ? 'rotate-90' : ''} self-center`}>▶</span>
              </button>
              {openSubMenu === item.key && (
                <div className="ml-4 flex flex-col">
                  {subMenus[item.key].map((sub) => (
                    <button
                      key={sub.name}
                      onClick={() => handleMenuClick(sub)}
                      className={`text-left px-4 py-2 border-l-4 ${
                        activeMenu === sub.name
                          ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold"
                          : "border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                      } focus:outline-none transition-colors duration-200`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              key={item.name}
              onClick={() => handleMenuClick(item)}
              className={`text-left px-6 py-3 border-l-4 ${
                activeMenu === item.name
                  ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold"
                  : "border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-300"
              } focus:outline-none transition-colors duration-200`}
            >
              {item.name}
            </button>
          )
        ))}
      </nav>
    </aside>
  );
}
