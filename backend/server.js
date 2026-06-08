import express from 'express'
import connectDB from './src/database/db.js';
const app = express()
import userRoute from './src/routes/user.routes.js'
import todoRoute from './src/routes/todo.routes.js'
import 'dotenv/config';
import cors from 'cors';

app.use(express.json())
app.use(cors());

 const PORT = process.env.PORT

connectDB();

app.use('/api/auth', userRoute)
app.use('/api/todos', todoRoute)

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`)
})
