export default function Badge({ children }) {
  return (
    <span className="inline-block text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md mt-2">
      {children}
    </span>
  );
}

