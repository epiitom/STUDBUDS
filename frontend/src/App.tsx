import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout";
import LandingPage from "./LandingPage";
import MainApp from "./MainApp";
import SignInPage from "./(auth)/sign-in/[[...sign-in]]/page";
import SignUpPage from "./(auth)/sign-up/[[...sign-up]]/page";
import StudyProfilePage from "./pages/StudyProfilePage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Landing Page with Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
        </Route>

        {/* Main App (Authenticated) with Dashboard */}
        <Route path="/app" element={<MainApp />}>
          <Route index element={<MainApp />} />
          <Route path="chat" element={null} />
          <Route path="todo" element={null} />
          <Route path="timer" element={null} />
          <Route path="study-profile" element={<StudyProfilePage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;