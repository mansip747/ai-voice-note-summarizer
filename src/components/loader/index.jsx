import React from "react";
import { PulseLoader } from "react-spinners";
import clsx from 'clsx';
import "./styles.scss";

const Loader = ({
  color = "#760033",
  height = "100vh",
  background = "transparent",
  className,
  style = {},
  size = 16,
}) => {
  return (
    <div
      className={clsx('loader-wrapper', className)}
      style={{
        height,
        background,
        ...style
      }}
    >
      <PulseLoader size={size} color={color} />
    </div>
  );
};

export default Loader;
