// src/components/layout/Sidebar/Sidebar.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.scss";
import Logo from "../../../assets/images/logo.png";
import {
  FaHome,
  FaCheckCircle,
  FaMicrophone,
  FaCog,
  FaCommentDots,
  FaExclamationTriangle,
} from "react-icons/fa";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      id: "home",
      label: "Home",
      icon: <FaHome />,
      path: "/dashboard",
    },
    {
      id: "recordings",
      label: "Recordings",
      icon: <FaMicrophone />,
      path: "/recordings",
    },
    {
      id: "action-items",
      label: "Action Items",
      icon: <FaCheckCircle />,
      path: "/action-items",
    },

    {
      id: "settings",
      label: "Settings",
      icon: <FaCog />,
      path: "/settings",
    },
    {
      id: "feedback",
      label: "Feedback",
      icon: <FaCommentDots />,
      path: "/feedback",
    },
    {
      id: "report",
      label: "Report a Problem",
      icon: <FaExclamationTriangle />,
      path: "/report-problem",
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo Section */}
      <div className="sidebar-header">
        <img src={Logo} alt="Logo" className="sidebar-logo" />
        {!collapsed && <h2 className="sidebar-title">Quint</h2>}
      </div>

      {/* Menu Items */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`sidebar-item ${
              location.pathname === item.path ? "active" : ""
            }`}
            onClick={() => handleNavigation(item.path)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-label">{item.label}</span>}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="sidebar-footer">
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
