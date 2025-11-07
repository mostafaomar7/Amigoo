const mongoose = require('mongoose');

const dbConnection =()=>{mongoose.connect(process.env.DB_URL)
.then(() => {});}


module.exports = dbConnection;
