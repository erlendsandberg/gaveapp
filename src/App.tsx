import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { SetupBirthday } from "./pages/SetupBirthday";
import { BirthdayCalendar } from "./pages/BirthdayCalendar";
import { Families } from "./pages/Families";
import { FamilyDetail } from "./pages/FamilyDetail";
import { MyWishes } from "./pages/MyWishes";
import { MemberWishes } from "./pages/MemberWishes";
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

          {/* Oppsett — krever innlogging men ikke bursdag */}
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
          <Route
            path="/familier"
            element={
              <ProtectedRoute>
                <Families />
              </ProtectedRoute>
            }
          />
          <Route
            path="/familie/:familyId"
            element={
              <ProtectedRoute>
                <FamilyDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/familie/:familyId/bruker/:uid"
            element={
              <ProtectedRoute>
                <MemberWishes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mine-ønsker"
            element={
              <ProtectedRoute>
                <MyWishes />
              </ProtectedRoute>
            }
          />
          {/* Direkte lenke til ønskeliste uten familiekontekst */}
          <Route
            path="/bruker/:uid"
            element={
              <ProtectedRoute>
                <MemberWishes />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
