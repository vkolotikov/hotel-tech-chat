const page = document.body.dataset.page;
const waitForPartials = async () => {
  if (window.OnlineChatPartialsReady && typeof window.OnlineChatPartialsReady.then === "function") {
    await window.OnlineChatPartialsReady;
  }
};
if (page === "login") {
  initLogin();
}
if (page === "dashboard") {
  waitForPartials().then(() => initDashboard());
}
