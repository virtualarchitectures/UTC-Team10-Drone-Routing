Cesium - Urban Tech Challenge
===================

This README can be edited through the _README.md_ file in Markdown format. This is best done in VS Code, where the text can be edited and also previewed by pressing Ctrl-Shift-V to open in preview mode. Drag the tab to the right to allow side-by-side editing and previewing. Once edits are complete, it can be converted to PDF by installing the Markdown PDF plugin in VS Code, then pressing Ctrl-Shift-P and selecting "Markdown PDF: Export (pdf)". 

# Installation
1. Unzip the template into the desired directory.
2. Make sure that Node.js is installed on the computer. Follow instructions at https://nodejs.org/en/download
	* To check if Node is installed, open a command prompt and enter `node -v` and verify that a version such as `v22.15.0` is displayed.
3. The template already has the following node modules installed:
	* express
	* axios
	* dotenv
4. Run the command `npm install` from your terminal, to install of the required dependencies
5. Additional modules can be installed if needed by opening a console to the root app folder and entering `npm install packagename` or similar command as recommended by the module documentation.

# Environment Variables
1. Create a new `.env` file within the root of the project, based on the provided `.env.template`
2. Update with the the appropriate Cesium ION and Google API Keys

# Launching the App
1. Launch a terminal at the root of this project
2. Run the command `npm run start` from your terminal or powershell
3. Open `http://localhost:3000` within a browser
