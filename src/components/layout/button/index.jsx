import React from "react";
import { BeatLoader } from "react-spinners";
import { Link } from "react-router-dom";
import "./styles.scss";

const Button = ({
  type = "submit",
  children,
  onClick,
  disabled,
  isLoading,
  className = "",
  isLink = false,
  link = "",
  icon,
  loaderColor = "#fff",
  loaderSize = 8,
  invertedTheme = false,
  bordered = false,
  boldText = false,
  ...rest
}) => {
  const linkSec = () => (
    <>
      {isLink && !disabled ? (
        <Link
          to={link}
          className={`custom-btn ${invertedTheme ? "secondary" : ""} ${
            bordered ? "bordered" : ""
          } ${boldText ? "bold" : ""} ${className} ${
            type === "pill" ? "btn-pill" : ""
          }`}
          {...rest}
        >
          {innerSec()}
        </Link>
      ) : (
        <button
          type={type}
          disabled={disabled || isLoading}
          onClick={onClick}
          className={`custom-btn ${invertedTheme ? "secondary" : ""} ${
            bordered ? "bordered" : ""
          } ${boldText ? "bold" : ""} ${className} ${
            type === "pill" ? "btn-pill" : ""
          }`}
          {...rest}
        >
          {innerSec()}
        </button>
      )}
    </>
  );
  const innerSec = () => (
    <>
      {isLoading ? (
        <BeatLoader
          size={loaderSize}
          color={invertedTheme ? "#000" : loaderColor}
        />
      ) : (
        <>
          {!!icon && icon}
          {children}
        </>
      )}
    </>
  );
  return linkSec();
};

export default Button;
