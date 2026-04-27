const mongoose = require('mongoose');

const subCatagorySchema = new mongoose.Schema({
name: {
    type: String,
default: null
  },
  image:{
    type: String,
    default: null   
  },
  catagory: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'catagory'
    }
  ]

}, {timestamps: true})

const subCatagoryModel = mongoose.model('subCatagory', subCatagorySchema)

module.exports = subCatagoryModel