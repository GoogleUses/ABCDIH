/*
 * Compatibility loader for the original site patch plus the new activity
 * logger. Keeping the original patch intact makes this update reversible and
 * avoids changing the generated application bundle.
 */
(() => {
  const original = document.createElement("script");
  original.src = "assets/site-patch-original.js";
  original.onload = () => {
    const activity = document.createElement("script");
    activity.type = "module";
    activity.src = "assets/activity-logs.js";
    document.head.appendChild(activity);
  };
  original.onerror = () => {
    console.error("NJsGames: the original site patch could not be loaded.");
  };
  document.head.appendChild(original);
})();