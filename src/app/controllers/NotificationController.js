import Notification from '../schemas/notification';
import User from '../models/user';

class NotificationController {
  async index(req, res) {

    const checkProvider = await User.findOne({
      where: { id: req.userId, provider: true }
    })

    if(!checkProvider) {
      return res.status(400).json({ error: 'Only providers can load notifications' });
    }

    const notifications = await Notification.find({
      user: req.userId,
    }).sort('-createdAt').limit(20);

    return res.json(notifications);
  }

  async update(req, res) {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    return res.json(notification);
  }
};

export default new NotificationController();
