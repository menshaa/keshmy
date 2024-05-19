import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import http from "http";
import next from "next";
import compression from "compression";
import Debug from "debug";
import fileupload from "express-fileupload";
const debug = Debug("itec404");

import usersRouter from "./routes/users";
import settingsRouter from "./routes/settings";
import adminRouter from "./routes/admin";
import articlesRouter from "./routes/articles";
import postsRouter from "./routes/posts";
import cafeteriaRouter from "./routes/cafeteria";
import cdnRouter from "./routes/cdn";
import messageRouter from "./routes/message";
import searchRouter from "./routes/search";
import eventsRouter from "./routes/events";
import announcementsRouter from "./routes/announcements";
import jobsRouter from "./routes/jobs";
import clubRouter from "./routes/club";
import groupRouter from "./routes/groups";
import { initWebsocketServer } from "./sockets/init";

const port = parseInt(process.env.NEXT_PUBLIC_PORT ?? "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname: process.env.NEXT_PUBLIC_DOMAIN ?? "localhost", port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const expressApp = express();
    const server = http.createServer(expressApp);
    initWebsocketServer(server);
    
    expressApp.use(compression());
    expressApp.use(fileupload({
        abortOnLimit: true,
        safeFileNames: true,
        limits: { files: 4, fileSize: 1024 * 1024 * 8 }
    }));
    expressApp.use(logger("dev"));
    expressApp.use(express.json());
    expressApp.use(express.urlencoded({ extended: false }));
    expressApp.use(cookieParser());

    expressApp.use("*", (_, res, next) => {
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, Content-Type, Accept",
        );
        res.header("Access-Control-Allow-Credentials");
        next();
    });

    expressApp.use("/api/users", usersRouter);
    expressApp.use("/api/settings", settingsRouter);
    expressApp.use("/api/admin", adminRouter);
    expressApp.use("/api/articles", articlesRouter);
    expressApp.use("/api/posts", postsRouter);
    expressApp.use("/api/cafeteria", cafeteriaRouter);
    expressApp.use("/api/message", messageRouter);
    expressApp.use("/api/search", searchRouter);
    expressApp.use("/api/events", eventsRouter);
    expressApp.use("/api/announcements", announcementsRouter);
    expressApp.use("/api/jobs", jobsRouter);
    expressApp.use("/api/club", clubRouter);
    expressApp.use("/api/groups", groupRouter);
    

    expressApp.use("/cdn", cdnRouter);

    expressApp.all("*", (req, res) => {
        return handle(req, res);
    });

    expressApp.set("port", port);
    server
        .listen(port)
        .on("listening", () => {
            const addr = server.address();
            const bind = typeof addr === "string"
                ? "pipe " + addr
                : "port " + addr?.port;
            debug("Listening on " + bind);
        })
        .on("error", (error: any) => {
            if (error.syscall !== "listen") {
                throw error;
            }

            const bind = typeof port === "string"
                ? "Pipe " + port
                : "Port " + port;

            // handle specific listen errors with friendly messages
            switch (error.code) {
            case "EACCES":
                console.error(bind + " requires elevated privileges");
                process.exit(1);
                break;
            case "EADDRINUSE":
                console.error(bind + " is already in use");
                process.exit(1);
                break;
            default:
                throw error;
            }
        });
});
