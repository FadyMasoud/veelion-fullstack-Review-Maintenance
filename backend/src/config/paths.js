const path = require('node:path');

// Built from this file's location, not process.cwd(), so the server finds
// its data no matter which folder it is started from.
// process.cwd() → the directory from which you started the Node.js process.
// __dirname → the directory where the currently executing JavaScript file is located.
// "لقيت إن مسارات ملفات البيانات معمولة بـ process.cwd()، وده بيعتمد على الفولدر اللي السيرفر اتشغل منه، فلو اتشغل من مكان تاني كل الطلبات بتطلع 500. غيرتها لـ __dirname عشان تعتمد على مكان الكود نفسه، وحطيت المسارات في ملف config واحد عشان كل الـ modules، ومنهم Reports، تستخدم نفس المصدر."
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

module.exports = {
  DATA_DIR,
  TASKS_FILE_PATH: path.join(DATA_DIR, 'tasks.json'),
  ACTIVITY_FILE_PATH: path.join(DATA_DIR, 'activity.json'),
};
