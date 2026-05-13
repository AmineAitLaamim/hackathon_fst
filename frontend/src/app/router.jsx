import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App.jsx";
import ExplorePage from "../pages/social/ExplorePage.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/explore" replace /> },
      { path: "explore", element: <ExplorePage /> },
    ],
  },
]);
