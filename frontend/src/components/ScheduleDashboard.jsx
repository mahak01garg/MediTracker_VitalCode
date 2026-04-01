// In your App.js or routes file
import ScheduleDashboard from './components/ScheduleDashboard';

function App() {
  return (
    <Routes>
      <Route path="/admin/schedule" element={<ScheduleDashboard />} />
      {/* other routes */}
    </Routes>
  );
}