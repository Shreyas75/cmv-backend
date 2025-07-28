const User = require('../models/User');
const { Parser } = require('json2csv');

class ExportService {
  async exportUserDataToCSV() {
    try {
      const users = await User.find({}, 
        'firstName lastName email phoneNo dob additionalComments createdAt'
      );
      
      if (users.length === 0) {
        return "No users found in the database.";
      }

      const fields = [
        'firstName', 
        'lastName', 
        'email', 
        'phoneNo', 
        'dob', 
        'additionalComments', 
        'createdAt'
      ];
      
      const json2csvParser = new Parser({ fields });
      return json2csvParser.parse(users);
    } catch (error) {
      throw new Error('Error exporting user data');
    }
  }
}

module.exports = new ExportService();
