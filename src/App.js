import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomeView from './components/HomeView'; 
import Auth from './components/Auth';
import Main from './components/Main'; 

function App() {
  const userId = localStorage.getItem("userId"); // Get userId from localStorage

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/main" element={<Main userId={userId} />} /> {/* Pass userId as prop */}
      </Routes>
    </Router>
  );
}

export default App;