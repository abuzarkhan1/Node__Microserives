require('dotenv').config();
const express = require('express');
const connectDB = require('./config/DB');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./utils/logger');
const {RateLimiterRedis} = require("rate-limiter-flexible") 
const Redis = require('ioredis');
const {rateLimit} = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');
const routes = require('./routes/identity-service');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

connectDB();

const redisCLient = new Redis(process.env.REDIS_URL);


app.use(helmet());
app.use(cors())
app.use(express.json());

app.use((req,res, next) => {
    logger.info(`Received ${req.method} request to  ${req.url}`);
    logger.info(`Request body ${req.body}`);
    next();
});

// DDos Protection
const rateLimiter = new RateLimiterRedis({
    storeClient: redisCLient,
    keyPrefix: 'middleware',
    points: 10, 
    duration: 1,  
});


app.use((req, res, next) => {
    rateLimiter.consume(req.ip)
        .then(() => {
            next();
        })
        .catch(() => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
            res.status(429).send('Too Many Requests');
        });
});

const sensitiveEndPointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    standardHeaders: true,
    legacyHeaders: false,
    handler : (req, res) => {
        logger.warn(`Rate limit exceeded for sensitive endpoint: ${req.originalUrl} from IP: ${req.ip}`);
        res.status(429).send('Too Many Requests');
    },
    store: new RedisStore({
        sendCommand: (...args) => redisCLient.call(...args),
    })
});

app.use("/api/auth/register", sensitiveEndPointsLimiter);

app.use("/api/auth", routes);

// Error handling middleware
app.use(errorHandler);


app.listen(process.env.PORT, () => {
    logger.info(`Server is running on port ${process.env.PORT || 3001}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
});