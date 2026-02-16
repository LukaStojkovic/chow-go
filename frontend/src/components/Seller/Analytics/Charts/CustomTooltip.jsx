export const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl p-3 shadow-lg">
        <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
            {p.name === "revenue" ? `$${p.value.toFixed(2)}` : p.value} {p.name}
          </p>
        ))}
      </div>
    );
  }
  return null;
};
