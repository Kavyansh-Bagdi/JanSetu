import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./components/Navbar";
import Add_Road from "./pages/Add_Road";
import Home from "./pages/Home";
import Inspect_Road from "./pages/Inspect_Road";

function App() {
  return (
    <Router>
      <div style={{ display: "flex", height: "100vh" }}>
        <NavBar />
        <div style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add_road" element={<Add_Road />} />
            <Route path="/inspect_road" element={<Inspect_Road />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
