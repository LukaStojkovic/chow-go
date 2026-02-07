export function DeliveryInstructions({ notes }) {
  if (!notes) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
      <h3 className="font-bold mb-2">Delivery Instructions</h3>
      <p className="text-sm text-gray-700 dark:text-gray-300">{notes}</p>
    </div>
  );
}
