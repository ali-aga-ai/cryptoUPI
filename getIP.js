const os = require("os");

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces).flat()) {
    if (iface.family === "IPv4" && !iface.internal) return iface.address;
  }
  return "127.0.0.1";
}
module.exports =  { getLocalIP };