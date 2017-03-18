# Uber Coffee Hipchat Bot

## Prereqs

* [nodejs](https://nodejs.org/en/)

## Get started

1. Clone this repo
1. Get dependencies: `npm install`
1. Create a new user for the bot, by going to `https://yourroom.slack.com/services/new/bot` (take note of the API Token)
1. Run with the API token as an environmental variable: `SLACK_TOKEN=xxx-xxx-xxx npm start` (this is Windows specific)
1. Add the bot to your room `/invite @bot`

## References

* [SlackJS](https://www.npmjs.com/package/slack)
* [Slack Real Time Messaging API](https://api.slack.com/rtm)