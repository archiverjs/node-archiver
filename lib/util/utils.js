module.exports = {
  convertDate: function(d) {
    var year = d.getFullYear();

    if (year < 1980) {
      return (1<<21) | (1<<16);
    }

    return ((year-1980) << 25) | ((d.getMonth()+1) << 21) | (d.getDate() << 16) |
      (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  },

  unixifyPath: function(filepath) {
    if (process.platform === 'win32') {
      return filepath.replace(/\\/g, '/');
    } else {
      return filepath;
    }
  }
};