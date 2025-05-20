import showdown from "showdown"

export const initReadMe = async (readme: string) => {
  // This function replaces the following HTML code:
  {
    /* 
    <div class="popup-overlay" id="popupOverlay"></div>
    <div class="popup" id="popup">
      <button id="closePopup">Close</button>
      <div id="popupContent" class="popup-content"></div>
    </div>
    */
  }

  // Create popup overlay
  const popupOverlay = document.createElement("div")
  popupOverlay.className = "popup-overlay"
  popupOverlay.id = "popupOverlay"
  document.body.appendChild(popupOverlay)

  // Create popup
  const popup = document.createElement("div")
  popup.className = "popup"
  popup.id = "popup"
  document.body.appendChild(popup)

  // Create close button
  const closeButton = document.createElement("button")
  closeButton.id = "closePopup"
  closeButton.textContent = "Close"
  popup.appendChild(closeButton)

  // Create popup content
  const popupContent = document.createElement("div")
  popupContent.id = "popupContent"
  popupContent.className = "popup-content"
  popup.appendChild(popupContent)

  document.getElementById("help-button")?.addEventListener("click", async () => {
    // const response = await fetch("README.md")
    // const markdown = await response.text()
    const converter = new showdown.Converter()
    const htmlContent = converter.makeHtml(readme)

    if (popupContent) {
      popupContent.innerHTML = htmlContent
    }

    popupContent.innerHTML = htmlContent
    popupOverlay.style.display = "block"
    popup.style.display = "block"
  })

  closeButton.addEventListener("click", () => {
    popupOverlay.style.display = "none"
    popup.style.display = "none"
  })
}
