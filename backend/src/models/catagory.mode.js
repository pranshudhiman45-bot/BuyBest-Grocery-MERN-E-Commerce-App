const mongoose = require('mongoose');


const catagorySchema = new mongoose.Schema({
name: {
    type: String,
default: null
  },
  image:{
    type: String,
    default: null   
  }


}, {timestamps: true})

const catagoryModel = mongoose.model('catagory', catagorySchema)

module.exports = catagoryModel