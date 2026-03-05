
import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000")
      .then(res => res.text())
      .then(data => setData(data));
  }, []);

  return (
    <div>
      <h1>{data}</h1>
    </div>
  );
}

export default App;
