require('dotenv').config();
const { IgApiClient } = require('instagram-private-api');
const { get, post } = require('request-promise');
const CronJob = require('cron').CronJob;
const express = require('express');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

const generateImage = async () => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const prompt = await generatePostIdea();

    // const image = await openai.images.generate({
    //   model: 'dall-e-2',
    //   prompt: prompt,
    // });
    // // console.log(image.data[0].url);

    // return image.data[0].url;

    // console.log('Prompt:', prompt);

    const resp = await fetch('https://api.deepai.org/api/text2img', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.DEEP_AI_API_KEY,
      },
      body: JSON.stringify({
        text: prompt,
      }),
    });

    const data = await resp.json();
    // console.log('Data:', data.output_url);
    return data.output_url;
  } catch (error) {
    console.error('Error generating image:', error);
  }
};

const generatePostIdea = async () => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a dall-e prompt generator.' },
        {
          role: 'user',
          content:
            'Generate a prompt for dall-e. Write prompt for a spesific visual and describe it to the dall-e. Find topics about Life, Motivation, World. Be unique and reflect your own style.',
        },
      ],
      model: 'gpt-3.5-turbo',
    });
    // console.log(completion.choices[0].message.content);
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating text response:', error);
    return 'Sorry, something went wrong.';
  }
};

const genereatePostDescription = async () => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a Social Media Manager.' },
        {
          role: 'user',
          content:
            'Generate an Instagram Post description with popular motivation quotes. Keep it short. Add inovative hashtags. At the last of all texts add this text: Powered by @bradi.tech ',
        },
      ],
      model: 'gpt-3.5-turbo',
    });

    // console.log(completion.choices[0].message.content);
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating text response:', error);
    return 'Sorry, something went wrong.';
  }
};

const postToInsta = async () => {
  try {
    const ig = new IgApiClient();
    ig.state.generateDevice(process.env.IG_USERNAME);
    await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);

    // const imageUrl =
    //   'https://api.deepai.org/job-view-file/3e011dd1-3155-4295-938e-42c0ed74b2fe/outputs/output.jpg';

    const imageUrl = await generateImage();

    const imageBuffer = await get({
      url: imageUrl,
      encoding: null,
    });

    const postDesc = await genereatePostDescription();

    await ig.publish.photo({
      file: imageBuffer,
      caption: postDesc,
    });
    console.log('Posted to Instagram');
  } catch (error) {
    console.error('Error posting to Instagram:', error);
  }
};

// postToInsta();

const cronInsta1 = new CronJob('46 0 * * *', async () => {
  console.log('Running cron job for 00 40');
  postToInsta();
});

const cronInsta2 = new CronJob('30 12 */2 * *', async () => {
  console.log('Running cron job for 12 30');

  postToInsta();
});

cronInsta1.start();

cronInsta2.start();