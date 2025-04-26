export default function Header() {
    return (
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Interview Assistant</h1>
        <div className="space-x-2">
          <button className="border px-4 py-2 text-black rounded-md hover:bg-gray-100">Start Trial Session</button>
          <button className="bg-black text-white px-4 py-2 rounded-md">Start Session</button>
        </div>
      </div>
    );
  }
  