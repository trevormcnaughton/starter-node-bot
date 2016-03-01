var Botkit = require('botkit')
var config = require('./config.json');
var clearbitToken = config.tokens.clearbit;
var slackToken = config.tokens.slack;// || process.env.SLACK_TOKEN
//var clearbit = require('clearbit')(clearbitToken);

// Expect a SLACK_TOKEN environment variable
if (!slackToken) {
  console.error('SLACK_TOKEN is required!')
  process.exit(1)
}

var controller = Botkit.slackbot()
var bot = controller.spawn({
  token: slackToken
})

bot.startRTM(function (err, bot, payload) {
  if (err) {
    console.log(err);
    throw new Error('Could not connect to Slack');
  }
})

controller.on('bot_channel_join', function (bot, message) {
  bot.reply(message, "I'm here!")
})

controller.hears(['hello', 'hi'], ['direct_mention'], function (bot, message) {
  bot.reply(message, 'Hello.')
})

controller.hears(['hello', 'hi'], ['direct_message'], function (bot, message) {
  bot.reply(message, 'Hello.')
  bot.reply(message, 'It\'s nice to talk to you directly.')
})

controller.hears('.*', ['mention'], function (bot, message) {
  bot.reply(message, 'You really do care about me. :heart:')
})

controller.hears('help', ['direct_message', 'direct_mention'], function (bot, message) {
  var help = 'I will respond to the following messages: \n' +
      '`bot hi` for a simple message.\n' +
      '`bot attachment` to see a Slack attachment message.\n' +
      '`@<your bot\'s name>` to demonstrate detecting a mention.\n' +
      '`bot help` to see this again.'
  bot.reply(message, help)
})

controller.hears(['attachment'], ['direct_message', 'direct_mention'], function (bot, message) {
  var text = 'Beep Beep Boop is a ridiculously simple hosting platform for your Slackbots.'
  var attachments = [{
    fallback: text,
    pretext: 'We bring bots to life. :sunglasses: :thumbsup:',
    title: 'Host, deploy and share your bot in seconds.',
    image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
    title_link: 'https://beepboophq.com/',
    text: text,
    color: '#7CD197'
  }]

  bot.reply(message, {
    attachments: attachments
  }, function (err, resp) {
    console.log(err, resp)
  })
})

controller.hears('.*', ['direct_message', 'direct_mention'], function (bot, message) {
  bot.reply(message, 'Sorry <@' + message.user + '>, I don\'t understand. \n')
})


// Clearbit lookup

controller.hears('lookup (.*)', 'direct_message,direct_mention', function(bot, message){
  var matches = message.text.match(/lookup (.*)/i);
  var email = matches[1].split('|')[1].slice(0, -1);

  clearbit.Enrichment.find({email: email})
    .then(function(response) {
      bot.reply(message, handlePersonProfileFormatting(response));
    })
    .catch(clearbit.Enrichment.QueuedError, function (err) {
      console.log(err);
    })
    .catch(function (err) {
      console.error(err);
    });
});

function handlePersonProfileFormatting(response) {
  const person = response.person;
  const company = response.company;
  const details = {
    github: function() { return person.github && person.github.handle ? 'Github: https://github.com/' + person.github.handle : '' },
    twitter: function() { return person.twitter && person.twitter.handle? 'Twitter: https://twitter.com/' + person.twitter.handle : '' },
    linkedin: function() { return person.linkedin && person.linkedin.handle? 'LinkedIn: https://linkedin.com/' + person.linkedin.handle : '' },
    angellist: function() { return person.angellist && person.angellist.handle? 'AngelList: https://angel.co/' + person.angellist.handle : '' }
  }

  var message = person.name.fullName + '\n' + details.github() + '\n' + details.twitter() + '\n' + details.linkedin() + '\n' + details.angellist();

  return message;
}
