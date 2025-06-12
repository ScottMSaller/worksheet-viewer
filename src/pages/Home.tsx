import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  const [worksheetText, setWorksheetText] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (worksheetText.trim()) {
      navigate('/results', { state: { worksheetText } });
    }
  };

  return (
    <div className="home-container">
      <div className="content">
        <h1>Store Order Worksheet Viewer</h1>
        <p>Paste your worksheet data below to view it in a structured format</p>
        
        <form onSubmit={handleSubmit}>
          <textarea
            value={worksheetText}
            onChange={(e) => setWorksheetText(e.target.value)}
            placeholder="Paste your worksheet data here..."
            rows={15}
          />
          <button type="submit" disabled={!worksheetText.trim()}>
            View Worksheet
          </button>
        </form>
      </div>
    </div>
  );
}

export default Home;