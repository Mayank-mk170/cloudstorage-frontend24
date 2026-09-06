import {BrowserRouter, Routes,Route,useLocation,} from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";


function AppContent() {

  const location = useLocation();

  const isDashboard =
    location.pathname.startsWith("/dashboard");

  return (
    <>
      {!isDashboard && <Navbar />}

      <Routes>

        {/* HOME */}
        <Route path="/"element={<Home />}/>

        {/* LOGIN */}
        <Route path="/login"element={<Login />}/>

        {/* REGISTER */}
        <Route path="/register"element={<Register />}/>

        {/* DASHBOARD */}
        <Route path="/dashboard" element={<Dashboard />}/>

      </Routes>
    </>
  );
}


function App() {

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}


export default App;