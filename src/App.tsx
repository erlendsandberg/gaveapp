import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { SetupBirthday } from "./pages/SetupBirthday";
import { BirthdayCalendar } from "./pages/BirthdayCalendar";
import { SetupNotice } from "./pages/SetupNotice";
import { isFirebaseConfigured } from "./lib/firebase";

export default function App() {
  if (!isFirebaseConfigured) {
    return <SetupNotice />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/logg-inn" element={<Login />} />

          {/* Oppsett-ruter krever innlogging men ikke bursdag */}
          <Route
            path="/oppsett"
            element={
              <ProtectedRoute>
                <SetupBirthday />
              </ProtectedRoute>
            }
          />

          {/* Beskyttede ruter — krever innlogging + bursdag */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kalender"
            element={
              <ProtectedRoute>
                <BirthdayCalendar />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
