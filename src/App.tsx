import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/clients/:id/edit" element={<div>Edit Client</div>} />
      </Routes>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
