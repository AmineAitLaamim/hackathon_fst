import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App.jsx";
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
]);
