import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { RoleProvider } from "./components/RoleContext.jsx";
import Home from "./pages/Home";
import Map from "./pages/Map";
import { useEffect } from "react";

function App() {

  return (
    <RoleProvider>
      <Router>
        <div className="d-flex" style={{ height: "100vh" }}>
          <Routes>
            <Route path="/" element={<Map />} />
            <Route path="/home" element={<Home />} />
          </Routes>
        </div>
      </Router>
    </RoleProvider>
  );
}

export default App;
