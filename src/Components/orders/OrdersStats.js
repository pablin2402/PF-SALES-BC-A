import { HiOutlineDocumentAdd, HiOutlineCheckCircle } from "react-icons/hi";
import { MdLocalShipping, MdDoneAll, MdCancel } from "react-icons/md";
import { SkeletonStats } from "../../utils/SkeletonLoading";

const StatCard = ({
  icon,
  label,
  value,
  color,
  textColor,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`
      relative overflow-hidden
      bg-white rounded-2xl border
      p-5 text-left
      transition-all duration-300
      hover:-translate-y-1
      hover:shadow-xl
      cursor-pointer
      w-full
      ${
        active
          ? "border-[#D3423E] ring-2 ring-[#D3423E]/20 shadow-lg"
          : "border-gray-200"
      }
    `}
  >
    <div className={`absolute top-0 left-0 w-full h-1 ${color}`} />

    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>

        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
      </div>

      <div
        className={`
          w-14 h-14 rounded-2xl
          flex items-center justify-center
          ${color} ${textColor}
        `}
      >
        {icon}
      </div>
    </div>
  </button>
);

export const OrdersStats = ({
  counts,
  statsLoading,
  selectedStatus,
  onFilterByStatus,
}) => {
  if (statsLoading) return <SkeletonStats />;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
      <StatCard
        icon={<HiOutlineDocumentAdd size={26} />}
        label="Sin asignar"
        value={counts?.created || 0}
        color="bg-blue-500"
        textColor="text-white"
        onClick={() => onFilterByStatus("created")}
        active={selectedStatus === "created"}
      />

      <StatCard
        icon={<HiOutlineCheckCircle size={26} />}
        label="Aprobados"
        value={counts?.aproved || 0}
        color="bg-green-500"
        textColor="text-white"
        onClick={() => onFilterByStatus("aproved")}
        active={selectedStatus === "aproved"}
      />

      <StatCard
        icon={<MdLocalShipping size={26} />}
        label="En Ruta"
        value={counts?.["En Ruta"] || 0}
        color="bg-yellow-500"
        textColor="text-white"
        onClick={() => onFilterByStatus("En Ruta")}
        active={selectedStatus === "En Ruta"}
      />

      <StatCard
        icon={<MdDoneAll size={26} />}
        label="Entregados"
        value={counts?.deliver || 0}
        color="bg-purple-500"
        textColor="text-white"
        onClick={() => onFilterByStatus("deliver")}
        active={selectedStatus === "deliver"}
      />

      <StatCard
        icon={<MdCancel size={26} />}
        label="Cancelados"
        value={counts?.cancelled || 0}
        color="bg-red-500"
        textColor="text-white"
        onClick={() => onFilterByStatus("cancelled")}
        active={selectedStatus === "cancelled"}
      />
    </div>
  );
};