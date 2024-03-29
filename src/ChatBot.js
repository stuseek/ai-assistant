import React, {useEffect, useRef, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Container, TextField, Button, Box, List, ListItem, ListItemText, Paper,
  AppBar, Toolbar, IconButton, Drawer, Typography, Grid
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import {CircularProgress} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import FacebookLoginButton from "./FBLoginButton";


let conversationHistory = [];

function ChatBot() {
  const [apiKey, setApiKey] = useState('');
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(false);
  const [gptVersion, setGptVersion] = useState('gpt-4-turbo-preview');
  const [isFirstCall, setIsFirstCall] = useState(true);
  const [shouldRun, setShouldRun] = useState(false);
  const [loadingText, setLoadingText] = useState('Analyzing');


  const lastMessageRef = useRef(null);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [chat]);

  let systemConversationHistory = [];


  const exampleQuestions = [
    "How many impressions in the last month?",
    "How many campaigns are currently active?",
    "Which ad was clicked the most?", ,
    "What audience is driving the most purchases?"
  ];

  useEffect(() => {
    const executeRun = async () => {
      if (shouldRun && question) {
        await run(false, question); // Ensure `run` is adapted to use `question` directly
        setShouldRun(false); // Reset the trigger
      }
    };

    executeRun();
  }, [shouldRun, question]); // Depend on `shouldRun` and `question`

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

  const handleAuthChange = (isLoggedIn, token) => {
    setIsAuthenticated(isLoggedIn);
    setAuthToken(token);
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
      setLoadingText("Analyzing Customer Request");

      const openAIQuestion = `Based on the customer request: "${question}", and message history, what endpoint and fields should we fetch from the Facebook Ads API?`;

      let messagesPayload;
      // if (isFirstCall) {
      messagesPayload = [
        {
          "role": "system",
          "content": "" +
            "You are a helpful assistant. Analyze the customer request and suggest the endpoint and fields needed for a Facebook Ads API request. Always add name to the top-level fields. Respond in JSON with such fields, example: endpoint: endpoint, fields: field1,field2,field3.fields(field1,field2,field3{subfield1,subfield2}), modifiers: modifier1=value&modifier2=value. Try to select as much fields as possible to get better results. Do not add anything else, just return stringified json. Should be compatible with provided graphQL syntax. Do not add markdown. Only use allowed endpoints, modifiers, fields." +
            "Allowed endpoint values to return: 'campaigns', 'ads', 'adimages', 'adsets', 'customaudiences', 'advideos', 'insights'. " +
            "Allowed fields for 'campaigns' endpoint: account_id,adlabels,bid_strategy,boosted_object_id,brand_lift_studies,name,spend_cap,start_time,stop_time,status,id,ads{insights},adsets,insights{cost_per_conversion},budget_remaining,buying_type,lifetime_budget,objective,pacing_type,last_budget_toggling_time. " +
            "Allowed fields for 'insights' endpoint: account_currency,account_id,account_name,action_values,actions,ad_name,clicks,cpc,cpm,cpp,ctr,date_start,date_stop,dda_results,adset_name,ad_id,adset_id,campaign_name,frequency,impressions,inline_link_click_ctr,inline_link_clicks,inline_post_engagement,objective,video_30_sec_watched_actions,video_avg_time_watched_actions,video_p100_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_play_actions,full_view_reach,full_view_impressions,cost_per_action_type,cost_per_conversion,conversion_values,campaign_id,conversions. " +
            "Allowed fields for 'customaudiences' endpoint: lookalike_audience_ids,name,lookalike_spec,operation_status,ads,data_source,account_id,approximate_count_lower_bound,approximate_count_upper_bound,time_created,sharing_status,sessions,description,id,delivery_status,external_event_source,opt_out_link,adaccounts. " +
            "Allowed fields for 'adsets' endpoint: account_id,bid_strategy,adlabels,adset_schedule,asset_feed_id,attribution_spec,bid_adjustments,bid_amount,bid_constraints,bid_info,billing_event,budget_remaining,campaign,campaign_active_time,campaign_attribution,campaign_id,name,status,start_time,source_adset,targeting,targeting_optimization_types,ads{insights},insights{cpm},id,daily_budget,created_time,end_time,effective_status,lifetime_budget,lifetime_min_spend_target,lifetime_spend_cap,optimization_goal,pacing_type,adcreatives,copies,configured_status,is_dynamic_creative,recommendations,updated_time,budget_schedules. " +
            "Allowed fields for 'advideos' endpoint: id,status,video_insights,source,length,live_status,post_views,post_id,published,title,is_crosspost_video,custom_labels,content_category,views. " +
            "Allowed fields for 'adimages' endpoint: account_id,updated_time,status,id,creatives,created_time,is_associated_creatives_in_adgroups,name,url. " +
            "Allowed fields for 'ads' endpoint: adset,adset_id,adlabels,created_time,creative,name,campaign,campaign_id,account_id,bid_amount,configured_status,conversion_domain,effective_status,adcreatives{body,call_to_action_type,category_media_source,image_url,name,status,video_id,link_destination_display_url,adlabels,product_set_id,title,url_tags,id},updated_time,leads. " +
            "Allowed modifiers: level=ad,time_range={'since':'YYYY-MM-DD,'until':'YYYY-MM-DD'}. Remember, today is " + Date()
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
        systemConversationHistory.push(message);
      });

      const data = {
        model: gptVersion,
        messages: systemConversationHistory,
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
          const responseData = await response.json();
          if (responseData && responseData.error) {
            alert(responseData.error.message)
          }
          setIsLoading(false);
          return;
        }

        const responseData = await response.json();
        const botResponseContent = JSON.parse(responseData.choices[0].message.content);


        systemConversationHistory.push({role: "assistant", content: JSON.stringify(botResponseContent)});

        const suggestedFields = botResponseContent.fields; // Here you might need to parse the response if it's not in the desired format
        const endpoint = botResponseContent.endpoint; // Here you might need to parse the response if it's not in the desired format
        const modifiers = botResponseContent.modifiers; // Here you might need to parse the response if it's not in the desired format

        console.log("Suggested Fields:", suggestedFields);

        setIsLoading(false);
        return {suggestedFields, endpoint, modifiers};
      } catch (error) {
        setIsLoading(false);
        console.error('Error communicating with OpenAI:', error);
      }
    }
  ;

  const fetchCampaigns = async (suggestedFields, endpoint, modifiers) => {
    const accessToken = authToken;
    const adAccountId = '1785133881702528';
    const baseUrl = `https://graph.facebook.com/v19.0/act_${adAccountId}/${endpoint}`;
    const url = `${baseUrl}?fields=${suggestedFields}&${modifiers}&access_token=${accessToken}`;

    setIsLoading(true);
    setLoadingText("Getting Marketing Data");


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
    const {suggestedFields, endpoint, modifiers} = await sendMessageToOpenAI(isRetry);
    const campaignInfo = await fetchCampaigns(suggestedFields, endpoint, modifiers);
    await interpretateResults(campaignInfo);
    setQuestion('');
  };


  const addSystemMessageToConversation = (message) => {
    systemConversationHistory.push({
      role: "system",
      content: message
    });
  };

  const interpretateResults = async (campaignData = '') => {
    if (!campaignData.trim()) return;

    setIsLoading(true);
    setLoadingText("Analyzing Marketing Data");

    // Assuming `campaignData` is a string representation of the fetched campaigns
    // Adjust the question to fit your needs for analysis
    const analysisQuestion = `Based on the following campaign data: "${campaignData}", and considering the user's initial question: "${question}", how can we interpret this information? Don't answer long, but answer structured. Do not mention you have data provided, or lack of data, don't explain a lot. Pretend you know everything. If you asked about purchases, and you cannot find any field related to that, that means there was no purchases. Be very friendly. Try to limit output by 250 tokens, of possible. `;

    const messagesPayload = [
      {
        "role": "system",
        "content": "You are a helpful assistant. Analyze the provided campaign data in the context of the user's last question and provide insights. Be sure you use Campaign name, not ID. What the param should be shown in dollars other currency please add the symbol. Question could not be related to facebook, but to marketing in general. If there is a link, or image url present, format it as a link or image please."
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

      if (botResponseContent === "additional_call") {
        console.log('Additional call');
        addSystemMessageToConversation(`You requested additional call to facebook API.`);
        await run();
        return;
      }

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

  const handleSendClick = (event, questionText = question) => {
    if (questionText) {
      setQuestion(questionText); // Update question state
      setShouldRun(true); // Set the trigger for the effect
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{my: 4}}>
        {!isAuthenticated ? (
          <>
            <FacebookLoginButton configId='1121020542257714' onAuthChange={handleAuthChange}/>
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
                        <ListItem style={{flexDirection: "column"}}
                                  alignItems="flex-start" ref={index === chat.length - 1 ? lastMessageRef : null}>
                          <ListItemText
                            style={{flexDirection: "column"}}
                            primary={
                              <Typography
                                type="body2"
                                style={{
                                  color: chatMessage.type === 'sent' ? 'white' : 'black'
                                }}>
                              </Typography>}
                            secondary={
                              <Box style={{
                                color: chatMessage.type === 'sent' ? 'white' : 'black',
                                textAlign: chatMessage.type === 'sent' ? 'right' : 'left',
                                alignSelf: chatMessage.type === 'sent' ? 'flex-end' : 'flex-start'
                              }}>
                                <ReactMarkdown>{chatMessage.text}</ReactMarkdown>
                              </Box>
                            }
                            sx={{
                              border: 1,
                              borderColor: 'grey.300',
                              borderRadius: '10px',
                              bgcolor: chatMessage.type === 'sent' ? 'primary.light' : 'grey.100',
                              py: 1,
                              px: 2,
                              maxWidth: '75%',
                              alignSelf: chatMessage.type === 'sent' ? 'flex-end' : 'flex-start',
                            }}
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                    {isLoading && (
                      <ListItem>
                        <CircularProgress size={15}/>
                        &nbsp;&nbsp;
                        <ListItemText primary={loadingText}/>
                      </ListItem>
                    )}
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
                    <Typography variant="subtitle2" color="textSecondary">
                      You can ask me:
                    </Typography>
                    <br/><br/>
                    <Grid container spacing={2} sx={{marginBottom: 2}}>
                      {exampleQuestions.map((question, index) => (
                        <Grid item xs={6} key={index}>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              borderRadius: '10px',
                              textTransform: 'none',
                              width: '100%',
                              justifyContent: 'flex-start'
                            }}
                            onClick={(event) => handleSendClick(event, question)}
                          >
                            {question}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
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
                  disabled={isLoading}
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
                  {'Send'}
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
