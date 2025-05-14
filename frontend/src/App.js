import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Add more routes here as needed */}
      </Routes>
    </Router>
  );
}

export default App;
