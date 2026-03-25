async function getMessage() {
  try {
    const res = await fetch("http://backend:5000/api/message", {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Failed to fetch backend message");
    }

    return await res.json();
  } catch (error) {
    return {
      success: false,
      message: "Could not connect to backend"
    };
  }
}

export default async function HomePage() {
  const data = await getMessage();

  return (
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "40px",
        maxWidth: "800px",
        margin: "0 auto"
      }}
    >
      <h1>Day 5 — Production-Style Deployment with Next.js</h1>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px"
        }}
      >
        <p>
          <strong>Backend Response:</strong> {data.message}
        </p>
      </div>
    </main>
  );
}