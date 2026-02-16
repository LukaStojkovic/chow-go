import { PIE_COLORS } from "@/constants/colorConstants";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export const PaymentMethodChart = ({ data }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800">
      <h3 className="text-lg font-bold mb-6 dark:text-white">
        Payment Methods
      </h3>

      <div className="flex items-center gap-6">
        <ResponsiveContainer width="50%" height={180}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="_id"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <div className="space-y-3 flex-1">
          {data.map((p, i) => (
            <div key={i} className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: PIE_COLORS[i % PIE_COLORS.length],
                  }}
                />
                <span className="capitalize dark:text-white">{p._id}</span>
              </div>
              <span className="font-bold dark:text-white">{p.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
