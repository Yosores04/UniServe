async function showAndroidRelease() {
  const status = document.getElementById("status");
  try {
    const response = await fetch("https://api.github.com/repos/Yosores04/UniServe/releases/latest");
    if (response.status === 404) return;
    if (!response.ok) throw new Error("Release lookup failed");
    const release = await response.json();
    const apk = release.assets.find(asset => asset.name === "UniServe.apk" && asset.state === "uploaded" && asset.size > 0);
    if (!apk) return;
    status.textContent = "Android release " + release.tag_name;
    const link = document.getElementById("download");
    link.href = "https://github.com/Yosores04/UniServe/releases/latest/download/UniServe.apk";
    link.hidden = false;
    document.getElementById("instructions").hidden = false;
  } catch {
    status.textContent = "Download availability could not be checked. Refresh to try again.";
  }
}
showAndroidRelease();
