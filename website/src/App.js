import './App.css';
import React from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import Home from './Pages/Home/Home';
import Files from './Pages/Files/Files';

function App() {

  let routes = (
    // UNPROTECTED ROUTES
    <Routes>
      <Route exact path='/' element={<Navigate to='/home' />}/>
      <Route exact path='/home' element={<Home/>}/>
      <Route exact path='/files' element={<Files/>}/>
    </Routes>
  );

  return <Router>{routes}</Router>;
}

export default App;