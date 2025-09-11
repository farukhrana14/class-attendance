export default function NotAuthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded shadow p-8 text-center">
        <h1 className="text-2xl font-semibold mb-3">Not Authorized</h1>
        <p className="text-gray-600 mb-6">
          You don’t have permission to view this page.
        </p>
        <a
          href="/"
          className="inline-block px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
