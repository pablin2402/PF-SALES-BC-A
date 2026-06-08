  export const getInitials = (name, lastName) => {
    return ((name?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '?';
  };

  export const getColor = (name, lastName) => {
    const hash = ((name || '') + (lastName || '')).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COLOR_CLASSES[hash % COLOR_CLASSES.length];
  };

  export const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  export const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="text-gray-300" size={10} />;
    return sortOrder === "asc" ? <FaSortUp className="text-[#D3423E]" size={10} /> : <FaSortDown className="text-[#D3423E]" size={10} />;
  };