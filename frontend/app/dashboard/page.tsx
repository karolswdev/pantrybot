export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome to your Fridgr dashboard!</p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Items</h3>
          <p className="text-3xl font-bold text-primary-600">47</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Expiring Soon</h3>
          <p className="text-3xl font-bold text-warning-600">5</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">This Week</h3>
          <p className="text-3xl font-bold text-secondary-600">$124.50</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Wasted</h3>
          <p className="text-3xl font-bold text-danger-600">$12</p>
        </div>
      </div>
    </div>
  )
}