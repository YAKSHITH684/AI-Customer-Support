const Notification = require('../models/Notification');

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const notifications = await Notification.find({
      $or: [
        { owner: userId },
        { owner: null }
      ]
    })
      .populate('ticketId', 'ticketNumber subject status priority')
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      $or: [
        { owner: userId },
        { owner: null }
      ],
      isRead: false
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found.' });
    }

    return res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    await Notification.updateMany(
      {
        $or: [
          { owner: userId },
          { owner: null }
        ],
        isRead: false
      },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Notification deleted.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
