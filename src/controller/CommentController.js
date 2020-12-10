const { Topic } = require('../models/Topic');
const Comment = require('../models/Comment');
const TopicController = require('./TopicController');

class CommentController {
  static async createComment(req, res) {
    try {
      if (!req.body.text)
        return res.status(400).send({ error: 'Comment should not be empty' });

      const comment = await Comment.create({
        text: req.body.text,
        user: req.userId,
        topic: req.params.topicId,
      });
      const topic = await Topic.findById(req.params.topicId).populate([
        { path: 'comments', populate: { path: 'user' } },
        { path: 'user' },
        { path: 'plant' },
      ]);

      await comment.save();
      topic.comments.push(comment);
      await topic.save();
      return res.send(topic);
    } catch (err) {
      return res.status(400).send({ error: `Error while commenting.${err}` });
    }
  }

  static async updateComment(req, res) {
    try {
      const comment = await Comment.findById(req.params.commentId);
      const newData = req.body;

      if (!newData.text)
        return res.status(400).send({ error: 'Comment should not be empty' });

      await Comment.findOneAndUpdate({ _id: req.params.commentId }, req.body, {
        useFindAndModify: false,
      });
      return TopicController.refreshTopicContents(res, comment.topic);
    } catch (err) {
      return res
        .status(400)
        .send({ error: `Error while updating comment.${err}` });
    }
  }

  static async deleteComment(req, res) {
    try {
      const comment = await Comment.findById(req.params.commentId);
      const topic = await Topic.findById(comment.topic);
      const index = topic.comments.indexOf(req.params.commentId);

      if (index > -1) {
        topic.comments.splice(index, 1);
      }

      topic.save();

      await Comment.findByIdAndRemove(req.params.commentId);
      return TopicController.refreshTopicContents(res, comment.topic);
    } catch (err) {
      return res
        .status(400)
        .send({ error: `Error while deleting topic.${err}` });
    }
  }
}

module.exports = CommentController;