import React from "react";

const SidePanelIcon = (props = {}) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="3.25" stroke="#000000" strokeWidth="1.5" />
    <path d="M4 0.75H5.25V15.25H4C2.20507 15.25 0.75 13.7949 0.75 12V4C0.75 2.20507 2.20507 0.75 4 0.75Z" stroke="#000000" strokeWidth="1.5" />
  </svg>
);

export default React.memo(SidePanelIcon);
