import React from "react";
import { getInitials, getAvatarColor } from "../../utils/avatarHelpers";

const SIZES = { md: "w-11 h-11", lg: "w-12 h-12" };

const Avatar = ({ fullName, lastName, size = "md" }) => (
  <div className={`${SIZES[size]} rounded-full flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0 ${getAvatarColor(fullName, lastName)}`}>
    {getInitials(fullName, lastName)}
  </div>
);

export default Avatar;