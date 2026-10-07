import './App.css';
import Admin from './Admin';
import Display from './Display';

const App = () => {
  return window.location.pathname.startsWith('/admin') ? (
    <Admin />
  ) : (
    <Display />
  );
};

export default App;
