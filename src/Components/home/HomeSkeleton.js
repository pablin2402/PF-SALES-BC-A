import React from "react";
import { SHIMMER } from "../../constants/homeConfigs";

const SBox = ({ className = "", style = {} }) => (
  <div className={`rounded-lg ${className}`} style={{ ...SHIMMER, ...style }} />
);

export const TrendChartSkeleton = () => (
  <div className="flex flex-col gap-3 h-80 justify-end px-2 pt-4">
    <div className="flex items-end gap-3 h-full">
      {[65, 85, 45, 90, 70].map((h, i) => <div key={i} className="flex-1 flex flex-col gap-2 items-center justify-end"><SBox className="w-full rounded-t-lg" style={{ height: `${h}%` }} /></div>)}
    </div>
    <div className="flex gap-3">{[...Array(5)].map((_, i) => <SBox key={i} className="flex-1 h-3" />)}</div>
  </div>
);

export const HomeSkeleton = () => (
  <div className="flex flex-col space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-3"><SBox className="w-12 h-12 rounded-xl" /><SBox className="w-16 h-5 rounded-full" /></div>
          <SBox className="h-3 w-28 mb-2" /><SBox className="h-8 w-36" />
        </div>
      ))}
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2"><SBox className="h-6 w-52" /><SBox className="h-3 w-36" /></div>
          <div className="flex gap-2"><SBox className="h-10 w-32 rounded-xl" /><SBox className="h-10 w-28 rounded-xl" /></div>
        </div>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm"><tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-b border-gray-100" style={{ opacity: 1 - i * 0.15 }}>
              <td className="px-6 py-4"><SBox className="h-5 w-6" /></td>
              <td className="px-4 py-4"><div className="flex items-center gap-3"><SBox className="w-10 h-10 rounded-full" /><SBox className="h-4 w-32" /></div></td>
              <td className="px-4 py-4 text-center"><SBox className="h-4 w-8 mx-auto" /></td>
              <td className="px-4 py-4"><SBox className="h-4 w-28 ml-auto" /></td>
              <td className="px-4 py-4"><SBox className="h-4 w-24 ml-auto" /></td>
              <td className="px-4 py-4"><div className="flex items-center gap-2"><SBox className="flex-1 h-2 rounded-full" /><SBox className="h-3 w-10" /></div></td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4"><div className="space-y-2"><SBox className="h-5 w-48" /><SBox className="h-3 w-28" /></div><SBox className="w-8 h-8 rounded-lg" /></div>
          <TrendChartSkeleton />
        </div>
      ))}
    </div>
  </div>
);