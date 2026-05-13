import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App.jsx";
import { AuthLayout } from "../components/layout/AuthLayout.jsx";
import { ProtectedRoute } from "../components/layout/ProtectedRoute.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";
import ExplorePage from "../pages/social/ExplorePage.jsx";
import ExploreDetailPage from "../pages/social/ExploreDetailPage.jsx";
import PersonalizeTourPage from "../pages/social/PersonalizeTourPage.jsx";
import FriendsPage from "../pages/social/FriendsPage.jsx";
import InvitationsPage from "../pages/social/InvitationsPage.jsx";
import GroupsPage from "../pages/groups/GroupsPage.jsx";
import GroupSessionPage from "../pages/groups/GroupSessionPage.jsx";
import NotificationsPage from "../pages/social/NotificationsPage.jsx";

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
        path: "/",
        element: <App />,
        children: [
          { index: true, element: <Navigate to="/explore" replace /> },
          { path: "explore", element: <ExplorePage /> },
          { path: "explore/:shareId", element: <ExploreDetailPage /> },
          { path: "tours/personalize/:shareId", element: <PersonalizeTourPage /> },
          { path: "friends", element: <FriendsPage /> },
          { path: "invitations", element: <InvitationsPage /> },
          { path: "groups", element: <GroupsPage /> },
          { path: "group/:id", element: <GroupSessionPage /> },
          { path: "notifications", element: <NotificationsPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);
