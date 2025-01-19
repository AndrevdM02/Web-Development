## Matthew Contributions/AI references
- Used [this site](https://logo.com/) to create a logo (note: AI was **NOT** used, I made use of their custom logo making tool. Although the slogan generating tool was used for the slogan).

- Used [this site](https://www.fotor.com/ai-image-generator/) to generate both background images for the site.

- Used:
  - [Tailwind Docs](https://v2.tailwindcss.com/docs) for documentation on Tailwind
  - [Typescript Docs](https://www.typescriptlang.org/docs/) and [Typescript Playground](https://www.typescriptlang.org/play/) for testing.

- Since TS/JS are notoriously confusing languages, I used [Claude](https://claude.ai/new)/[ChatGPT](https://chatgpt.com/) for bug fixing and generating boilerplate `handle` functions i.e.:
```{Typescript}

  const handleUsername = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };

  const handleUserEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserEmail(event.target.value);
  };

  const handlePassword = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

```

- When trying to export these chats, both sites struggled to do so when images were involved (mainly from other unrelated chats, but Claude cannot export individual chats). I have no problem disclosing these chats on request but I am unable to provide them in this report. 

- All other information and assistance came from my knowledgeable group members.

## Liam Contributions/AI references
- Used code snippets from the documentation for:
  - [Expressjs](https://expressjs.com/) (primarily boilerplate code from various sections of the website)
  - [Nodejs](https://nodejs.org/) (in particular the [learn](https://nodejs.org/en/learn) and [docs](https://nodejs.org/docs/latest-v20.x/api/index.html) sections)
  - [Authjs](https://authjs.dev/) (most of the back-end auth related code was originally copied from here, but has subsequently been very heavily modified)
- Got inspiration from various git repositories, however no code was directly copied to the best of my knowledge
- I did **NOT** use generative AI at any point.

## Ludwig Contributions/AI references
- AI use:
  - Helping to generate Swagger documentation: I provided a template of some examples of how I wanted the swagger documentation to look for API endpoints, then asked it to generate documentation for the rest of the endpoints based on the functions in `frontEndRequests.ts`. The documentation can be found in `swaggerConfig.ts`.
  - I tried to export the chat from ChatGPT, but got a warning saying that chats with user provided images can not yet be exported. I am happy to show the chat on request

  - Helping to generate request functions for querying the database. This was especially useful for similar endpoints, such as /api/users/ and /api/users/{id}, where the query was generally made up of the same boilerplate, but with minor changes that are easily verifiable.
  - These can be found in the `{tableName}Controller.ts` files in the backend.

  - During debugging it was helpful to throw in a problematic function (especially ones using the evil, terrible React syntax) and have the AI explain step-by-step what the syntax implied for functionality, and how it differed from what the function was intended to do.

- Other: 
 - [React](https://react.dev/) for fully understanding how to implements state variables, and passing values up and down the DOM tree
 - [Swagger Documentation](https://swagger.io/docs/) for correctly implementing documentation options in YAML

## Dieter Contributions/AI references
- AI use:
  - Helping to understand React and general websocket stuff: I used AI whenever I wasn't able to find information that would help me with the integration of the sockets into React as there were very few examples of it being used in the way I wanted to.
  - Generally used AI like Google after a few minutes of trying to solve a problem when other articles proved unhelpful, but didn't use the code which it gave, but rather tried to undestand the concept and write my own code to avoid plagiarising.
  - On occasion when a line of code was impossible to debug, I'd use AI to help break down what could be the cause.

- Other:
  - [Socket.IO](https://socket.io/) at start to build the foundation for all the socket stuff.
  - [React](https://react.dev/learn) to help understand how to integerate the client side sockets and to do other things in the front end.
- Used this tutorial to understand socket.IO in terms of express.js:
  - [YouTube](https://www.youtube.com/watch?v=UwS3wJoi7fY&list=PL4cUxeGkcC9i4V-_ZVwLmOusj8YAUhj_9&index=4)

## Andre Contributions/AI references
- AI use:
  - Helped me better understand how React, TypeScript, and Tailwind work by providing guidance on implementing specific features or tasks when I was unfamiliar with the problem.
  - Helped to sort the notes in alphabetical order when the page first loads and allowed for sorting in both ascending and descending order when specified.
  - Helped by applying regular expressions to each date returned by the database to transform it into a more readable format.
  - Helped with the understanding of createContext in React.
  - After a few hours of debugging without finding the issue, I asked AI for help with the problem to see if there was an easier way to implement the task.

- Other:
  - [Shadcn/UI](https://ui.shadcn.com/) was used to create the basic components that, when combined, built the notes page.
  - [React](https://react.dev/) to get a better understanding of what react is and components that could be used to implement a specific feature, such as the createContext used to implement dark and light mode.
  - [Tailwind Docs](https://v2.tailwindcss.com/docs) for documentation on Tailwind