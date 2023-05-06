require("dotenv").config({ path: "../.env" });
require("custom-env").env(true);

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

module.exports = {
  connect: async () => {
    try {
      const conn = await mongoose.connect(
        `mongodb+srv://ramdevnemathillam:${process.env.MONGO_PASSWORD}@leone.2cqsqko.mongodb.net/shopping`
      );
      console.log(`Database connected : ${conn.connection.host}`);
    } catch (error) {
      console.log(error);
    }
  },
};