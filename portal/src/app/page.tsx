export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-3xl font-semibold">CADGroup Tools Portal</h1>
        <p className="text-neutral-600">Deployed on Render. Core features are being implemented.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/api/health/db"
            className="px-4 py-2 rounded-md bg-black text-white hover:opacity-90"
          >
            Database Health (JSON)
          </a>
        </div>
      </div>
    </main>
  );
}
