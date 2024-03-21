import React, {useEffect, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Container, TextField, Button, Box, List, ListItem, ListItemText, Paper,
  AppBar, Toolbar, IconButton, Drawer, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(false);
  const [gptVersion, setGptVersion] = useState('gpt-4-turbo-preview');
  const [isFirstCall, setIsFirstCall] = useState(true);


  let conversationHistory = [];
  const exampleQuestions = [
    "How many impressions in the last month?",
    "How many campaigns are currently active?",
    "What is the total spend so far this week?",
    "What audience is driving the most purchases?"
  ];

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

  const handleGptVersionChange = (event) => {
    setGptVersion(event.target.value);
  };

  const handleQuestionChange = (event) => {
    setQuestion(event.target.value);
  };

  const handleAdditionalInfoChange = (event) => {
    setAdditionalInfo(event.target.value);
  };

  const addMessageToChat = (message) => {
    setChat((prevChat) => [
      ...prevChat,
      {
        ...message,
        // Ensure the message text is a string
        text: typeof message.text === 'string' ? message.text : JSON.stringify(message.text)
      }
    ]);
  };

  const sendMessageToOpenAI = async (isRetry = false, errorMessage = '') => {
    // if (!question.trim()) return;

    setIsLoading(true);

    const openAIQuestion = `Based on the customer request: "${question}", and message history, what endpoint and fields should we fetch from the Facebook Ads API? Always add name to the top-level fields. Only use real fields from Meta Business API. Respond in JSON with such fields, example: endpoint: endpoint, fields: field1,field2,field3.fields(field1,field2,field3{subfield1,subfield2}). Do not add anything else, just return stringified json. Should be compatible with provided graphQL syntax. Do not add markdown.`;

    let messagesPayload;
    // if (isFirstCall) {
      messagesPayload = [
        {
          "role": "system",
          "content": "You are a helpful assistant. Analyze the customer request and suggest the endpoint and fields needed for a Facebook Ads API request. Use API Be sure to select fields allowed for endpoint you selected. Be friendly, but not expose a lot of data and explanations."
        },
        {
          "role": "system",
          "content": "Allowed endpoint values to return: 'campaigns', 'ads', 'adimages', 'adsets', 'customaudiences', 'advideos', 'insights'. Just one word, nothing else."
        },
        {
          "role": "system",
          "content": "Allowed fields for 'campaigns' endpoint: account_id,adlabels,bid_strategy,boosted_object_id,brand_lift_studies,name,spend_cap,start_time,stop_time,status,id,ads{insights},adsets,insights{cost_per_conversion},budget_remaining,buying_type,lifetime_budget,objective,pacing_type,last_budget_toggling_time"
        },
        {
          "role": "system",
          "content": "Allowed fields for 'insights' endpoint: account_currency,account_id,account_name,action_values,actions,ad_name,clicks,cpc,cpm,cpp,ctr,date_start,date_stop,dda_results,adset_name,ad_id,adset_id,campaign_name,frequency,impressions,inline_link_click_ctr,inline_link_clicks,inline_post_engagement,objective,video_30_sec_watched_actions,video_avg_time_watched_actions,video_p100_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_play_actions,website_purchase_roas,full_view_reach,full_view_impressions,cost_per_action_type,cost_per_conversion,conversion_values,campaign_id,conversions"
        },
        {
          "role": "system",
          "content": "Allowed fields for 'customaudiences' endpoint: lookalike_audience_ids,name,lookalike_spec,operation_status,ads,data_source,account_id,approximate_count_lower_bound,approximate_count_upper_bound,time_created,sharing_status,sessions,description,id,delivery_status,external_event_source,opt_out_link,adaccounts"
        },
        {
          "role": "system",
          "content": "Allowed fields for 'adsets' endpoint: account_id,bid_strategy,adlabels,adset_schedule,asset_feed_id,attribution_spec,bid_adjustments,bid_amount,bid_constraints,bid_info,billing_event,budget_remaining,campaign,campaign_active_time,campaign_attribution,campaign_id,name,status,start_time,source_adset,targeting,targeting_optimization_types,ads{insights},insights{cpm},id,daily_budget,created_time,end_time,effective_status,lifetime_budget,lifetime_min_spend_target,lifetime_spend_cap,optimization_goal,pacing_type,adcreatives,copies,configured_status,is_dynamic_creative,recommendations,updated_time,budget_schedules"
        },
        {
          "role": "system",
          "content": "Allowed fields for 'advideos' endpoint: id,status,video_insights,source,length,live_status,post_views,post_id,published,title,is_crosspost_video,custom_labels,content_category,views"
        },
        {
          "role": "system",
          "content": "Allowed fields for 'adimages' endpoint: account_id,updated_time,status,id,creatives,created_time,is_associated_creatives_in_adgroups,name,url"
        },
        {
          "role": "user",
          "content": openAIQuestion
        }
      ];
      setIsFirstCall(false);
    // } else {
    //   messagesPayload = [
    //     {
    //       "role": "user",
    //       "content": openAIQuestion
    //     }
    //   ];
    // }

    if (!isRetry) {
      addMessageToChat({type: 'sent', text: question});
    }

    messagesPayload.forEach((message) => {
      conversationHistory.push(message);
    });

    const data = {
      model: gptVersion,
      messages: conversationHistory,
      response_format: {"type": "json_object"}
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
      const botResponseContent = JSON.parse(responseData.choices[0].message.content);


      conversationHistory.push({role: "assistant", content: JSON.stringify(botResponseContent)});

      const suggestedFields = botResponseContent.fields; // Here you might need to parse the response if it's not in the desired format
      const endpoint = botResponseContent.endpoint; // Here you might need to parse the response if it's not in the desired format

      console.log("Suggested Fields:", suggestedFields);

      setIsLoading(false);
      return {suggestedFields, endpoint};
    } catch (error) {
      setIsLoading(false);
      console.error('Error communicating with OpenAI:', error);
    }
  };

  const fetchCampaigns = async (suggestedFields, endpoint) => {
    const accessToken = authToken;
    const adAccountId = '1785133881702528';
    const baseUrl = `https://graph.facebook.com/v19.0/act_${adAccountId}/${endpoint}`;
    const url = `${baseUrl}?fields=${suggestedFields}&access_token=${accessToken}`;

    setIsLoading(true);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.json(); // Attempt to read the error body
        let errorMessage = "Error fetching data from Facebook API.";
        if (errorBody && errorBody.error && errorBody.error.message) {
          errorMessage = errorBody.error.message; // Extract a more specific error message if available
        }
        if (response.status === 400) {
          // Include the specific error message in the system message
          addSystemMessageToConversation(`You were wrong, try again. Use the same format. Error: ${errorMessage}`);
          // Retry the request by making a recursive call to the original chat function
          await run(true, errorMessage);
          setIsLoading(false);
        } else {
          // Handle other types of errors
          throw new Error(errorMessage);
        }
      }
      const data = await response.json();
      return JSON.stringify(data.data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setIsLoading(false);
      // addMessageToChat({type: 'error', text: 'Error fetching campaign information'});
    }
  };

  const run = async (isRetry = false, errorMessage = '') => {
    if (!question.trim()) return;
    const {suggestedFields, endpoint} = await sendMessageToOpenAI(isRetry);
    const campaignInfo = await fetchCampaigns(suggestedFields, endpoint);
    await interpretateResults(campaignInfo);
    setQuestion('');
  };


  const addSystemMessageToConversation = (message) => {
    conversationHistory.push({
      role: "system",
      content: message
    });
  };
  const interpretateResults = async (campaignData = '') => {
    if (!campaignData.trim()) return;

    setIsLoading(true);

    // Assuming `campaignData` is a string representation of the fetched campaigns
    // Adjust the question to fit your needs for analysis
    const analysisQuestion = `Based on the following campaign data: "${campaignData}", and considering the user's initial question: "${question}", how can we interpret this information? Don't answer long, but answer structured. Do not mention you have data provided, or lack of data, don't explain a lot. Pretend you know everything. Be very friendly.`;

    const messagesPayload = [
      {
        "role": "system",
        "content": "You are a helpful assistant. Analyze the provided campaign data in the context of the user's initial question and provide insights. Be sure you use Campaign name, not ID. What the param should be shown in dollars other currency please add the symbol. Question could not be related to facebook, but to marketing in general. If there is a link, or url present, format it as a link"
      },
      {
        "role": "user",
        "content": analysisQuestion
      }
    ];

    messagesPayload.forEach((message) => {
      conversationHistory.push(message);
    });

    const data = {
      model: gptVersion,
      messages: conversationHistory,
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

      conversationHistory.push({role: "assistant", content: botResponseContent});

      // Process the response here, e.g., displaying it in the chat
      addMessageToChat({type: 'assistant', text: botResponseContent});

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error communicating with OpenAI for result interpretation:', error);
      addMessageToChat({type: 'error', text: 'Error interpreting campaign information'});
    }
  };

  const handleSendClick = async (event, questionText = question) => {
    if (questionText) {
      setQuestion(questionText);
      await run(false);
    }
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
                  <ListItem>
                    <TextField
                      label="GPT Version"
                      variant="outlined"
                      fullWidth
                      margin="dense"
                      value={gptVersion}
                      onChange={handleGptVersionChange}
                    />
                  </ListItem>
                </List>
              </Box>
            </Drawer>

            <Box sx={{my: 4}}>
              <Paper sx={{mt: 5, maxHeight: 550, overflow: 'auto'}}>
                {chat.length > 0 ? (
                  <List>
                    {chat.map((chatMessage, index) => (
                      <React.Fragment key={index}>
                        <ListItem alignItems="flex-start">
                          <ListItemText
                            primary={chatMessage.type === 'sent' ? 'You' : chatMessage.role === 'Assistant'}
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
                    {/*<Typography variant="subtitle2" color="textSecondary">*/}
                    {/*  You can ask me:*/}
                    {/*</Typography>*/}
                    <br/><br/>
                    {/*<Grid container spacing={2} sx={{ marginBottom: 2 }}>*/}
                    {/*  {exampleQuestions.map((question, index) => (*/}
                    {/*    <Grid item xs={6} key={index}>*/}
                    {/*      <Button*/}
                    {/*        variant="outlined"*/}
                    {/*        size="small"*/}
                    {/*        sx={{*/}
                    {/*          fontSize: '0.75rem',*/}
                    {/*          borderRadius: '10px',*/}
                    {/*          textTransform: 'none',*/}
                    {/*          width: '100%',*/}
                    {/*          justifyContent: 'flex-start'*/}
                    {/*        }}*/}
                    {/*        onClick={(event) => handleSendClick(event, question)}*/}
                    {/*      >*/}
                    {/*        {question}*/}
                    {/*      </Button>*/}
                    {/*    </Grid>*/}
                    {/*  ))}*/}
                    {/*</Grid>*/}
                    <br/><br/>
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
                      handleSendClick();
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
