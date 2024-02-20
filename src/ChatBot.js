import React, {useEffect, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Container, TextField, Button, Box, List, ListItem, ListItemText, Paper,
  AppBar, Toolbar, IconButton, Drawer, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import {CircularProgress} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';

function ChatBot() {
  const [apiKey, setApiKey] = useState('');
  const [question, setQuestion] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [chat, setChat] = useState([]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  const handleFacebookLogin = () => {
    window.FB.login((response) => {
      console.log('Response:', response);
      if (response.authResponse) {
        console.log('Welcome! Fetching your information.... ');
        window.FB.api('/me', function(response) {
          console.log('Good to see you, ' + response.name + '.');
        });
        setIsAuthenticated(true);
      } else {
        console.log('User cancelled login or did not fully authorize.');
        setIsAuthenticated(false);
      }
    }, {scope: 'email,public_profile', ignoreSdkError: true});
  };

  const checkLoginStatus = () => {
    window.FB.getLoginStatus(function(response) {
      console.log(response)
    });
  }

  useEffect(() => {
    window.FB.getLoginStatus(function(response) {
      if (response.status === 'connected') {
        setIsAuthenticated(true);
        console.log(1)
      } else if (response.status === 'not_authorized') {
        setIsAuthenticated(false);
        console.log(2)
      } else {
        setIsAuthenticated(false);
        console.log(3)

      }
    });
  }, []);


  const toggleDrawer = () => {
    setDrawerOpen(!isDrawerOpen);
  };

  const toggleSettings = () => {
    setSettingsOpen(!isSettingsOpen);
  };

  const handleApiKeyChange = (event) => {
    setApiKey(event.target.value);
  };

  const handleQuestionChange = (event) => {
    setQuestion(event.target.value);
  };

  const handleAdditionalInfoChange = (event) => {
    setAdditionalInfo(event.target.value);
  };

  const sendMessageToOpenAI = async () => {
    if (!question.trim()) return;

    setIsLoading(true);

    const newMessage = {role: "user", content: question};
    const updatedConversationHistory = [...conversationHistory, newMessage];

    const messagesPayload = [
      {
        "role": "system",
        "content": "You are a helpful assistant. Please act as mate. Answer about marketing data provided. Ignore non-related questions."
      },
      {
        "role": "system",
        "content": additionalInfo || "There should have been data there, but data provided. Please say it to user. "
      },
      ...updatedConversationHistory
    ];

    const data = {
      model: "gpt-4",
      messages: messagesPayload,
    };

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const responseData = await response.json();
      const botResponseContent = responseData.choices[0].message.content;

      // Add the bot's response to the conversation history
      const botResponse = {role: "assistant", content: botResponseContent};
      updatedConversationHistory.push(botResponse);

      // Update the conversation history state
      setConversationHistory(updatedConversationHistory);

      // Update the chat for rendering
      const newChatEntry = {type: 'sent', text: question};
      const botChatResponse = {type: 'received', text: botResponseContent};
      setChat([...chat, newChatEntry, botChatResponse]);
      setQuestion('');

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setChat([...chat, {type: 'error', text: 'Error communicating with OpenAI. Please try again later'}]);
    }
  };

  const handleSendClick = () => {
    sendMessageToOpenAI();
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{my: 4}}>
        {!isAuthenticated ? (
          <>
            <button onClick={handleFacebookLogin}>Login with Facebook</button>
            <button onClick={checkLoginStatus}>Check Login Status</button>
          </>
        ) : (
          <>
            <AppBar position="static">
              <Toolbar>
                <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer}>
                  <MenuIcon/>
                </IconButton>
                <Typography variant="h6" style={{flexGrow: 1}}>
                  Marketing Assistant
                </Typography>
                <IconButton color="inherit" onClick={toggleSettings}>
                  <SettingsIcon/>
                </IconButton>
              </Toolbar>
            </AppBar>

            <Drawer anchor="left" open={isDrawerOpen} onClose={toggleDrawer}>
              <Box sx={{width: 250}} role="presentation">
                <List>
                  <ListItem>
                    <TextField
                      label="API Key"
                      variant="outlined"
                      fullWidth
                      margin="dense"
                      value={apiKey}
                      onChange={handleApiKeyChange}
                    />
                  </ListItem>
                </List>
              </Box>
            </Drawer>

            <Dialog open={isSettingsOpen} onClose={toggleSettings}>
              <DialogTitle>Campaign Data</DialogTitle>
              <DialogContent>
                <TextField sx={{width: 800}}
                           label="CSV with campaign data"
                           variant="outlined"
                           fullWidth
                           multiline
                           rows={20}
                           value={additionalInfo}
                           onChange={handleAdditionalInfoChange}
                           margin="dense"
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={toggleSettings} color="primary">
                  Close
                </Button>
              </DialogActions>
            </Dialog>

            <Box sx={{my: 4}}>
              <Paper sx={{mt: 5, maxHeight: 550, overflow: 'auto'}}>
                {chat.length > 0 ? (
                  <List>
                    {chat.map((chatMessage, index) => (
                      <React.Fragment key={index}>
                        <ListItem alignItems="flex-start">
                          <ListItemText
                            primary={chatMessage.type === 'sent' ? 'You' : chatMessage.type === 'received' ? 'Assistant' : 'Error'}
                            secondary={<ReactMarkdown>{chatMessage.text}</ReactMarkdown>}
                            primaryTypographyProps={{
                              color: chatMessage.type === 'sent' ? 'primary' : 'textSecondary',
                              fontWeight: 'fontWeightBold',
                            }}
                          />
                        </ListItem>
                        {index < chat.length - 1 && <ListItem divider/>}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    p: 3
                  }}>
                    <ChatIcon color="disabled" sx={{fontSize: 60}}/>
                    <Typography variant="subtitle1" color="textSecondary">
                      No messages yet. Start the conversation!
                    </Typography>
                  </Box>
                )}
              </Paper>
              <Box sx={{display: 'flex', alignItems: 'flex-start', my: 2}}>
                <TextField
                  label="Ask a question"
                  variant="outlined"
                  fullWidth
                  value={question}
                  onChange={handleQuestionChange}
                  margin="normal"
                  onKeyPress={(ev) => {
                    if (ev.key === 'Enter') {
                      sendMessageToOpenAI();
                    }
                  }}
                  sx={{mr: 1, height: '40px', my: 0}}
                />
                <Button variant="contained" color="primary" onClick={handleSendClick}
                        disabled={isLoading}
                        sx={{py: '15px', minWidth: '100px'}}>
                  {isLoading ? <CircularProgress size={24}/> : 'Send'}
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
}

export default ChatBot;
