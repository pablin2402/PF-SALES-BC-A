import './App.css';
import Sidebars from './Sidebars';
import AppRoutes from './Routes';
import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  return (
    <Router>
      <main className="App flex">
      <div className="w-64 px-0 py-0">

      <Sidebars/>

        </div>
        <div className="flex-1">
          <AppRoutes />
        </div>
      </main>
    </Router>

  );
}

export default App;
