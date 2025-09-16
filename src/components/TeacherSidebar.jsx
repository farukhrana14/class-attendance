import React from "react";
import { NavLink, useLocation, useParams, matchPath } from "react-router-dom";

function SidebarSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-5 bg-gray-200 rounded" />
      <div className="h-5 bg-gray-200 rounded" />
      <div className="h-5 bg-gray-200 rounded" />
    </div>
  );
}

export default function TeacherSidebar({
  userData,
  userLoading,
  items = [],
  onSignOut,
}) {
  const navItems = Array.isArray(items) ? items : [];
  const location = useLocation();
  const { courseId } = useParams();

  // Prefer route param; else extract from path; ignore special routes
  const courseIdFromPath = React.useMemo(() => {
    if (courseId) return courseId;
    const m = location.pathname.match(/^\/teacher\/courses\/([^/]+)/);
    if (!m) return null;
    const cid = m[1];
    if (cid === "create-course" || cid === "add-students") return null;
    return cid;
  }, [courseId, location.pathname]);

  // Remember course only while inside a course route
  React.useEffect(() => {
    if (courseIdFromPath) {
      try {
        localStorage.setItem("lastCourseId", courseIdFromPath);
      } catch {}
    }
  }, [courseIdFromPath]);

  // Clear sticky id anytime we leave /teacher/courses/:courseId/...
  React.useEffect(() => {
    const inCourse = /^\/teacher\/courses\/[^/]+/.test(location.pathname);
    if (!inCourse) {
      try {
        localStorage.removeItem("lastCourseId");
      } catch {}
    }
  }, [location.pathname]);

  const lastCourseId = React.useMemo(() => {
    try {
      return localStorage.getItem("lastCourseId");
    } catch {
      return null;
    }
  }, [location.pathname]);

  // Resolve item path
  const resolvePath = (item) => {
    const path = item?.path || ".";
    if (!path.includes(":courseId")) return path;

    // Reports: never use lastCourseId when outside a course → go to launcher
    if (path.includes("/reports")) {
      if (courseIdFromPath) return path.replace(":courseId", courseIdFromPath);
      return "roll-call?target=reports";
    }

    // Others: allow lastCourseId fallback
    const cid = courseIdFromPath || lastCourseId;
    return cid ? path.replace(":courseId", cid) : "courses";
  };

  // Our own active logic so only ONE lights up
  const isItemActive = (item) => {
    const pathname = location.pathname;
    const params = new URLSearchParams(location.search);
    const target = params.get("target");

    const isReportsItem = /reports/.test(item.path);
    const isRegisterItem =
      /rollcall/.test(item.path) ||
      (/roll-call/.test(item.path) && !/reports/.test(item.path));

    const onReportsPage =
      Boolean(
        matchPath({ path: "/teacher/courses/:courseId/reports" }, pathname)
      ) ||
      (pathname === "/teacher/roll-call" && target === "reports");

    const onRegisterPage =
      Boolean(
        matchPath({ path: "/teacher/courses/:courseId/rollcall" }, pathname)
      ) ||
      (pathname === "/teacher/roll-call" && target !== "reports");

    if (isReportsItem) return onReportsPage;
    if (isRegisterItem) return onRegisterPage;

    // Fallback to pattern-based for everything else
    const extraActive = (item.activePatterns || []).some((p) =>
      matchPath({ path: p, end: true }, pathname)
    );
    return extraActive;
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem("lastCourseId");
    } catch {}
    onSignOut?.();
  };

  return (
    <aside className="w-64 bg-white shadow-md p-6 hidden md:block">
      <h1 className="text-xl font-bold mb-2">Teacher Dashboard</h1>

      {userLoading ? (
        <SidebarSkeleton />
      ) : (
        userData && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-blue-900 animate-fade-in">
            <div className="font-semibold">{userData.name}</div>
            <div className="text-xs break-all">{userData.email}</div>
          </div>
        )
      )}

      <nav>
        {navItems.map((item) => {
          if (item.disabled) {
            return (
              <div
                key={item.path}
                aria-disabled="true"
                title="Coming soon"
                className="flex items-center px-4 py-2 mb-2 rounded-lg text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </div>
            );
          }

          const to = resolvePath(item);
          const active = isItemActive(item);

          return (
            <NavLink
              key={item.path}
              to={to}
              end={Boolean(item.end)}
              title={
                item.path.includes(":courseId") &&
                item.path.includes("/reports") &&
                !courseIdFromPath
                  ? "Pick a course for reports"
                  : undefined
              }
              className={() =>
                `flex items-center px-4 py-2 mb-2 rounded-lg ${
                  active
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`
              }
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={handleSignOut}
        className="mt-6 w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
      >
        Sign Out
      </button>
    </aside>
  );
}
