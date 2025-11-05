import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { RoleProvider } from "./components/RoleContext.jsx";
import Home from "./pages/Home";
import Map from "./pages/Map";

function App() {
  return (
    <RoleProvider>
      <Router>
        <div style={{ display: "flex", height: "100vh" }}>
          <div style={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Map />} />
              <Route path="/home" element={<Home />} />
            </Routes>
          </div>
        </div>
      </Router>
    </RoleProvider>
  );
}

export default App;
