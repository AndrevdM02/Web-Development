/**
 * Entry point to the DB launch
 */

import { CredentialsSignin, ExpressAuth, ExpressAuthConfig, User, getSession } from "@auth/express";
import Credentials  from "@auth/express/providers/credentials";
import { JWT } from "@auth/core/jwt";
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';
import path from 'node:path';
import pool from './db/connection';

import userRoutes from './routes/userRoutes';
import notesRoutes from './routes/notesRoutes';
import categoryRoutes from './routes/categoryRoutes';
import sharedNotesRouters from './routes/sharedNotesRoutes';
import { saltAndHashPassword } from "./utils/saltAndHashPassword";

import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerOptions from './swaggerConfig';

import { Server, Socket} from 'socket.io';
import { setupSocket } from "./websocket/serverSocket";
import { skipCSRFCheck } from "@auth/core";




const app = express(); //create an express application

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
  }
}

const authConfig: ExpressAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        user_name: {},
        password: {type: "password"},
      },
      authorize: async (credentials) => {
        let user = null;

        const salt = await pool.query("SELECT salt_password FROM Users WHERE user_name = $1", [credentials.user_name]);
        if (salt.rowCount !== 1) {
          throw new CredentialsSignin("Invalid Credentials!");
        }
        const pwHash = saltAndHashPassword(credentials.password, salt.rows[0].salt_password);

        user = await getUserFromDB(credentials.user_name, pwHash);

        if (!user) {
          return null;
        }
        return user;
      },
    }),
  ],
  //  By default, the `id` property does not exist on `token` or `session`. See the [TypeScript](https://authjs.dev/getting-started/typescript) on how to add it.
  callbacks: {
    jwt({ token, user }) {
      if (user) { // User is available during sign-in
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: 'http://192.145.146.90:18226/',
  },
  session: {maxAge: 3600, updateAge: 0},
  debug: true,
  trustHost: true,
  skipCSRFCheck: skipCSRFCheck,

};

const logDirectory = path.resolve('logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });

app.use(cors()); //enable CORS
app.use(morgan('combined', { stream: accessLogStream })); //enable logging using Morgan

app.use("*",
  (req, res, next) => {
    if (res.getHeader("Access-Control-Allow-Origin") !== undefined){
      res.removeHeader("Access-Control-Allow-Origin")
    }
    if (req.get("Origin") !== undefined){
      res.appendHeader("Access-Control-Allow-Origin", req.header("Origin") as string);
    }
    res.appendHeader("Access-Control-Allow-Credentials", "true");
    next();
  });

app.use(
  "/auth/*",
  // (req, res, next) => {
  //   next();
  // },
  ExpressAuth(authConfig),
  (req, res, next) => {
    console.log(req);
    console.log(res);
    next();
  }
);
app.use(express.json({type: "*/*"})); //enable JSON parsing
// Registering routes exposed by the API
export async function authSession(req: Request, res: Response, next: NextFunction) {
  res.locals.session = await getSession(req, authConfig)
  next()
}

app.use(authSession)

export async function authenticatedUser(req: Request, res: Response, next: NextFunction) {
  const session = res.locals.session ?? (await getSession(req, authConfig))
  if (!session?.user) {
    res.redirect("/auth/signin"); // TODO: change to actual login page
  } else {
    next();
  }
}

console.log("Registering User routing");
app.use("/api/users", userRoutes);

console.log("Registering Note routing");
app.use("/api/notes", notesRoutes);

console.log("Registering Category routing");
app.use("/api/categories", categoryRoutes);

console.log("Registering shared_notes routing");
app.use("/api/shared_notes", sharedNotesRouters);

console.log("Registering test route. GET /api/test to test the backend");
app.get('/api/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Backend is working!' });
});

console.log("Registering Swagger UI. API documentation available at /api/docs");
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


const PORT = process.env.SERVER_PORT;
var server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//Websocket setup
const server_socket = new Server(server, {});

setupSocket(server_socket);


process.on('SIGTERM', () => {
  safeShutdown('SIGTERM');
});

process.on('SIGINT', () => {
  safeShutdown('SIGINT');
});

process.on('SIGABRT', () => {
  safeShutdown('SIGABRT');
});

process.on('SIGALRM', () => {
  safeShutdown('SIGALRM');
});

process.on('SIGHUP', () => {
  safeShutdown('SIGHUP');
});

async function safeShutdown(sig : string) {
  console.debug(`${sig} signal received: closing HTTP server`);
  server.close(() => {
    console.debug('HTTP server closed');
  });
  server.closeAllConnections();
  server_socket.close();
  console.debug(`${sig} signal received: closing PostgreSQL connection`);
  if (!pool.ended && !pool.ending) {
    await pool.end();
  }
  console.debug('PostgreSQL connection closed');
}





export default app;

async function getUserFromDB(user_name: unknown, pwHash: string): Promise<any> {
  let user : User;
  const user_details = await pool.query("SELECT * FROM Users WHERE user_name = $1 AND password = $2", [user_name, pwHash]);
  if (user_details.rows.length == 1) {
    user = {
      email: user_details.rows[0].email,
      id: user_details.rows[0].user_id,
      image: user_details.rows[0].image_url,
      name: user_details.rows[0].user_name,
    }
  } else {
    return null;
  }
  return user;
}
