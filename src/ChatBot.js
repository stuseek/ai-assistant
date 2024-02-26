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
  const [authToken, setAuthToken] = useState(false);
  const [campaignFields, setCampaignFields] = useState('');

  const checkLoginStatus = () => {
    window.FB.getLoginStatus(function (response) {
      console.log(response)
    });
  }

  useEffect(() => {
    window.FB.getLoginStatus(function (response) {
      if (response.status === 'connected') {
        setIsAuthenticated(true);
        setAuthToken(response.authResponse.accessToken);
        console.log('User is authorized')
      } else if (response.status === 'not_authorized') {
        setIsAuthenticated(false);
        console.log('User is not authorized')
      } else {
        setIsAuthenticated(false);
        console.log('User auth status is unknown')

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

    const openAIQuestion = `Based on the customer request: "${question}", what fields should we fetch from the Facebook Ads API? Always add campaign_name to the response. Only use real fields from Meta Business API. Answer as field1,field2,field3,insights.fields(field1,field2,field3)`;

    const messagesPayload = [
      {
        "role": "system",
        "content": "You are a helpful assistant. Analyze the customer request and suggest the fields needed for a Facebook Ads API request."
      },
      {
        "role": "user",
        "content": openAIQuestion
      },
      {
        "role": "system",
        "content": "Allowed fields to fetch: id,name,status,objective,start_time,end_time,budget_remaining,daily_budget,lifetime_budget,spend,impressions,clicks,adsets{id,name,status,budget_remaining,daily_budget,lifetime_budget,start_time,end_time,ads{id,name,status,creative{title,message,image_hash},insights{impressions,clicks,spend,reach,cost_per_impression,cost_per_click,campaign_name,adset_name,ad_name}}},insights{click_through_rate,cost_per_click,conversions,conversion_value,impressions,reach},bid_strategy,targeting{geo_locations{countries},interests,behaviors},creative{image_url,name,body},placements,optimization_goal"
      }
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

      const suggestedFields = botResponseContent; // Here you might need to parse the response if it's not in the desired format

      console.log("Suggested Fields:", suggestedFields);

      setIsLoading(false);
      return suggestedFields;
    } catch (error) {
      setIsLoading(false);
      console.error('Error communicating with OpenAI:', error);
    }
  };

  const fetchCampaigns = async (suggestedFields) => {
    const accessToken = authToken;
    const adAccountId = '1785133881702528';
    const baseUrl = `https://graph.facebook.com/v19.0/act_${adAccountId}/campaigns`;
    const url = `${baseUrl}?fields=${suggestedFields}&access_token=${accessToken}`;

    setIsLoading(true); // Use the existing isLoading state to show loading indicator

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setIsLoading(false); // Hide loading indicator
      return JSON.stringify(data.data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setIsLoading(false); // Hide loading indicator
      setChat([...chat, {type: 'error', text: 'Error fetching campaign information'}]);
    }
  };

  const addMessageToHistory = (message, type = 'sent') => {
    const newMessage = { text: message, type };

    setConversationHistory(prevHistory => [...prevHistory, newMessage]);
  };

  const interpretateResults = async (campaignData = '') => {
    if (!campaignData.trim()) return;

    setIsLoading(true);

    // Assuming `campaignData` is a string representation of the fetched campaigns
    // Adjust the question to fit your needs for analysis
    const analysisQuestion = `Based on the following campaign data: "${campaignData}", and considering the user's initial question: "${question}", how can we interpret this information?`;

    const messagesPayload = [
      {
        "role": "system",
        "content": "You are a helpful assistant. Analyze the provided campaign data in the context of the user's initial question and provide insights.  Be sure you use Campaign name, not ID. What the param should be shown in dollars other currency please add the symbol."
      },
      {
        "role": "user",
        "content": analysisQuestion
      }
    ];

    const data = {
      model: "gpt-4-turbo-preview",
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

      // Process the response here, e.g., displaying it in the chat
      setChat([...chat, {type: 'received', text: `Insights: ${botResponseContent}`}]);

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error communicating with OpenAI for result interpretation:', error);
      setChat([...chat, {type: 'error', text: 'Error interpreting campaign information'}]);
    }
  };

  const handleSendClick = async () => {
    const suggestedFields = await sendMessageToOpenAI();
    // alert(suggestedFields);
    addMessageToHistory(question, 'sent'); // Add the user's question to history
    const campaignInfo = await fetchCampaigns(suggestedFields);
    await interpretateResults(campaignInfo);
    setQuestion('');
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{my: 4}}>
        {!isAuthenticated ? (
          <>
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
