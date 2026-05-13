import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout.jsx";
import AuthLayout from "../components/layout/AuthLayout.jsx";
import ProtectedRoute from "../components/layout/ProtectedRoute.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";
import OnboardingPage from "../pages/auth/OnboardingPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";
import ProfilePage from "../pages/profile/ProfilePage.jsx";
import GenerateTourPage from "../pages/tours/GenerateTourPage.jsx";
import TourDetailPage from "../pages/tours/TourDetailPage.jsx";
import ToursPage from "../pages/tours/ToursPage.jsx";

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/onboarding", element: <OnboardingPage /> },
          { path: "/generate", element: <GenerateTourPage /> },
          { path: "/tours", element: <ToursPage /> },
          { path: "/tours/:id", element: <TourDetailPage /> },
          { path: "/profile", element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: "/", element: <Navigate to="/tours" replace /> },
  { path: "*", element: <Navigate to="/tours" replace /> },
]);
