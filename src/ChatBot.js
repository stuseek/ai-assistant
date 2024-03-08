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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(false);
  const [campaignFields, setCampaignFields] = useState('');

  let conversationHistory = [];

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

    const openAIQuestion = `Based on the customer request: "${question}", and message history, what endpoint and fields should we fetch from the Facebook Ads API? Always add name to the top-level fields. Only use real fields from Meta Business API. Answer nothing else but JSON: endpoint: "endpoint", fields: "field1,field2,field3.fields(field1,field2,field3)"`;

    const messagesPayload = [
      {
        "role": "system",
        "content": "You are a helpful assistant. Analyze the customer request and suggest the endpoint and fields needed for a Facebook Ads API request. Be sure to select fields allowed for endpoint you selected. Allowed endpoints: campaigns, ads, adimages, adsets, customaudience. Allowed fields to fetch (graphql-based): account_id,adlabels,bid_strategy,boosted_object_id,brand_lift_studies,budget_rebalance_flag,budget_remaining,buying_type,campaign_group_active_time,can_create_brand_lift_study,can_use_spend_cap,configured_status,created_time,daily_budget,effective_status,has_secondary_skadnetwork_reporting,id,is_budget_schedule_enabled,is_skadnetwork_attribution,issues_info,last_budget_toggling_time,lifetime_budget,name,objective,pacing_type,primary_attribution,smart_promotion_type,source_campaign,promoted_object,source_campaign_id,special_ad_categories,special_ad_category,special_ad_category_country,spend_cap,start_time,status,stop_time,topline_id,updated_time,ad_studies,adrules_governed,ads,adsets,budget_schedules,copies,insights{account_currency,account_id,action_values,account_name,ad_id,ad_name,adset_id,adset_name,app_id,attribution_setting,buying_type,campaign_id,campaign_name,canvas_avg_view_percent,canvas_avg_view_time,catalog_segment_value,clicks,coarse_conversion_value,conversion_rate_ranking,conversion_values,conversions,converted_product_quantity,converted_product_value,cost_per_action_type,cost_per_conversion,actions,cost_per_estimated_ad_recallers,cost_per_inline_link_click,cost_per_inline_post_engagement,cost_per_outbound_click,cost_per_thruplay,cost_per_unique_action_type,cost_per_unique_click,cost_per_unique_inline_link_click,cost_per_unique_outbound_click,cpc,cpm,cpp,ctr,date_start,date_stop,dda_results,engagement_rate_ranking,estimated_ad_recall_rate,estimated_ad_recallers,fidelity_type,frequency,full_view_impressions,full_view_reach,hsid,impressions,inline_link_click_ctr,inline_link_clicks,inline_post_engagement,instagram_upcoming_event_reminders_set,instant_experience_clicks_to_open,instant_experience_clicks_to_start,instant_experience_outbound_clicks,is_conversion_id_modeled,landing_destination,mobile_app_purchase_roas,objective,optimization_goal,outbound_clicks,outbound_clicks_ctr,place_page_name,postback_sequence_index,purchase_roas,qualifying_question_qualify_answer_rate,quality_ranking,reach,redownload,skan_campaign_id,skan_conversion_id,social_spend,spend,total_postbacks,total_postbacks_detailed,total_postbacks_detailed_v4,user_segment_key,video_30_sec_watched_actions,video_avg_time_watched_actions,video_p100_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_play_actions,video_play_curve_actions,website_ctr,website_purchase_roas}"
      },
      {
        "role": "user",
        "content": openAIQuestion
      }
    ];

    conversationHistory.push(messagesPayload);

    const data = {
      model: "gpt-4-turbo-preview",
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
      const botResponseContent = JSON.parse(responseData.choices[0].message.content);


      conversationHistory.push({role: "assistant", content: botResponseContent});

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

  const interpretateResults = async (campaignData = '') => {
    if (!campaignData.trim()) return;

    setIsLoading(true);

    // Assuming `campaignData` is a string representation of the fetched campaigns
    // Adjust the question to fit your needs for analysis
    const analysisQuestion = `Based on the following campaign data: "${campaignData}", and considering the user's initial question: "${question}", how can we interpret this information? Don't answer long. If there is lack of data to answer the question, respond "nodata"`;

    const messagesPayload = [
      {
        "role": "system",
        "content": "You are a helpful assistant. Analyze the provided campaign data in the context of the user's initial question and provide insights. Be sure you use Campaign name, not ID. What the param should be shown in dollars other currency please add the symbol."
      },
      {
        "role": "user",
        "content": analysisQuestion
      }
    ];

    conversationHistory.push(messagesPayload);

    const data = {
      model: "gpt-4-turbo-preview",
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
      setChat([...chat, {type: 'assistant', text: botResponseContent}]);

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error communicating with OpenAI for result interpretation:', error);
      setChat([...chat, {type: 'error', text: 'Error interpreting campaign information'}]);
    }
  };

  const handleSendClick = async () => {
    const {suggestedFields, endpoint} = await sendMessageToOpenAI();
    const campaignInfo = await fetchCampaigns(suggestedFields, endpoint);
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
                            primary={chatMessage.type === 'sent' ? 'You' : chatMessage.role === 'assistant' ? 'Assistant' : 'Error'}
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
