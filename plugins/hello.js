module.exports = function(api) {
  console.log('Hello plugin loaded!');
  
  // Example: intercept keystrokes
  api.onKeystroke((key) => {
    // We could intercept or log keys here
  });

  // Example: write to terminal directly
  setTimeout(() => {
    api.write('\r\n[Plugin System] Hello plugin loaded!\r\n');
  }, 2000);
};
