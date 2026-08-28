/* Compatibility loader: preserve the original patch and add activity logs. */
(function () {
  var original = document.createElement("script");
  original.src = "site-patch-original.js";
  original.onload = function () {
    var telemetry = document.createElement("script");
    telemetry.src = "other-logs.js";
    document.head.appendChild(telemetry);
  };
  document.head.appendChild(original);
})();