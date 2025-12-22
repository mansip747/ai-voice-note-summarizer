// src/App.jsx (temporary debug version)
import React from "react";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import pageRoutes from "./routes";
import "./App.scss";

const App = () => {

  
  return (
    <>

      <RouterProvider router={pageRoutes} />
      <ToastContainer style={{ zIndex: 99999 }} />
    </>
  );
};

export default App;