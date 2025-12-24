// src/routes/index.jsx
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { Button } from "../components/layout";
import Dashboard from "../modules/Dashboard";
import Recordings from "../modules/Recordings";
import Settings from "../modules/Settings";
import Feedback from "../modules/Feedback";
import ReportProblem from "../modules/ReportProblem";
import ActionItems from "../modules/ActionItems";

const NotFound = () => (
  <div style={{ padding: "30px" }}>
    <h1>404 - Page Not Found</h1>

    <Button isLink link={"/"} style={{ top: "40px" }}>
      Back to home
    </Button>
  </div>
);

const pageRoutes = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "recordings",
        element: <Recordings />,
      },
      {
        path: "action-items",
        element: <ActionItems />,
      },
      {
        path: "action-items/:id",
        element: <ActionItems />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "feedback",
        element: <Feedback />,
      },
      {
        path: "report-problem",
        element: <ReportProblem />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

export default pageRoutes;
