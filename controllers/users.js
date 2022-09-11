const User = require("../model/User");
const Message = require("../model/Message");
const Friends = require("../model/Friends");
const ImageModel = require("../model/imageModel");
const path = require("path");
const fs = require("fs");

const getAllUsers = async (req, res) => {
  const users = await User.find({}, { username: 1 });
  res.status(200).json(users);
};

const getFriends = async (req, res) => {
  try {
    const currentUser = req.user.username;
    const friends = await Friends.findOne({ username: currentUser });
    res.status(200).json(friends);
  } catch (error) {
    res.send(error);
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    if (req.body.friendToRequest == req.user.username) {
      throw new Error("Bad request");
    }
    const friendInfo = await User.findOne({
      username: req.user.username,
    });
    await Friends.updateOne(
      { username: req.body.friendToRequest },
      {
        $push: {
          friends: {
            username: req.user.username,
            isFriend: false,
            image: friendInfo.image,
          },
        },
      }
    );
  } catch (error) {
    res.send(error);
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    //accept request
    await Friends.updateOne(
      {
        username: req.user.username,
        "friends.username": req.body.userToAccept,
      },
      { $set: { "friends.$.isFriend": true } }
    );
    const friendInfo = await User.findOne({ username: req.user.username });
    await Friends.updateOne(
      { username: req.body.userToAccept },
      {
        $push: {
          friends: {
            username: req.user.username,
            isFriend: true,
            image: friendInfo.image,
          },
        },
      }
    );
    await Message.create({
      username1: req.user.username,
      username2: req.body.userToAccept,
      messages: [],
    });
    res.send("success");
  } catch (error) {
    res.send(error);
  }
};

const deleteFriendRequest = async (req, res) => {
  try {
    await Friends.updateOne(
      { username: req.user.username },
      { $pull: { friends: { username: req.body.userToDecline } } }
    );
    res.send("success");
  } catch (error) {
    res.send(error);
  }
};

const getCurrentUser = async (req, res) => {
  try {
    if (req.user != "error") {
      const currentUser = req.user.username;
      const userInfo = await User.findOne({ username: currentUser });
      res.json({ currentUser, image: userInfo.image });
    } else {
      res.send("error");
    }
  } catch (error) {
    res.send(error);
    console.log(error);
  }
};

const getUserImage = async (req, res) => {
  try {
    const username2 = req.body.username2;

    const userInfo = await User.findOne({ username: username2 });
    const image = userInfo.image;
    res.send(image);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
};

module.exports = {
  getAllUsers,
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  deleteFriendRequest,
  getUserImage,
  getCurrentUser,
};
