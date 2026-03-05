import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState("");

  useEffect(() => {
    fetch("/api/health") 
      .then(res => res.json())
      .then(data => setData(JSON.stringify(data)));
  }, []);

  return (
    <div>
      <h1>{data}</h1>
    </div>
  );
}

export default App;