import Sequelize from 'sequelize';
import mongoose from 'mongoose';
import databaseConfig from '../config/database';

import User from '../app/models/user';
import File from '../app/models/file';
import Appointments from '../app/models/appointments';

const models = [User, File, Appointments];

class Database {
  constructor(){
    this.init();
    this.mongo();
  }

  init(){
    this.connection = new Sequelize(databaseConfig);
    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models));
  }

  mongo() {
    this.mongoConnection = mongoose.set('useUnifiedTopology', true)
    this.mongoConnection = mongoose.connect(
      process.env.MONGO_URL,
      { useNewUrlParser: true, useFindAndModify: true }
    )
  }
}

export default new Database();
