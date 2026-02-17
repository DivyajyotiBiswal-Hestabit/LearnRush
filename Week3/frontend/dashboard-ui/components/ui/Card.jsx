export default function Card({ children, title }) {
  return (
    <div className="bg-white/80 backdrop-blur border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl p-5">
      {title && (
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
      )}
      {children}
    </div>
  );
}



