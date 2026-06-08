import { HiOutlineDocumentAdd, HiOutlineCheckCircle } from "react-icons/hi";
import { MdLocalShipping, MdDoneAll, MdCancel } from "react-icons/md";
import { StatCard } from "../../utils/StatCard";
import { SkeletonStats } from "../../utils/SkeletonLoading";

export const OrdersStats = ({ counts, statsLoading, selectedStatus, onFilterByStatus }) => {
  if (statsLoading) return <SkeletonStats />;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      <StatCard icon={<HiOutlineDocumentAdd size={24} />} label="Sin asignar" value={counts?.created || 0} color="bg-blue-100" textColor="text-blue-600" onClick={() => onFilterByStatus("created")} active={selectedStatus === "created"} />
      <StatCard icon={<HiOutlineCheckCircle size={24} />} label="Aprobados" value={counts?.aproved || 0} color="bg-green-100" textColor="text-green-600" onClick={() => onFilterByStatus("aproved")} active={selectedStatus === "aproved"} />
      <StatCard icon={<MdLocalShipping size={24} />} label="En Ruta" value={counts?.["En Ruta"] || 0} color="bg-yellow-100" textColor="text-yellow-600" onClick={() => onFilterByStatus("En Ruta")} active={selectedStatus === "En Ruta"} />
      <StatCard icon={<MdDoneAll size={24} />} label="Entregados" value={counts?.deliver || 0} color="bg-purple-100" textColor="text-purple-600" onClick={() => onFilterByStatus("deliver")} active={selectedStatus === "deliver"} />
      <StatCard icon={<MdCancel size={24} />} label="Cancelados" value={counts?.cancelled || 0} color="bg-red-100" textColor="text-red-600" onClick={() => onFilterByStatus("cancelled")} active={selectedStatus === "cancelled"} />
    </div>
  );
};