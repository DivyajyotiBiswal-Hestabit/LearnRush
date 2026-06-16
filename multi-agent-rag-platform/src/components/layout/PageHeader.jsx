export function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-gray-500 text-sm mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}