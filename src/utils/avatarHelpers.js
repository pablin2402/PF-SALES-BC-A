export const COLOR_CLASSES = [
  "bg-gradient-to-br from-orange-500 to-orange-700",
  "bg-gradient-to-br from-blue-500 to-blue-700",
  "bg-gradient-to-br from-green-500 to-green-700",
  "bg-gradient-to-br from-purple-500 to-purple-700",
  "bg-gradient-to-br from-yellow-500 to-orange-600",
  "bg-gradient-to-br from-pink-500 to-pink-700",
  "bg-gradient-to-br from-indigo-500 to-indigo-700",
  "bg-gradient-to-br from-teal-500 to-teal-700",
];

export const getInitials = (fullName, lastName) =>
  ((fullName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "?";

export const getAvatarColor = (fullName, lastName) => {
  const hash = ((fullName || "") + (lastName || ""))
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLOR_CLASSES[hash % COLOR_CLASSES.length];
};