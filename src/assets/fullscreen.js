// fullscreen
function fullscreen(){
  if (!document.fullscreenElement) {
    // If the document is not in fullscreen mode, request it for the HTML element
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
    });
  } else {
    // Otherwise, exit fullscreen mode
    document.exitFullscreen();
  }
}

