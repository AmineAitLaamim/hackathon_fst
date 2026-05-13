import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App.jsx";
import AuthLayout from "../components/layout/AuthLayout.jsx";
import ProtectedRoute from "../components/layout/ProtectedRoute.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";
import OnboardingPage from "../pages/auth/OnboardingPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";
import ProfilePage from "../pages/profile/ProfilePage.jsx";
import ExplorePage from "../pages/social/ExplorePage.jsx";
import ExploreDetailPage from "../pages/social/ExploreDetailPage.jsx";
import PersonalizeTourPage from "../pages/social/PersonalizeTourPage.jsx";
import FriendsPage from "../pages/social/FriendsPage.jsx";
import InvitationsPage from "../pages/social/InvitationsPage.jsx";
import GroupsPage from "../pages/groups/GroupsPage.jsx";
import GroupSessionPage from "../pages/groups/GroupSessionPage.jsx";
import NotificationsPage from "../pages/social/NotificationsPage.jsx";
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
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <App />,
        children: [
          { index: true, element: <Navigate to="/tours" replace /> },
          { path: "onboarding", element: <OnboardingPage /> },
          { path: "generate", element: <GenerateTourPage /> },
          { path: "tours", element: <ToursPage /> },
          { path: "tours/:id", element: <TourDetailPage /> },
          { path: "tours/personalize/:shareId", element: <PersonalizeTourPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "explore", element: <ExplorePage /> },
          { path: "explore/:shareId", element: <ExploreDetailPage /> },
          { path: "friends", element: <FriendsPage /> },
          { path: "invitations", element: <InvitationsPage /> },
          { path: "groups", element: <GroupsPage /> },
          { path: "group/:id", element: <GroupSessionPage /> },
          { path: "notifications", element: <NotificationsPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/tours" replace /> },
]);
