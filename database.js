const mongoose = require('mongoose');

class Database {

    constructor () {
        this.connect();
    }
    connect () {
        mongoose.connect("mongodb+srv://shahriarahmed99bd:EMxgewEwMqllnVOl@devmemeschatcluster.gth2ysz.mongodb.net/?retryWrites=true&w=majority")
        .then(() => {
            console.log("Database connected successfully!");
        })
        .catch((err) => {
            console.log("Database connection failed" + err);
        })
    }
}

module.exports = new Database();