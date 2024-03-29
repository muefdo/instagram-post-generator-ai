require("dotenv").config();
const { IgApiClient } = require("instagram-private-api");
const { get, post } = require("request-promise");
const CronJob = require("cron").CronJob;
const express = require("express");
const OpenAI = require("openai");

const app = express();
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

const generateImage = async (imagePrompt) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    // const prompt = await generatePostIdea();

    // const image = await openai.images.generate({
    //   model: 'dall-e-2',
    //   prompt: prompt,
    // });
    // // console.log(image.data[0].url);

    // return image.data[0].url;

    // console.log('Prompt:', prompt);

    const resp = await fetch("https://api.deepai.org/api/text2img", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.DEEP_AI_API_KEY,
      },
      body: JSON.stringify({
        text: imagePrompt,
        grid_size: "1", // Specify the grid size here as a string value
        image_generator_version: "hd",
        negative_prompts:
          "bad anatomy,bad proportions, blurry, cloned face, cropped, deformed, dehydrated, disfigured, duplicate, error, extra arms, extra fingers, extra legs, extra limbs, fused fingers, gross proportions, jpeg artifacts, long neck, low quality, lowres, malformed limbs, missing arms, missing legs, morbid, mutated hands, mutation, mutilated, out of frame, poorly drawn face, poorly drawn hands, signature, text, too many fingers, ugly, username, watermark, worst quality.",
      }),
    });

    const data = await resp.json();
    // console.log('Data:', data.output_url);
    return data.output_url;
  } catch (error) {
    console.error("Error generating image:", error);
  }
};

const getPostConcept = async () => {
  const concepts = [
    {
      1: "Life",
      2: "Animals",
      3: "Nature",
      4: "Technology",
      5: "Art",
      6: "Science",
      7: "Education",
      8: "World",
      9: "Culture",
      10: "Food",
      11: "Sports",
      12: "Entertainment",
      13: "Animals",
      14: "Culture",
      15: "Health",
      16: "Music",
      17: "History",
      18: "Animals",
      19: "Entertainment",
      20: "Social Media",
      21: "Movies",
      22: "Books",
      23: "Photography",
      24: "Design",
      25: "Architecture",
      26: "Gaming",
      27: "Animals",
      28: "Technology",
      29: "Environment",
      30: "Space",
      31: "Random",
    },
  ];

  const date = new Date();
  const day = date.getDate();
  return concepts[0][day];
};

const generatePostIdea = async () => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const concept = await getPostConcept();

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a dall-e prompt generator. Only write the prompt.",
        },
        {
          role: "user",
          content: `Generate a prompt for a spesific visuals about ${concept} and describe it to the dall-e. Keep it simple and short.`,
        },
      ],
      model: "gpt-3.5-turbo",
    });
    // console.log(completion.choices[0].message.content);
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error generating text response:", error);
    return "Sorry, something went wrong.";
  }
};

const genereatePostDescription = async (imagePrompt) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a Social Media Manager." },
        {
          role: "user",
          content: `Generate an Instagram Post description for this image ${imagePrompt}. Keep it short. Add inovative hashtags. At the last of all texts add this text: Powered by @bradi.tech `,
        },
      ],
      model: "gpt-3.5-turbo",
    });

    // console.log(completion.choices[0].message.content);
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error generating text response:", error);
    return "Sorry, something went wrong.";
  }
};

const postToInsta = async () => {
  try {
    const ig = new IgApiClient();
    ig.state.generateDevice(process.env.IG_USERNAME);
    await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);

    const imagePrompt = await generatePostIdea();
    // console.log("Image Prompt Generated");
    const imageUrl = await generateImage(imagePrompt);
    // console.log("Image Created");
    const postDesc = await genereatePostDescription(imagePrompt);
    // console.log("Post Description Generated");

    const imageBuffer = await get({
      url: imageUrl,
      encoding: null,
    });

    await ig.publish.photo({
      file: imageBuffer,
      caption: postDesc,
    });

    await ig.publish.story({
      file: imageBuffer,
    });
    console.log("Posted to Instagram");
  } catch (error) {
    console.error("Error posting to Instagram:", error);
  }
};

const postStoryToInsta = async () => {
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

    console.log("Posted to Instagram");
  } catch (error) {
    console.error("Error posting to Instagram:", error);
  }
};

// postToInsta();

const cronInsta1 = new CronJob("30 19 * * *", async () => {
  console.log("Posting for 22 30");
  postToInsta();
});

const cronInsta2 = new CronJob("30 9 */2 * *", async () => {
  console.log("Posting for 12 30");
  postToInsta();
});

cronInsta1.start();

cronInsta2.start();
