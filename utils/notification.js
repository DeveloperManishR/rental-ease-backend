import Notification from "../models/notification.model.js";


export const createNotification = async (notificationData) => {

  try {
    const notification = await Notification.create(notificationData);
   
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error; // rethrow so caller can handle it
  }
};
