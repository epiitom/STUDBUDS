import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout";
import LandingPage from "./LandingPage";
import MainApp from "./MainApp";
import SignInPage from "./(auth)/sign-in/[[...sign-in]]/page";
import SignUpPage from "./(auth)/sign-up/[[...sign-up]]/page";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Landing Page with Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          
          {/* Main App (Authenticated) with Dashboard */}
          <Route path="/app" element={<MainApp />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
