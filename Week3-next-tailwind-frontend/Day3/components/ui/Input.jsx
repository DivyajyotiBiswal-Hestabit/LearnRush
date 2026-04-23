export default function Input({
  label,
  placeholder,
  type = "text",
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-600">
          {label}
        </label>
      )}

      <input
        type={type}
        placeholder={placeholder}
        className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}
