import "./App.css";
import { useState, useEffect } from "react";

function App() {
  const [initialAmount, setInitialAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [calData, setCalData] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const initialAmountValue = form.elements[0].value;
    const totalAmountValue = form.elements[1].value;
    setInitialAmount(initialAmountValue);
    setTotalAmount(totalAmountValue);
  };

  const calculateRows = () => {
    let x = totalAmount;
    let total = x;
    let ini = initialAmount;
    let rows = [];
    for (let i = 0; i < 100000; i++) {
      const xIni = x - ini;
      const remainingValue = totalAmount - xIni;
      rows.push({ total, ini, xIni, remainingValue });
      if (xIni <= 0) break;
      total = x - ini;
      ini *= 2;
      x -= ini;
    }
    setCalData(rows);
  };

  useEffect(() => {
    calculateRows();
  }, [initialAmount, totalAmount]);

  return (
    <div className="App">
      <div className="head">Martingale Strategy:</div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Initial Amount:</label>
          <input type="number" placeholder="Enter initial amount" />
        </div>
        <div>
          <label>Total Amount:</label>
          <input type="number" placeholder="Enter total amount" />
        </div>
        <button type="submit">Calculate</button>
      </form>
      <div>
        <h2>Calculated Data:</h2>
        <table>
          <thead>
            <tr>
              <th>No. of loss</th>
              <th>Total</th>
              <th>Bet</th>
              <th>Value</th>
              <th>Total Minus</th>
            </tr>
          </thead>
          <tbody>
            {calData.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{row.total}</td>
                <td>{row.ini}</td>
                <td>{row.xIni}</td>
                <td>{row.remainingValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
