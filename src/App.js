import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import {Link} from 'react-router-dom';
import PrivacyPolicy from './PrivacyPolicy';
import ChatBot from './ChatBot';
import Home from './Home';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

function App() {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Button color="inherit" component={Link} to="/" sx={{marginRight: 2}}>
            Home
          </Button>
          <Button color="inherit" component={Link} to="/chatbot" sx={{marginRight: 2}}>
            ChatBot
          </Button>
          <Button color="inherit" component={Link} to="/privacy-policy" sx={{marginRight: 2}}>
            Privacy Policy
          </Button>
        </Toolbar>
      </AppBar>

      {/* Routes Configuration */}
      <Container>
        <Routes>
          <Route path="/privacy-policy" element={<PrivacyPolicy/>}/>
          <Route path="/chatbot" element={<ChatBot/>}/>
          <Route path="/" element={<Home/>}/>
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
