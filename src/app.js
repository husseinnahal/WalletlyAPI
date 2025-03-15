import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import globalErrorHandler from './middlewares/globalErrorHandler.js'; 
import Auth from './routes/auth.routes.js';
import Categories from './routes/categories.routes.js';
import Transactions from './routes/transaction.routes.js';
import Goals from './routes/goal.routes.js';
import Debts from './routes/debt.routes.js';


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static("public"));

// Connect to MongoDB
mongoose.connect(process.env.Mongo_Url)
  .then(() => {
    console.log("MongoDB connection is working");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });


app.use('/api/auth', Auth);
app.use('/api/cat', Categories);
app.use('/api/transaction', Transactions);
app.use('/api/goals', Goals);
app.use('/api/debts', Debts);



app.all('*', (req, res) => {
  res.status(404).json({
    status: false,
    message: "The resource is not found",
  });
});

app.use(globalErrorHandler);

export default app;


